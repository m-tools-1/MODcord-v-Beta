import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  loadAccountsFromFirestore,
  saveAccountToFirestore,
  loadStateFromFirestore,
  saveMessageToFirestore,
  deleteMessageFromFirestore,
  saveUserToFirestore,
  saveServerToFirestore,
} from './src/lib/firestoreService';

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json({ limit: '20mb' }));

// Data Directory
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StoredAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  displayName: string;
  discriminator: string;
  avatar: string;
  banner?: string;
  bannerColor?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  role: 'owner' | 'admin' | 'mod' | 'member';
  roleTitle: string;
  roleColor: string;
  bio: string;
  color: string;
  joinedAt: string;
}

// Initial Preset Accounts (Master ! MOD account only)
const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    id: 'user-mod',
    username: 'MOD',
    password: 'mod@2026',
    name: 'mod',
    displayName: '! MOD',
    discriminator: '0001',
    avatar: '',
    status: 'online',
    customStatus: 'المالك والمشرف العام 👑',
    role: 'owner',
    roleTitle: '👑 المشرف العام والمالك (! MOD)',
    roleColor: '#f59e0b',
    bio: 'الحساب الإداري الرسمي لسيرفر MODcord - مودكورد - الصلاحية الكاملة على كافة الرومات ونقل الأعضاء.',
    color: '#f59e0b',
    joinedAt: 'اليوم',
  },
];

function loadAccounts(): StoredAccount[] {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const content = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
      const loaded: StoredAccount[] = JSON.parse(content);
      // Ensure master ! MOD account is always present with owner permissions
      const modIndex = loaded.findIndex(
        (a) => a.username.toUpperCase() === 'MOD' || a.id === 'user-mod'
      );
      if (modIndex >= 0) {
        loaded[modIndex] = {
          ...DEFAULT_ACCOUNTS[0],
          ...loaded[modIndex],
          role: 'owner',
          roleTitle: '👑 المشرف العام والمالك (! MOD)',
          roleColor: '#f59e0b',
        };
      } else {
        loaded.unshift(DEFAULT_ACCOUNTS[0]);
      }
      return loaded;
    }
  } catch (err) {
    console.error('Failed to read accounts file:', err);
  }
  return [...DEFAULT_ACCOUNTS];
}

function saveAccounts(accounts: StoredAccount[]) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save accounts file:', err);
  }
  // Sync to Cloud Firestore in background
  accounts.forEach((acc) => {
    saveAccountToFirestore(acc).catch(() => {});
  });
}

let accounts = loadAccounts();
saveAccounts(accounts);

interface StoredData {
  servers: any[];
  messages: any[];
  users: any[];
}

