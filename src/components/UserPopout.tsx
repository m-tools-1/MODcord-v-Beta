import React, { useState } from 'react';
import {
  User,
  UserStatus,
  Server,
} from '../types';
import {
  X,
  Edit3,
  MessageSquare,
  Copy,
  Check,
  Crown,
  ChevronRight,
  Sparkles,
  Palette,
  LogOut,
  ExternalLink,
  Shield,
  Code,
  Zap,
  Flame,
  Gamepad2,
  CheckCircle2,
} from 'lucide-react';

interface UserPopoutProps {
  user: User;
  currentUser: User;
  server?: Server;
  onClose: () => void;
  onOpenEditProfile: () => void;
  onOpenFullProfile: (user: User) => void;
  onUpdateStatus?: (status: UserStatus) => void;
  onUpdateGradient?: (gradient: { enabled: boolean; from: string; to: string; angle?: number }) => void;
  onStartDM?: (user: User) => void;
  onSwitchAccounts?: () => void;
  onLogout?: () => void;
  position?: 'bottom-left' | 'center';
}

export function isLightColor(hexColor: string): boolean {
  if (!hexColor) return false;
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150;
}

const GRADIENT_PRESETS = [
  {
    name: 'غروب الخوخ الدافئ 🌅',
    from: '#fce4d6',
    to: '#f7c59f',
    angle: 145,
  },
  {
    name: 'البنفسج الملكي 🔮',
    from: '#2e0854',
    to: '#7c3aed',
    angle: 135,
  },
  {
    name: 'سماء الغسق 🌌',
    from: '#1e1b4b',
    to: '#3b82f6',
    angle: 135,
  },
  {
    name: 'الزمرد السيبراني 🍃',
    from: '#064e3b',
    to: '#10b981',
    angle: 135,
  },
  {
    name: 'الذهب الأسود الفاخر ✨',
    from: '#1c1917',
    to: '#d97706',
    angle: 135,
  },
  {
    name: 'الياقوت القرمزي 🌹',
    from: '#4c0519',
    to: '#f43f5e',
    angle: 135,
  },
  {
    name: 'الشفق الوردي 🌸',
    from: '#fed7aa',
    to: '#f472b6',
    angle: 135,
  },
  {
    name: 'MODcord - مودكورد النيلي 💎',
    from: '#1e1b4b',
    to: '#6366f1',
    angle: 135,
  },
];

