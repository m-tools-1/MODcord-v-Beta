import { useEffect, useRef, useState, useCallback } from 'react';
import { Message, Server, User } from '../types';
import { soundEffects } from './audio';

export interface VoiceParticipant {
  userId: string;
  user?: User;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing?: boolean;
}

export function useMODcordSocket(
  currentUser: User,
  onSyncInit: (data: { servers: Server[]; messages: Message[]; users: User[] }) => void,
  onNewMessage: (msg: Message) => void,
  onUpdateMessage: (msg: Message) => void,
  onDeleteMessage: (msgId: string) => void,
  onUpdateUsers: (users: User[]) => void,
  onUpdateServers: (servers: Server[]) => void,
  onVoiceParticipantsUpdate: (channelId: string, participants: VoiceParticipant[]) => void,
  onAudioReceived?: (userId: string, audioBase64: string) => void,
  onWebRtcSignal?: (fromUserId: string, signal: any) => void,
  onMovedByAdmin?: (targetChannelId: string, channelName: string, movedBy: string) => void,
  onForcedMute?: (isMuted: boolean, by: string) => void,
  onForcedDisconnect?: (by: string) => void,
  onScreenShareStarted?: (data: { userId: string; userName: string; channelId: string }) => void,
  onScreenShareStopped?: (data: { userId: string; channelId: string }) => void,
  onScreenFrameReceived?: (data: { userId: string; userName: string; channelId: string; frame: string }) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    let active = true;
    let reconnectTimeout: any = null;

    function connect() {
      if (!active) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!active) return;
          setIsConnected(true);
          // Send identify event
          ws.send(
            JSON.stringify({
              event: 'auth:identify',
              payload: currentUser,
            })
          );
        };

        ws.onmessage = (event) => {
          if (!active) return;
          try {
            const { event: evt, payload } = JSON.parse(event.data);

            if (evt === 'sync:init') {
              onSyncInit(payload);
            } else if (evt === 'message:new') {
              onNewMessage(payload);
              if (payload.authorId !== currentUser.id) {
                soundEffects.playMessagePing();
              }
            } else if (evt === 'message:update') {
              onUpdateMessage(payload);
            } else if (evt === 'message:deleted') {
              onDeleteMessage(payload);
            } else if (evt === 'users:update') {
              onUpdateUsers(payload);
            } else if (evt === 'servers:update') {
              onUpdateServers(payload);
            } else if (evt === 'voice:participants') {
              onVoiceParticipantsUpdate(payload.channelId, payload.participants);
            } else if (evt === 'voice:audio_received') {
              if (onAudioReceived && payload.userId !== currentUser.id) {
                onAudioReceived(payload.userId, payload.audio);
              }
            } else if (evt === 'webrtc:signal') {
              onWebRtcSignal?.(payload.fromUserId, payload.signal);
            } else if (evt === 'voice:moved_by_admin') {
              onMovedByAdmin?.(payload.targetChannelId, payload.channelName, payload.movedBy);
            } else if (evt === 'voice:forced_mute') {
              onForcedMute?.(payload.isMuted, payload.by);
            } else if (evt === 'voice:forced_disconnect') {
              onForcedDisconnect?.(payload.by);
            } else if (evt === 'screen:started') {
              onScreenShareStarted?.(payload);
            } else if (evt === 'screen:stopped') {
              onScreenShareStopped?.(payload);
            } else if (evt === 'screen:frame_received') {
              onScreenFrameReceived?.(payload);
            } else if (evt === 'typing') {
              const { channelId, userName } = payload;
              setTypingUsers((prev) => {
                const current = prev[channelId] || [];
                if (!current.includes(userName)) {
                  return { ...prev, [channelId]: [...current, userName] };
                }
                return prev;
              });

              const key = `${channelId}_${userName}`;
              if (typingTimeoutsRef.current[key]) {
                clearTimeout(typingTimeoutsRef.current[key]);
              }
              typingTimeoutsRef.current[key] = setTimeout(() => {
                setTypingUsers((prev) => {
                  const current = prev[channelId] || [];
                  return {
                    ...prev,
                    [channelId]: current.filter((name) => name !== userName),
                  };
                });
              }, 3000);
            }
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        ws.onclose = () => {
          if (!active) return;
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
        reconnectTimeout = setTimeout(connect, 2000);
      }
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser.id]);

  const sendEvent = useCallback((event: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, payload }));
    }
  }, []);

  const sendMessage = useCallback(
    (msg: Message) => {
      sendEvent('message:send', msg);
    },
    [sendEvent]
  );

  const sendReaction = useCallback(
    (messageId: string, emoji: string, userId: string) => {
      sendEvent('message:reaction', { messageId, emoji, userId });
    },
    [sendEvent]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      sendEvent('message:delete', messageId);
    },
    [sendEvent]
  );

  const pinMessage = useCallback(
    (messageId: string) => {
      sendEvent('message:pin', messageId);
    },
    [sendEvent]
  );

  const createChannel = useCallback(
    (serverId: string, channel: any) => {
      sendEvent('channel:create', { serverId, channel });
    },
    [sendEvent]
  );

  const updateChannel = useCallback(
    (serverId: string, channelId: string, updates: any) => {
      sendEvent('channel:update', { serverId, channelId, updates });
    },
    [sendEvent]
  );

  const deleteChannel = useCallback(
    (serverId: string, channelId: string) => {
      sendEvent('channel:delete', { serverId, channelId });
    },
    [sendEvent]
  );

  const createServer = useCallback(
    (server: Server) => {
      sendEvent('server:create', server);
    },
    [sendEvent]
  );

  const updateServer = useCallback(
    (server: Server) => {
      sendEvent('server:update', server);
    },
    [sendEvent]
  );

  const updateUser = useCallback(
    (user: User) => {
      sendEvent('user:update', user);
    },
    [sendEvent]
  );

  const joinVoice = useCallback(
    (channelId: string, isMuted: boolean, isDeafened: boolean) => {
      sendEvent('voice:join', { channelId, isMuted, isDeafened });
    },
    [sendEvent]
  );

  const leaveVoice = useCallback(() => {
    sendEvent('voice:leave', {});
  }, [sendEvent]);

  const updateVoiceState = useCallback(
    (isMuted: boolean, isDeafened: boolean, isSpeaking: boolean, isScreenSharing?: boolean) => {
      sendEvent('voice:state', { isMuted, isDeafened, isSpeaking, isScreenSharing });
    },
    [sendEvent]
  );

  const sendSignal = useCallback(
    (targetUserId: string, signal: any) => {
      sendEvent('webrtc:signal', { targetUserId, signal });
    },
    [sendEvent]
  );

  const sendAudioChunk = useCallback(
    (audioBase64: string) => {
      sendEvent('voice:audio_chunk', { audio: audioBase64 });
    },
    [sendEvent]
  );

  const sendTyping = useCallback(
    (channelId: string, userName: string) => {
      sendEvent('typing', { channelId, userName });
    },
    [sendEvent]
  );

  // Admin exclusive: Force move user to a voice channel
  const forceMoveUser = useCallback(
    (targetUserId: string, targetChannelId: string) => {
      sendEvent('voice:force_move', { targetUserId, targetChannelId });
    },
    [sendEvent]
  );

  // Admin exclusive: Force mute user
  const forceMuteUser = useCallback(
    (targetUserId: string, isMuted: boolean) => {
      sendEvent('voice:force_mute', { targetUserId, isMuted });
    },
    [sendEvent]
  );

  // Admin exclusive: Force disconnect user from voice
  const forceDisconnectUser = useCallback(
    (targetUserId: string) => {
      sendEvent('voice:force_disconnect', { targetUserId });
    },
    [sendEvent]
  );

  // Screen share controls
  const startScreenShare = useCallback(
    (channelId: string, meta?: any) => {
      sendEvent('screen:start', { channelId, meta });
    },
    [sendEvent]
  );

  const stopScreenShare = useCallback(
    (channelId: string) => {
      sendEvent('screen:stop', { channelId });
    },
    [sendEvent]
  );

  const sendScreenFrame = useCallback(
    (channelId: string, frame: string) => {
      sendEvent('screen:frame', { channelId, frame });
    },
    [sendEvent]
  );

  return {
    isConnected,
    typingUsers,
    sendMessage,
    sendReaction,
    deleteMessage,
    pinMessage,
    createChannel,
    updateChannel,
    deleteChannel,
    createServer,
    updateServer,
    updateUser,
    joinVoice,
    leaveVoice,
    updateVoiceState,
    sendSignal,
    sendAudioChunk,
    sendTyping,
    forceMoveUser,
    forceMuteUser,
    forceDisconnectUser,
    startScreenShare,
    stopScreenShare,
    sendScreenFrame,
  };
}

export const useModeCordSocket = useMODcordSocket;