const DEFAULT_DATA: StoredData = {
  servers: [
    {
      id: 'server-main',
      name: 'سيرفر MODcord - مودكورد الرئيسي',
      icon: 'M',
      description: 'السيرفر المخصص للشباب - تواصل نصي وصوتي ومشاركة شاشة مباشرة 100%',
      ownerId: 'user-mod',
      categories: [
        { id: 'cat-text', serverId: 'server-main', name: '💬 قنوات نصية' },
        { id: 'cat-voice', serverId: 'server-main', name: '🔊 غرف صوتية' },
      ],
      channels: [
        {
          id: 'ch-general',
          serverId: 'server-main',
          name: 'الدردشة-العامة',
          type: 'text',
          topic: 'المحادثة العامة للشباب في MODcord - مودكورد',
          categoryId: 'cat-text',
        },
        {
          id: 'ch-gaming',
          serverId: 'server-main',
          name: 'ألعاب-وسوالف',
          type: 'text',
          topic: 'تنسيق اللعب والروابط ومشاركة الشاشة',
          categoryId: 'cat-text',
        },
        {
          id: 'ch-voice-lounge',
          serverId: 'server-main',
          name: 'ديوانية الشباب 🎙️',
          type: 'voice',
          topic: 'غرفة صوتية مفتوحة للأحاديث المباشرة',
          categoryId: 'cat-voice',
        },
        {
          id: 'ch-voice-gaming',
          serverId: 'server-main',
          name: 'روم القيمنق 🎮',
          type: 'voice',
          topic: 'تواصل صوتي حقيقي ومشاركة شاشة أثناء اللعب',
          categoryId: 'cat-voice',
        },
      ],
      memberIds: ['user-mod'],
    },
  ],
  messages: [
    {
      id: 'msg-welcome',
      channelId: 'ch-general',
      serverId: 'server-main',
      authorId: 'user-mod',
      content: 'أهلاً بكم في سيرفر **MODcord - مودكورد** الحقيقي! 🎉\nالآن تم تفعيل نظام تسجيل الحسابات الدائم، وحساب المشرف **! MOD** بالصلاحيات الكاملة، مع دعم مشاركة الشاشة المباشرة بدقة عالية! 🚀🖥️',
      timestamp: 'الآن',
      isPinned: true,
      reactions: [{ emoji: '🔥', count: 1, users: ['user-mod'] }],
    },
  ],
  users: accounts.map((a) => ({
    id: a.id,
    name: a.name,
    displayName: a.displayName,
    discriminator: a.discriminator,
    avatar: a.avatar,
    status: 'online',
    customStatus: a.customStatus,
    role: a.role,
    roleTitle: a.roleTitle,
    roleColor: a.roleColor,
    bio: a.bio,
    color: a.color,
    joinedAt: a.joinedAt,
  })),
};

function loadStore(): StoredData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf8');
      const loaded: StoredData = JSON.parse(content);
      // Ensure ! MOD user exists
      if (!loaded.users.some((u) => u.id === 'user-mod')) {
        const modAcc = accounts.find((a) => a.id === 'user-mod') || DEFAULT_ACCOUNTS[0];
        loaded.users.unshift({
          id: modAcc.id,
          name: modAcc.name,
          displayName: modAcc.displayName,
          discriminator: modAcc.discriminator,
          avatar: modAcc.avatar,
          status: 'online',
          customStatus: modAcc.customStatus,
          role: modAcc.role,
          roleTitle: modAcc.roleTitle,
          roleColor: modAcc.roleColor,
          bio: modAcc.bio,
          color: modAcc.color,
          joinedAt: modAcc.joinedAt,
        });
      }
      // Ensure server-main owner is user-mod
      if (loaded.servers[0]) {
        loaded.servers[0].ownerId = 'user-mod';
      }
      // Ensure all servers have roles and memberRoles initialized
      loaded.servers.forEach((srv) => {
        if (!srv.roles || srv.roles.length === 0) {
          srv.roles = [
            {
              id: `role-admin-${srv.id}`,
              name: 'إدارة السيرفر 🛡️',
              color: '#ef4444',
              position: 1,
              hoist: true,
              permissions: ['manage_server', 'manage_roles', 'manage_channels', 'kick_members', 'mute_members', 'move_members', 'send_messages'],
            },
            {
              id: `role-vip-${srv.id}`,
              name: 'كبار الشخصيات VIP ✨',
              color: '#f59e0b',
              position: 2,
              hoist: true,
              permissions: ['send_messages'],
            },
            {
              id: `role-member-${srv.id}`,
              name: 'الأعضاء المميزين 🚀',
              color: '#38bdf8',
              position: 3,
              hoist: true,
              permissions: ['send_messages'],
            },
          ];
        }
        if (!srv.memberRoles) {
          srv.memberRoles = {};
        }
      });
      return loaded;
    }
  } catch (err) {
    console.error('Failed to read store:', err);
  }
  return DEFAULT_DATA;
}

function saveStore(data: StoredData) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save store:', err);
  }
}

let store = loadStore();
saveStore(store);

