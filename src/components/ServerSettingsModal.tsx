import React, { useState } from 'react';
import { Channel, Server, User, UserRole } from '../types';
import {
  X,
  Trash2,
  Settings,
  Hash,
  Volume2,
  Plus,
  Crown,
  Edit2,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Award,
  CheckCircle2,
  Check,
  User as UserIcon,
  Bot as BotIcon,
} from 'lucide-react';
import { ROLE_DEFINITIONS, getRoleInfo } from '../utils/roles';
import { RoleBadge } from './RoleBadge';
import { soundEffects } from '../utils/audio';

interface ServerSettingsModalProps {
  server: Server;
  users?: User[];
  currentUser?: User;
  onUpdateUserRole?: (userId: string, newRole: UserRole) => void;
  onUpdateServer: (updatedServer: Server) => void;
  onDeleteServer?: (serverId: string) => void;
  onOpenCreateChannel?: () => void;
  onOpenEditChannel?: (channel: Channel) => void;
  onDeleteChannel?: (channelId: string) => void;
  onOpenServerRoles?: () => void;
  onClose: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  server,
  users = [],
  currentUser,
  onUpdateUserRole,
  onUpdateServer,
  onDeleteServer,
  onOpenCreateChannel,
  onOpenEditChannel,
  onDeleteChannel,
  onOpenServerRoles,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'channels' | 'roles'>('general');
  const [name, setName] = useState(server.name);
  const [icon, setIcon] = useState(server.icon);
  const [description, setDescription] = useState(server.description || '');
  const [selectedRoleKey, setSelectedRoleKey] = useState<UserRole>('owner');
  const [roleSuccessMsg, setRoleSuccessMsg] = useState('');

