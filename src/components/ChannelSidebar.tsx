import React, { useState } from 'react';
import { Channel, Server, User, VoiceSessionState } from '../types';
import {
  ChevronDown,
  Hash,
  Volume2,
  Plus,
  Settings,
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Signal,
  UserPlus,
  Trash2,
  LogOut,
  Crown,
  ArrowLeftRight,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface VoiceParticipant {
  userId: string;
  user?: User;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing?: boolean;
}

interface ChannelSidebarProps {
  server: Server;
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  voiceState: VoiceSessionState;
  onJoinVoice: (channelId: string) => void;
  onDisconnectVoice: () => void;
  onOpenVoiceStage: () => void;
  currentUser: User;
  users: User[];
  theme?: 'dark' | 'midnight' | 'light';
  onToggleTheme?: () => void;
  onOpenCreateChannel: (categoryId?: string, defaultType?: 'text' | 'voice') => void;
  onOpenServerSettings: () => void;
  onOpenUserSettings: () => void;
  onOpenUserPopout?: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onLogout?: () => void;
  voiceParticipantsMap?: Record<string, VoiceParticipant[]>;
  onForceMoveUser?: (targetUserId: string, targetChannelId: string) => void;
  onOpenEditChannel?: (channel: Channel) => void;
  onOpenServerRoles?: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  server,
  activeChannelId,
  onSelectChannel,
  voiceState,
  onJoinVoice,
  onDisconnectVoice,
  onOpenVoiceStage,
  currentUser,
  users,
  theme = 'dark',
  onToggleTheme,
  onOpenCreateChannel,
  onOpenServerSettings,
  onOpenUserSettings,
  onOpenUserPopout,
  onToggleMute,
  onToggleDeafen,
  onLogout,
  voiceParticipantsMap = {},
  onForceMoveUser,
  onOpenEditChannel,
  onOpenServerRoles,
}) => {
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [movingUserId, setMovingUserId] = useState<string | null>(null);
  const isLight = theme === 'light';

  const isServerOwner = server.ownerId === currentUser.id;
  const canManageChannels =
    isServerOwner ||
    currentUser.role === 'owner' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'mod';

  const handleCopyInvite = () => {
    const inviteLink = window.location.href;
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => {
      setInviteCopied(false);
    }, 2000);
  };

  const categories = server.categories || [];
  const uncategorizedChannels = server.channels.filter((c) => !c.categoryId);

  return (
    <div
      id="channel-sidebar"
      className={`w-64 flex flex-col h-full border-l select-none flex-shrink-0 transition-colors duration-200 ${
        isLight
          ? 'bg-[#f2f3f5] border-[#e3e5e8]'
          : 'bg-[#141519] border-white/[0.05]'
      }`}
    >
      {/* Server Header Dropdown */}
      <div className={`relative border-b flex items-center justify-between px-2 ${
        isLight ? 'border-[#e3e5e8]' : 'border-white/[0.05]'
      }`}>
        <button
          onClick={() => setShowServerMenu(!showServerMenu)}
          className={`w-full h-13 px-2.5 flex items-center justify-between font-bold text-sm transition-all duration-200 cursor-pointer group ${
            isLight
              ? 'text-[#060607] hover:bg-black/[0.04] rounded-lg'
              : 'text-white hover:bg-white/[0.04] rounded-lg'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="truncate tracking-wide font-extrabold">{server.name}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${
              isLight
                ? showServerMenu ? 'rotate-180 text-indigo-600' : 'text-gray-500 group-hover:text-gray-900'
                : showServerMenu ? 'rotate-180 text-indigo-400' : 'text-gray-400 group-hover:text-white'
            }`}
          />
        </button>

        {/* Server Options Dropdown with Glassmorphism */}
        {showServerMenu && (
          <div className="absolute top-14 right-2 left-2 glass-dropdown rounded-xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                handleCopyInvite();
                setShowServerMenu(false);
              }}
              className="w-full px-3 py-2 rounded-lg text-xs font-bold text-indigo-300 hover:bg-[#5865f2] hover:text-white flex items-center justify-between transition duration-200 cursor-pointer"
            >
              <span>{inviteCopied ? '✓ تم نسخ الرابط بنجاح!' : 'دعوة الأصدقاء للسيرفر'}</span>
              <UserPlus className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onOpenServerSettings();
                setShowServerMenu(false);
              }}
              className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:bg-white/[0.08] hover:text-white flex items-center justify-between transition duration-200 cursor-pointer"
            >
              <span>إعدادات السيرفر</span>
              <Settings className="w-4 h-4" />
            </button>

            {onOpenServerRoles && isServerOwner && (
              <button
                onClick={() => {
                  onOpenServerRoles();
                  setShowServerMenu(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 flex items-center justify-between transition duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>إدارة رتب السيرفر</span>
                </div>
                <span className="text-[10px] bg-amber-500/30 px-1.5 py-0.5 rounded text-amber-200 font-extrabold flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 text-amber-300" />
                  المالك
                </span>
              </button>
            )}

            {canManageChannels && (
              <button
                onClick={() => {
                  onOpenCreateChannel();
                  setShowServerMenu(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-200 border border-amber-500/20 flex items-center justify-between transition duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>إنشاء روم جديد (المشرف)</span>
                </div>
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Categories & their channels */}
        {categories.map((category) => {
          const catChannels = server.channels.filter((c) => c.categoryId === category.id);
          return (
            <div key={category.id} className="space-y-1">
              {/* Category Header */}
              <div className={`flex items-center justify-between px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider group ${
                isLight ? 'text-[#5c6370]' : 'text-gray-400/80'
              }`}>
                <span className="truncate">{category.name}</span>
                {canManageChannels && (
                  <button
                    onClick={() =>
                      onOpenCreateChannel(
                        category.id,
                        category.id === 'cat-voice' ? 'voice' : 'text'
                      )
                    }
                    title="إنشاء روم في هذا القسم"
                    className={`opacity-0 group-hover:opacity-100 transition p-0.5 rounded cursor-pointer ${
                      isLight ? 'hover:text-black hover:bg-black/[0.06] text-gray-500' : 'hover:text-white text-gray-400 hover:bg-white/[0.08]'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Channels */}
              {catChannels.map((channel) => {
                const isSelected = activeChannelId === channel.id;
                const isVoice = channel.type === 'voice';
                const isVoiceConnectedHere =
                  voiceState.isConnected && voiceState.channelId === channel.id;

                // Active participants in this channel
                const participantsInChannel = voiceParticipantsMap[channel.id] || [];
                const hasSpeakingParticipant = participantsInChannel.some((p) => p.isSpeaking);

                return (
                  <div key={channel.id} className="space-y-1">
                    <div
                      className={`relative group flex items-center rounded-lg transition-all duration-200 ${
                        isSelected
                          ? isLight
                            ? 'bg-[#5865f2]/12 text-[#5865f2] font-bold border-r-2 border-[#5865f2]'
                            : 'bg-gradient-to-l from-indigo-500/25 to-indigo-500/10 text-white font-bold border-r-2 border-indigo-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                          : isVoiceConnectedHere
                          ? isLight
                            ? 'bg-emerald-500/15 text-emerald-700 font-bold border-r-2 border-emerald-500'
                            : 'bg-emerald-500/15 text-emerald-400 font-bold border-r-2 border-emerald-500'
                          : isLight
                          ? 'text-[#4f5660] hover:text-[#060607] hover:bg-black/[0.04]'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <button
                        onClick={() => {
                          if (isVoice) {
                            if (!isVoiceConnectedHere) {
                              onJoinVoice(channel.id);
                            } else {
                              onOpenVoiceStage();
                            }
                          } else {
                            onSelectChannel(channel.id);
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 flex items-center gap-2.5 text-right truncate cursor-pointer min-w-0"
                      >
                        {isVoice ? (
                          <div className="relative flex items-center justify-center flex-shrink-0">
                            <Volume2
                              className={`w-4 h-4 ${
                                isVoiceConnectedHere
                                  ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                                  : isLight ? 'text-[#747f8d] group-hover:text-[#060607]' : 'text-gray-400 group-hover:text-gray-300'
                              }`}
                            />
                            {hasSpeakingParticipant && (
                              <span className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            )}
                          </div>
                        ) : (
                          <Hash className={`w-4 h-4 flex-shrink-0 ${
                            isSelected
                              ? isLight ? 'text-[#5865f2]' : 'text-indigo-400'
                              : isLight ? 'text-[#747f8d] group-hover:text-[#060607]' : 'text-gray-500 group-hover:text-gray-400'
                          }`} />
                        )}
                        <span className="text-xs truncate flex-1 tracking-wide">{channel.name}</span>

                        {/* Equalizer Wave / Member Count for Voice */}
                        {isVoice && participantsInChannel.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {hasSpeakingParticipant && (
                              <div className="flex items-end gap-0.5 h-3 px-1">
                                <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-1" />
                                <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-2" />
                                <span className="w-0.5 bg-emerald-400 rounded-full animate-eq-3" />
                              </div>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                              isLight
                                ? 'bg-white text-emerald-700 border-emerald-300'
                                : 'bg-[#0d0e12] text-emerald-400 border-emerald-500/20'
                            }`}>
                              {participantsInChannel.length}
                            </span>
                          </div>
                        )}
                      </button>

                      {/* Admin Channel Edit Action */}
                      {canManageChannels && onOpenEditChannel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onOpenEditChannel(channel);
                          }}
                          title="تعديل اسم الروم وإدارته (صلاحية المشرف)"
                          className="opacity-0 group-hover:opacity-100 p-1.5 ml-1.5 hover:bg-white/10 text-gray-400 hover:text-amber-300 rounded-md transition duration-150 flex-shrink-0 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Active Voice Participants list inside the voice channel */}
                    {isVoice && participantsInChannel.length > 0 && (
                      <div className="mr-6 my-1.5 space-y-1">
                        {participantsInChannel.map((p) => {
                          const u =
                            p.user ||
                            users.find((user) => user.id === p.userId) || {
                              id: p.userId,
                              displayName: 'صديق',
                              color: '#5865f2',
                              role: 'member',
                            };
                          const isTargetOwner = u.role === 'owner' || u.id === 'user-mod';

                          return (
                            <div
                              key={p.userId}
                              className={`flex items-center justify-between px-2 py-1 text-[11px] rounded-md transition-all duration-200 relative group/p ${
                                p.isSpeaking
                                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                                  : 'bg-white/[0.02] hover:bg-white/[0.05] text-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white overflow-hidden flex-shrink-0 transition-transform ${
                                    p.isSpeaking ? 'ring-2 ring-emerald-400 scale-110' : ''
                                  }`}
                                  style={{ backgroundColor: u.color || '#5865f2' }}
                                >
                                  {u.avatar ? (
                                    <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    u.displayName.slice(0, 1)
                                  )}
                                </div>
                                <span className="truncate">{u.displayName}</span>
                                {isTargetOwner && (
                                  <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {p.isMuted && <MicOff className="w-3 h-3 text-[#f23f43]" />}

                                {/* Move Member action for ! MOD */}
                                {isServerOwner && p.userId !== currentUser.id && (
                                  <div className="relative">
                                    <button
                                      onClick={() =>
                                        setMovingUserId(
                                          movingUserId === p.userId ? null : p.userId
                                        )
                                      }
                                      title="نقل العضو إلى روم آخر"
                                      className="opacity-0 group-hover/p:opacity-100 p-0.5 hover:bg-amber-500/20 text-amber-400 rounded transition"
                                    >
                                      <ArrowLeftRight className="w-3 h-3" />
                                    </button>

                                    {movingUserId === p.userId && (
                                      <div className="absolute left-0 bottom-full mb-1 w-44 glass-dropdown rounded-xl p-1.5 z-50 space-y-0.5">
                                        <div className="px-2 py-1 text-[9px] text-gray-400 font-bold border-b border-white/10">
                                          نقل إلى روم:
                                        </div>
                                        {server.channels
                                          .filter(
                                            (c) => c.type === 'voice' && c.id !== channel.id
                                          )
                                          .map((vc) => (
                                            <button
                                              key={vc.id}
                                              onClick={() => {
                                                onForceMoveUser?.(p.userId, vc.id);
                                                setMovingUserId(null);
                                              }}
                                              className="w-full text-right px-2 py-1 rounded text-[11px] text-gray-200 hover:bg-indigo-600 hover:text-white transition truncate block"
                                            >
                                              🔊 {vc.name}
                                            </button>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Uncategorized Channels */}
        {uncategorizedChannels.length > 0 && (
          <div className="space-y-1">
            <div className={`px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
              isLight ? 'text-[#5c6370]' : 'text-gray-400/80'
            }`}>
              قنوات أخرى
            </div>
            {uncategorizedChannels.map((channel) => {
              const isSelected = activeChannelId === channel.id;
              const isVoice = channel.type === 'voice';
              return (
                <div
                  key={channel.id}
                  className={`relative group flex items-center rounded-lg transition-all duration-200 ${
                    isSelected
                      ? isLight
                        ? 'bg-[#5865f2]/12 text-[#5865f2] font-bold border-r-2 border-[#5865f2]'
                        : 'bg-gradient-to-l from-indigo-500/25 to-indigo-500/10 text-white font-bold border-r-2 border-indigo-500'
                      : isLight
                      ? 'text-[#4f5660] hover:text-[#060607] hover:bg-black/[0.04]'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <button
                    onClick={() => {
                      if (isVoice) {
                        onJoinVoice(channel.id);
                      } else {
                        onSelectChannel(channel.id);
                      }
                    }}
                    className="flex-1 px-2.5 py-1.5 flex items-center gap-2.5 text-right truncate cursor-pointer min-w-0"
                  >
                    {isVoice ? (
                      <Volume2 className={`w-4 h-4 flex-shrink-0 ${
                        isLight ? 'text-emerald-600' : 'text-emerald-400'
                      }`} />
                    ) : (
                      <Hash className={`w-4 h-4 flex-shrink-0 ${
                        isSelected
                          ? isLight ? 'text-[#5865f2]' : 'text-indigo-400'
                          : isLight ? 'text-[#747f8d] group-hover:text-[#060607]' : 'text-gray-500 group-hover:text-gray-300'
                      }`} />
                    )}
                    <span className="text-xs truncate flex-1">{channel.name}</span>
                  </button>

                  {canManageChannels && onOpenEditChannel && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onOpenEditChannel(channel);
                      }}
                      title="تعديل اسم الروم (صلاحية المشرف)"
                      className={`opacity-0 group-hover:opacity-100 p-1.5 ml-1.5 rounded-md transition duration-150 flex-shrink-0 cursor-pointer ${
                        isLight ? 'hover:bg-black/[0.06] text-gray-500 hover:text-black' : 'hover:bg-white/10 text-gray-400 hover:text-amber-300'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Voice Connection Status Bar (Shows when connected) */}
      {voiceState.isConnected && (
        <div className={`border-t p-3 flex items-center justify-between shadow-sm transition-colors ${
          isLight
            ? 'border-[#e3e5e8] bg-emerald-50 text-emerald-950'
            : 'border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-[#141519] to-emerald-950/20'
        }`}>
          <button
            onClick={onOpenVoiceStage}
            className="flex-1 text-right flex flex-col cursor-pointer group"
          >
            <div className={`flex items-center gap-1.5 text-xs font-extrabold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-ping" />
              <span>صوت متصل (RTC Active)</span>
            </div>
            <div className={`text-[11px] truncate mt-0.5 font-medium ${isLight ? 'text-gray-700 group-hover:text-black' : 'text-gray-300 group-hover:text-white'}`}>
              {server.channels.find((c) => c.id === voiceState.channelId)?.name || 'غرفة صوتية'}
            </div>
          </button>

          <button
            onClick={onDisconnectVoice}
            title="قطع الاتصال الصوتي"
            className={`p-2 rounded-lg transition duration-200 cursor-pointer border ${
              isLight
                ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                : 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.5)]'
            }`}
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User Bottom Bar */}
      <div className={`h-15 border-t px-2.5 flex items-center justify-between transition-colors ${
        isLight
          ? 'bg-[#ebedef] border-[#e3e5e8]'
          : 'bg-[#101114] border-white/[0.05]'
      }`}>
        {/* User Card Trigger */}
        <button
          onClick={onOpenUserPopout || onOpenUserSettings}
          className={`flex items-center gap-2.5 p-1 rounded-lg transition flex-1 min-w-0 text-right cursor-pointer group ${
            isLight ? 'hover:bg-black/[0.05]' : 'hover:bg-white/[0.06]'
          }`}
        >
          {/* Avatar with status dot */}
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md group-hover:scale-105 transition-transform"
              style={{ backgroundColor: currentUser.color || '#5865f2' }}
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.displayName}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                currentUser.displayName.slice(0, 2)
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 ${
                isLight ? 'border-[#ebedef]' : 'border-[#101114]'
              } ${
                currentUser.status === 'online'
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                  : currentUser.status === 'idle'
                  ? 'bg-amber-400'
                  : currentUser.status === 'dnd'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className={`text-xs font-bold truncate flex items-center gap-1 ${
              isLight ? 'text-[#060607]' : 'text-white'
            }`}>
              <span className={isLight ? 'group-hover:text-indigo-600' : 'group-hover:text-indigo-300'}>{currentUser.displayName}</span>
              {isServerOwner && <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />}
            </div>
            <div className={`text-[10px] font-mono truncate ${
              isLight ? 'text-[#5c6370]' : 'text-gray-400'
            }`}>
              #{currentUser.discriminator}
            </div>
          </div>
        </button>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleMute}
            title={voiceState.isMuted ? 'إلغاء كتم الميكروفون' : 'كتم الميكروفون'}
            className={`p-2 rounded-lg transition cursor-pointer ${
              voiceState.isMuted
                ? 'text-red-500 bg-red-500/10'
                : isLight
                ? 'text-[#5c6370] hover:text-[#060607] hover:bg-black/[0.06]'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {voiceState.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleDeafen}
            title={voiceState.isDeafened ? 'إلغاء كتم الصوت' : 'كتم أصوات الغرفة'}
            className={`p-2 rounded-lg transition cursor-pointer ${
              voiceState.isDeafened
                ? 'text-red-500 bg-red-500/10'
                : isLight
                ? 'text-[#5c6370] hover:text-[#060607] hover:bg-black/[0.06]'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Headphones className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenUserSettings}
            title="إعدادات المستخدم"
            className={`p-2 rounded-lg transition cursor-pointer ${
              isLight
                ? 'text-[#5c6370] hover:text-[#060607] hover:bg-black/[0.06]'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'light' ? 'التبديل إلى المود الداكن 🌙' : 'التبديل إلى المود الفاتح ☀️'}
              className={`p-2 rounded-lg transition cursor-pointer ${
                isLight
                  ? 'hover:bg-black/[0.06] text-amber-600'
                  : 'hover:bg-white/[0.08] text-amber-400 hover:text-amber-300'
              }`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              title="تبديل الحساب / تسجيل الخروج"
              className={`p-2 rounded-lg transition cursor-pointer ${
                isLight
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-400 hover:text-red-400 hover:bg-red-500/20'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