async function initFirestoreSync() {
  try {
    console.log('[Firestore] Starting two-way cloud sync...');
    // 1. Sync accounts
    const cloudAccounts = await loadAccountsFromFirestore();
    if (cloudAccounts && cloudAccounts.length > 0) {
      cloudAccounts.forEach((ca) => {
        const idx = accounts.findIndex(
          (a) => a.id === ca.id || a.username.toLowerCase() === ca.username.toLowerCase()
        );
        if (idx >= 0) {
          accounts[idx] = { ...accounts[idx], ...ca };
        } else {
          accounts.push(ca);
        }
      });
      try {
        fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
      } catch {}
      console.log(`[Firestore] Synced ${cloudAccounts.length} accounts from Cloud Firestore`);
    } else {
      // Seed Cloud Firestore with existing local accounts
      accounts.forEach((a) => saveAccountToFirestore(a).catch(() => {}));
    }

    // 2. Sync state (servers, messages, users)
    const cloudState = await loadStateFromFirestore();
    if (cloudState) {
      let stateChanged = false;

      if (cloudState.servers && cloudState.servers.length > 0) {
        store.servers = cloudState.servers;
        stateChanged = true;
      } else if (store.servers.length > 0) {
        store.servers.forEach((s) => saveServerToFirestore(s).catch(() => {}));
      }

      if (cloudState.messages && cloudState.messages.length > 0) {
        const msgMap = new Map(store.messages.map((m) => [m.id, m]));
        cloudState.messages.forEach((m) => msgMap.set(m.id, m));
        store.messages = Array.from(msgMap.values());
        stateChanged = true;
      } else if (store.messages.length > 0) {
        store.messages.forEach((m) => saveMessageToFirestore(m).catch(() => {}));
      }

      if (cloudState.users && cloudState.users.length > 0) {
        const userMap = new Map(store.users.map((u) => [u.id, u]));
        cloudState.users.forEach((u) => userMap.set(u.id, u));
        store.users = Array.from(userMap.values());
        stateChanged = true;
      } else if (store.users.length > 0) {
        store.users.forEach((u) => saveUserToFirestore(u).catch(() => {}));
      }

      if (stateChanged) {
        saveStore(store);
        console.log(
          `[Firestore] Cloud Firestore synchronized: ${store.messages.length} messages, ${store.users.length} users, ${store.servers.length} servers`
        );
        broadcastToAll('servers:update', store.servers);
        broadcastToAll('users:update', store.users);
      }
    }
  } catch (err) {
    console.error('[Firestore] Initialization sync error:', err);
  }
}

// Track active WebSocket connections & voice rooms
interface ClientSession {
  ws: WebSocket;
  userId: string;
  userName: string;
  voiceChannelId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing?: boolean;
}

const clients = new Map<WebSocket, ClientSession>();

// WebSockets Server
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(event: string, payload: any, senderWs?: WebSocket) {
  const data = JSON.stringify({ event, payload });
  for (const [clientWs] of clients) {
    if (clientWs.readyState === WebSocket.OPEN && clientWs !== senderWs) {
      clientWs.send(data);
    }
  }
}

function broadcastToAll(event: string, payload: any) {
  const data = JSON.stringify({ event, payload });
  for (const [clientWs] of clients) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data);
    }
  }
}

function getVoiceParticipants(channelId: string) {
  const list: any[] = [];
  for (const session of clients.values()) {
    if (session.voiceChannelId === channelId) {
      const u = store.users.find((user) => user.id === session.userId);
      list.push({
        userId: session.userId,
        user: u,
        isMuted: session.isMuted,
        isDeafened: session.isDeafened,
        isSpeaking: session.isSpeaking,
        isScreenSharing: !!session.isScreenSharing,
      });
    }
  }
  return list;
}

