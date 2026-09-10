import React, { useState } from 'react';
import { Server, ServerRole, User } from '../types';
import {
  X,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Users,
  Check,
  Palette,
  Crown,
  CheckCircle2,
  Lock,
  UserPlus,
  UserMinus,
  Search,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface ServerRolesModalProps {
  server: Server;
  users: User[];
  currentUser: User;
  onUpdateServer: (updatedServer: Server) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber / Gold
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#64748b', // Slate
  '#ffffff', // White
];

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_server', label: 'إدارة السيرفر بالكامل', desc: 'تعديل اسم السيرفر ووصفه وإعداداته العامة' },
  { id: 'manage_roles', label: 'إدارة وتعيين الرتب', desc: 'إنشاء وتعديل الرتب وتعيينها لأعضاء السيرفر' },
  { id: 'manage_channels', label: 'إدارة القنوات والغرف', desc: 'إنشاء وتعديل وحذف الرومات النصية والصوتية' },
  { id: 'kick_members', label: 'طرد الأعضاء', desc: 'إمكانية طرد الأعضاء من السيرفر' },
  { id: 'mute_members', label: 'كتم الأعضاء صوتياً', desc: 'كتم المايك للأعضاء داخل الرومات الصوتية' },
  { id: 'move_members', label: 'نقل الأعضاء صوتياً', desc: 'نقل الأعضاء بين القنوات الصوتية المختلفة' },
  { id: 'send_messages', label: 'إرسال الرسائل والمرفقات', desc: 'المحادثة النصية وإرسال الصور والتفاعلات' },
];

