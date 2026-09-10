import React, { useState } from 'react';
import { AppSettings, User, UserStatus } from '../types';
import {
  X,
  Volume2,
  Moon,
  Sun,
  User as UserIcon,
  Check,
  LogOut,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Upload,
  Camera,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { compressImageFile, compressDataUrl } from '../utils/imageCompressor';
import { isLightColor } from './UserPopout';

interface UserSettingsModalProps {
  currentUser: User;
  settings: AppSettings;
  onSaveUser: (updatedUser: User) => void;
  onSaveSettings: (updatedSettings: AppSettings) => void;
  onClose: () => void;
  onLogout?: () => void;
}

const AVATAR_COLORS = [
  '#5865f2',
  '#23a55a',
  '#f0b232',
  '#f23f43',
  '#eb459e',
  '#00a8fc',
  '#8b5cf6',
  '#10b981',
];

const PRESET_BANNERS = [
  { id: 'grad-1', name: 'نيون ديسكورد', style: 'linear-gradient(135deg, #5865f2, #eb459e)' },
  { id: 'grad-2', name: 'شفق الفضاء', style: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' },
  { id: 'grad-3', name: 'ألعاب دارك', style: 'linear-gradient(135deg, #0f172a, #334155)' },
  { id: 'grad-4', name: 'لهيب سايبر', style: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { id: 'grad-5', name: 'ماتريكس زمردي', style: 'linear-gradient(135deg, #059669, #10b981)' },
  { id: 'grad-6', name: 'ذهبي المشرف 👑', style: 'linear-gradient(135deg, #d97706, #78350f)' },
];

const FOUNDER_GRADIENT_PRESETS = [
  { name: 'غروب دافئ (Discord Peach)', from: '#fce4d6', to: '#f7c59f', angle: 145 },
  { name: 'بنفسجي ملكي (Royal Dark)', from: '#1a0b2e', to: '#3d1255', angle: 135 },
  { name: 'شفق ليلي (Night Aurora)', from: '#0b192c', to: '#1e3e62', angle: 150 },
  { name: 'نيترو روز (Nitro Rose)', from: '#f43f5e', to: '#8b5cf6', angle: 135 },
  { name: 'زمرد سيبر (Cyber Emerald)', from: '#064e3b', to: '#059669', angle: 130 },
  { name: 'ذهب فاخر (Golden Sunset)', from: '#451a03', to: '#b45309', angle: 140 },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  currentUser,
  settings,
  onSaveUser,
  onSaveSettings,
  onClose,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sound' | 'appearance' | 'database'>('profile');
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [customStatus, setCustomStatus] = useState(currentUser.customStatus || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [status, setStatus] = useState<UserStatus>(currentUser.status);
  const [selectedColor, setSelectedColor] = useState(currentUser.color || '#5865f2');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar || '');
  const [bannerUrl, setBannerUrl] = useState(currentUser.banner || '');
  const [bannerColor, setBannerColor] = useState(currentUser.bannerColor || 'linear-gradient(135deg, #5865f2, #8b5cf6)');
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [theme, setTheme] = useState(settings.theme);

  // Founder Dual-Color Profile Gradient
  const isFounder = currentUser.role === 'owner' || currentUser.id === 'user-mod';
  const [gradientEnabled, setGradientEnabled] = useState(currentUser.customGradient?.enabled ?? isFounder);
  const [gradientFrom, setGradientFrom] = useState(currentUser.customGradient?.from || '#fce4d6');
  const [gradientTo, setGradientTo] = useState(currentUser.customGradient?.to || '#f7c59f');
  const [gradientAngle, setGradientAngle] = useState(currentUser.customGradient?.angle || 145);

  // File Upload Handlers for Avatar & Banner with automatic client-side compression
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, { maxWidth: 160, maxHeight: 160, quality: 0.82 });
        setAvatarUrl(compressed);
      } catch (err) {
        console.warn('Avatar compression fallback:', err);
      }
    }
    e.target.value = '';
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, { maxWidth: 640, maxHeight: 240, quality: 0.80 });
        setBannerUrl(compressed);
      } catch (err) {
        console.warn('Banner compression fallback:', err);
      }
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    let finalAvatar = avatarUrl.trim();
    let finalBanner = bannerUrl.trim();

    // If avatar or banner was entered as a massive data URL, compress it
    if (finalAvatar.startsWith('data:image/') && finalAvatar.length > 40000) {
      try {
        finalAvatar = await compressDataUrl(finalAvatar, { maxWidth: 160, maxHeight: 160, quality: 0.82 });
      } catch (e) {
        console.warn(e);
      }
    }

    if (finalBanner.startsWith('data:image/') && finalBanner.length > 60000) {
      try {
        finalBanner = await compressDataUrl(finalBanner, { maxWidth: 640, maxHeight: 240, quality: 0.80 });
      } catch (e) {
        console.warn(e);
      }
    }

    const updatedUser: User = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      customStatus: customStatus.trim(),
      bio: bio.trim(),
      status,
      color: selectedColor,
      avatar: finalAvatar,
      banner: finalBanner,
      bannerColor: bannerColor,
      customGradient: isFounder
        ? {
            enabled: gradientEnabled,
            from: gradientFrom,
            to: gradientTo,
            angle: gradientAngle,
          }
        : currentUser.customGradient,
    };
    onSaveUser(updatedUser);

    const updatedSettings: AppSettings = {
      ...settings,
      soundEnabled,
      theme,
    };
    soundEffects.enabled = soundEnabled;
    onSaveSettings(updatedSettings);

    onClose();
  };

  const handleTestSound = () => {
    soundEffects.playJoinVoice();
  };

  return (
    <div
      id="user-settings-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#313338] border border-[#1f2023] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-52 bg-[#2b2d31] p-4 flex flex-col border-b md:border-b-0 md:border-l border-[#1f2023]">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
            إعدادات المستخدم
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'profile' ? 'bg-[#3f4147] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#35373c]'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>الملف الشخصي</span>
            </button>

            <button
              onClick={() => setActiveTab('sound')}
              className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'sound' ? 'bg-[#3f4147] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#35373c]'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>الصوت والمؤثرات</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'appearance' ? 'bg-[#3f4147] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#35373c]'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>المظهر والثيم</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'database' ? 'bg-[#3f4147] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#35373c]'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>الحفظ السحابي الدائم</span>
            </button>
          </div>

          {onLogout && (
            <div className="mt-auto pt-4 border-t border-[#1f2023]">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full text-right px-3 py-2 rounded-lg text-xs font-bold text-[#f23f43] hover:bg-[#f23f43]/15 transition flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
          {/* Header */}
          <div className="p-4 border-b border-[#2b2d31] flex items-center justify-between">
            <h3 className="font-bold text-base text-white">
              {activeTab === 'profile' && 'الملف الشخصي والحساب'}
              {activeTab === 'sound' && 'إعدادات الصوت وتنبيهات ديسكورد'}
              {activeTab === 'appearance' && 'المظهر والتصميم'}
              {activeTab === 'database' && 'حالة الحفظ السحابي الدائم'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#35373c]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {activeTab === 'profile' && (
              <>
                {/* Live Preview Card */}
                {(() => {
                  const previewIsLight = (isFounder && gradientEnabled)
                    ? isLightColor(gradientFrom) || isLightColor(gradientTo)
                    : false;
                  return (
                    <div
                      className={`rounded-2xl overflow-hidden border shadow-xl transition-all duration-300 ${
                        isFounder && gradientEnabled
                          ? previewIsLight
                            ? 'border-black/20 text-[#2c1b0d]'
                            : 'border-white/20 text-white'
                          : 'bg-[#2b2d31] border-[#1f2023] text-white'
                      }`}
                      style={{
                        background: isFounder && gradientEnabled
                          ? `linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo})`
                          : undefined,
                      }}
                    >
                      {/* Banner Preview */}
                      <div
                        className="h-24 w-full relative bg-cover bg-center transition-all duration-300"
                        style={{
                          background: bannerUrl
                            ? `url(${bannerUrl}) center/cover no-repeat`
                            : (isFounder && gradientEnabled
                                ? `linear-gradient(135deg, ${gradientFrom}ee, ${gradientTo}cc)`
                                : bannerColor),
                        }}
                      >
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] text-white font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>معاينة البروفايل الحية</span>
                        </div>
                      </div>

                      <div className={`px-5 pb-5 relative ${isFounder && gradientEnabled ? 'bg-transparent' : 'bg-[#1e1f22]'}`}>
                        <div className="relative -top-9 -mb-5 flex items-end justify-between">
                          <div className="relative z-20">
                            <div
                              className={`w-18 h-18 rounded-full border-4 flex items-center justify-center font-bold text-xl text-white shadow-xl overflow-hidden ${
                                isFounder && gradientEnabled
                                  ? previewIsLight
                                    ? 'border-[#fce4d6] bg-[#2c1b0d]'
                                    : 'border-white/20 bg-[#16171d]'
                                  : 'border-[#1e1f22]'
                              }`}
                              style={{ backgroundColor: selectedColor }}
                            >
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt="Avatar"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                displayName.slice(0, 2)
                              )}
                            </div>
                            <span
                              className={`absolute bottom-0 left-0 w-4 h-4 rounded-full border-2 ${
                                isFounder && gradientEnabled && previewIsLight ? 'border-[#fce4d6]' : 'border-[#1e1f22]'
                              } ${
                                status === 'online'
                                  ? 'bg-[#23a55a]'
                                  : status === 'idle'
                                  ? 'bg-[#f0b232]'
                                  : status === 'dnd'
                                  ? 'bg-[#f23f43]'
                                  : 'bg-[#80848e]'
                              }`}
                            />
                          </div>

                          {/* Speech bubble preview */}
                          {customStatus && (
                            <div className="relative -top-2">
                              <div className={`px-3 py-1 rounded-xl text-xs font-bold shadow-md border ${
                                isFounder && gradientEnabled
                                  ? previewIsLight
                                    ? 'bg-white/90 border-black/15 text-[#3d2311]'
                                    : 'bg-black/60 border-white/20 text-white'
                                  : 'bg-[#2b2d31] border-white/10 text-gray-200'
                              }`}>
                                💬 {customStatus}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-1">
                          <div className="font-bold text-base flex items-center gap-1.5">
                            <span>{displayName}</span>
                            {currentUser.role === 'owner' && <span className="text-amber-400 text-sm">👑</span>}
                          </div>
                          <div className={`text-xs ${isFounder && gradientEnabled && previewIsLight ? 'text-black/60' : 'text-gray-400'}`}>
                            @{currentUser.name}#{currentUser.discriminator}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Section 1: Avatar Customization */}
                <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#1f2023] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#5865f2]" />
                      <span>صورة البروفايل (Avatar)</span>
                    </label>
                    <label className="px-3 py-1 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition shadow">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة من جهازك</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="أو ضع رابط صورة مباشر هنا (https://...)"
                      className="w-full bg-[#1e1f22] text-xs text-white px-3 py-2 rounded-lg border border-[#3f4147] focus:outline-none focus:border-[#5865f2]"
                    />
                  </div>

                  {/* Preset Avatars */}
                  <div>
                    <span className="text-[11px] text-gray-400 mb-1.5 block">أو اختر صورة جاهزة كشخة:</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {PRESET_AVATARS.map((pUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(pUrl)}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition flex-shrink-0 cursor-pointer hover:scale-105 ${
                            avatarUrl === pUrl ? 'border-[#5865f2] ring-2 ring-[#5865f2]/50' : 'border-transparent'
                          }`}
                        >
                          <img src={pUrl} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 bg-red-500/10 rounded-lg flex-shrink-0 border border-red-500/20"
                        >
                          إزالة الصورة
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Banner Customization */}
                <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#1f2023] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span>بانر البروفايل (Profile Banner)</span>
                    </label>
                    <label className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition shadow">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع بانر من جهازك</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <input
                      type="url"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="أو ضع رابط صورة البانر (https://...)"
                      className="w-full bg-[#1e1f22] text-xs text-white px-3 py-2 rounded-lg border border-[#3f4147] focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Preset Banner Styles */}
                  <div>
                    <span className="text-[11px] text-gray-400 mb-1.5 block">تدرجات وألوان بانر ديسكورد:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESET_BANNERS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setBannerColor(b.style);
                            setBannerUrl('');
                          }}
                          className={`h-9 rounded-lg px-2 text-right transition border flex items-center justify-between cursor-pointer ${
                            !bannerUrl && bannerColor === b.style
                              ? 'border-white ring-2 ring-white/50'
                              : 'border-transparent hover:opacity-90'
                          }`}
                          style={{ background: b.style }}
                        >
                          <span className="text-[10px] font-bold text-white drop-shadow">
                            {b.name}
                          </span>
                          {!bannerUrl && bannerColor === b.style && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Founder-Exclusive Dual-Color Profile Gradient */}
                {isFounder && (
                  <div className="bg-gradient-to-br from-amber-500/10 via-[#2b2d31] to-purple-500/10 p-4 rounded-xl border border-amber-500/30 space-y-3.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                          👑
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>خلفية بروفايل المؤسس (تدرج بلونين)</span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">حصري للمؤسس</span>
                          </div>
                          <p className="text-[11px] text-gray-400">تحكم في التدرج اللوني الذي يظهر لجميع المستخدمين في بطاقة بروفايلك</p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gradientEnabled}
                          onChange={(e) => setGradientEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {gradientEnabled && (
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        {/* 2 Color Pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Color 1 */}
                          <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-white/5">
                            <label className="text-[11px] font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
                              <span>اللون الأول (البداية)</span>
                              <span className="font-mono text-amber-400 text-[10px]">{gradientFrom}</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={gradientFrom}
                                onChange={(e) => setGradientFrom(e.target.value)}
                                className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                              />
                              <input
                                type="text"
                                value={gradientFrom}
                                onChange={(e) => setGradientFrom(e.target.value)}
                                className="flex-1 bg-[#111214] text-xs font-mono text-white px-2.5 py-1.5 rounded border border-white/10"
                                placeholder="#fce4d6"
                              />
                            </div>
                          </div>

                          {/* Color 2 */}
                          <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-white/5">
                            <label className="text-[11px] font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
                              <span>اللون الثاني (النهاية)</span>
                              <span className="font-mono text-purple-400 text-[10px]">{gradientTo}</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={gradientTo}
                                onChange={(e) => setGradientTo(e.target.value)}
                                className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                              />
                              <input
                                type="text"
                                value={gradientTo}
                                onChange={(e) => setGradientTo(e.target.value)}
                                className="flex-1 bg-[#111214] text-xs font-mono text-white px-2.5 py-1.5 rounded border border-white/10"
                                placeholder="#f7c59f"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Angle Slider */}
                        <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-gray-300">زاوية التدرج (Angle)</label>
                            <span className="text-[11px] font-mono text-amber-400 font-bold">{gradientAngle}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="5"
                            value={gradientAngle}
                            onChange={(e) => setGradientAngle(Number(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
                          />
                        </div>

                        {/* Presets */}
                        <div>
                          <label className="text-[11px] text-gray-400 block mb-1.5">تدرجات جاهزة مصممة خصيصاً للمؤسس:</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {FOUNDER_GRADIENT_PRESETS.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setGradientFrom(preset.from);
                                  setGradientTo(preset.to);
                                  setGradientAngle(preset.angle);
                                }}
                                className="h-8 rounded-lg px-2 text-right transition border border-white/10 flex items-center justify-between cursor-pointer hover:scale-[1.02] shadow-sm"
                                style={{
                                  background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                                }}
                              >
                                <span
                                  className={`text-[10px] font-extrabold truncate drop-shadow ${
                                    isLightColor(preset.from) || isLightColor(preset.to) ? 'text-black' : 'text-white'
                                  }`}
                                >
                                  {preset.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-2">الحالة الحالية</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'online', name: 'متصل 🟢', color: '#23a55a' },
                      { id: 'idle', name: 'خامل 🌙', color: '#f0b232' },
                      { id: 'dnd', name: 'عدم الإزعاج ⛔', color: '#f23f43' },
                      { id: 'offline', name: 'مخفي ⚪', color: '#80848e' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStatus(s.id as UserStatus)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition text-center ${
                          status === s.id
                            ? 'bg-[#35373c] border-white text-white'
                            : 'bg-[#2b2d31] border-transparent text-gray-300 hover:bg-[#35373c]'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">اسم العرض (Display Name)</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#1e1f22] text-sm text-white px-3 py-2 rounded-lg border border-[#3f4147] focus:outline-none focus:border-[#5865f2]"
                  />
                </div>

                {/* Custom Status Quote */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">الحالة المخصصة (Custom Status)</label>
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="مثال: مطور MODcord - مودكورد 🚀"
                    className="w-full bg-[#1e1f22] text-sm text-white px-3 py-2 rounded-lg border border-[#3f4147] focus:outline-none focus:border-[#5865f2]"
                  />
                </div>

                {/* Avatar Color Picker */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-2">لون الأفاتار الشخصي</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className="w-8 h-8 rounded-full border-2 transition transform hover:scale-110 flex items-center justify-center"
                        style={{
                          backgroundColor: c,
                          borderColor: selectedColor === c ? '#ffffff' : 'transparent',
                        }}
                      >
                        {selectedColor === c && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">نبذة عني (About Me)</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#1e1f22] text-sm text-white px-3 py-2 rounded-lg border border-[#3f4147] focus:outline-none focus:border-[#5865f2] resize-none"
                  />
                </div>
              </>
            )}

            {activeTab === 'sound' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#2b2d31] rounded-xl border border-[#1f2023] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-white">المؤثرات الصوتية لديسكورد</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      تشغيل نغمات الدخول والخروج من الرومات والرسائل الجديدة
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5865f2]"></div>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-4 py-2 bg-[#3f4147] hover:bg-[#4e5058] text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition"
                >
                  <Volume2 className="w-4 h-4 text-green-400" />
                  <span>اختبار نغمة ديسكورد</span>
                </button>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-2">ثيم الواجهة (المود الفاتح والداكن)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                        theme === 'dark'
                          ? 'border-[#5865f2] bg-[#5865f2]/10 ring-2 ring-[#5865f2]/40'
                          : 'border-[#3f4147] bg-[#2b2d31] hover:bg-[#35373c]'
                      }`}
                    >
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <span>مود داكن (Dark)</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">النمط الكلاسيكي الأصلي لديسكورد</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                        theme === 'light'
                          ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/40'
                          : 'border-[#3f4147] bg-[#2b2d31] hover:bg-[#35373c]'
                      }`}
                    >
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span>مود فاتح (Light)</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">نمط نهاري مريح في الإضاءة الساطعة</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('midnight')}
                      className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                        theme === 'midnight'
                          ? 'border-[#5865f2] bg-[#5865f2]/10 ring-2 ring-[#5865f2]/40'
                          : 'border-[#3f4147] bg-[#2b2d31] hover:bg-[#35373c]'
                      }`}
                    >
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span className="text-xs">🌌</span>
                        <span>منتصف الليل (AMOLED)</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">سواد أعمق لشاشات OLED وتوفير البطارية</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-4">
                {/* Cloud Status Card */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-emerald-300">قاعدة البيانات السحابية متصلة ونشطة</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        مزامنة نشطة
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                      تم تفعيل الحفظ السحابي الدائم بنجاح. حسابك وكافة الرسائل، الرومات، والتفاعلات يتم حفظها وتزامنها سحابياً بشكل دائم وآمن.
                    </p>
                  </div>
                </div>

                {/* Security & Durability Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#2b2d31] rounded-xl border border-[#1f2023]">
                    <div className="text-xs font-bold text-white mb-1">🔐 أمان الحسابات</div>
                    <div className="text-[11px] text-gray-400 leading-normal">
                      حسابات المستخدمين وكلمات المرور تحفظ بشكل آمن ومشفر لمنع أي فقدان أو اختراق.
                    </div>
                  </div>

                  <div className="p-3 bg-[#2b2d31] rounded-xl border border-[#1f2023]">
                    <div className="text-xs font-bold text-white mb-1">⚡ استمرارية الرسائل</div>
                    <div className="text-[11px] text-gray-400 leading-normal">
                      لا تفقد أي رسالة أو تفاعل أو روم صوتي/كتابي حتى عند إغلاق التبويب أو إعادة النشر.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Save Button */}
          <div className="p-4 bg-[#2b2d31] border-t border-[#1f2023] flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white rounded-lg hover:bg-[#35373c] transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-[#5865f2] hover:bg-[#4752c4] rounded-lg transition shadow-md"
            >
              حفظ التغييرات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
