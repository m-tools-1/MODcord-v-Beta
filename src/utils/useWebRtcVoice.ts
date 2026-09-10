import { useEffect, useRef, useState, useCallback } from 'react';
import { User } from '../types';
import { RemoteVoiceParticipant } from '../components/VoiceStage';

interface UseWebRtcVoiceOptions {
  currentUser: User;
  isConnected: boolean;
  channelId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  remoteParticipants: RemoteVoiceParticipant[];
  sendSignal: (targetUserId: string, signal: any) => void;
  sendAudioChunk?: (audioBase64: string) => void;
  onSendSpeakingState?: (isSpeaking: boolean) => void;
}

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRtcVoice({
  currentUser,
  isConnected,
  channelId,
  isMuted,
  isDeafened,
  remoteParticipants,
  sendSignal,
  sendAudioChunk,
  onSendSpeakingState,
}: UseWebRtcVoiceOptions) {
  const [localMicLevel, setLocalMicLevel] = useState<number>(0);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState<boolean>(false);
  const [remoteSpeakingMap, setRemoteSpeakingMap] = useState<Record<string, boolean>>({});
  const [remoteVolumeLevels, setRemoteVolumeLevels] = useState<Record<string, number>>({});
  const [userVolumes, setUserVolumes] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('modecord_user_volumes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Keep mutable references to prevent re-triggering effects and re-creating callbacks
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const isDeafenedRef = useRef(isDeafened);
  isDeafenedRef.current = isDeafened;

  const userVolumesRef = useRef(userVolumes);
  userVolumesRef.current = userVolumes;

  const sendSignalRef = useRef(sendSignal);
  sendSignalRef.current = sendSignal;

  const sendAudioChunkRef = useRef(sendAudioChunk);
  sendAudioChunkRef.current = sendAudioChunk;

  const onSendSpeakingStateRef = useRef(onSendSpeakingState);
  onSendSpeakingStateRef.current = onSendSpeakingState;

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const remoteAnalysersRef = useRef<Map<string, { audioCtx: AudioContext; analyser: AnalyserNode }>>(new Map());
  const localAudioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const remoteCheckIntervalRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Set per-user volume
  const setUserVolume = useCallback((userId: string, volume: number) => {
    setUserVolumes((prev) => {
      const updated = { ...prev, [userId]: volume };
      try {
        localStorage.setItem('modecord_user_volumes', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const audioEl = remoteAudioElementsRef.current.get(userId);
    if (audioEl) {
      audioEl.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, []);

  // Cleanup a specific remote peer connection and its audio
  const cleanupPeer = useCallback((userId: string) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onnegotiationneeded = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }
    pendingCandidatesRef.current.delete(userId);

    const audioEl = remoteAudioElementsRef.current.get(userId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
      remoteAudioElementsRef.current.delete(userId);
    }

    const analyserObj = remoteAnalysersRef.current.get(userId);
    if (analyserObj) {
      analyserObj.audioCtx.close().catch(() => {});
      remoteAnalysersRef.current.delete(userId);
    }

    setRemoteSpeakingMap((prev) => {
      if (!prev[userId]) return prev;
      const next = { ...prev };
      delete next[userId];
      return next;
    });

    setRemoteVolumeLevels((prev) => {
      if (prev[userId] === undefined) return prev;
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  // Attach & Play remote audio stream with auto-resume safeguards
  const attachRemoteAudio = useCallback((userId: string, stream: MediaStream) => {
    let audioEl = remoteAudioElementsRef.current.get(userId);
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.id = `remote-audio-${userId}`;
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      document.body.appendChild(audioEl);
      remoteAudioElementsRef.current.set(userId, audioEl);
    }

    audioEl.srcObject = stream;
    const vol = userVolumesRef.current[userId] ?? 100;
    const isDeaf = isDeafenedRef.current;
    audioEl.volume = isDeaf ? 0 : Math.max(0, Math.min(1, vol / 100));
    audioEl.muted = isDeaf;

    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Unlock on first user gesture
        const unlock = () => {
          audioEl?.play().catch(() => {});
          window.removeEventListener('click', unlock);
          window.removeEventListener('keydown', unlock);
          window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        window.addEventListener('touchstart', unlock);
      });
    }

    // Set up Web Audio Analyser for remote speaking visualization
    try {
      if (!remoteAnalysersRef.current.has(userId)) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        remoteAnalysersRef.current.set(userId, { audioCtx, analyser });
      }
    } catch (err) {
      console.warn('Could not attach remote audio analyser:', err);
    }
  }, []);

  // Create or retrieve PeerConnection for a specific remote user
  const getOrCreatePeerConnection = useCallback((targetUserId: string) => {
    let pc = peerConnectionsRef.current.get(targetUserId);
    if (pc && pc.signalingState !== 'closed') {
      return pc;
    }

    pc = new RTCPeerConnection(ICE_CONFIG);
    peerConnectionsRef.current.set(targetUserId, pc);

    // Add local microphone tracks if active
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        pc!.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate event
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalRef.current(targetUserId, {
          type: 'candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Remote Audio track received
    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      attachRemoteAudio(targetUserId, stream);
    };

    // Perfect negotiation pattern: deterministic polite peer
    const polite = currentUser.id < targetUserId;
    let makingOffer = false;

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer = true;
        await pc!.setLocalDescription();
        sendSignalRef.current(targetUserId, {
          type: 'sdp',
          description: pc!.localDescription,
        });
      } catch (err) {
        console.warn(`Negotiation error with ${targetUserId}:`, err);
      } finally {
        makingOffer = false;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc!.connectionState === 'failed') {
        pc!.restartIce();
      }
    };

    return pc;
  }, [attachRemoteAudio, currentUser.id]);

  // Handle incoming WebRTC signaling message
  const handleIncomingSignal = useCallback(async (fromUserId: string, signal: any) => {
    if (!isConnected || !channelId || fromUserId === currentUser.id) return;

    const pc = getOrCreatePeerConnection(fromUserId);
    const polite = currentUser.id < fromUserId;

    try {
      if (signal.type === 'sdp' && signal.description) {
        const description = new RTCSessionDescription(signal.description);
        const readyForOffer =
          pc.signalingState === 'stable' ||
          pc.signalingState === 'have-local-offer';

        if (description.type === 'offer') {
          if (!readyForOffer && !polite) {
            return; // Ignore collided offer if impolite
          }
          await pc.setRemoteDescription(description);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignalRef.current(fromUserId, {
            type: 'sdp',
            description: pc.localDescription,
          });
        } else if (description.type === 'answer') {
          await pc.setRemoteDescription(description);
        }

        // Drain pending candidates
        const pending = pendingCandidatesRef.current.get(fromUserId) || [];
        for (const candidate of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Error applying pending candidate:', e);
          }
        }
        pendingCandidatesRef.current.delete(fromUserId);
      } else if (signal.type === 'candidate' && signal.candidate) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else {
          const list = pendingCandidatesRef.current.get(fromUserId) || [];
          list.push(signal.candidate);
          pendingCandidatesRef.current.set(fromUserId, list);
        }
      }
    } catch (err) {
      console.warn(`Signal handling error from ${fromUserId}:`, err);
    }
  }, [channelId, currentUser.id, getOrCreatePeerConnection, isConnected]);

  // Handle incoming audio chunk fallback
  const handleIncomingAudioChunk = useCallback((fromUserId: string, audioBase64: string) => {
    if (isDeafenedRef.current || fromUserId === currentUser.id) return;
    const pc = peerConnectionsRef.current.get(fromUserId);
    // If WebRTC is already connected, WebRTC delivers direct ultra-low latency audio
    if (pc && pc.iceConnectionState === 'connected') return;

    try {
      const snd = new Audio(`data:audio/webm;base64,${audioBase64}`);
      const vol = userVolumesRef.current[fromUserId] ?? 100;
      snd.volume = Math.max(0, Math.min(1, vol / 100));
      snd.play().catch(() => {});
    } catch (e) {
      console.warn('Fallback audio play error:', e);
    }
  }, [currentUser.id]);

  // Microphone initialization and local level meter loop
  useEffect(() => {
    if (!isConnected || !channelId) {
      // Disconnect all
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      if (localAudioContextRef.current) {
        localAudioContextRef.current.close().catch(() => {});
        localAudioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      remoteAudioElementsRef.current.forEach((el) => {
        el.pause();
        el.remove();
      });
      remoteAudioElementsRef.current.clear();
      remoteAnalysersRef.current.forEach(({ audioCtx }) => audioCtx.close().catch(() => {}));
      remoteAnalysersRef.current.clear();

      setLocalMicLevel(0);
      setIsLocalSpeaking(false);
      setRemoteSpeakingMap({});
      setRemoteVolumeLevels({});
      return;
    }

    let isMounted = true;
    let lastSpeaking = false;
    let lastLevel = 0;
    let lastLevelUpdateTime = 0;

    async function startMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;

        // Apply initial mute state to track
        stream.getAudioTracks().forEach((t) => {
          t.enabled = !isMutedRef.current;
        });

        // Add track to any existing peer connections
        peerConnectionsRef.current.forEach((pc) => {
          stream.getAudioTracks().forEach((track) => {
            const senders = pc.getSenders();
            const hasAudio = senders.some((s) => s.track?.kind === 'audio');
            if (!hasAudio) {
              pc.addTrack(track, stream);
            }
          });
        });

        // Set up Local Analyser
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        localAudioContextRef.current = audioCtx;
        localAnalyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkMic = () => {
          if (!isMounted || !localAnalyserRef.current) return;

          const now = Date.now();
          const currentMuted = isMutedRef.current;

          if (currentMuted) {
            if (lastLevel !== 0) {
              lastLevel = 0;
              setLocalMicLevel(0);
            }
            if (lastSpeaking) {
              lastSpeaking = false;
              setIsLocalSpeaking(false);
              onSendSpeakingStateRef.current?.(false);
            }
          } else {
            localAnalyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const level = Math.min(100, Math.round((avg / 128) * 100));

            // Throttle mic level updates to 100ms or on significant delta to avoid React thrashing
            if (now - lastLevelUpdateTime > 100 || Math.abs(level - lastLevel) >= 8) {
              lastLevel = level;
              lastLevelUpdateTime = now;
              setLocalMicLevel(level);
            }

            const speaking = level > 12;
            if (speaking !== lastSpeaking) {
              lastSpeaking = speaking;
              setIsLocalSpeaking(speaking);
              onSendSpeakingStateRef.current?.(speaking);
            }
          }

          animationFrameRef.current = requestAnimationFrame(checkMic);
        };

        checkMic();

        // Optional WebSocket Audio Recorder fallback
        if (typeof MediaRecorder !== 'undefined' && sendAudioChunkRef.current) {
          try {
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
              ? 'audio/webm;codecs=opus'
              : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
              ? 'audio/ogg;codecs=opus'
              : '';

            if (mimeType) {
              const rec = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
              mediaRecorderRef.current = rec;
              rec.ondataavailable = async (e) => {
                if (!isMutedRef.current && e.data && e.data.size > 0 && lastSpeaking) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const result = reader.result as string;
                    if (result) {
                      const base64 = result.split(',')[1];
                      if (base64) {
                        sendAudioChunkRef.current?.(base64);
                      }
                    }
                  };
                  reader.readAsDataURL(e.data);
                }
              };
              rec.start(350);
            }
          } catch (e) {
            console.warn('Fallback media recorder not initialized:', e);
          }
        }
      } catch (err) {
        console.error('Microphone acquisition error:', err);
      }
    }

    startMic();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (localAudioContextRef.current) {
        localAudioContextRef.current.close().catch(() => {});
        localAudioContextRef.current = null;
      }
    };
  }, [isConnected, channelId]);

  // Synchronize Mute state to local audio tracks
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !isMuted;
      });
    }
    if (isMuted) {
      setLocalMicLevel((prev) => (prev !== 0 ? 0 : prev));
      setIsLocalSpeaking((prev) => (prev ? false : prev));
      onSendSpeakingStateRef.current?.(false);
    }
  }, [isMuted]);

  // Synchronize Deafen state to remote audio outputs
  useEffect(() => {
    remoteAudioElementsRef.current.forEach((el, userId) => {
      const vol = userVolumesRef.current[userId] ?? 100;
      el.muted = isDeafened;
      el.volume = isDeafened ? 0 : Math.max(0, Math.min(1, vol / 100));
    });
  }, [isDeafened]);

  // Maintain PeerConnections for all remote participants based on stable IDs
  const participantIdsKey = remoteParticipants
    .filter((rp) => rp.userId !== currentUser.id)
    .map((rp) => rp.userId)
    .sort()
    .join(',');

  useEffect(() => {
    if (!isConnected || !channelId) return;

    const currentParticipantIds = new Set<string>(
      remoteParticipants
        .filter((rp) => rp.userId !== currentUser.id)
        .map((rp) => rp.userId)
    );

    // Initialize connections for new participants
    currentParticipantIds.forEach((targetId) => {
      getOrCreatePeerConnection(targetId);
    });

    // Cleanup disconnected participants
    peerConnectionsRef.current.forEach((_, existingId) => {
      if (!currentParticipantIds.has(existingId)) {
        cleanupPeer(existingId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, isConnected, participantIdsKey, getOrCreatePeerConnection, cleanupPeer]);

  // Periodic Remote speaking detector (guarded against useless re-renders)
  useEffect(() => {
    if (!isConnected || !channelId) {
      if (remoteCheckIntervalRef.current) {
        clearInterval(remoteCheckIntervalRef.current);
      }
      return;
    }

    const dataArray = new Uint8Array(128);

    remoteCheckIntervalRef.current = setInterval(() => {
      if (remoteAnalysersRef.current.size === 0) return;

      let speakingChanged = false;
      let volumeChanged = false;

      const newSpeakingMap: Record<string, boolean> = {};
      const newVolumeLevels: Record<string, number> = {};

      remoteAnalysersRef.current.forEach(({ analyser }, userId) => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const level = Math.min(100, Math.round((avg / 128) * 100));
        const isSpeaking = level > 10;

        newVolumeLevels[userId] = level;
        newSpeakingMap[userId] = isSpeaking;

        setRemoteSpeakingMap((prev) => {
          if (prev[userId] !== isSpeaking) {
            speakingChanged = true;
          }
          return prev;
        });

        setRemoteVolumeLevels((prev) => {
          if (Math.abs((prev[userId] || 0) - level) >= 8) {
            volumeChanged = true;
          }
          return prev;
        });
      });

      if (speakingChanged) {
        setRemoteSpeakingMap(newSpeakingMap);
      }
      if (volumeChanged) {
        setRemoteVolumeLevels(newVolumeLevels);
      }
    }, 150);

    return () => {
      if (remoteCheckIntervalRef.current) {
        clearInterval(remoteCheckIntervalRef.current);
      }
    };
  }, [channelId, isConnected]);

  return {
    localMicLevel,
    isLocalSpeaking,
    remoteSpeakingMap,
    remoteVolumeLevels,
    userVolumes,
    setUserVolume,
    handleIncomingSignal,
    handleIncomingAudioChunk,
  };
}
