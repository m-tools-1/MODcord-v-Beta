import React from 'react';
import { Server, ServerRole, User } from '../types';
import { Crown, ShieldCheck, Sparkles, Settings, Users } from 'lucide-react';

interface MemberListProps {
  users: User[];
  currentUserId: string;
  onOpenProfile: (user: User) => void;
  onStartDM: (user: User) => void;
  theme?: 'dark' | 'midnight' | 'light';
  server?: Server;
  onOpenRolesManagement?: () => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  users,
  currentUserId,
  onOpenProfile,
  theme = 'dark',
  server,
  onOpenRolesManagement,
}) => {
  const isLight = theme === 'light';

  // Server members resolution
  const isServerOwner = !!server && server.ownerId === currentUserId;
  const serverMemberIds = server?.memberIds || [];
  const serverRoles = (server?.roles || []).slice().sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  const memberRolesMap = server?.memberRoles || {};

  // Filter users to members of this server
  const serverUsers = users.filter((u) => {
    if (!server) return true;
    if (u.id === server.ownerId) return true;
    // Main default community server includes all users
    if (server.id === 'server-main') return true;
    return serverMemberIds.includes(u.id);
  });

  // Track users placed in categories to avoid duplicates
  const placedUserIds = new Set<string>();

  // 1. Server Owner (always at the very top of THIS server)
  const ownerUser = server ? users.find((u) => u.id === server.ownerId) : null;
  if (ownerUser) {
    placedUserIds.add(ownerUser.id);
  }

  // 2. Hoisted custom roles
  interface RoleGroupItem {
    role: ServerRole;
    members: User[];
  }
  const roleGroups: RoleGroupItem[] = [];

  if (server) {
    serverRoles.forEach((role) => {
      if (role.hoist === false) return;
      const membersInThisRole = serverUsers.filter((u) => {
        if (placedUserIds.has(u.id)) return false;
        const uRoles = memberRolesMap[u.id] || [];
        return uRoles.includes(role.id);
      });

      if (membersInThisRole.length > 0) {
        membersInThisRole.forEach((u) => placedUserIds.add(u.id));
        roleGroups.push({
          role,
          members: membersInThisRole,
        });
      }
    });
  }

  // 3. Online members without hoisted roles
  const onlineMembers = serverUsers.filter(
    (u) => !placedUserIds.has(u.id) && u.status !== 'offline'
  );
  onlineMembers.forEach((u) => placedUserIds.add(u.id));

  // 4. Offline members
  const offlineMembers = serverUsers.filter((u) => !placedUserIds.has(u.id));

  const renderUserRow = (
    user: User,
    options?: {
      overrideColor?: string;
      customBadge?: string;
      isOwnerRow?: boolean;
    }
  ) => {
    const isMe = user.id === currentUserId;
    const nameColor = options?.overrideColor || (options?.isOwnerRow ? '#f59e0b' : user.color || '#ffffff');

    return (
      <div
        key={user.id}
        role="button"
        tabIndex={0}
        onClick={() => onOpenProfile(user)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenProfile(user);
          }
        }}
        className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 transition-all duration-150 text-right group cursor-pointer border ${
          isLight
            ? 'hover:bg-black/[0.05] border-transparent hover:border-black/[0.05]'
            : 'hover:bg-white/[0.05] border-transparent hover:border-white/[0.06]'
        } relative`}
      >
        {/* Avatar with Status Badge */}
        <div className="relative flex-shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md transition-transform group-hover:scale-105 overflow-hidden"
            style={{ backgroundColor: user.color || '#5865f2' }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              user.displayName.slice(0, 2)
            )}
          </div>
          {/* Status Indicator */}
          <span
            className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 ${
              isLight ? 'border-[#f2f3f5]' : 'border-[#0e0f13]'
            } ${
              user.status === 'online'
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                : user.status === 'idle'
                ? 'bg-amber-400'
                : user.status === 'dnd'
                ? 'bg-red-500'
                : 'bg-gray-500'
            }`}
          />
        </div>

        {/* Name & Role Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="text-xs font-bold truncate transition-colors"
                style={{ color: nameColor }}
              >
                {user.displayName}
              </span>
              {options?.isOwnerRow && (
                <Crown className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)] animate-pulse shrink-0" />
              )}
            </div>

            {/* Custom Role Badge if passed */}
            {options?.customBadge && (
              <span
                className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border shrink-0 truncate max-w-[85px]"
                style={{
                  color: options.overrideColor || '#a855f7',
                  borderColor: `${options.overrideColor || '#a855f7'}40`,
                  backgroundColor: `${options.overrideColor || '#a855f7'}15`,
                }}
              >
                {options.customBadge}
              </span>
            )}

            {options?.isOwnerRow && (
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border shrink-0 text-amber-400 border-amber-500/40 bg-amber-500/15">
                المالك
              </span>
            )}
          </div>

          {user.customStatus ? (
            <p
              className={`text-[10px] truncate mt-0.5 font-medium ${
                isLight ? 'text-[#5c6370]' : 'text-gray-400'
              }`}
            >
              {user.customStatus}
            </p>
          ) : (
            <p
              className={`text-[9px] truncate mt-0.5 ${
                isLight ? 'text-[#747f8d]' : 'text-gray-500'
              }`}
            >
              {options?.customBadge || (options?.isOwnerRow ? 'صاحب السيرفر' : 'عضو في السيرفر')}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderHeader = (title: string, count: number, color?: string) => (
    <div className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 mb-1.5 flex items-center justify-between">
      <div className="flex items-center gap-1.5 truncate" style={{ color: color || '#94a3b8' }}>
        <span className="truncate">{title}</span>
      </div>
      <span
        className={`font-mono px-1.5 py-0.2 rounded text-[9px] font-bold ${
          isLight ? 'text-gray-600 bg-black/[0.06]' : 'text-gray-500 bg-white/[0.04]'
        }`}
      >
        {count}
      </span>
    </div>
  );

  return (
    <div
      id="member-list-sidebar"
      className={`w-64 flex flex-col h-full select-none flex-shrink-0 border-r transition-colors duration-200 ${
        isLight
          ? 'bg-[#f2f3f5] border-[#e3e5e8]'
          : 'bg-[#0e0f13]/95 backdrop-blur-xl border-white/[0.05]'
      }`}
    >
      {/* Harmonized Top Header Bar matching ChannelSidebar and ChatArea (h-13) */}
      <div
        className={`h-13 border-b px-3.5 flex items-center justify-between select-none flex-shrink-0 ${
          isLight
            ? 'border-[#e3e5e8] bg-white/40'
            : 'border-white/[0.05] bg-black/10'
        }`}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className={`text-xs font-bold tracking-wide ${isLight ? 'text-gray-700' : 'text-gray-200'}`}>
            الأعضاء
          </span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
              isLight ? 'bg-black/[0.06] text-gray-600' : 'bg-white/[0.06] text-gray-400'
            }`}
          >
            {serverUsers.length}
          </span>
        </div>

        {isServerOwner && onOpenRolesManagement && (
          <button
            onClick={onOpenRolesManagement}
            title="إدارة رتب السيرفر (المالك)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
              isLight
                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100/70'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable Members Body */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {/* 1. Server Owner Group (Always at the top) */}
        {ownerUser && (
          <div className="mb-4">
            {renderHeader('👑 صاحب السيرفر', 1, '#f59e0b')}
            <div className="space-y-0.5">
              {renderUserRow(ownerUser, { isOwnerRow: true })}
            </div>
          </div>
        )}

        {/* 2. Hoisted Custom Server Roles Groups */}
        {roleGroups.map(({ role, members }) => (
          <div key={role.id} className="mb-4">
            {renderHeader(role.name, members.length, role.color)}
            <div className="space-y-0.5">
              {members.map((member) =>
                renderUserRow(member, {
                  overrideColor: role.color,
                  customBadge: role.name,
                })
              )}
            </div>
          </div>
        ))}

        {/* 3. Online Members Group */}
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            {renderHeader('🟢 الأعضاء المتصلين', onlineMembers.length, '#10b981')}
            <div className="space-y-0.5">
              {onlineMembers.map((member) => renderUserRow(member))}
            </div>
          </div>
        )}

        {/* 4. Offline Members Group */}
        {offlineMembers.length > 0 && (
          <div className="mb-4">
            {renderHeader('⚪ غير متصل', offlineMembers.length, '#64748b')}
            <div className="space-y-0.5">
              {offlineMembers.map((member) => renderUserRow(member))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