wss.on('connection', (ws: WebSocket) => {
  ws.send(JSON.stringify({ event: 'connected', payload: { time: Date.now() } }));

  ws.on('message', (rawMsg: string) => {
    try {
      const { event, payload } = JSON.parse(rawMsg.toString());

      if (event === 'auth:identify') {
        const user = payload;
        clients.set(ws, {
          ws,
          userId: user.id,
          userName: user.displayName || user.name,
          voiceChannelId: null,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false,
          isScreenSharing: false,
        });

        // Add or update user in store
        const existingIdx = store.users.findIndex((u) => u.id === user.id);
        let currentUserObj: any;
        if (existingIdx >= 0) {
          currentUserObj = { ...store.users[existingIdx], ...user, status: 'online' };
          store.users[existingIdx] = currentUserObj;
        } else {
          const isOwner = user.id === 'user-mod' || user.role === 'owner';
          currentUserObj = {
            ...user,
            status: 'online',
            role: isOwner ? 'owner' : 'member',
            roleTitle: isOwner ? '👑 المشرف العام والمالك (! MOD)' : 'عضو في السيرفر',
            roleColor: isOwner ? '#f59e0b' : '#38bdf8',
            joinedAt: 'اليوم',
          };
          store.users.push(currentUserObj);
        }
        saveStore(store);
        saveUserToFirestore(currentUserObj).catch(() => {});

        // Send initial state sync
        ws.send(
          JSON.stringify({
            event: 'sync:init',
            payload: {
              servers: store.servers,
              messages: store.messages,
              users: store.users,
            },
          })
        );

        broadcastToAll('users:update', store.users);
      }

      if (event === 'message:send') {
        const msg = payload;
        store.messages.push(msg);
        saveStore(store);
        saveMessageToFirestore(msg).catch(() => {});
        broadcastToAll('message:new', msg);
      }

      if (event === 'message:reaction') {
        const { messageId, emoji, userId } = payload;
        const targetMsg = store.messages.find((m) => m.id === messageId);
        if (targetMsg) {
          targetMsg.reactions = targetMsg.reactions || [];
          const reactIndex = targetMsg.reactions.findIndex((r: any) => r.emoji === emoji);
          if (reactIndex >= 0) {
            const react = targetMsg.reactions[reactIndex];
            const hasUser = react.users.includes(userId);
            if (hasUser) {
              react.users = react.users.filter((uid: string) => uid !== userId);
              react.count -= 1;
            } else {
              react.users.push(userId);
              react.count += 1;
            }
            if (react.count <= 0) {
              targetMsg.reactions.splice(reactIndex, 1);
            }
          } else {
            targetMsg.reactions.push({ emoji, count: 1, users: [userId] });
          }
          saveStore(store);
          saveMessageToFirestore(targetMsg).catch(() => {});
          broadcastToAll('message:update', targetMsg);
        }
      }

      if (event === 'message:delete') {
        const messageId = payload;
        store.messages = store.messages.filter((m) => m.id !== messageId);
        saveStore(store);
        deleteMessageFromFirestore(messageId).catch(() => {});
        broadcastToAll('message:deleted', messageId);
      }

      if (event === 'message:pin') {
        const messageId = payload;
        const msg = store.messages.find((m) => m.id === messageId);
        if (msg) {
          msg.isPinned = !msg.isPinned;
          saveStore(store);
          saveMessageToFirestore(msg).catch(() => {});
          broadcastToAll('message:update', msg);
        }
      }

      if (event === 'channel:create') {
        const { serverId, channel } = payload;
        const s = store.servers.find((srv) => srv.id === serverId);
        if (s) {
          s.channels.push(channel);
          saveStore(store);
          saveServerToFirestore(s).catch(() => {});
          broadcastToAll('servers:update', store.servers);
        }
      }

      if (event === 'channel:update') {
        const { serverId, channelId, updates } = payload;
        const s = store.servers.find((srv) => srv.id === serverId);
        if (s) {
          const chIdx = s.channels.findIndex((c) => c.id === channelId);
          if (chIdx >= 0) {
            s.channels[chIdx] = { ...s.channels[chIdx], ...updates };
            saveStore(store);
            saveServerToFirestore(s).catch(() => {});
            broadcastToAll('servers:update', store.servers);
          }
        }
      }

      if (event === 'channel:delete') {
        const { serverId, channelId } = payload;
        const s = store.servers.find((srv) => srv.id === serverId);
        if (s) {
          s.channels = s.channels.filter((c) => c.id !== channelId);
          // Also optionally clean up messages in that channel
          store.messages = store.messages.filter((m) => m.channelId !== channelId);
          saveStore(store);
          saveServerToFirestore(s).catch(() => {});
          broadcastToAll('servers:update', store.servers);
        }
      }

      if (event === 'server:create') {
        const newServer = payload;
        store.servers.push(newServer);
        saveStore(store);
        saveServerToFirestore(newServer).catch(() => {});
        broadcastToAll('servers:update', store.servers);
      }

      if (event === 'server:update') {
        const updated = payload;
        store.servers = store.servers.map((s) => (s.id === updated.id ? updated : s));
        saveStore(store);
        saveServerToFirestore(updated).catch(() => {});
        broadcastToAll('servers:update', store.servers);
      }

      if (event === 'user:update') {
        const updated = payload;
        store.users = store.users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u));
        saveStore(store);
        saveUserToFirestore(updated).catch(() => {});

        // Also update persistent account credentials in ACCOUNTS_FILE
        try {
          const accounts = loadAccounts();
          const accIdx = accounts.findIndex((a) => a.id === updated.id);
          if (accIdx >= 0) {
            accounts[accIdx] = {
              ...accounts[accIdx],
              displayName: updated.displayName || accounts[accIdx].displayName,
              avatar: updated.avatar !== undefined ? updated.avatar : accounts[accIdx].avatar,
              banner: updated.banner !== undefined ? updated.banner : accounts[accIdx].banner,
              bannerColor: updated.bannerColor !== undefined ? updated.bannerColor : accounts[accIdx].bannerColor,
              color: updated.color || accounts[accIdx].color,
              customStatus: updated.customStatus !== undefined ? updated.customStatus : accounts[accIdx].customStatus,
              bio: updated.bio !== undefined ? updated.bio : accounts[accIdx].bio,
              status: updated.status || accounts[accIdx].status,
            };
            saveAccounts(accounts);
          }
        } catch (e) {
          console.error('Failed to sync updated user into accounts:', e);
        }

        broadcastToAll('users:update', store.users);
      }

      // Voice Channel Events
      if (event === 'voice:join') {
        const { channelId, isMuted, isDeafened } = payload;
        const session = clients.get(ws);
        if (session) {
          const oldChan = session.voiceChannelId;
          session.voiceChannelId = channelId;
          session.isMuted = !!isMuted;
          session.isDeafened = !!isDeafened;
          if (oldChan && oldChan !== channelId) {
            broadcastToAll('voice:participants', {
              channelId: oldChan,
              participants: getVoiceParticipants(oldChan),
            });
          }
          broadcastToAll('voice:participants', {
            channelId,
            participants: getVoiceParticipants(channelId),
          });
        }
      }

      if (event === 'voice:leave') {
        const session = clients.get(ws);
        if (session && session.voiceChannelId) {
          const oldChan = session.voiceChannelId;
          session.voiceChannelId = null;
          session.isScreenSharing = false;
          broadcastToAll('voice:participants', {
            channelId: oldChan,
            participants: getVoiceParticipants(oldChan),
          });
          broadcastToAll('screen:stopped', {
            userId: session.userId,
            channelId: oldChan,
          });
        }
      }

      if (event === 'voice:state') {
        const { isMuted, isDeafened, isSpeaking, isScreenSharing } = payload;
        const session = clients.get(ws);
        if (session && session.voiceChannelId) {
          session.isMuted = isMuted;
          session.isDeafened = isDeafened;
          session.isSpeaking = isSpeaking;
          if (typeof isScreenSharing === 'boolean') {
            session.isScreenSharing = isScreenSharing;
          }
          broadcastToAll('voice:participants', {
            channelId: session.voiceChannelId,
            participants: getVoiceParticipants(session.voiceChannelId),
          });
        }
      }

      // ! MOD & Admin Exclusive: Force Move member to another room
      if (event === 'voice:force_move') {
        const { targetUserId, targetChannelId } = payload;
        const session = clients.get(ws);
        const requester = store.users.find((u) => u.id === session?.userId);
        const isAuthorized = requester && (requester.role === 'owner' || requester.id === 'user-mod');

        if (isAuthorized) {
          let targetWs: WebSocket | null = null;
          let targetSession: ClientSession | null = null;

          for (const [cWs, s] of clients.entries()) {
            if (s.userId === targetUserId) {
              targetWs = cWs;
              targetSession = s;
              break;
            }
          }

          if (targetSession) {
            const previousChannelId = targetSession.voiceChannelId;
            targetSession.voiceChannelId = targetChannelId;

            const allChannels = store.servers.flatMap((s) => s.channels);
            const targetChannel = allChannels.find((c) => c.id === targetChannelId);
            const channelName = targetChannel?.name || 'غرفة صوتية';

            // Send notification to the moved user
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(
                JSON.stringify({
                  event: 'voice:moved_by_admin',
                  payload: {
                    targetChannelId,
                    channelName,
                    movedBy: requester.displayName || '! MOD',
                  },
                })
              );
            }

            // Broadcast voice participant changes
            if (previousChannelId) {
              broadcastToAll('voice:participants', {
                channelId: previousChannelId,
                participants: getVoiceParticipants(previousChannelId),
              });
            }
            broadcastToAll('voice:participants', {
              channelId: targetChannelId,
              participants: getVoiceParticipants(targetChannelId),
            });
          }
        }
      }

      // ! MOD Force Mute
      if (event === 'voice:force_mute') {
        const { targetUserId, isMuted } = payload;
        const session = clients.get(ws);
        const requester = store.users.find((u) => u.id === session?.userId);
        if (requester && (requester.role === 'owner' || requester.id === 'user-mod')) {
          for (const [cWs, s] of clients.entries()) {
            if (s.userId === targetUserId) {
              s.isMuted = isMuted;
              if (cWs.readyState === WebSocket.OPEN) {
                cWs.send(
                  JSON.stringify({
                    event: 'voice:forced_mute',
                    payload: { isMuted, by: requester.displayName || '! MOD' },
                  })
                );
              }
              if (s.voiceChannelId) {
                broadcastToAll('voice:participants', {
                  channelId: s.voiceChannelId,
                  participants: getVoiceParticipants(s.voiceChannelId),
                });
              }
              break;
            }
          }
        }
      }

      // ! MOD Force Disconnect
      if (event === 'voice:force_disconnect') {
        const { targetUserId } = payload;
        const session = clients.get(ws);
        const requester = store.users.find((u) => u.id === session?.userId);
        if (requester && (requester.role === 'owner' || requester.id === 'user-mod')) {
          for (const [cWs, s] of clients.entries()) {
            if (s.userId === targetUserId) {
              const oldChan = s.voiceChannelId;
              s.voiceChannelId = null;
              if (cWs.readyState === WebSocket.OPEN) {
                cWs.send(
                  JSON.stringify({
                    event: 'voice:forced_disconnect',
                    payload: { by: requester.displayName || '! MOD' },
                  })
                );
              }
              if (oldChan) {
                broadcastToAll('voice:participants', {
                  channelId: oldChan,
                  participants: getVoiceParticipants(oldChan),
                });
              }
              break;
            }
          }
        }
      }

      // Screen Sharing Feature for everyone
      if (event === 'screen:start') {
        const { channelId, meta } = payload;
        const session = clients.get(ws);
        if (session) {
          session.isScreenSharing = true;
          broadcastToAll('screen:started', {
            userId: session.userId,
            userName: session.userName,
            channelId,
            meta,
          });
          if (session.voiceChannelId) {
            broadcastToAll('voice:participants', {
              channelId: session.voiceChannelId,
              participants: getVoiceParticipants(session.voiceChannelId),
            });
          }
        }
      }

      if (event === 'screen:stop') {
        const { channelId } = payload;
        const session = clients.get(ws);
        if (session) {
          session.isScreenSharing = false;
          broadcastToAll('screen:stopped', {
            userId: session.userId,
            channelId,
          });
          if (session.voiceChannelId) {
            broadcastToAll('voice:participants', {
              channelId: session.voiceChannelId,
              participants: getVoiceParticipants(session.voiceChannelId),
            });
          }
        }
      }

      // Screen live frame relay (for universal cross-browser screen viewing)
      if (event === 'screen:frame') {
        const { channelId, frame } = payload;
        const session = clients.get(ws);
        if (session && session.voiceChannelId === channelId) {
          const frameMsg = JSON.stringify({
            event: 'screen:frame_received',
            payload: {
              userId: session.userId,
              userName: session.userName,
              channelId,
              frame,
            },
          });
          for (const [cWs, s] of clients.entries()) {
            if (cWs.readyState === WebSocket.OPEN && cWs !== ws && s.voiceChannelId === channelId) {
              cWs.send(frameMsg);
            }
          }
        }
      }

      // WebRTC direct signaling for voice audio & screenshare
      if (event === 'webrtc:signal') {
        const { targetUserId, signal } = payload;
        const session = clients.get(ws);
        if (session) {
          for (const [cWs, s] of clients.entries()) {
            if (s.userId === targetUserId && cWs.readyState === WebSocket.OPEN) {
              cWs.send(
                JSON.stringify({
                  event: 'webrtc:signal',
                  payload: {
                    fromUserId: session.userId,
                    signal,
                  },
                })
              );
            }
          }
        }
      }

      // Relay Voice audio chunk
      if (event === 'voice:audio_chunk') {
        const session = clients.get(ws);
        if (session && session.voiceChannelId && !session.isMuted) {
          const data = JSON.stringify({
            event: 'voice:audio_received',
            payload: {
              userId: session.userId,
              channelId: session.voiceChannelId,
              audio: payload.audio,
            },
          });
          for (const [clientWs, s] of clients) {
            if (
              clientWs.readyState === WebSocket.OPEN &&
              clientWs !== ws &&
              s.voiceChannelId === session.voiceChannelId &&
              !s.isDeafened
            ) {
              clientWs.send(data);
            }
          }
        }
      }

      // Typing event
      if (event === 'typing') {
        const { channelId, userName } = payload;
        broadcast('typing', { channelId, userName }, ws);
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    const session = clients.get(ws);
    if (session) {
      if (session.voiceChannelId) {
        const oldChan = session.voiceChannelId;
        session.voiceChannelId = null;
        broadcastToAll('voice:participants', {
          channelId: oldChan,
          participants: getVoiceParticipants(oldChan),
        });
        if (session.isScreenSharing) {
          broadcastToAll('screen:stopped', {
            userId: session.userId,
            channelId: oldChan,
          });
        }
      }

      const user = store.users.find((u) => u.id === session.userId);
      if (user) {
        user.status = 'offline';
        saveStore(store);
        broadcastToAll('users:update', store.users);
      }
    }
    clients.delete(ws);
  });
});

