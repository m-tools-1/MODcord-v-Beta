import React, { useState } from 'react';
import { Server, User, UserRole } from '../types';
import {
  X,
  MessageSquare,
  Calendar,
  Award,
  Crown,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Bot,
  User as UserIcon,
  CheckCircle2,
  Check,
  ChevronDown,
  Palette,
} from 'lucide-react';
import { getRoleInfo, canAssignRole, ROLE_HIERARCHY } from '../utils/roles';
import { RoleBadge } from './RoleBadge';
import { soundEffects } from '../utils/audio';
import { isLightColor } from './UserPopout';

interface UserProfileModalProps {
  user: User;
  currentUser: User;
  onStartDM: (user: User) => void;
  onUpdateUserRole?: (userId: string, newRole: UserRole) => void;
  server?: Server;
  onUpdateServer?: (server: Server) => void;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  currentUser,
  onStartDM,
  onUpdateUserRole,
  server,
  onUpdateServer,
  onClose,
}) => {
  const isMe = user.id === currentUser.id;
  const isServerOwner = !!server && server.ownerId === currentUser.id;
  const isFounder = user.role === 'owner' || user.id === 'user-mod';
  const userServerRoleIds = server?.memberRoles?.[user.id] || [];
  const serverRoles = server?.roles || [];
  const roleInfo = getRoleInfo(user.role);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role || 'member');
  const [isAssigning, setIsAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Custom Founder Gradient
  const userGradient = user.customGradient;
  const hasCustomGradient = isFounder && userGradient?.enabled;
  const isLight = hasCustomGradient
    ? isLightColor(userGradient?.from || '#fce4d6') || isLightColor(userGradient?.to || '#f7c59f')
    : false;

  const cardGradientStyle = hasCustomGradient
    ? {
        background: `linear-gradient(${userGradient?.angle || 145}deg, ${userGradient?.from}, ${userGradient?.to})`,
      }
    : undefined;

  const handleToggleServerRole = (roleId: string) => {
    if (!server || !onUpdateServer || !isServerOwner) return;
    const currentMemberRoles = server.memberRoles || {};
    const uList = currentMemberRoles[user.id] || [];
    const hasRole = uList.includes(roleId);

    const nextList = hasRole ? uList.filter((id) => id !== roleId) : [...uList, roleId];
    const nextMemberRoles = {
      ...currentMemberRoles,
      [user.id]: nextList,
    };

    onUpdateServer({
      ...server,
      memberRoles: nextMemberRoles,
    });

    soundEffects.play('upgrade');
    const targetRole = serverRoles.find((r) => r.id === roleId);
    setSuccessMsg(
      hasRole
        ? `تم إزالة رتبة "${targetRole?.name}" من ${user.displayName}`
        : `تم منح رتبة "${targetRole?.name}" إلى ${user.displayName}!`
    );
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Check permissions to change this user's role
  const canManageThisUserRole =
    Boolean(onUpdateUserRole) &&
    !isMe &&
    (currentUser.role === 'owner' ||
      currentUser.id === 'user-mod' ||
      (currentUser.role === 'admin' && user.role !== 'owner' && user.role !== 'admin'));

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole);
    if (onUpdateUserRole) {
      onUpdateUserRole(user.id, newRole);
      soundEffects.play('upgrade');
      const targetRoleInfo = getRoleInfo(newRole);
      setSuccessMsg(`تم تعيين رتبة "${targetRoleInfo.name}" بنجاح!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setIsAssigning(false);
  };

  const getRoleIcon = (roleKey: UserRole) => {
    switch (roleKey) {
      case 'owner':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-rose-400" />;
      case 'mod':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      case 'vip':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'bot':
        return <Bot className="w-4 h-4 text-indigo-400" />;
      default:
        return <UserIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      id="user-profile-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div
        className={`rounded-3xl w-full max-w-md overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col relative max-h-[90vh] border ${
          hasCustomGradient
            ? isLight
              ? 'border-black/15 text-[#2c1b0d]'
              : 'border-white/20 text-white'
            : 'bg-[#16171d] border-white/10 text-white'
        }`}
        style={cardGradientStyle}
      >
        {/* Top Header Section: Banner + Overlapping Avatar (Zero clipping) */}
        <div className="relative shrink-0 select-none">
          {/* Banner - placed underneath avatar (z-0) */}
          <div
            className="h-36 w-full relative bg-cover bg-center transition-all overflow-hidden z-0"
            style={{
              background: user.banner
                ? `url(${user.banner}) center/cover no-repeat`
                : user.bannerColor ||
                  (hasCustomGradient
                    ? `linear-gradient(135deg, ${userGradient?.from}ee, ${userGradient?.to}bb)`
                    : `linear-gradient(135deg, ${roleInfo.color}40, #111214)`),
            }}
          >
            {/* Subtle gradient overlay at bottom of banner */}
            <div
              className={`absolute inset-0 bg-gradient-to-b ${
                hasCustomGradient
                  ? isLight
                    ? 'from-black/10 via-transparent to-black/10'
                    : 'from-black/20 via-transparent to-black/60'
                  : 'from-black/20 via-transparent to-[#121317]/80'
              } pointer-events-none`}
            />

            {/* Role Pill on top right of banner */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <RoleBadge role={user.role} size="sm" showPermissionsModal={false} />
            </div>

            {/* Close button on top left */}
            <button
              onClick={onClose}
              className="absolute top-3 left-3 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full transition cursor-pointer backdrop-blur-md z-10 border border-white/10 shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar and Action Bar - placed with z-20 so avatar sits proud ABOVE the banner */}
          <div
            className={`px-6 relative ${
              hasCustomGradient ? 'bg-transparent' : 'bg-[#121317]'
            }`}
          >
            <div className="relative -top-12 flex items-end justify-between -mb-8 pointer-events-auto">
              {/* Avatar with ring and shadow */}
              <div className="relative z-20 flex items-end gap-3">
                <div className="relative">
                  <div
                    className={`w-24 h-24 rounded-full ring-4 shadow-2xl flex items-center justify-center font-black text-3xl text-white overflow-hidden ${
                      hasCustomGradient
                        ? isLight
                          ? 'ring-[#fce4d6] border-2 border-black/10 bg-[#2c1b0d]'
                          : 'ring-white/20 border-2 border-white/20 bg-[#16171d]'
                        : 'ring-[#121317] border-2 border-white/20 bg-[#16171d]'
                    }`}
                    style={{
                      backgroundColor: user.color || roleInfo.color || '#5865f2',
                      boxShadow: `0 0 25px ${roleInfo.color}40, 0 10px 25px rgba(0,0,0,0.7)`,
                    }}
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

                  {/* Online/Offline Status Pill */}
                  <span
                    className={`absolute bottom-0 left-1 w-6 h-6 rounded-full border-4 flex items-center justify-center z-30 shadow-md ${
                      hasCustomGradient
                        ? isLight
                          ? 'border-[#fce4d6]'
                          : 'border-slate-900'
                        : 'border-[#121317]'
                    } ${
                      user.status === 'online'
                        ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                        : user.status === 'idle'
                        ? 'bg-amber-400'
                        : user.status === 'dnd'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                    }`}
                  >
                    {user.status === 'idle' && (
                      <span className="text-[10px] text-amber-950 font-bold leading-none">🌙</span>
                    )}
                    {user.status === 'dnd' && (
                      <span className="w-2.5 h-0.5 bg-white rounded-full"></span>
                    )}
                  </span>
                </div>

                {/* Status Speech Bubble (Discord thought bubble) */}
                <div className="relative mb-3 hidden sm:flex items-center">
                  <div
                    className={`px-3.5 py-1.5 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-1.5 ${
                      hasCustomGradient
                        ? isLight
                          ? 'bg-white/90 border-black/15 text-[#3d2311]'
                          : 'bg-black/60 border-white/20 text-white'
                        : 'bg-[#232428] border-white/10 text-gray-200'
                    }`}
                  >
                    <div
                      className={`absolute -bottom-1 right-4 w-2 h-2 rounded-full border ${
                        hasCustomGradient
                          ? isLight
                            ? 'bg-white/90 border-black/15'
                            : 'bg-black/60 border-white/20'
                          : 'bg-[#232428] border-white/10'
                      }`}
                    />
                    <span>{user.customStatus || (isFounder ? 'Web DEV ! 💻' : 'MODcord - مودكورد 🚀')}</span>
                  </div>
                </div>
              </div>

              {!isMe && (
                <button
                  onClick={() => {
                    onStartDM(user);
                    onClose();
                  }}
                  className="relative z-20 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer mb-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>إرسال رسالة خاصة</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details Container - Scrollable starting cleanly below avatar */}
        <div
          className={`px-6 pb-6 pt-3 relative flex-1 overflow-y-auto custom-scrollbar ${
            hasCustomGradient ? 'bg-transparent' : 'bg-[#121317]'
          }`}
        >
          {/* User Names and Role Title */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-black text-xl tracking-wide"
                  style={{ color: roleInfo.color }}
                >
                  {user.displayName}
                </span>
                {getRoleIcon(user.role)}
              </div>
              <div className="text-xs text-gray-400 font-mono mt-0.5">
                @{user.name}#{user.discriminator}
              </div>
            </div>

            {/* Custom Status */}
            {user.customStatus && (
              <div className="text-xs text-gray-200 bg-white/[0.03] p-3 rounded-xl border border-white/[0.07] flex items-center gap-2">
                <span>💬</span>
                <span className="font-medium">{user.customStatus}</span>
              </div>
            )}

            {/* Success toast banner */}
            {successMsg && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Admin Role Management Section */}
            {canManageThisUserRole && (
              <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-black/40 p-3.5 rounded-2xl border border-indigo-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-extrabold text-white">
                      صلاحيات الإدارة: تعديل رتبة العضو
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md font-bold">
                    إدارة المشرف 🛡️
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(currentUser.role === 'owner' || currentUser.id === 'user-mod'
                    ? (['admin', 'mod', 'vip', 'member'] as UserRole[])
                    : (['mod', 'vip', 'member'] as UserRole[])
                  ).map((rKey) => {
                    const rDef = getRoleInfo(rKey);
                    const isCurrent = user.role === rKey;

                    return (
                      <button
                        key={rKey}
                        type="button"
                        onClick={() => handleRoleChange(rKey)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                          isCurrent
                            ? 'bg-white/15 border-white/40 text-white shadow-md'
                            : 'bg-black/40 border-white/[0.08] text-gray-300 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {getRoleIcon(rKey)}
                          <span className="truncate">{rDef.name}</span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Server-Specific Roles Card */}
            {server && (
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-extrabold text-white">
                      رتب السيرفر ({server.name})
                    </span>
                  </div>
                  {isServerOwner && !isMe && (
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md font-bold">
                      انقر للتبديل ⚡
                    </span>
                  )}
                </div>

                {serverRoles.length === 0 ? (
                  <p className="text-xs text-gray-500">لا توجد رتب مخصصة في هذا السيرفر بعد</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {serverRoles.map((r) => {
                      const hasThisRole = userServerRoleIds.includes(r.id);
                      const isOwnerCard = user.id === server.ownerId;

                      return (
                        <button
                          key={r.id}
                          type="button"
                          disabled={!isServerOwner || isMe || isOwnerCard}
                          onClick={() => handleToggleServerRole(r.id)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition ${
                            hasThisRole
                              ? 'shadow-sm'
                              : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-80'
                          } ${
                            isServerOwner && !isMe && !isOwnerCard ? 'cursor-pointer' : 'cursor-default'
                          }`}
                          style={{
                            color: r.color,
                            borderColor: `${r.color}50`,
                            backgroundColor: hasThisRole ? `${r.color}20` : 'transparent',
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: r.color }}
                          />
                          <span>{r.name}</span>
                          {hasThisRole && <Check className="w-3 h-3 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Role Details & Permissions Breakdown Card */}
            <div
              className="rounded-2xl p-4 border space-y-3"
              style={{
                backgroundColor: `${roleInfo.color}0d`,
                borderColor: `${roleInfo.color}35`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center border"
                    style={{
                      backgroundColor: `${roleInfo.color}20`,
                      borderColor: `${roleInfo.color}50`,
                    }}
                  >
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{roleInfo.name}</h4>
                    <span className="text-[10px] text-gray-400 font-mono">
                      مستوى الرتبة: #{roleInfo.level}
                    </span>
                  </div>
                </div>

                <RoleBadge role={user.role} size="xs" showPermissionsModal={false} />
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                {roleInfo.description}
              </p>

              {/* Permissions list */}
              <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                <div className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase mb-1">
                  الصلاحيات المعتمدة للرتبة:
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {roleInfo.permissions.map((perm, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-[11px] text-gray-200"
                    >
                      <CheckCircle2
                        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                        style={{ color: roleInfo.color }}
                      />
                      <span className="leading-tight">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* About Me / Bio */}
            {user.bio && (
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/[0.06]">
                <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                  نبذة شخصية
                </div>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {user.bio}
                </p>
              </div>
            )}

            {/* Join Date */}
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1 px-1">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>انضم للمجتمع في: {user.joinedAt}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