export const UserPopout: React.FC<UserPopoutProps> = ({
  user,
  currentUser,
  server,
  onClose,
  onOpenEditProfile,
  onOpenFullProfile,
  onUpdateStatus,
  onUpdateGradient,
  onStartDM,
  onSwitchAccounts,
  onLogout,
  position = 'bottom-left',
}) => {
  const isMe = user.id === currentUser.id;
  const isFounder = user.role === 'owner' || user.id === 'user-mod';

  const [copiedId, setCopiedId] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showGradientEditor, setShowGradientEditor] = useState(false);

  // Gradient state for founder
  const userGradient = user.customGradient;
  const hasCustomGradient = isFounder && userGradient?.enabled;

  const [customFrom, setCustomFrom] = useState(userGradient?.from || '#fce4d6');
  const [customTo, setCustomTo] = useState(userGradient?.to || '#f7c59f');
  const [customAngle, setCustomAngle] = useState(userGradient?.angle || 145);
  const [gradientEnabled, setGradientEnabled] = useState(userGradient?.enabled ?? true);

  const isLight = hasCustomGradient
    ? isLightColor(userGradient?.from || '#fce4d6') || isLightColor(userGradient?.to || '#f7c59f')
    : false;

  const cardBackground = hasCustomGradient
    ? `linear-gradient(${userGradient?.angle || 145}deg, ${userGradient?.from}, ${userGradient?.to})`
    : undefined;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleApplyGradient = (from: string, to: string, angle = 145, enabled = true) => {
    setCustomFrom(from);
    setCustomTo(to);
    setCustomAngle(angle);
    setGradientEnabled(enabled);
    if (onUpdateGradient) {
      onUpdateGradient({ enabled, from, to, angle });
    }
  };

  return (
    <div
      id="user-popout-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="user-popout-card"
        className={`w-full max-w-[340px] rounded-3xl overflow-hidden border shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all flex flex-col relative select-none animate-in zoom-in-95 duration-150 ${
          hasCustomGradient
            ? isLight
              ? 'border-black/15 text-[#2c1b0d]'
              : 'border-white/20 text-white'
            : 'bg-[#18191c] border-white/10 text-white'
        }`}
        style={{
          background: cardBackground,
        }}
      >
        {/* Top Banner (z-0) */}
        <div className="relative h-28 w-full select-none overflow-hidden shrink-0">
          <div
            className="w-full h-full bg-cover bg-center transition-all"
            style={{
              background: user.banner
                ? `url(${user.banner}) center/cover no-repeat`
                : user.bannerColor ||
                  (hasCustomGradient
                    ? `linear-gradient(135deg, ${userGradient?.from}dd, ${userGradient?.to}bb)`
                    : `linear-gradient(135deg, #4f46e5, #0f172a)`),
            }}
          >
            {/* Gradient shadow towards avatar */}
            <div
              className={`absolute inset-0 bg-gradient-to-b ${
                hasCustomGradient
                  ? isLight
                    ? 'from-black/10 via-transparent to-[#fce4d6]/40'
                    : 'from-black/20 via-transparent to-black/60'
                  : 'from-black/20 via-transparent to-[#18191c]/80'
              }`}
            />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white transition backdrop-blur-md z-20 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Founder Crown / Badge on top right */}
          {isFounder && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-amber-950 font-black text-[11px] shadow-lg backdrop-blur-md z-20">
              <Crown className="w-3 h-3 text-amber-950" />
              <span>المالك والمؤسس</span>
            </div>
          )}
        </div>

        {/* Profile Content Container */}
        <div className="px-4 pb-4 pt-0 relative flex-1 flex flex-col">
          {/* Avatar and Speech Bubble row */}
          <div className="relative -top-10 flex items-end justify-between mb-[-24px] pointer-events-auto">
            {/* Avatar with Status Dot */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={`w-20 h-20 rounded-full ring-4 shadow-2xl flex items-center justify-center font-black text-2xl text-white overflow-hidden ${
                  hasCustomGradient
                    ? isLight
                      ? 'ring-[#fce4d6] bg-[#2c1b0d]'
                      : 'ring-white/20 bg-slate-900'
                    : 'ring-[#18191c] bg-[#111214]'
                }`}
                style={{
                  backgroundColor: user.color || '#5865f2',
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

              {/* Status Badge with custom Discord-like symbols */}
              <span
                className={`absolute bottom-0 left-0 w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-lg ${
                  hasCustomGradient ? (isLight ? 'border-[#fce4d6]' : 'border-slate-900') : 'border-[#18191c]'
                } ${
                  user.status === 'online'
                    ? 'bg-emerald-500'
                    : user.status === 'idle'
                    ? 'bg-amber-400'
                    : user.status === 'dnd'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
              >
                {user.status === 'idle' && (
                  <span className="text-[9px] text-amber-950 leading-none">🌙</span>
                )}
                {user.status === 'dnd' && (
                  <span className="w-2 h-0.5 bg-white rounded-full"></span>
                )}
              </span>
            </div>

            {/* Custom Status Speech Bubble (Exact Discord thought bubble) */}
            <div className="relative z-10 mr-3 flex-1 flex items-end justify-end pb-3">
              <div
                className={`relative px-3 py-1.5 rounded-2xl shadow-lg border text-xs font-semibold max-w-[190px] truncate flex items-center gap-1.5 animate-in slide-in-from-bottom-2 ${
                  hasCustomGradient
                    ? isLight
                      ? 'bg-white/80 border-black/10 text-[#3d2311] shadow-amber-900/10'
                      : 'bg-black/50 border-white/15 text-white shadow-black/40'
                    : 'bg-[#232428] border-white/10 text-gray-200'
                }`}
              >
                {/* Speech Bubble Tail connector dots */}
                <div
                  className={`absolute -bottom-1 right-5 w-2 h-2 rounded-full border ${
                    hasCustomGradient
                      ? isLight
                        ? 'bg-white/80 border-black/10'
                        : 'bg-black/50 border-white/15'
                      : 'bg-[#232428] border-white/10'
                  }`}
                />
                <div
                  className={`absolute -bottom-2 right-6 w-1 h-1 rounded-full ${
                    hasCustomGradient
                      ? isLight
                        ? 'bg-white/80'
                        : 'bg-black/50'
                      : 'bg-[#232428]'
                  }`}
                />

                <span className="truncate">
                  {user.customStatus || (isFounder ? 'Web DEV ! 💻' : 'عضو في MODcord - مودكورد 🚀')}
                </span>
              </div>
            </div>
          </div>

          {/* User Names & Badges */}
          <div className="mt-2 text-right">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`text-lg font-black truncate tracking-wide ${
                    hasCustomGradient
                      ? isLight
                        ? 'text-[#2c1b0d] font-serif'
                        : 'text-white'
                      : 'text-white'
                  }`}
                >
                  {user.displayName}
                </span>
                {isFounder && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
              </div>

              {/* View Full Profile link */}
              <button
                onClick={() => {
                  onClose();
                  onOpenFullProfile(user);
                }}
                className={`text-[11px] font-bold underline transition opacity-75 hover:opacity-100 cursor-pointer ${
                  hasCustomGradient && isLight ? 'text-amber-900' : 'text-indigo-400'
                }`}
              >
                الملف الكامل
              </button>
            </div>

            <div
              className={`text-xs font-mono mt-0.5 flex items-center gap-1.5 flex-wrap ${
                hasCustomGradient
                  ? isLight
                    ? 'text-[#5a3b22]'
                    : 'text-gray-300'
                  : 'text-gray-400'
              }`}
            >
              <span>@{user.name}</span>
              <span>•</span>
              <span className="text-[11px] font-sans">#{user.discriminator}</span>
              {isFounder && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                    <Code className="w-2.5 h-2.5" /> CODE
                  </span>
                </>
              )}
            </div>

            {/* Badges Bar (Founder, Dev, Nitro, etc.) */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {isFounder && (
                <span
                  title="مؤسس المنصة وصاحب السيرفر"
                  className="p-1 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/30"
                >
                  <Crown className="w-3.5 h-3.5" />
                </span>
              )}
              <span
                title="مطور معتمد"
                className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              >
                <Code className="w-3.5 h-3.5" />
              </span>
              <span
                title="داعم مميز Nitro"
                className="p-1 rounded-md bg-pink-500/20 text-pink-400 border border-pink-500/30"
              >
                <Zap className="w-3.5 h-3.5" />
              </span>
              <span
                title="شعلة النشاط"
                className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              >
                <Flame className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Divider */}
          <div
            className={`my-3 h-px ${
              hasCustomGradient
                ? isLight
                  ? 'bg-black/10'
                  : 'bg-white/10'
                : 'bg-white/10'
            }`}
          />

          {/* Bio / About */}
          <div className="text-right space-y-1 text-xs">
            <div
              className={`text-[10px] font-bold uppercase tracking-wider ${
                hasCustomGradient
                  ? isLight
                    ? 'text-[#5a3b22]'
                    : 'text-gray-400'
                  : 'text-gray-400'
              }`}
            >
              نبذة تعريفية
            </div>
            <p
              className={`leading-relaxed line-clamp-3 ${
                hasCustomGradient
                  ? isLight
                    ? 'text-[#2c1b0d]'
                    : 'text-gray-200'
                  : 'text-gray-300'
              }`}
            >
              {user.bio || 'مرحباً بكم في سيرفر MODcord - مودكورد! تواصل ودردش بحرية.'}
            </p>
          </div>

          {/* Activity / Game Collection Box (Exact Discord feature from screenshot) */}
          <div
            className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
              hasCustomGradient
                ? isLight
                  ? 'bg-white/50 border-black/10 text-[#2c1b0d]'
                  : 'bg-black/30 border-white/10 text-white'
                : 'bg-black/20 border-white/5 text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-emerald-500" />
              <div className="text-right">
                <div className="font-bold text-[11px]">Game Collection</div>
                <div
                  className={`text-[10px] ${
                    hasCustomGradient && isLight ? 'text-[#5a3b22]' : 'text-gray-400'
                  }`}
                >
                  MODcord - مودكورد برو 🎮
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              نشط الآن
            </span>
          </div>

          {/* Action List Section */}
          <div className="mt-3 space-y-1.5">
            {isMe && (
              <>
                {/* 1. Edit Profile Button */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenEditProfile();
                  }}
                  className={`w-full p-2.5 rounded-xl border font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                    hasCustomGradient
                      ? isLight
                        ? 'bg-white/60 hover:bg-white/90 border-black/10 text-[#2c1b0d] shadow-sm'
                        : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
                      : 'bg-[#232428] hover:bg-[#2b2d31] border-white/5 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    <span>تعديل الملف الشخصي (Edit Profile)</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-red-500 text-white shadow-sm">
                    NEW
                  </span>
                </button>

                {/* 2. Founder Exclusive: Gradient Theme Customizer */}
                {isFounder && (
                  <div className="relative">
                    <button
                      onClick={() => setShowGradientEditor(!showGradientEditor)}
                      className={`w-full p-2.5 rounded-xl border font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                        hasCustomGradient
                          ? isLight
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-600/30 text-amber-950'
                            : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                          : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-amber-500" />
                        <span>خلفية البروفايل (تدرج لوني للمؤسس 👑)</span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          showGradientEditor ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {/* Expandable Founder Gradient Editor */}
                    {showGradientEditor && (
                      <div
                        className={`mt-2 p-3 rounded-2xl border text-right space-y-3 animate-in fade-in-50 duration-150 ${
                          hasCustomGradient
                            ? isLight
                              ? 'bg-white/90 border-black/15 text-[#2c1b0d] shadow-lg'
                              : 'bg-[#111214]/95 border-white/20 text-white shadow-2xl'
                            : 'bg-[#111214] border-white/15 text-white shadow-2xl'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            تخصيص التدرج اللوني للبروفايل
                          </span>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                            <span>تفعيل</span>
                            <input
                              type="checkbox"
                              checked={gradientEnabled}
                              onChange={(e) => {
                                const en = e.target.checked;
                                setGradientEnabled(en);
                                handleApplyGradient(customFrom, customTo, customAngle, en);
                              }}
                              className="accent-amber-500 w-4 h-4 rounded"
                            />
                          </label>
                        </div>

                        {/* Color Pickers (from & to) */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold block mb-1">اللون الأول</label>
                            <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/10">
                              <input
                                type="color"
                                value={customFrom}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomFrom(val);
                                  handleApplyGradient(val, customTo, customAngle, gradientEnabled);
                                }}
                                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <span className="text-[10px] font-mono">{customFrom}</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold block mb-1">اللون الثاني</label>
                            <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/10">
                              <input
                                type="color"
                                value={customTo}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomTo(val);
                                  handleApplyGradient(customFrom, val, customAngle, gradientEnabled);
                                }}
                                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                              />
                              <span className="text-[10px] font-mono">{customTo}</span>
                            </div>
                          </div>
                        </div>

                        {/* Presets List */}
                        <div>
                          <div className="text-[10px] font-bold mb-1.5">نماذج جاهزة للمؤسس:</div>
                          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                            {GRADIENT_PRESETS.map((p, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleApplyGradient(p.from, p.to, p.angle, true)}
                                className="flex items-center gap-2 p-1.5 rounded-lg border border-white/10 hover:border-amber-500/50 transition text-right cursor-pointer group bg-black/20"
                              >
                                <span
                                  className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                                  style={{
                                    background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                                  }}
                                />
                                <span className="text-[10px] font-medium truncate group-hover:text-amber-400">
                                  {p.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Status Switcher Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className={`w-full p-2.5 rounded-xl border font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                      hasCustomGradient
                        ? isLight
                          ? 'bg-white/60 hover:bg-white/90 border-black/10 text-[#2c1b0d]'
                          : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
                        : 'bg-[#232428] hover:bg-[#2b2d31] border-white/5 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          user.status === 'online'
                            ? 'bg-emerald-500'
                            : user.status === 'idle'
                            ? 'bg-amber-400'
                            : user.status === 'dnd'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                        }`}
                      />
                      <span>
                        {user.status === 'online'
                          ? 'متصل (Online)'
                          : user.status === 'idle'
                          ? 'خامل (Idle)'
                          : user.status === 'dnd'
                          ? 'مشغول - لا تزعج (DND)'
                          : 'مخفي (Invisible)'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${showStatusMenu ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {/* Status Selection Menu */}
                  {showStatusMenu && (
                    <div
                      className={`mt-1.5 p-1 rounded-xl border space-y-0.5 animate-in fade-in-50 duration-100 ${
                        hasCustomGradient
                          ? isLight
                            ? 'bg-white/95 border-black/15 text-[#2c1b0d] shadow-lg'
                            : 'bg-[#18191c] border-white/20 text-white shadow-xl'
                          : 'bg-[#18191c] border-white/15 text-white shadow-xl'
                      }`}
                    >
                      {[
                        { id: 'online', label: 'متصل (Online)', color: 'bg-emerald-500' },
                        { id: 'idle', label: 'خامل (Idle)', color: 'bg-amber-400' },
                        { id: 'dnd', label: 'مشغول (Do Not Disturb)', color: 'bg-red-500' },
                        { id: 'offline', label: 'مخفي (Invisible)', color: 'bg-gray-500' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => {
                            if (onUpdateStatus) onUpdateStatus(st.id as UserStatus);
                            setShowStatusMenu(false);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between hover:bg-white/10 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${st.color}`} />
                            <span>{st.label}</span>
                          </div>
                          {user.status === st.id && (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Switch Accounts */}
                {onSwitchAccounts && (
                  <button
                    onClick={() => {
                      onClose();
                      onSwitchAccounts();
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold text-xs flex items-center justify-between transition cursor-pointer ${
                      hasCustomGradient
                        ? isLight
                          ? 'bg-white/60 hover:bg-white/90 border-black/10 text-[#2c1b0d]'
                          : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
                        : 'bg-[#232428] hover:bg-[#2b2d31] border-white/5 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-amber-500" />
                      <span>تبديل الحسابات (Switch Accounts)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                )}
              </>
            )}

            {/* If viewing another user */}
            {!isMe && (
              <button
                onClick={() => {
                  onClose();
                  if (onStartDM) onStartDM(user);
                }}
                className="w-full p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>إرسال رسالة خاصة</span>
              </button>
            )}

            {/* Copy User ID */}
            <button
              onClick={handleCopyId}
              className={`w-full p-2 rounded-xl border text-[11px] font-semibold flex items-center justify-between transition cursor-pointer ${
                hasCustomGradient
                  ? isLight
                    ? 'hover:bg-white/50 border-black/10 text-[#5a3b22]'
                    : 'hover:bg-white/10 border-white/10 text-gray-300'
                  : 'hover:bg-[#232428] border-transparent text-gray-400'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ معرف الحساب (Copy User ID)</span>
              </div>
              {copiedId ? (
                <span className="text-emerald-500 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> تم النسخ!
                </span>
              ) : (
                <span className="font-mono text-[10px] opacity-70">#{user.discriminator}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