// REST API Endpoints for Authentication & State
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', onlineClients: clients.size, time: Date.now() });
});

app.get('/api/state', (req, res) => {
  res.json({
    servers: store.servers,
    messages: store.messages,
    users: store.users,
  });
});

// List Accounts for quick login
app.get('/api/auth/accounts', (req, res) => {
  res.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      username: a.username,
      displayName: a.displayName,
      role: a.role,
      roleTitle: a.roleTitle,
      roleColor: a.roleColor,
      avatar: a.avatar,
      color: a.color,
      customStatus: a.customStatus,
    })),
  });
});

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
  }

  const cleanUser = username.trim().toLowerCase().replace(/^!/, '').trim();
  const acc = accounts.find((a) => {
    const aUser = a.username.toLowerCase();
    const aName = a.name.toLowerCase();
    const aDisplay = a.displayName.toLowerCase().replace(/^!/, '').trim();
    return (
      aUser === cleanUser ||
      aName === cleanUser ||
      aDisplay === cleanUser ||
      (cleanUser === 'mod' && a.id === 'user-mod')
    );
  });

  if (!acc || acc.password !== password) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  let userProfile = store.users.find((u) => u.id === acc.id);
  if (!userProfile) {
    userProfile = {
      id: acc.id,
      name: acc.name,
      displayName: acc.displayName,
      discriminator: acc.discriminator || '0001',
      avatar: acc.avatar || '',
      status: 'online',
      customStatus: acc.customStatus || '',
      role: acc.role || 'member',
      roleTitle: acc.roleTitle || 'عضو السيرفر',
      roleColor: acc.roleColor || '#38bdf8',
      bio: acc.bio || '',
      color: acc.color || '#5865f2',
      joinedAt: 'اليوم',
    };
    store.users.push(userProfile);
    saveStore(store);
  }

  res.json({
    success: true,
    user: userProfile,
    token: `token-${acc.id}-${Date.now()}`,
  });
});