  const isOwnerOrAdmin =
    server.ownerId === currentUser?.id ||
    currentUser?.role === 'owner' ||
    currentUser?.role === 'admin';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateServer({
      ...server,
      name,
      icon,
      description,
    });
    onClose();
  };

  const handleAssignRoleToUser = (targetUserId: string, newRole: UserRole) => {
    if (!onUpdateUserRole) return;
    onUpdateUserRole(targetUserId, newRole);
    soundEffects.play('upgrade');
    const rInfo = getRoleInfo(newRole);
    setRoleSuccessMsg(`تم تعيين رتبة "${rInfo.name}" بنجاح!`);
    setTimeout(() => setRoleSuccessMsg(''), 3000);
  };

  const getRoleIconComponent = (roleKey: string, className: string = 'w-4 h-4') => {
    switch (roleKey) {
      case 'owner':
        return <Crown className={`${className} text-amber-400`} />;
      case 'admin':
        return <ShieldCheck className={`${className} text-rose-400`} />;
      case 'mod':
        return <ShieldAlert className={`${className} text-purple-400`} />;
      case 'vip':
        return <Sparkles className={`${className} text-pink-400`} />;
      case 'bot':
        return <BotIcon className={`${className} text-indigo-400`} />;
      default:
        return <UserIcon className={`${className} text-slate-400`} />;
    }
  };

  return (
    <div
      id="server-settings-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div className="bg-[#121317] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-wide">
                إدارة السيرفر ({server.name})
              </h3>
              <p className="text-xs text-gray-400">لوحة تحكم المشرف، الرومات، ونظام الرتب</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.06] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-white/[0.06] px-5 bg-black/20 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'general'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>نظرة عامة على السيرفر</span>
            {activeTab === 'general' && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`py-3 px-4 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'channels'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>إدارة الرومات والقنوات ({server.channels.length})</span>
            {activeTab === 'channels' && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-gradient-to-r from-amber-500 to-indigo-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`py-3 px-4 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 flex-shrink-0 ${
              activeTab === 'roles'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-rose-400" />
            <span>نظام الرتب والصلاحيات</span>
            {activeTab === 'roles' && (
              <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-gradient-to-r from-rose-500 to-amber-500" />
            )}
          </button>
        </div>

        {/* Tab 1: General Server Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-lg border border-white/10 flex-shrink-0">
                {icon.slice(0, 3) || name.slice(0, 2)}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  رمز السيرفر المختصر
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="MC"
                  className="w-24 bg-white/[0.04] text-sm text-center font-bold text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.06] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                اسم السيرفر
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم السيرفر"
                className="w-full bg-white/[0.04] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.06] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                وصف السيرفر
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر لمجتمع السيرفر"
                className="w-full bg-white/[0.04] text-sm text-white px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.06] transition"
              />
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              {onDeleteServer && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        `هل أنت متأكد تماماً من رغبتك في حذف السيرفر (${server.name})؟ لا يمكن التراجع عن هذا الإجراء.`
                      )
                    ) {
                      onDeleteServer(server.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف السيرفر</span>
                </button>
              )}

              <div className="flex items-center gap-3 mr-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Channels Management */}
        {activeTab === 'channels' && (
          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
              <div>
                <h4 className="text-sm font-extrabold text-white">قنوات ورومات السيرفر</h4>
                <p className="text-xs text-gray-400">
                  يمكنك إنشاء رومات جديدة، وتعديل أسمائها ومواضيعها، أو حذفها
                </p>
              </div>
              {onOpenCreateChannel && (
                <button
                  onClick={() => {
                    onOpenCreateChannel();
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إنشاء روم جديد</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {server.channels.map((channel) => {
                const isVoice = channel.type === 'voice';
                const cat = server.categories?.find((c) => c.id === channel.categoryId);

                return (
                  <div
                    key={channel.id}
                    className="p-3 bg-white/[0.03] hover:bg-white/[0.05] rounded-xl border border-white/[0.06] flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isVoice
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-indigo-500/20 text-indigo-400'
                        }`}
                      >
                        {isVoice ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <Hash className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">
                            {channel.name}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                              isVoice
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            {isVoice ? 'صوتي' : 'كتابي'}
                          </span>
                          {cat && (
                            <span className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
                              {cat.name}
                            </span>
                          )}
                        </div>
                        {channel.topic && (
                          <p className="text-xs text-gray-400 truncate max-w-sm mt-0.5">
                            {channel.topic}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {onOpenEditChannel && (
                        <button
                          onClick={() => {
                            onOpenEditChannel(channel);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      )}

                      {onDeleteChannel && server.channels.length > 1 && (
                        <button
                          onClick={() => {
                            if (
                              confirm(`هل أنت متأكد من رغبتك في حذف الروم (${channel.name})؟`)
                            ) {
                              onDeleteChannel(channel.id);
                            }
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/15 border border-rose-500/20 rounded-lg transition cursor-pointer"
                          title="حذف الروم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Roles & Permissions */}
        {activeTab === 'roles' && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh] custom-scrollbar">
            {/* Roles Header Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>دليل رتب السيرفر والصلاحيات المعتمدة</span>
                </h4>
                <p className="text-xs text-gray-300 mt-1">
                  توزيع الألوان والأيقونات والصلاحيات الإدارية للأعضاء والمشرفين
                </p>
              </div>

              {onOpenServerRoles && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenServerRoles();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-200" />
                  <span>تخصيص رتب السيرفر وألوانها ⚡</span>
                </button>
              )}
            </div>

            {roleSuccessMsg && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{roleSuccessMsg}</span>
              </div>
            )}

            {/* Role Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(['owner', 'admin', 'mod', 'vip', 'bot', 'member'] as UserRole[]).map((rKey) => {
                const rDef = ROLE_DEFINITIONS[rKey];
                const count = users.filter((u) => u.role === rKey).length;
                const isSelected = selectedRoleKey === rKey;

                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => setSelectedRoleKey(rKey)}
                    className={`p-3 rounded-2xl text-right transition border cursor-pointer flex flex-col justify-between h-24 ${
                      isSelected
                        ? 'bg-white/15 border-white/40 shadow-lg scale-[1.02]'
                        : 'bg-black/30 border-white/[0.08] hover:bg-white/[0.06]'
                    }`}
                    style={{
                      boxShadow: isSelected ? `0 0 15px ${rDef.color}35` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      {getRoleIconComponent(rKey, 'w-4 h-4')}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-gray-400 font-bold">
                        {count} أعضاء
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-black text-white truncate">{rDef.name}</div>
                      <div
                        className="text-[10px] font-bold truncate mt-0.5"
                        style={{ color: rDef.color }}
                      >
                        مستوى #{rDef.level}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Detailed Permissions Card */}
            {selectedRoleKey && (
              <div
                className="p-4 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: `${ROLE_DEFINITIONS[selectedRoleKey].color}0f`,
                  borderColor: `${ROLE_DEFINITIONS[selectedRoleKey].color}35`,
                }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center border"
                      style={{
                        backgroundColor: `${ROLE_DEFINITIONS[selectedRoleKey].color}25`,
                        borderColor: `${ROLE_DEFINITIONS[selectedRoleKey].color}50`,
                      }}
                    >
                      {getRoleIconComponent(selectedRoleKey, 'w-4 h-4')}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">
                        {ROLE_DEFINITIONS[selectedRoleKey].name}
                      </h4>
                      <p className="text-[10px] text-gray-300">
                        {ROLE_DEFINITIONS[selectedRoleKey].description}
                      </p>
                    </div>
                  </div>

                  <RoleBadge role={selectedRoleKey} size="sm" showPermissionsModal={false} />
                </div>

                <div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
                    الصلاحيات الممنوحة لهذه الرتبة:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ROLE_DEFINITIONS[selectedRoleKey].permissions.map((perm, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-200">
                        <CheckCircle2
                          className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                          style={{ color: ROLE_DEFINITIONS[selectedRoleKey].color }}
                        />
                        <span className="leading-tight">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Member Promotion & Role Management Table (For Admins / Owners) */}
            {isOwnerOrAdmin && onUpdateUserRole && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>إدارة وتعيين رتب أعضاء السيرفر</span>
                  </h4>
                  <span className="text-[10px] text-gray-400">
                    اضغط لتغيير رتبة أي عضو فوراً
                  </span>
                </div>

                <div className="space-y-2">
                  {users.map((u) => {
                    const uRoleInfo = getRoleInfo(u.role);
                    const isTargetOwner = u.role === 'owner' || u.id === 'user-mod';
                    const canEditThis =
                      !isTargetOwner &&
                      (currentUser?.role === 'owner' ||
                        currentUser?.id === 'user-mod' ||
                        (currentUser?.role === 'admin' && u.role !== 'admin'));

                    return (
                      <div
                        key={u.id}
                        className="p-2.5 bg-white/[0.03] hover:bg-white/[0.05] rounded-xl border border-white/[0.06] flex items-center justify-between transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: u.color || '#5865f2' }}
                          >
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.displayName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              u.displayName.slice(0, 2)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span style={{ color: uRoleInfo.color }}>{u.displayName}</span>
                              {getRoleIconComponent(u.role, 'w-3 h-3')}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              @{u.name}#{u.discriminator}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <RoleBadge role={u.role} size="xs" showPermissionsModal={false} />

                          {canEditThis ? (
                            <select
                              value={u.role || 'member'}
                              onChange={(e) =>
                                handleAssignRoleToUser(u.id, e.target.value as UserRole)
                              }
                              className="bg-[#1e1f24] text-xs font-bold text-white px-2.5 py-1 rounded-lg border border-white/10 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              {(currentUser?.role === 'owner' || currentUser?.id === 'user-mod'
                                ? (['admin', 'mod', 'vip', 'member'] as UserRole[])
                                : (['mod', 'vip', 'member'] as UserRole[])
                              ).map((rk) => (
                                <option key={rk} value={rk}>
                                  {ROLE_DEFINITIONS[rk].name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[10px] text-gray-500 font-mono px-2 py-0.5 bg-white/[0.03] rounded">
                              {isTargetOwner ? 'مالك السيرفر' : 'محمي'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