export const ServerRolesModal: React.FC<ServerRolesModalProps> = ({
  server,
  users,
  currentUser,
  onUpdateServer,
  onClose,
}) => {
  const isOwner = server.ownerId === currentUser.id;
  const roles = server.roles || [];
  const memberRoles = server.memberRoles || {};

  const [activeSubTab, setActiveSubTab] = useState<'roles' | 'assign' | 'members'>('roles');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
  const [editingRole, setEditingRole] = useState<ServerRole | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string>('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Form states for Create/Edit
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formHoist, setFormHoist] = useState(true);
  const [formPermissions, setFormPermissions] = useState<string[]>(['send_messages']);

  const showNotice = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setEditingRole(null);
    setFormName('');
    setFormColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setFormHoist(true);
    setFormPermissions(['send_messages']);
  };

  const handleStartEdit = (role: ServerRole) => {
    setEditingRole(role);
    setIsCreatingNew(false);
    setFormName(role.name);
    setFormColor(role.color || '#6366f1');
    setFormHoist(role.hoist !== false);
    setFormPermissions(role.permissions || ['send_messages']);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    const cleanName = formName.trim();
    if (!cleanName) return;

    if (isCreatingNew) {
      const newRole: ServerRole = {
        id: `role-${Date.now()}`,
        name: cleanName,
        color: formColor,
        position: roles.length + 1,
        hoist: formHoist,
        permissions: formPermissions,
      };

      const updatedRoles = [...roles, newRole];
      const updatedServer: Server = {
        ...server,
        roles: updatedRoles,
      };

      onUpdateServer(updatedServer);
      soundEffects.playJoin();
      showNotice(`تم إنشاء الرتبة "${cleanName}" بنجاح!`);
      setIsCreatingNew(false);
      setSelectedRoleId(newRole.id);
    } else if (editingRole) {
      const updatedRoles = roles.map((r) =>
        r.id === editingRole.id
          ? {
              ...r,
              name: cleanName,
              color: formColor,
              hoist: formHoist,
              permissions: formPermissions,
            }
          : r
      );

      const updatedServer: Server = {
        ...server,
        roles: updatedRoles,
      };

      onUpdateServer(updatedServer);
      soundEffects.playJoin();
      showNotice(`تم تعديل الرتبة "${cleanName}" بنجاح!`);
      setEditingRole(null);
    }
  };

  const handleDeleteRole = (roleId: string) => {
    if (!isOwner) return;
    const target = roles.find((r) => r.id === roleId);
    if (!target) return;

    if (!confirm(`هل أنت متأكد من رغبتك في حذف رتبة "${target.name}"؟ سيفقد جميع الأعضاء هذه الرتبة.`)) {
      return;
    }

    const updatedRoles = roles.filter((r) => r.id !== roleId);
    // Remove from memberRoles
    const nextMemberRoles = { ...memberRoles };
    Object.keys(nextMemberRoles).forEach((uid) => {
      nextMemberRoles[uid] = (nextMemberRoles[uid] || []).filter((id) => id !== roleId);
    });

    const updatedServer: Server = {
      ...server,
      roles: updatedRoles,
      memberRoles: nextMemberRoles,
    };

    onUpdateServer(updatedServer);
    soundEffects.playMute(true);
    showNotice(`تم حذف رتبة "${target.name}"`);
    if (selectedRoleId === roleId) {
      setSelectedRoleId(updatedRoles[0]?.id || '');
    }
    if (editingRole?.id === roleId) {
      setEditingRole(null);
    }
  };

  const handleMoveRole = (index: number, direction: 'up' | 'down') => {
    if (!isOwner) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= roles.length) return;

    const reordered = [...roles];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    // Update positions
    const updatedWithPositions = reordered.map((r, idx) => ({
      ...r,
      position: idx + 1,
    }));

    const updatedServer: Server = {
      ...server,
      roles: updatedWithPositions,
    };

    onUpdateServer(updatedServer);
    soundEffects.playJoin();
    showNotice('تم تحديث ترتيب الرتب في قائمة المتواجدين');
  };

  const handleToggleMemberRole = (userId: string, roleId: string) => {
    if (!isOwner) return;
    const currentList = memberRoles[userId] || [];
    const hasRole = currentList.includes(roleId);

    const nextList = hasRole
      ? currentList.filter((id) => id !== roleId)
      : [...currentList, roleId];

    const nextMemberRoles = {
      ...memberRoles,
      [userId]: nextList,
    };

    const updatedServer: Server = {
      ...server,
      memberRoles: nextMemberRoles,
    };

    onUpdateServer(updatedServer);
    soundEffects.play('upgrade');
    const u = users.find((x) => x.id === userId);
    const r = roles.find((x) => x.id === roleId);
    if (hasRole) {
      showNotice(`تم سحب رتبة "${r?.name}" من ${u?.displayName || 'العضو'}`);
    } else {
      showNotice(`تم منح رتبة "${r?.name}" إلى ${u?.displayName || 'العضو'}!`);
    }
  };

  const handleToggleServerMember = (userId: string) => {
    if (!isOwner) return;
    if (userId === server.ownerId) return; // cannot remove owner

    const currentMemberIds = server.memberIds || [];
    const isMember = currentMemberIds.includes(userId);

    let nextMemberIds: string[];
    const nextMemberRoles = { ...memberRoles };

    if (isMember) {
      nextMemberIds = currentMemberIds.filter((id) => id !== userId);
      delete nextMemberRoles[userId];
    } else {
      nextMemberIds = [...currentMemberIds, userId];
    }

    const updatedServer: Server = {
      ...server,
      memberIds: nextMemberIds,
      memberRoles: nextMemberRoles,
    };

    onUpdateServer(updatedServer);
    const targetUser = users.find((u) => u.id === userId);
    if (isMember) {
      soundEffects.playLeave();
      showNotice(`تمت إزالة ${targetUser?.displayName || 'العضو'} من السيرفر`);
    } else {
      soundEffects.playJoin();
      showNotice(`تمت إضافة ${targetUser?.displayName || 'العضو'} إلى السيرفر بنجاح!`);
    }
  };

  const serverMembers = users.filter((u) => {
    if (u.id === server.ownerId) return true;
    if (server.id === 'server-main') return true;
    return (server.memberIds || []).includes(u.id);
  });

  return (
    <div
      id="server-roles-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
    >
      <div className="bg-[#2b2d31] border border-[#1f2023] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#1e1f22] border-b border-[#1f2023] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">إدارة رتب السيرفر</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  صلاحيات المالك
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                تخصيص رتب {server.name} وألوانها وترتيبها في قائمة المتواجدين
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#35373c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice alert banner */}
        {successNotice && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Sub Navigation Tabs */}
        <div className="px-4 pt-3 bg-[#232428] border-b border-[#1f2023] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveSubTab('roles');
                setIsCreatingNew(false);
                setEditingRole(null);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
                activeSubTab === 'roles'
                  ? 'border-[#5865f2] text-white bg-[#2b2d31]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>الرتب والألوان والترتيب</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-gray-300">
                {roles.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('assign');
                setIsCreatingNew(false);
                setEditingRole(null);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
                activeSubTab === 'assign'
                  ? 'border-[#5865f2] text-white bg-[#2b2d31]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>تعيين الرتب للأعضاء</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-gray-300">
                {serverMembers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('members');
                setIsCreatingNew(false);
                setEditingRole(null);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
                activeSubTab === 'members'
                  ? 'border-[#5865f2] text-white bg-[#2b2d31]'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <UserPlus className="w-4 h-4 text-cyan-400" />
              <span>إدارة أعضاء السيرفر</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-gray-300">
                {serverMembers.length}
              </span>
            </button>
          </div>

          {activeSubTab === 'roles' && !isCreatingNew && !editingRole && isOwner && (
            <button
              onClick={handleStartCreate}
              className="mb-1.5 px-3 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-indigo-500/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إنشاء رتبة جديدة</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* TAB 1: Roles Management */}
          {activeSubTab === 'roles' && (
            <div>
              {/* If Creating or Editing a Role */}
              {(isCreatingNew || editingRole) ? (
                <form onSubmit={handleSaveRole} className="p-4 bg-[#1e1f22] rounded-2xl border border-[#35373c] space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-[#2b2d31]">
                    <div className="font-extrabold text-sm text-white flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: formColor }}
                      />
                      <span>{isCreatingNew ? 'إنشاء رتبة جديدة' : `تعديل رتبة: ${editingRole?.name}`}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingRole(null);
                      }}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-[#2b2d31] hover:bg-[#35373c]"
                    >
                      إلغاء
                    </button>
                  </div>

                  {/* Role Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      اسم الرتبة <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="مثال: نائب المشرف، كبار الشخصيات VIP، محاربين..."
                      className="w-full bg-[#2b2d31] text-sm text-white px-3.5 py-2.5 rounded-xl border border-[#3f4147] focus:outline-none focus:border-[#5865f2] font-semibold"
                    />
                  </div>

                  {/* Role Color Picker */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                      <span>لون الرتبة (يظهر لاسم العضو في القائمة والشات)</span>
                      <span className="font-mono text-[11px] text-gray-400 uppercase">{formColor}</span>
                    </label>

                    {/* Presets */}
                    <div className="grid grid-cols-8 gap-2 mb-2.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormColor(c)}
                          className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center ${
                            formColor.toLowerCase() === c.toLowerCase()
                              ? 'scale-110 ring-2 ring-white shadow-lg'
                              : 'hover:scale-105 opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        >
                          {formColor.toLowerCase() === c.toLowerCase() && (
                            <Check className="w-3.5 h-3.5 text-black drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Custom Color Input */}
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs text-gray-400">أو اختر درجة لون مخصصة بدقة من لوحة الألوان</span>
                    </div>

                    {/* Live Preview Box */}
                    <div className="mt-2.5 p-2.5 rounded-xl bg-[#2b2d31] border border-[#35373c] flex items-center justify-between">
                      <span className="text-xs text-gray-400">معاينة ظهور الاسم في القائمة:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold" style={{ color: formColor }}>
                          {formName || 'اسم العضو التجريبي'}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            color: formColor,
                            borderColor: `${formColor}40`,
                            backgroundColor: `${formColor}15`,
                          }}
                        >
                          {formName || 'الرتبة'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hoist Toggle */}
                  <div className="p-3 rounded-xl bg-[#2b2d31] border border-[#35373c] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">إظهار أعضاء هذه الرتبة في قسم منفصل</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        فصل الأعضاء الحاملين لهذه الرتبة في ترويسة خاصة بهم داخل قائمة المتواجدين
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormHoist(!formHoist)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        formHoist ? 'bg-[#5865f2]' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          formHoist ? 'right-6' : 'right-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Permissions Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">
                      صلاحيات هذه الرتبة:
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {AVAILABLE_PERMISSIONS.map((perm) => {
                        const checked = formPermissions.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => {
                              if (checked) {
                                setFormPermissions(formPermissions.filter((p) => p !== perm.id));
                              } else {
                                setFormPermissions([...formPermissions, perm.id]);
                              }
                            }}
                            className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                              checked
                                ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                                : 'bg-[#2b2d31] border-[#35373c] text-gray-300 hover:bg-[#32353b]'
                            }`}
                          >
                            <div className="text-right">
                              <div className="text-xs font-bold">{perm.label}</div>
                              <div className="text-[11px] text-gray-400">{perm.desc}</div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                checked ? 'bg-[#5865f2] border-[#5865f2]' : 'border-gray-500'
                              }`}
                            >
                              {checked && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingRole(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white rounded-lg hover:bg-[#2b2d31]"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                    >
                      {isCreatingNew ? 'إنشاء الرتبة فوراً' : 'حفظ التعديلات'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Roles List */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span>ترتيب الرتب في قائمة المتواجدين (الأعلى يتصدر القائمة بعد صاحب السيرفر)</span>
                    <span className="font-bold text-gray-300">{roles.length} رتب</span>
                  </div>

                  {roles.length === 0 ? (
                    <div className="text-center py-10 bg-[#1e1f22] rounded-2xl border border-[#35373c] p-6">
                      <Palette className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                      <div className="text-sm font-bold text-white mb-1">لا توجد رتب مخصصة بعد</div>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                        أنشئ رتباً لسيرفرك وحدد ألوانها وصلاحياتها لتظهر في القائمة الجانبية.
                      </p>
                      {isOwner && (
                        <button
                          onClick={handleStartCreate}
                          className="px-4 py-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-xs inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إنشاء أول رتبة</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Server Owner Special Crown Slot */}
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <div>
                            <div className="text-xs font-black text-amber-300">👑 صاحب السيرفر (Owner)</div>
                            <div className="text-[10px] text-amber-200/70">يتصدر قائمة السيرفر دائماً بكافة الصلاحيات</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                          ثابت في الصدارة
                        </span>
                      </div>

                      {/* Custom Roles List */}
                      {roles.map((role, idx) => {
                        // Count assigned members
                        const assignedCount = Object.values(memberRoles).filter((rIds) =>
                          Array.isArray(rIds) && (rIds as string[]).includes(role.id)
                        ).length;

                        return (
                          <div
                            key={role.id}
                            className="p-3 rounded-xl bg-[#1e1f22] border border-[#35373c] hover:border-[#4e5058] transition flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              {/* Hierarchy Reorder Buttons */}
                              {isOwner && (
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    disabled={idx === 0}
                                    onClick={() => handleMoveRole(idx, 'up')}
                                    title="رفع الرتبة للأعلى"
                                    className={`p-1 rounded transition ${
                                      idx === 0
                                        ? 'opacity-20 cursor-not-allowed text-gray-500'
                                        : 'text-gray-400 hover:text-white hover:bg-[#35373c] cursor-pointer'
                                    }`}
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    disabled={idx === roles.length - 1}
                                    onClick={() => handleMoveRole(idx, 'down')}
                                    title="إنزال الرتبة للأسفل"
                                    className={`p-1 rounded transition ${
                                      idx === roles.length - 1
                                        ? 'opacity-20 cursor-not-allowed text-gray-500'
                                        : 'text-gray-400 hover:text-white hover:bg-[#35373c] cursor-pointer'
                                    }`}
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {/* Color Dot */}
                              <div
                                className="w-4 h-4 rounded-full shadow-sm shrink-0 ring-2 ring-black/30"
                                style={{ backgroundColor: role.color }}
                              />

                              {/* Role Info */}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-xs font-extrabold"
                                    style={{ color: role.color }}
                                  >
                                    {role.name}
                                  </span>
                                  {role.hoist && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                                      قسم منفصل
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                                  <span>{assignedCount} أعضاء حاملين للرتبة</span>
                                  <span>•</span>
                                  <span>الترتيب: #{idx + 1}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5">
                              {/* Quick assign button */}
                              <button
                                onClick={() => {
                                  setSelectedRoleId(role.id);
                                  setActiveSubTab('assign');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#35373c] hover:bg-[#3f4147] text-gray-200 text-xs font-bold flex items-center gap-1 transition"
                                title="تعيين الأعضاء لهذه الرتبة"
                              >
                                <Users className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="hidden sm:inline">تعيين الأعضاء</span>
                              </button>

                              {isOwner && (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(role)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#35373c] transition"
                                    title="تعديل الرتبة"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition"
                                    title="حذف الرتبة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Member Assignment */}
          {activeSubTab === 'assign' && (
            <div className="space-y-4">
              {/* Role Selector Header */}
              <div className="p-3 bg-[#1e1f22] rounded-xl border border-[#35373c] flex items-center justify-between gap-3">
                <div className="text-xs font-bold text-gray-300">اختر الرتبة لتعيينها:</div>
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
                  {roles.map((r) => {
                    const isSel = selectedRoleId === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRoleId(r.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition whitespace-nowrap border ${
                          isSel
                            ? 'bg-white/15 border-white/30 text-white shadow'
                            : 'bg-[#2b2d31] border-transparent text-gray-400 hover:text-white'
                        }`}
                        style={{
                          color: isSel ? r.color : undefined,
                        }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: r.color }}
                        />
                        <span>{r.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                  <span>أعضاء السيرفر ({serverMembers.length}):</span>
                  {selectedRoleId && (
                    <span className="text-indigo-400 font-bold">
                      انقر على العضو لإعطائه أو سحب رتبة (
                      {roles.find((r) => r.id === selectedRoleId)?.name})
                    </span>
                  )}
                </div>

                {serverMembers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 bg-[#1e1f22] rounded-xl border border-[#35373c]">
                    لا يوجد أعضاء آخرين في السيرفر حالياً
                  </div>
                ) : (
                  serverMembers.map((member) => {
                    const isServerOwner = member.id === server.ownerId;
                    const uRoleIds = memberRoles[member.id] || [];
                    const hasSelectedRole = selectedRoleId ? uRoleIds.includes(selectedRoleId) : false;

                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          if (selectedRoleId && !isServerOwner) {
                            handleToggleMemberRole(member.id, selectedRoleId);
                          }
                        }}
                        className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          hasSelectedRole
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                            : 'bg-[#1e1f22] border-[#35373c] hover:bg-[#25272b] text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden shadow"
                            style={{ backgroundColor: member.color || '#5865f2' }}
                          >
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.displayName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              member.displayName.slice(0, 2)
                            )}
                          </div>

                          {/* Info & Current Roles */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-white">
                                {member.displayName}
                              </span>
                              {isServerOwner && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                                  <Crown className="w-2.5 h-2.5" />
                                  صاحب السيرفر
                                </span>
                              )}
                            </div>

                            {/* Assigned roles badges */}
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {uRoleIds.length === 0 ? (
                                <span className="text-[10px] text-gray-500">لا توجد رتب مخصصة</span>
                              ) : (
                                uRoleIds.map((rid) => {
                                  const r = roles.find((x) => x.id === rid);
                                  if (!r) return null;
                                  return (
                                    <span
                                      key={rid}
                                      className="text-[10px] font-bold px-2 py-0.2 rounded-full border"
                                      style={{
                                        color: r.color,
                                        borderColor: `${r.color}40`,
                                        backgroundColor: `${r.color}15`,
                                      }}
                                    >
                                      {r.name}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Checkbox / Status */}
                        {isServerOwner ? (
                          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            المالك
                          </span>
                        ) : selectedRoleId ? (
                          <div
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition ${
                              hasSelectedRole
                                ? 'bg-[#5865f2] border-[#5865f2] text-white'
                                : 'border-[#4e5058] bg-[#2b2d31]'
                            }`}
                          >
                            {hasSelectedRole && <Check className="w-4 h-4" />}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Server Members Management */}
          {activeSubTab === 'members' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#1e1f22] rounded-xl border border-[#35373c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-cyan-400" />
                    <span>قائمة أعضاء السيرفر ({serverMembers.length})</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    يمكنك كصاحب سيرفر إضافة أو إزالة أي مستخدم في التطبيق من هذا السيرفر
                  </p>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="بحث في المستخدمين..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full bg-[#141519] border border-[#35373c] rounded-lg pr-8 pl-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Users list */}
              <div className="space-y-2">
                {users
                  .filter((u) => {
                    if (!memberSearchQuery.trim()) return true;
                    const query = memberSearchQuery.toLowerCase();
                    return (
                      u.displayName.toLowerCase().includes(query) ||
                      u.username.toLowerCase().includes(query)
                    );
                  })
                  .map((u) => {
                    const isServerOwner = u.id === server.ownerId;
                    const isInServer = (server.memberIds || []).includes(u.id);

                    return (
                      <div
                        key={u.id}
                        className="p-3 rounded-xl bg-[#1e1f22] border border-[#35373c] hover:border-[#4e5058] transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={u.avatar}
                              alt={u.displayName}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-white/10"
                            />
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1e1f22] ${
                                u.status === 'online'
                                  ? 'bg-emerald-500'
                                  : u.status === 'idle'
                                  ? 'bg-amber-500'
                                  : u.status === 'dnd'
                                  ? 'bg-rose-500'
                                  : 'bg-gray-500'
                              }`}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {u.displayName}
                              </span>
                              {isServerOwner && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-extrabold flex items-center gap-1">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  صاحب السيرفر
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">
                              @{u.username}#{u.discriminator}
                            </span>
                          </div>
                        </div>

                        <div>
                          {isServerOwner ? (
                            <span className="text-xs text-amber-400/80 font-bold px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                              مالك السيرفر
                            </span>
                          ) : isInServer ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                                ✓ في السيرفر
                              </span>
                              <button
                                onClick={() => handleToggleServerMember(u.id)}
                                className="px-3 py-1 rounded-lg text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition flex items-center gap-1 cursor-pointer"
                                title="إزالة العضو من السيرفر"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span>إزالة</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleToggleServerMember(u.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#5865f2] hover:bg-[#4752c4] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>إضافة للسيرفر</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#1e1f22] border-t border-[#1f2023] flex items-center justify-between">
          <div className="text-[11px] text-gray-400">
            يتم حفظ ونشر الرتب فورياً في قاعدة البيانات السحابية لجميع الأعضاء
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#35373c] hover:bg-[#3f4147] rounded-xl transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
