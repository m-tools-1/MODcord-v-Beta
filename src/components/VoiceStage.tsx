import React, { useEffect, useRef, useState } from 'react';
import { Channel, Server, User, VoiceSessionState } from '../types';
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Video,
  VideoOff,
  ScreenShare,
  Signal,
  Sparkles,
  Volume2,
  Users,
  Copy,
  Check,
  Crown,
  ArrowLeftRight,
  Maximize2,
  Minimize2,
  StopCircle,
  MoreVertical,
  VolumeX,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { RoleBadge } from './RoleBadge';
import { getRoleInfo } from '../utils/roles';

export interface RemoteVoiceParticipant {
  userId: string;
  user?: User;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing?: boolean;
}

interface VoiceStageProps {
  channel: Channel;
  server?: Server;
  currentUser: User;
  users: User[];
  voiceState: VoiceSessionState;
  remoteParticipants?: RemoteVoiceParticipant[];
  theme?: 'dark' | 'midnight' | 'light';
  onToggleTheme?: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onDisconnect: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onSendSpeakingState?: (isSpeaking: boolean) => void;
  // Admin and screen share features
  onForceMoveUser?: (targetUserId: string, targetChannelId: string) => void;
  onForceMuteUser?: (targetUserId: string, isMuted: boolean) => void;
  onForceDisconnectUser?: (targetUserId: string) => void;
  onSendScreenFrame?: (frame: string) => void;
  onStartScreenShareBroadcast?: () => void;
  onStopScreenShareBroadcast?: () => void;
  onOpenEditChannel?: (channel: Channel) => void;
  activeScreenShare?: {
    userId: string;
    userName: string;
    channelId: string;
    frame?: string;
  } | null;
  // WebRTC real-time audio sync
  localMicLevel?: number;
  isLocalSpeaking?: boolean;
  remoteSpeakingMap?: Record<string, boolean>;
  remoteVolumeLevels?: Record<string, number>;
  userVolumes?: Record<string, number>;
  setUserVolume?: (userId: string, volume: number) => void;
}

