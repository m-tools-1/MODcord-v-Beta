/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppSettings,
  Channel,
  ChannelType,
  DirectMessageChannel,
  Message,
  Server,
  User,
  UserRole,
  VoiceSessionState,
} from './types';
import { getRoleInfo } from './utils/roles';
import {
  loadStoredServers,
  saveStoredServers,
  loadStoredMessages,
  saveStoredMessages,
  loadStoredUsers,
  saveStoredUsers,
  loadStoredCurrentUser,
  saveStoredCurrentUser,
  loadStoredSettings,
  saveStoredSettings,
  isUserLoggedIn,
  setStoredLoggedIn,
  clearStoredAuthUser,
  CURRENT_USER,
} from './utils/storage';
import { soundEffects } from './utils/audio';
import { useMODcordSocket, VoiceParticipant } from './utils/useSocket';
import { useWebRtcVoice } from './utils/useWebRtcVoice';

// Components
import { ServerSidebar } from './components/ServerSidebar';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatArea } from './components/ChatArea';
import { MemberList } from './components/MemberList';
import { VoiceStage } from './components/VoiceStage';
import { DirectMessages } from './components/DirectMessages';
import { AuthModal } from './components/AuthModal';

// Modals
import { UserSettingsModal } from './components/UserSettingsModal';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { ServerRolesModal } from './components/ServerRolesModal';
import { CreateChannelModal } from './components/CreateChannelModal';
import { EditChannelModal } from './components/EditChannelModal';
import { CreateServerModal } from './components/CreateServerModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserPopout } from './components/UserPopout';

import { Menu, X, Crown, AlertTriangle, CheckCircle } from 'lucide-react';

const EMPTY_VOICE_PARTICIPANTS: VoiceParticipant[] = [];