// Register Endpoint
app.post('/api/auth/register', (req, res) => {
  const { username, displayName, password, color, avatar } = req.body;
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'يرجى تعبئة اسم المستخدم والاسم المعروض وكلمة المرور' });
  }

  const cleanUser = username.trim().toLowerCase();
  if (accounts.some((a) => a.username.toLowerCase() === cleanUser)) {
    return res.status(400).json({ error: 'اسم المستخدم مسجّل مسبقاً، يرجى اختيار اسم آخر' });
  }

  const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newDisc = Math.floor(1000 + Math.random() * 9000).toString();
  const newAcc: StoredAccount = {
    id: newId,
    username: cleanUser,
    password: password.trim(),
    name: cleanUser,
    displayName: displayName.trim(),
    discriminator: newDisc,
    role: 'member',
    roleTitle: 'عضو في السيرفر',
    roleColor: '#38bdf8',
    color: color || '#5865f2',
    avatar: avatar || '',
    status: 'online',
    customStatus: 'عضو مسجل في MODcord - مودكورد 🚀',
    bio: 'صديق في سيرفر MODcord - مودكورد.',
    joinedAt: 'اليوم',
  };

  accounts.push(newAcc);
  saveAccounts(accounts);

  const newUserProfile = {
    id: newAcc.id,
    name: newAcc.name,
    displayName: newAcc.displayName,
    discriminator: newAcc.discriminator,
    avatar: newAcc.avatar,
    status: 'online' as const,
    customStatus: newAcc.customStatus,
    role: newAcc.role,
    roleTitle: newAcc.roleTitle,
    roleColor: newAcc.roleColor,
    bio: newAcc.bio,
    color: newAcc.color,
    joinedAt: newAcc.joinedAt,
  };

  store.users.push(newUserProfile);
  if (store.servers[0] && !store.servers[0].memberIds.includes(newId)) {
    store.servers[0].memberIds.push(newId);
  }
  saveStore(store);
  saveAccountToFirestore(newAcc).catch(() => {});
  saveUserToFirestore(newUserProfile).catch(() => {});
  if (store.servers[0]) {
    saveServerToFirestore(store.servers[0]).catch(() => {});
  }
  broadcastToAll('users:update', store.users);
  broadcastToAll('servers:update', store.servers);

  res.json({
    success: true,
    user: newUserProfile,
    token: `token-${newId}-${Date.now()}`,
  });
});

// Vite Middleware Setup
async function initServer() {
  // Sync Cloud Firestore on server boot
  await initFirestoreSync();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MODcord - مودكورد server running on http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error('Failed to start server:', err);
});