export const VoiceStage: React.FC<VoiceStageProps> = ({
  channel,
  server,
  currentUser,
  users,
  voiceState,
  remoteParticipants = [],
  theme = 'dark',
  onToggleTheme,
  onToggleMute,
  onToggleDeafen,
  onDisconnect,
  onToggleCamera,
  onToggleScreenShare,
  onSendSpeakingState,
  onForceMoveUser,
  onForceMuteUser,
  onForceDisconnectUser,
  onSendScreenFrame,
  onStartScreenShareBroadcast,
  onStopScreenShareBroadcast,
  onOpenEditChannel,
  activeScreenShare,
  localMicLevel,
  isLocalSpeaking,
  remoteSpeakingMap,
  remoteVolumeLevels,
  userVolumes,
  setUserVolume,
}) => {
  const [micLevel, setMicLevel] = useState(0);
  const [isMicSpeaking, setIsMicSpeaking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openAdminMenuForUser, setOpenAdminMenuForUser] = useState<string | null>(null);
  const [openVolumePopoverForUser, setOpenVolumePopoverForUser] = useState<string | null>(null);
  const [isTheaterScreen, setIsTheaterScreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Screen share refs
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenIntervalRef = useRef<any>(null);
  const theaterContainerRef = useRef<HTMLDivElement | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const isOwner = currentUser.role === 'owner' || currentUser.id === 'user-mod';

  const onSendSpeakingStateRef = useRef(onSendSpeakingState);
  onSendSpeakingStateRef.current = onSendSpeakingState;

  const hasTopLevelMic = localMicLevel !== undefined;

  // Initialize microphone level detection (fallback if not provided from top-level WebRTC)
  useEffect(() => {
    if (hasTopLevelMic) return;
    let isMounted = true;
    let lastSpeakingState = false;

    async function initAudio() {
      if (voiceState.isMuted) {
        setIsMicSpeaking(false);
        setMicLevel(0);
        if (lastSpeakingState) {
          lastSpeakingState = false;
          onSendSpeakingStateRef.current?.(false);
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!isMounted || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setMicLevel(level);

          const speaking = level > 12;
          setIsMicSpeaking(speaking);

          if (speaking !== lastSpeakingState) {
            lastSpeakingState = speaking;
            onSendSpeakingStateRef.current?.(speaking);
          }

          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (err) {
        console.warn('Microphone permission not granted or device missing:', err);
      }
    }

    initAudio();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [hasTopLevelMic, voiceState.isMuted]);

  // Handle webcam video toggle with HD constraints & graceful fallback
  useEffect(() => {
    if (voiceState.isVideoOn) {
      const getCamStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            },
          });
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch {
          // Fallback if ideal dimensions not supported
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (e) {
            console.warn('Camera error or permission denied:', e);
          }
        }
      };
      getCamStream();
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [voiceState.isVideoOn]);

  // Handle real screen sharing start/stop
  const handleStartScreenShare = async () => {
    try {
      const mediaDevices = navigator.mediaDevices as any;
      if (!mediaDevices || !mediaDevices.getDisplayMedia) {
        alert('مشاركة الشاشة غير مدعومة في هذا المتصفح');
        return;
      }

      // High Quality 1080p / 60fps preferred capture
      let stream: MediaStream;
      try {
        stream = await mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 60 },
          },
          audio: true,
        });
      } catch {
        // Fallback to basic constraints if advanced settings rejected
        stream = await mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      }

      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      onStartScreenShareBroadcast?.();

      // Start canvas frame relay for other participants (High fidelity relay)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      canvas.width = 1280;
      canvas.height = 720;

      screenIntervalRef.current = setInterval(() => {
        if (screenVideoRef.current && ctx && screenStreamRef.current?.active) {
          ctx.drawImage(screenVideoRef.current, 0, 0, canvas.width, canvas.height);
          const frameData = canvas.toDataURL('image/jpeg', 0.72);
          onSendScreenFrame?.(frameData);
        }
      }, 120);

      stream.getVideoTracks()[0].onended = () => {
        handleStopScreenShare();
      };

      onToggleScreenShare();
      soundEffects.playJoin();
    } catch (err) {
      console.warn('Screen share canceled or error:', err);
    }
  };

  const handleStopScreenShare = () => {
    if (screenIntervalRef.current) {
      clearInterval(screenIntervalRef.current);
      screenIntervalRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    onStopScreenShareBroadcast?.();
    if (voiceState.isScreenSharing) {
      onToggleScreenShare();
    }
    soundEffects.playLeave();
  };

  const toggleScreenSharing = () => {
    if (voiceState.isScreenSharing) {
      handleStopScreenShare();
    } else {
      handleStartScreenShare();
    }
  };

  // Toggle fullscreen for screen share viewer
  const handleToggleFullscreen = () => {
    if (!theaterContainerRef.current) return;
    if (!document.fullscreenElement) {
      theaterContainerRef.current.requestFullscreen().catch(() => {});
      setIsTheaterScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsTheaterScreen(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Other voice channels for admin moving
  const otherVoiceChannels =
    server?.channels.filter((c) => c.type === 'voice' && c.id !== channel.id) || [];

  const effectiveMicLevel = localMicLevel !== undefined ? localMicLevel : micLevel;
  const effectiveIsSpeaking = isLocalSpeaking !== undefined ? isLocalSpeaking : isMicSpeaking;

  // Build active participant list
  const meParticipant = {
    user: currentUser,
    isMuted: voiceState.isMuted,
    isDeafened: voiceState.isDeafened,
    isSpeaking: !voiceState.isMuted && effectiveIsSpeaking,
    isVideo: voiceState.isVideoOn,
    isScreen: voiceState.isScreenSharing,
  };

  const otherParticipants = remoteParticipants
    .filter((rp) => rp.userId !== currentUser.id)
    .map((rp) => {
      const u =
        rp.user ||
        users.find((user) => user.id === rp.userId) || {
          id: rp.userId,
          name: 'صديق',
          displayName: 'صديق متصل',
          discriminator: '0000',
          avatar: '',
          status: 'online',
          role: 'member',
          roleTitle: 'عضو في السيرفر',
          roleColor: '#38bdf8',
          color: '#5865f2',
        };
      const isLiveSpeaking = remoteSpeakingMap?.[rp.userId] ?? rp.isSpeaking;
      return {
        user: u as User,
        isMuted: rp.isMuted,
        isDeafened: rp.isDeafened,
        isSpeaking: !rp.isMuted && isLiveSpeaking,
        isVideo: false,
        isScreen: !!rp.isScreenSharing,
      };
    });

  const allParticipants = [meParticipant, ...otherParticipants];

  // Is someone sharing screen in this channel?
  const hasActiveScreen =
    voiceState.isScreenSharing ||
    (activeScreenShare && activeScreenShare.channelId === channel.id);

  const isLight = theme === 'light';

  return (
    <div
      id="voice-stage-container"
      className={`flex-1 flex flex-col relative overflow-hidden select-none h-full transition-colors duration-200 ${
        isLight ? 'bg-[#f2f3f5] text-gray-900' : 'bg-[#0b0c10] text-white'
      }`}
    >
      {/* Top Header */}
      <div
        id="voice-stage-header"
        className={`h-13 border-b px-4 flex items-center justify-between backdrop-blur-md z-10 transition-colors duration-200 ${
          isLight
            ? 'bg-white/95 border-[#e3e5e8]'
            : 'bg-[#121317]/90 border-white/[0.05]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isLight ? 'bg-emerald-100 border border-emerald-300' : 'bg-emerald-500/10 border border-emerald-500/20'
          }`}>
            <Volume2 className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <span className={`font-extrabold text-base tracking-wide ${
            isLight ? 'text-gray-900' : 'text-white'
          }`}>
            {channel.name}
          </span>
          {isOwner && onOpenEditChannel && (
            <button
              onClick={() => onOpenEditChannel(channel)}
              title="تعديل اسم الروم الصوتي وإدارته (المشرف)"
              className={`p-1 rounded-md transition cursor-pointer ${
                isLight ? 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100' : 'text-gray-400 hover:text-amber-300 hover:bg-white/10'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
          <span className={`text-xs font-medium ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
            ({server?.name || 'MODcord - مودكورد'})
          </span>

          {isOwner && (
            <span className="mr-2 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
              <Crown className="w-3 h-3" />
              <span>أنت المشرف العام (صلاحية إدارة ونقل الأعضاء)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyInvite}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(99,102,241,0.3)] cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? '✓ تم نسخ الرابط!' : 'دعوة صديق للروم'}</span>
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'light' ? 'التبديل إلى المود الداكن 🌙' : 'التبديل إلى المود الفاتح ☀️'}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                theme === 'light'
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-sm'
                  : 'bg-white/[0.05] hover:bg-white/10 text-amber-300 border-white/10 hover:border-amber-400/30'
              }`}
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">مود داكن</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">مود فاتح</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold shadow-[0_0_10px_rgba(52,211,153,0.15)]">
            <Signal className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-bold">صوت حي WebRTC HD</span>
            <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded font-mono font-bold">{voiceState.ping}ms</span>
          </div>
        </div>
      </div>

      {/* Main Video & Audio Stage Grid */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col items-center">
        {/* Real Live Screen Share Viewport (when active) */}
        {hasActiveScreen && (
          <div
            ref={theaterContainerRef}
            className="w-full max-w-5xl mb-6 rounded-3xl bg-black border-2 border-indigo-500/70 overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.3)] relative flex flex-col items-center justify-center min-h-[280px] sm:min-h-[420px]"
          >
            {/* Screen Stream Display */}
            {voiceState.isScreenSharing ? (
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain max-h-[70vh]"
              />
            ) : activeScreenShare?.frame ? (
              <img
                src={activeScreenShare.frame}
                alt="بث الشاشة المباشر"
                className="w-full h-full object-contain max-h-[70vh]"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <ScreenShare className="w-12 h-12 text-indigo-400 animate-pulse mb-3" />
                <span className="font-bold text-white text-base">جارٍ تحميل بث الشاشة المباشر...</span>
              </div>
            )}

            {/* Screen Header Bar Overlay */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-2xl text-xs font-semibold text-white pointer-events-auto border border-white/10">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-red-400 font-black">بث مباشر 🔴</span>
                <span className="text-gray-300">
                  {voiceState.isScreenSharing
                    ? 'شاشتك الخاصة (1080p 60FPS Ultra HD)'
                    : `شاشة ${activeScreenShare?.userName || 'صديق'}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {voiceState.isScreenSharing && (
                  <button
                    onClick={handleStopScreenShare}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>إيقاف البث</span>
                  </button>
                )}

                <button
                  onClick={handleToggleFullscreen}
                  title="ملء الشاشة"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
                >
                  {isTheaterScreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notice when room is empty */}
        {otherParticipants.length === 0 && (
          <div className="mb-6 glass-panel rounded-2xl px-5 py-3 text-xs text-gray-300 flex items-center gap-3 shadow-lg border border-white/[0.06]">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <span>
              أنت متصل بالروم الصوتي الآن. يمكنك التحدث، ومشاركة شاشتك للأصدقاء بدقة عالية، أو إرسال دعوة الروم للشباب!
            </span>
          </div>
        )}

        {/* Participants Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl">
          {allParticipants.map((p, idx) => {
            const isMe = p.user.id === currentUser.id;
            const isTargetOwner = p.user.role === 'owner' || p.user.id === 'user-mod';

            return (
              <div
                key={p.user.id || idx}
                className={`relative aspect-video rounded-3xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 shadow-2xl group ${
                  isLight ? 'bg-white' : 'bg-[#14151b]'
                } ${
                  p.isSpeaking
                    ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.35)] scale-[1.01]'
                    : isTargetOwner
                    ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : isLight
                    ? 'border-gray-200 hover:border-gray-300'
                    : 'border-white/[0.06] hover:border-white/15'
                }`}
              >
                {/* Admin controls button for ! MOD */}
                {isOwner && !isMe && (
                  <div className="absolute top-3 left-3 z-30">
                    <button
                      onClick={() =>
                        setOpenAdminMenuForUser(
                          openAdminMenuForUser === p.user.id ? null : p.user.id
                        )
                      }
                      title="صلاحيات المشرف العام (! MOD)"
                      className="p-1.5 bg-black/70 hover:bg-amber-500/30 border border-amber-500/50 rounded-xl text-amber-400 hover:text-white transition flex items-center gap-1.5 text-[11px] font-bold shadow-lg cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>إدارة العضو</span>
                    </button>

                    {/* Admin Actions Dropdown */}
                    {openAdminMenuForUser === p.user.id && (
                      <div className="absolute left-0 mt-2 w-52 glass-dropdown rounded-2xl shadow-2xl p-2 space-y-1 text-right z-40 animate-in fade-in zoom-in-95">
                        <div className="px-2.5 py-1 text-[10px] font-extrabold text-gray-400 border-b border-white/10">
                          تحكم المشرف بـ ({p.user.displayName})
                        </div>

                        {/* Move user to another voice channel */}
                        <div className="py-1">
                          <div className="px-2.5 py-1 text-[10px] text-amber-400 font-bold flex items-center gap-1">
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>نقل العضو إلى روم آخر:</span>
                          </div>
                          {otherVoiceChannels.length > 0 ? (
                            otherVoiceChannels.map((targetChan) => (
                              <button
                                key={targetChan.id}
                                onClick={() => {
                                  onForceMoveUser?.(p.user.id, targetChan.id);
                                  setOpenAdminMenuForUser(null);
                                  soundEffects.playJoin();
                                }}
                                className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-gray-200 hover:bg-indigo-600 hover:text-white transition truncate block cursor-pointer"
                              >
                                🔊 {targetChan.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-2.5 py-1 text-[10px] text-gray-500">
                              لا توجد غرف صوتية أخرى
                            </div>
                          )}
                        </div>

                        <div className="border-t border-white/10 pt-1">
                          {/* Force Mute */}
                          <button
                            onClick={() => {
                              onForceMuteUser?.(p.user.id, !p.isMuted);
                              setOpenAdminMenuForUser(null);
                            }}
                            className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-gray-200 hover:bg-red-500/20 hover:text-red-400 transition flex items-center gap-2 cursor-pointer"
                          >
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>{p.isMuted ? 'إلغاء الكتم الإداري' : 'كتم العضو إدارياً'}</span>
                          </button>

                          {/* Force Disconnect */}
                          <button
                            onClick={() => {
                              onForceDisconnectUser?.(p.user.id);
                              setOpenAdminMenuForUser(null);
                            }}
                            className="w-full text-right px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/20 transition flex items-center gap-2 cursor-pointer font-bold"
                          >
                            <PhoneOff className="w-3.5 h-3.5" />
                            <span>طرد من الروم الصوتي</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Video if webcam active */}
                {isMe && voiceState.isVideoOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  /* Avatar Card */
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-3">
                      <div
                        className={`w-22 h-22 rounded-full flex items-center justify-center text-2xl font-black shadow-xl transition-all duration-300 ${
                          p.isSpeaking
                            ? 'ring-4 ring-emerald-400 ring-offset-4 ring-offset-[#14151b] scale-110 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                            : isTargetOwner
                            ? 'ring-2 ring-amber-500/60 ring-offset-2 ring-offset-[#14151b]'
                            : ''
                        }`}
                        style={{ backgroundColor: p.user.color || '#5865f2' }}
                      >
                        {p.user.avatar ? (
                          <img
                            src={p.user.avatar}
                            alt={p.user.displayName}
                            className="w-full h-full rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          p.user.displayName.slice(0, 2)
                        )}
                      </div>

                      {/* Speaking Waves visual */}
                      {p.isSpeaking && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.9)]"></span>
                        </span>
                      )}

                      {/* Screen Sharing badge on participant */}
                      {p.isScreen && (
                        <span className="absolute -bottom-1 -left-1 bg-indigo-600 rounded-full p-1.5 shadow-lg border border-white/20">
                          <ScreenShare className="w-3.5 h-3.5 text-white" />
                        </span>
                      )}
                    </div>

                    {/* Speaking Equalizer Bar below avatar */}
                    {p.isSpeaking && (
                      <div className="flex items-end gap-1 h-3 px-2">
                        <span className="w-1 bg-emerald-400 rounded-full animate-eq-1" />
                        <span className="w-1 bg-emerald-400 rounded-full animate-eq-2" />
                        <span className="w-1 bg-emerald-400 rounded-full animate-eq-3" />
                        <span className="w-1 bg-emerald-400 rounded-full animate-eq-2" />
                      </div>
                    )}
                  </div>
                )}

                {/* Name & Indicators overlay at bottom */}
                <div className="absolute bottom-3.5 right-3.5 left-3.5 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/10 shadow-lg">
                    <span style={{ color: p.user.roleColor || getRoleInfo(p.user.role).color }}>
                      {p.user.displayName}
                    </span>
                    {isMe && <span className="text-gray-400 text-[10px] font-normal">(أنت)</span>}
                    {p.user.role && p.user.role !== 'member' && (
                      <RoleBadge
                        role={p.user.role}
                        size="xs"
                        showPermissionsModal={false}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 pointer-events-auto">
                    {/* User Volume Slider popover for remote participants */}
                    {!isMe && setUserVolume && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenVolumePopoverForUser(
                              openVolumePopoverForUser === p.user.id ? null : p.user.id
                            );
                          }}
                          title="التحكم بمستوى صوت الصديق (User Volume)"
                          className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-indigo-600 text-gray-300 hover:text-white transition flex items-center gap-1 text-[10px] cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3 text-indigo-400" />
                          <span className="font-mono">{userVolumes?.[p.user.id] ?? 100}%</span>
                        </button>

                        {openVolumePopoverForUser === p.user.id && (
                          <div className="absolute bottom-full left-0 mb-2 w-48 p-3 rounded-2xl glass-dropdown shadow-2xl z-50 text-right animate-in fade-in zoom-in-95 border border-white/15">
                            <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                              <span>صوت ({p.user.displayName})</span>
                              <span className="text-emerald-400 font-mono font-black">{userVolumes?.[p.user.id] ?? 100}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={userVolumes?.[p.user.id] ?? 100}
                              onChange={(e) => setUserVolume(p.user.id, Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                            />
                            <div className="flex justify-between text-[9px] text-gray-400 mt-1 font-mono">
                              <span>0%</span>
                              <span>100%</span>
                              <span>200%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {p.isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                    {p.isDeafened && <Headphones className="w-3.5 h-3.5 text-red-400" />}
                    {!p.isMuted && !p.isDeafened && (
                      <Mic
                        className={`w-3.5 h-3.5 ${
                          p.isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-gray-400'
                        }`}
                      />
                    )}
                  </div>
                </div>

                {/* Mic Volume Level Bar for me */}
                {isMe && !voiceState.isMuted && effectiveMicLevel > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
                    <div
                      className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-75"
                      style={{ width: `${effectiveMicLevel}%` }}
                    />
                  </div>
                )}

                {/* Live Volume Level Bar for remote user */}
                {!isMe && !p.isMuted && remoteVolumeLevels?.[p.user.id] !== undefined && remoteVolumeLevels[p.user.id] > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
                    <div
                      className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-all duration-75"
                      style={{ width: `${remoteVolumeLevels[p.user.id]}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Luxury Bottom Voice Controls */}
      <div className={`h-22 backdrop-blur-xl border-t px-6 flex items-center justify-center gap-3 sm:gap-4 z-20 transition-colors duration-200 ${
        isLight
          ? 'bg-white/95 border-[#e3e5e8] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]'
          : 'bg-[#0c0d12]/95 border-white/[0.05] shadow-[0_-8px_32px_rgba(0,0,0,0.5)]'
      }`}>
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          title={voiceState.isMuted ? 'إلغاء كتم الميكروفون' : 'كتم الميكروفون'}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer ${
            voiceState.isMuted
              ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-600'
              : isLight
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              : 'bg-white/[0.06] text-gray-200 hover:bg-white/[0.12] hover:text-white border border-white/[0.08]'
          }`}
        >
          {voiceState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Deafen Button */}
        <button
          onClick={onToggleDeafen}
          title={voiceState.isDeafened ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer ${
            voiceState.isDeafened
              ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-600'
              : isLight
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              : 'bg-white/[0.06] text-gray-200 hover:bg-white/[0.12] hover:text-white border border-white/[0.08]'
          }`}
        >
          <Headphones className="w-5 h-5" />
        </button>

        {/* Camera Button */}
        <button
          onClick={onToggleCamera}
          title={voiceState.isVideoOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer ${
            voiceState.isVideoOn
              ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(52,211,153,0.4)] hover:bg-emerald-600'
              : isLight
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              : 'bg-white/[0.06] text-gray-200 hover:bg-white/[0.12] hover:text-white border border-white/[0.08]'
          }`}
        >
          {voiceState.isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={toggleScreenSharing}
          title={voiceState.isScreenSharing ? 'إيقاف مشاركة الشاشة' : 'مشاركة الشاشة للعيال'}
          className={`px-5 h-13 rounded-2xl flex items-center gap-2.5 transition-all duration-200 shadow-xl cursor-pointer font-bold text-xs ${
            voiceState.isScreenSharing
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_0_25px_rgba(99,102,241,0.5)] ring-2 ring-white/40'
              : isLight
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              : 'bg-white/[0.06] text-gray-200 hover:bg-white/[0.12] hover:text-white border border-white/[0.08]'
          }`}
        >
          <ScreenShare className="w-5 h-5" />
          <span className="hidden sm:inline">
            {voiceState.isScreenSharing ? 'إيقاف الشاشة' : 'مشاركة الشاشة'}
          </span>
        </button>

        <div className={`h-8 w-px mx-1 sm:mx-2 ${isLight ? 'bg-gray-300' : 'bg-white/10'}`} />

        {/* Disconnect Button */}
        <button
          onClick={onDisconnect}
          title="مغادرة الغرفة الصوتية"
          className="px-6 h-13 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-extrabold text-sm rounded-2xl flex items-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] cursor-pointer"
        >
          <PhoneOff className="w-5 h-5" />
          <span>مغادرة</span>
        </button>
      </div>
    </div>
  );
};