export default function App() {
  // Authentication & Current User
  const [currentUser, setCurrentUser] = useState<User>(() => loadStoredCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isUserLoggedIn());

  // Core State
  const [servers, setServers] = useState<Server[]>(() => loadStoredServers());
  const [activeServerId, setActiveServerId] = useState<string | null>('server-main');
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-general');
  const [messages, setMessages] = useState<Message[]>(() => loadStoredMessages());
  const [users, setUsers] = useState<User[]>(() => loadStoredUsers());
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());

  // DMs State
  const [dms, setDms] = useState<DirectMessageChannel[]>([]);
  const [activeDmId, setActiveDmId] = useState<string | null>(null);

  // Voice Session State
  const [voiceState, setVoiceState] = useState<VoiceSessionState>({
    isConnected: false,
    channelId: null,
    serverId: null,
    isMuted: false,
    isDeafened: false,
    isSpeaking: false,
    isScreenSharing: false,
    isVideoOn: false,
    ping: 24,
    participants: [],
  });

  const [voiceParticipantsMap, setVoiceParticipantsMap] = useState<
    Record<string, VoiceParticipant[]>
  >({});

  // Screen Share & Admin Notifications
  const [activeScreenShare, setActiveScreenShare] = useState<{
    userId: string;
    userName: string;
    channelId: string;
    frame?: string;
  } | null>(null);

  const [adminNotice, setAdminNotice] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'warn' | 'success';
  } | null>(null);

  const [viewMode, setViewMode] = useState<'chat' | 'voiceStage'>('chat');
  const [showMembers, setShowMembers] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showServerRoles, setShowServerRoles] = useState(false);
  const [createChannelConfig, setCreateChannelConfig] = useState<{
    show: boolean;
    categoryId?: string;
    defaultType?: ChannelType;
  }>({ show: false });
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
  const [popoutUser, setPopoutUser] = useState<User | null>(null);

  const handleOpenUserPopout = useCallback((user: User) => {
    // Resolve with latest user state
    setCurrentUser((current) => {
      if (user.id === current.id) {
        setPopoutUser(current);
      } else {
        setUsers((all) => {
          const found = all.find((u) => u.id === user.id) || user;
          setPopoutUser(found);
          return all;
        });
      }
      return current;
    });
  }, []);

  // Sync callbacks for WebSocket
  const handleSyncInit = useCallback(
    (data: { servers: Server[]; messages: Message[]; users: User[] }) => {
      if (data.servers && data.servers.length > 0) setServers(data.servers);
      if (data.messages && data.messages.length > 0) setMessages(data.messages);
      if (data.users && data.users.length > 0) {
        const stored = loadStoredCurrentUser();
        const merged = data.users.map((u) => {
          if (u.id === stored.id) {
            return {
              ...u,
              avatar: stored.avatar || u.avatar,
              banner: stored.banner || u.banner,
              bannerColor: stored.bannerColor || u.bannerColor,
              displayName: stored.displayName || u.displayName,
              color: stored.color || u.color,
              customStatus: stored.customStatus || u.customStatus,
              bio: stored.bio || u.bio,
              customGradient: stored.customGradient || u.customGradient,
            };
          }
          return u;
        });
        if (!merged.some((u) => u.id === stored.id)) {
          merged.unshift(stored);
        }
        setUsers(merged);
      }
    },
    []
  );

  const handleNewMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const handleUpdateMessage = useCallback((updatedMsg: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
  }, []);

  const handleDeleteMessageWs = useCallback((msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }, []);

  const handleUpdateUsers = useCallback((updatedUsers: User[]) => {
    const stored = loadStoredCurrentUser();
    const merged = updatedUsers.map((u) => {
      if (u.id === stored.id) {
        return {
          ...u,
          avatar: stored.avatar || u.avatar,
          banner: stored.banner || u.banner,
          bannerColor: stored.bannerColor || u.bannerColor,
          displayName: stored.displayName || u.displayName,
          color: stored.color || u.color,
          customStatus: stored.customStatus || u.customStatus,
          bio: stored.bio || u.bio,
        };
      }
      return u;
    });
    setUsers(merged);
  }, []);

  const handleUpdateServers = useCallback((updatedServers: Server[]) => {
    setServers(updatedServers);
  }, []);

  const handleVoiceParticipantsUpdate = useCallback(
    (channelId: string, participants: VoiceParticipant[]) => {
      setVoiceParticipantsMap((prev) => ({
        ...prev,
        [channelId]: participants,
      }));
    },
    []
  );

  // Admin and Screen Share WebSocket Handlers
  const handleMovedByAdmin = useCallback(
    (targetChannelId: string, channelName: string, movedBy: string) => {
      setVoiceState((prev) => ({
        ...prev,
        isConnected: true,
        channelId: targetChannelId,
      }));
      soundEffects.playJoinVoice();
      setAdminNotice({
        title: '👑 تحكم إداري من المشرف العام (! MOD)',
        message: `قام المشرف (${movedBy}) بنقلك فوراً إلى: ${channelName}`,
        type: 'info',
      });
      setTimeout(() => setAdminNotice(null), 6000);
    },
    []
  );

  const handleForcedMute = useCallback((isMuted: boolean, by: string) => {
    setVoiceState((prev) => ({ ...prev, isMuted }));
    soundEffects.playMute(isMuted);
    setAdminNotice({
      title: isMuted ? '🔇 كتم إداري' : '🔊 إلغاء الكتم الإداري',
      message: isMuted
        ? `قام المشرف العام (${by}) بكتم صوتك إدارياً`
        : `قام المشرف العام (${by}) بإلغاء الكتم عنك`,
      type: isMuted ? 'warn' : 'success',
    });
    setTimeout(() => setAdminNotice(null), 5000);
  }, []);

  const handleForcedDisconnect = useCallback((by: string) => {
    setVoiceState((prev) => ({
      ...prev,
      isConnected: false,
      channelId: null,
    }));
    soundEffects.playLeave();
    setAdminNotice({
      title: '⏹️ فصل إداري من الروم الصوتي',
      message: `تم فصل اتصالك بالروم الصوتي بواسطة المشرف العام (${by})`,
      type: 'warn',
    });
    setTimeout(() => setAdminNotice(null), 6000);
  }, []);

  const handleScreenShareStarted = useCallback(
    (data: { userId: string; userName: string; channelId: string }) => {
      setActiveScreenShare({
        userId: data.userId,
        userName: data.userName,
        channelId: data.channelId,
      });
      soundEffects.playMessagePing();
    },
    []
  );

  const handleScreenShareStopped = useCallback((data: { userId: string; channelId: string }) => {
    setActiveScreenShare((prev) => (prev?.userId === data.userId ? null : prev));
  }, []);

  const handleScreenFrameReceived = useCallback(
    (data: { userId: string; userName: string; channelId: string; frame: string }) => {
      setActiveScreenShare((prev) => {
        if (!prev || prev.userId !== data.userId) {
          return {
            userId: data.userId,
            userName: data.userName,
            channelId: data.channelId,
            frame: data.frame,
          };
        }
        return { ...prev, frame: data.frame };
      });
    },
    []
  );

  // Incoming signal and audio handlers for WebRTC
  const incomingSignalRef = useRef<((fromUserId: string, signal: any) => void) | null>(null);
  const incomingAudioRef = useRef<((userId: string, audio: string) => void) | null>(null);

  const handleAudioReceived = useCallback((userId: string, audio: string) => {
    incomingAudioRef.current?.(userId, audio);
  }, []);

  const handleWebRtcSignal = useCallback((fromUserId: string, signal: any) => {
    incomingSignalRef.current?.(fromUserId, signal);
  }, []);

  // Real-time WebSocket connection
  const {
    isConnected: isWsConnected,
    typingUsers,
    sendMessage: wsSendMessage,
    sendReaction: wsSendReaction,
    deleteMessage: wsDeleteMessage,
    pinMessage: wsPinMessage,
    createChannel: wsCreateChannel,
    updateChannel: wsUpdateChannel,
    deleteChannel: wsDeleteChannel,
    createServer: wsCreateServer,
    updateServer: wsUpdateServer,
    updateUser: wsUpdateUser,
    joinVoice: wsJoinVoice,
    leaveVoice: wsLeaveVoice,
    updateVoiceState: wsUpdateVoiceState,
    sendSignal: wsSendSignal,
    sendAudioChunk: wsSendAudioChunk,
    sendTyping: wsSendTyping,
    forceMoveUser,
    forceMuteUser,
    forceDisconnectUser,
    startScreenShare,
    stopScreenShare,
    sendScreenFrame,
  } = useMODcordSocket(
    currentUser,
    handleSyncInit,
    handleNewMessage,
    handleUpdateMessage,
    handleDeleteMessageWs,
    handleUpdateUsers,
    handleUpdateServers,
    handleVoiceParticipantsUpdate,
    handleAudioReceived,
    handleWebRtcSignal,
    handleMovedByAdmin,
    handleForcedMute,
    handleForcedDisconnect,
    handleScreenShareStarted,
    handleScreenShareStopped,
    handleScreenFrameReceived
  );

  // Active voice participants for the connected channel
  const activeVoiceParticipants =
    (voiceState.channelId && voiceParticipantsMap[voiceState.channelId]) || EMPTY_VOICE_PARTICIPANTS;

  const handleSendSpeakingState = useCallback(
    (speaking: boolean) => {
      wsUpdateVoiceState(voiceState.isMuted, voiceState.isDeafened, speaking);
    },
    [wsUpdateVoiceState, voiceState.isMuted, voiceState.isDeafened]
  );

  // WebRTC P2P Voice Mesh & Audio Pipeline
  const {
    localMicLevel,
    isLocalSpeaking,
    remoteSpeakingMap,
    remoteVolumeLevels,
    userVolumes,
    setUserVolume,
    handleIncomingSignal,
    handleIncomingAudioChunk,
  } = useWebRtcVoice({
    currentUser,
    isConnected: voiceState.isConnected,
    channelId: voiceState.channelId,
    isMuted: voiceState.isMuted,
    isDeafened: voiceState.isDeafened,
    remoteParticipants: activeVoiceParticipants,
    sendSignal: wsSendSignal,
    sendAudioChunk: wsSendAudioChunk,
    onSendSpeakingState: handleSendSpeakingState,
  });

  useEffect(() => {
    incomingSignalRef.current = handleIncomingSignal;
    incomingAudioRef.current = handleIncomingAudioChunk;
  }, [handleIncomingSignal, handleIncomingAudioChunk]);

  // Sync settings sound
  useEffect(() => {
    soundEffects.enabled = settings.soundEnabled;
  }, [settings.soundEnabled]);

  // Persist state locally
  useEffect(() => {
    saveStoredServers(servers);
  }, [servers]);

  useEffect(() => {
    saveStoredMessages(messages);
  }, [messages]);

  useEffect(() => {
    saveStoredUsers(users);
  }, [users]);

  useEffect(() => {
    saveStoredCurrentUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Active Server & Channel references
  const currentServer = servers.find((s) => s.id === activeServerId) || servers[0];
  const currentChannel =
    currentServer?.channels.find((c) => c.id === activeChannelId) ||
    currentServer?.channels[0] || {
      id: 'ch-general',
      serverId: currentServer?.id || '',
      name: 'الدردشة-العامة',
      type: 'text' as ChannelType,
      topic: 'المحادثة العامة',
    };

  // Handlers
  const handleSelectServer = (serverId: string | null) => {
    setActiveServerId(serverId);
    setMobileMenuOpen(false);
    if (serverId) {
      const targetServer = servers.find((s) => s.id === serverId);
      if (targetServer && targetServer.channels.length > 0) {
        const firstText =
          targetServer.channels.find((c) => c.type === 'text') || targetServer.channels[0];
        setActiveChannelId(firstText.id);
      }
      setViewMode('chat');
    }
  };

  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    setViewMode('chat');
    setMobileMenuOpen(false);
  };

  const handleSendMessage = (
    content: string,
    replyTo?: Message,
    attachments?: { id: string; name: string; url: string; type: 'image' | 'file' }[]
  ) => {
    const targetChannelId = activeServerId ? activeChannelId : activeDmId || '';
    const now = new Date();
    const timeStr = `اليوم ${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'م' : 'ص'}`;

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      channelId: targetChannelId,
      serverId: activeServerId || undefined,
      authorId: currentUser.id,
      content,
      timestamp: timeStr,
      replyTo: replyTo
        ? {
            id: replyTo.id,
            authorName: users.find((u) => u.id === replyTo.authorId)?.displayName || 'صديق',
            content: replyTo.content.slice(0, 50),
          }
        : undefined,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMessage]);
    wsSendMessage(newMessage);
  };

  const handleReact = (messageId: string, emoji: string) => {
    wsSendReaction(messageId, emoji, currentUser.id);

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentReactions = msg.reactions || [];
        const existingReactIndex = currentReactions.findIndex((r) => r.emoji === emoji);

        if (existingReactIndex > -1) {
          const react = currentReactions[existingReactIndex];
          const hasUser = react.users.includes(currentUser.id);
          const updatedUsers = hasUser
            ? react.users.filter((id) => id !== currentUser.id)
            : [...react.users, currentUser.id];

          if (updatedUsers.length === 0) {
            return {
              ...msg,
              reactions: currentReactions.filter((r) => r.emoji !== emoji),
            };
          } else {
            const nextReactions = [...currentReactions];
            nextReactions[existingReactIndex] = {
              ...react,
              count: updatedUsers.length,
              users: updatedUsers,
            };
            return { ...msg, reactions: nextReactions };
          }
        } else {
          return {
            ...msg,
            reactions: [
              ...currentReactions,
              { emoji, count: 1, users: [currentUser.id] },
            ],
          };
        }
      })
    );
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    wsDeleteMessage(messageId);
  };

  const handlePinMessage = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      wsPinMessage(messageId, !msg.pinned);
    }
  };

  const handleJoinVoice = (channelId: string) => {
    setVoiceState((prev) => ({
      ...prev,
      isConnected: true,
      channelId,
      serverId: activeServerId,
    }));
    wsJoinVoice(channelId, voiceState.isMuted, voiceState.isDeafened);
    soundEffects.playJoinVoice();
    setViewMode('voiceStage');
  };

  const handleDisconnectVoice = () => {
    if (voiceState.channelId) {
      wsLeaveVoice();
    }
    setVoiceState((prev) => ({
      ...prev,
      isConnected: false,
      channelId: null,
      serverId: null,
      isScreenSharing: false,
      isVideoOn: false,
    }));
    soundEffects.playLeave();
    setViewMode('chat');
  };

  const handleToggleMute = () => {
    const nextMuted = !voiceState.isMuted;
    setVoiceState((prev) => ({ ...prev, isMuted: nextMuted }));
    wsUpdateVoiceState(nextMuted, voiceState.isDeafened, voiceState.isSpeaking);
    soundEffects.playMute(nextMuted);
  };

  const handleToggleDeafen = () => {
    const nextDeafened = !voiceState.isDeafened;
    setVoiceState((prev) => ({
      ...prev,
      isDeafened: nextDeafened,
      isMuted: nextDeafened ? true : prev.isMuted,
    }));
    wsUpdateVoiceState(
      nextDeafened ? true : voiceState.isMuted,
      nextDeafened,
      voiceState.isSpeaking
    );
    soundEffects.playMute(nextDeafened);
  };

  const handleCreateChannel = (
    name: string,
    type: ChannelType,
    topic: string,
    categoryId?: string
  ) => {
    if (!currentServer) return;
    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      serverId: currentServer.id,
      name,
      type,
      topic,
      categoryId,
    };

    const updatedServer = {
      ...currentServer,
      channels: [...currentServer.channels, newChannel],
    };

    setServers((prev) => prev.map((s) => (s.id === currentServer.id ? updatedServer : s)));
    wsCreateChannel(currentServer.id, newChannel);

    if (type === 'text') {
      setActiveChannelId(newChannel.id);
    }
  };

  const handleUpdateChannel = (
    channelId: string,
    updates: { name: string; topic?: string; categoryId?: string; type?: ChannelType }
  ) => {
    if (!currentServer) return;

    const updatedChannels = currentServer.channels.map((c) =>
      c.id === channelId ? { ...c, ...updates } : c
    );
    const updatedServer = {
      ...currentServer,
      channels: updatedChannels,
    };

    setServers((prev) => prev.map((s) => (s.id === currentServer.id ? updatedServer : s)));
    wsUpdateChannel(currentServer.id, channelId, updates);
    soundEffects.playJoin();
    setAdminNotice({
      title: '✏️ تم تعديل الروم',
      message: `تم تحديث بيانات وإعدادات الروم (${updates.name}) بنجاح`,
      type: 'success',
    });
    setTimeout(() => setAdminNotice(null), 4000);
  };

  const handleDeleteChannel = (channelId: string) => {
    if (!currentServer) return;
    const targetChannel = currentServer.channels.find((c) => c.id === channelId);
    const chName = targetChannel ? targetChannel.name : 'الروم';

    const remainingChannels = currentServer.channels.filter((c) => c.id !== channelId);
    if (remainingChannels.length === 0) {
      alert('لا يمكن حذف جميع قنوات السيرفر. يجب إبقاء قناة واحدة على الأقل.');
      return;
    }

    const updatedServer = {
      ...currentServer,
      channels: remainingChannels,
    };

    setServers((prev) => prev.map((s) => (s.id === currentServer.id ? updatedServer : s)));
    wsDeleteChannel(currentServer.id, channelId);

    // If active channel was deleted, select next remaining channel
    if (activeChannelId === channelId) {
      const nextChan = remainingChannels.find((c) => c.type === 'text') || remainingChannels[0];
      if (nextChan) {
        setActiveChannelId(nextChan.id);
      }
    }

    // If active voice connection was on deleted channel, disconnect
    if (voiceState.isConnected && voiceState.channelId === channelId) {
      handleDisconnectVoice();
    }

    soundEffects.playLeave();
    setAdminNotice({
      title: '🗑️ حذف الروم',
      message: `تم حذف الروم (${chName}) من السيرفر`,
      type: 'warn',
    });
    setTimeout(() => setAdminNotice(null), 4000);
  };

  const handleUpdateServer = (updatedServer: Server) => {
    setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
    wsUpdateServer(updatedServer);
  };

  const handleUpdateUserRole = (targetUserId: string, newRole: UserRole) => {
    const roleInfo = getRoleInfo(newRole);
    const updatedUsers = users.map((u) => {
      if (u.id === targetUserId) {
        return {
          ...u,
          role: newRole,
          roleTitle: roleInfo.name,
          roleColor: roleInfo.color,
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    const updatedTarget = updatedUsers.find((u) => u.id === targetUserId);
    if (updatedTarget) {
      wsUpdateUser(updatedTarget);
      if (selectedUserProfile?.id === targetUserId) {
        setSelectedUserProfile(updatedTarget);
      }
      if (currentUser.id === targetUserId) {
        setCurrentUser(updatedTarget);
        saveStoredCurrentUser(updatedTarget);
      }
    }

    setAdminNotice({
      title: '🎖️ ترقية وتعيين رتبة',
      message: `تم تحديث رتبة ${updatedTarget?.displayName || 'العضو'} إلى "${roleInfo.name}" بنجاح`,
      type: 'info',
    });
    setTimeout(() => setAdminNotice(null), 4000);
  };

  const handleDeleteServer = (serverId: string) => {
    const updated = servers.filter((s) => s.id !== serverId);
    setServers(updated);
    if (activeServerId === serverId) {
      setActiveServerId(updated[0]?.id || null);
    }
  };

  const handleCreateServer = (newServer: Server) => {
    setServers((prev) => [...prev, newServer]);
    setActiveServerId(newServer.id);
    setActiveChannelId(newServer.channels[0]?.id || '');
    wsCreateServer(newServer);
  };

  const handleStartDM = (targetUser: User) => {
    const existingDm = dms.find((d) => d.targetUserId === targetUser.id);
    if (existingDm) {
      setActiveServerId(null);
      setActiveDmId(existingDm.id);
    } else {
      const newDm: DirectMessageChannel = {
        id: `dm-${targetUser.id}`,
        targetUserId: targetUser.id,
      };
      setDms((prev) => [newDm, ...prev]);
      setActiveServerId(null);
      setActiveDmId(newDm.id);
    }
    setViewMode('chat');
  };

  const handleStartVoiceCall = (targetUser: User) => {
    handleStartDM(targetUser);
    setVoiceState((prev) => ({
      ...prev,
      isConnected: true,
      channelId: `dm-${targetUser.id}`,
      serverId: null,
    }));
    wsJoinVoice(`dm-${targetUser.id}`, voiceState.isMuted, voiceState.isDeafened);
    soundEffects.playJoinVoice();
    setViewMode('voiceStage');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    saveStoredCurrentUser(user);
    setStoredLoggedIn(true);
    setIsAuthenticated(true);
    wsUpdateUser(user);
  };

  const handleLogout = () => {
    clearStoredAuthUser();
    setStoredLoggedIn(false);
    if (voiceState.isConnected) {
      handleDisconnectVoice();
    }
    setIsAuthenticated(false);
    soundEffects.playLeave();
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    const updatedSettings: AppSettings = {
      ...settings,
      theme: nextTheme,
    };
    setSettings(updatedSettings);
    saveStoredSettings(updatedSettings);
    soundEffects.playJoin();
  };

  // Synchronize document theme class and body background
  useEffect(() => {
    if (settings.theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
      document.body.style.backgroundColor = '#f2f3f5';
    } else {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
      document.body.style.backgroundColor = settings.theme === 'midnight' ? '#000000' : '#0a0b0e';
    }
  }, [settings.theme]);

  const isDMsMode = activeServerId === null;

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden antialiased select-none font-sans ${
        settings.theme === 'light'
          ? 'theme-light bg-[#f2f3f5] text-[#2e3338]'
          : settings.theme === 'midnight'
          ? 'bg-[#000000] text-[#dbdee1]'
          : 'bg-[#1e1f22] text-[#dbdee1]'
      }`}
      dir="rtl"
    >
      {/* Floating Admin Notice Banner */}
      {adminNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1e1f22]/95 border-2 border-amber-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4">
          <Crown className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="text-right">
            <div className="font-bold text-xs text-amber-400">{adminNotice.title}</div>
            <div className="text-xs text-gray-200">{adminNotice.message}</div>
          </div>
          <button
            onClick={() => setAdminNotice(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white mr-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Auth Modal for Login / Switch Account */}
      {!isAuthenticated && <AuthModal onLoginSuccess={handleLoginSuccess} />}

      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden fixed top-3 right-3 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-[#313338] border border-[#2b2d31] rounded-lg text-white shadow-lg cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Far Left Server Rail */}
      <div
        className={`fixed md:relative inset-y-0 right-0 z-40 flex transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <ServerSidebar
          servers={servers}
          activeServerId={activeServerId}
          onSelectServer={handleSelectServer}
          onOpenCreateServer={() => setShowCreateServer(true)}
          unreadDMsCount={0}
          theme={settings.theme}
        />

        {/* Channels Sidebar */}
        {currentServer && !isDMsMode && (
          <ChannelSidebar
            server={currentServer}
            activeChannelId={activeChannelId}
            onSelectChannel={handleSelectChannel}
            voiceState={voiceState}
            onJoinVoice={handleJoinVoice}
            onDisconnectVoice={handleDisconnectVoice}
            onOpenVoiceStage={() => setViewMode('voiceStage')}
            currentUser={currentUser}
            users={users}
            theme={settings.theme}
            onToggleTheme={handleToggleTheme}
            onOpenCreateChannel={(categoryId, defaultType) =>
              setCreateChannelConfig({ show: true, categoryId, defaultType })
            }
            onOpenServerSettings={() => setShowServerSettings(true)}
            onOpenServerRoles={() => setShowServerRoles(true)}
            onOpenUserSettings={() => setShowUserSettings(true)}
            onOpenUserPopout={() => handleOpenUserPopout(currentUser)}
            onToggleMute={handleToggleMute}
            onToggleDeafen={handleToggleDeafen}
            onLogout={handleLogout}
            voiceParticipantsMap={voiceParticipantsMap}
            onForceMoveUser={(userId, targetChannelId) =>
              forceMoveUser(userId, targetChannelId)
            }
            onOpenEditChannel={(ch) => setEditingChannel(ch)}
          />
        )}
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex h-full min-w-0 overflow-hidden relative">
        {isDMsMode ? (
          <DirectMessages
            currentUser={currentUser}
            users={users}
            dms={dms}
            activeDmId={activeDmId}
            onSelectDm={(id) => setActiveDmId(id)}
            messages={messages}
            theme={settings.theme}
            onToggleTheme={handleToggleTheme}
            onSendMessage={handleSendMessage}
            onReact={handleReact}
            onDeleteMessage={handleDeleteMessage}
            onPinMessage={handlePinMessage}
            onOpenProfile={handleOpenUserPopout}
            onStartVoiceCall={handleStartVoiceCall}
            onStartNewDM={handleStartDM}
          />
        ) : viewMode === 'voiceStage' && voiceState.isConnected ? (
          <VoiceStage
            channel={
              currentServer?.channels.find((c) => c.id === voiceState.channelId) || currentChannel
            }
            server={currentServer}
            currentUser={currentUser}
            users={users}
            voiceState={voiceState}
            remoteParticipants={voiceParticipantsMap[voiceState.channelId || ''] || []}
            theme={settings.theme}
            onToggleTheme={handleToggleTheme}
            onToggleMute={handleToggleMute}
            onToggleDeafen={handleToggleDeafen}
            onDisconnect={handleDisconnectVoice}
            onToggleCamera={() =>
              setVoiceState((prev) => ({ ...prev, isVideoOn: !prev.isVideoOn }))
            }
            onToggleScreenShare={() =>
              setVoiceState((prev) => ({ ...prev, isScreenSharing: !prev.isScreenSharing }))
            }
            onSendSpeakingState={(speaking) =>
              wsUpdateVoiceState(voiceState.isMuted, voiceState.isDeafened, speaking)
            }
            onForceMoveUser={(targetUserId, targetChanId) =>
              forceMoveUser(targetUserId, targetChanId)
            }
            onForceMuteUser={(targetUserId, isMuted) => forceMuteUser(targetUserId, isMuted)}
            onForceDisconnectUser={(targetUserId) => forceDisconnectUser(targetUserId)}
            onStartScreenShareBroadcast={() => startScreenShare(voiceState.channelId || '')}
            onStopScreenShareBroadcast={() => stopScreenShare(voiceState.channelId || '')}
            onSendScreenFrame={(frame) => sendScreenFrame(voiceState.channelId || '', frame)}
            onOpenEditChannel={(ch) => setEditingChannel(ch)}
            activeScreenShare={activeScreenShare}
            localMicLevel={localMicLevel}
            isLocalSpeaking={isLocalSpeaking}
            remoteSpeakingMap={remoteSpeakingMap}
            remoteVolumeLevels={remoteVolumeLevels}
            userVolumes={userVolumes}
            setUserVolume={setUserVolume}
          />
        ) : (
          <div className="flex-1 flex h-full min-w-0">
            <ChatArea
              channel={currentChannel}
              server={currentServer}
              messages={messages}
              users={users.map((u) => (u.id === currentUser.id ? currentUser : u))}
              currentUser={currentUser}
              theme={settings.theme}
              onToggleTheme={handleToggleTheme}
              typingUsers={typingUsers[currentChannel.id] || []}
              onSendMessage={handleSendMessage}
              onReact={handleReact}
              onDeleteMessage={handleDeleteMessage}
              onPinMessage={handlePinMessage}
              onOpenProfile={handleOpenUserPopout}
              onToggleMembers={() => setShowMembers(!showMembers)}
              showMembers={showMembers}
              onTyping={() => wsSendTyping(currentChannel.id, currentUser.displayName)}
              onOpenEditChannel={(ch) => setEditingChannel(ch)}
            />

            {/* Member List on Right */}
            {showMembers && (
              <div className="hidden lg:block h-full">
                <MemberList
                  users={users.map((u) => (u.id === currentUser.id ? currentUser : u))}
                  currentUserId={currentUser.id}
                  onOpenProfile={handleOpenUserPopout}
                  onStartDM={handleStartDM}
                  theme={settings.theme}
                  server={currentServer}
                  onOpenRolesManagement={() => setShowServerRoles(true)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showUserSettings && (
        <UserSettingsModal
          currentUser={currentUser}
          settings={settings}
          onSaveUser={(u) => {
            setCurrentUser(u);
            saveStoredCurrentUser(u);
            setUsers((prev) => {
              const exists = prev.some((usr) => usr.id === u.id);
              if (exists) {
                return prev.map((usr) => (usr.id === u.id ? u : usr));
              }
              return [u, ...prev];
            });
            wsUpdateUser(u);
          }}
          onSaveSettings={(s) => {
            setSettings(s);
            saveStoredSettings(s);
          }}
          onClose={() => setShowUserSettings(false)}
          onLogout={handleLogout}
        />
      )}

      {showServerSettings && currentServer && (
        <ServerSettingsModal
          server={currentServer}
          users={users.map((u) => (u.id === currentUser.id ? currentUser : u))}
          currentUser={currentUser}
          onUpdateUserRole={handleUpdateUserRole}
          onUpdateServer={handleUpdateServer}
          onDeleteServer={handleDeleteServer}
          onOpenCreateChannel={() => setCreateChannelConfig({ show: true })}
          onOpenEditChannel={(ch) => setEditingChannel(ch)}
          onDeleteChannel={handleDeleteChannel}
          onOpenServerRoles={() => setShowServerRoles(true)}
          onClose={() => setShowServerSettings(false)}
        />
      )}

      {showServerRoles && currentServer && (
        <ServerRolesModal
          server={currentServer}
          users={users.map((u) => (u.id === currentUser.id ? currentUser : u))}
          currentUser={currentUser}
          onUpdateServer={handleUpdateServer}
          onClose={() => setShowServerRoles(false)}
        />
      )}

      {createChannelConfig.show && currentServer && (
        <CreateChannelModal
          categories={currentServer.categories || []}
          defaultCategoryId={createChannelConfig.categoryId}
          defaultType={createChannelConfig.defaultType}
          onCreateChannel={handleCreateChannel}
          onClose={() => setCreateChannelConfig({ show: false })}
        />
      )}

      {editingChannel && (
        <EditChannelModal
          channel={editingChannel}
          categories={currentServer?.categories || []}
          onUpdateChannel={handleUpdateChannel}
          onDeleteChannel={handleDeleteChannel}
          onClose={() => setEditingChannel(null)}
        />
      )}

      {showCreateServer && (
        <CreateServerModal
          currentUserId={currentUser.id}
          onCreateServer={handleCreateServer}
          onClose={() => setShowCreateServer(false)}
        />
      )}

      {selectedUserProfile && (
        <UserProfileModal
          user={
            selectedUserProfile.id === currentUser.id
              ? currentUser
              : (users.find((u) => u.id === selectedUserProfile.id) || selectedUserProfile)
          }
          currentUser={currentUser}
          onStartDM={handleStartDM}
          onUpdateUserRole={handleUpdateUserRole}
          server={currentServer}
          onUpdateServer={handleUpdateServer}
          onClose={() => setSelectedUserProfile(null)}
        />
      )}

      {/* Discord User Popout */}
      {popoutUser && (
        <UserPopout
          user={
            popoutUser.id === currentUser.id
              ? currentUser
              : (users.find((u) => u.id === popoutUser.id) || popoutUser)
          }
          currentUser={currentUser}
          server={currentServer}
          onClose={() => setPopoutUser(null)}
          onStartDM={handleStartDM}
          onOpenFullProfile={(u) => {
            setPopoutUser(null);
            setSelectedUserProfile(u);
          }}
          onOpenSettings={() => {
            setPopoutUser(null);
            setShowUserSettings(true);
          }}
          onUpdateStatus={(newStatus) => {
            const updated: User = { ...currentUser, status: newStatus };
            setCurrentUser(updated);
            saveStoredCurrentUser(updated);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            wsUpdateUser(updated);
          }}
          onUpdateGradient={(gradient) => {
            const updated: User = { ...currentUser, customGradient: gradient };
            setCurrentUser(updated);
            saveStoredCurrentUser(updated);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            wsUpdateUser(updated);
          }}
        />
      )}
    </div>
  );
}
