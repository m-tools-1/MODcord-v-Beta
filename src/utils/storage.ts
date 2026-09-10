import { Server, User, Message, DirectMessageChannel, AppSettings } from '../types';

export const DEFAULT_MOD_USER: User = {
  id: 'user-mod',
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
};

export const CURRENT_USER: User = DEFAULT_MOD_USER;

export const INITIAL_USERS: User[] = [CURRENT_USER];

export const INITIAL_SERVERS: Server[] = [
  {
    id: 'server-main',
    name: 'سيرفر MODcord - مودكورد الرئيسي',
    icon: 'M',
    description: 'سيرفر MODcord - مودكورد الخاص - محادثات حية وغرف صوتية مباشرة بين الأصدقاء',
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
        topic: 'المحادثة العامة للأصدقاء في MODcord - مودكورد',
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
    roles: [
      {
        id: 'role-admin',
        name: 'إدارة السيرفر 🛡️',
        color: '#ef4444',
        position: 1,
        hoist: true,
        permissions: ['manage_server', 'manage_roles', 'manage_channels', 'kick_members', 'mute_members', 'move_members', 'send_messages'],
      },
      {
        id: 'role-vip',
        name: 'كبار الشخصيات VIP ✨',
        color: '#f59e0b',
        position: 2,
        hoist: true,
        permissions: ['send_messages'],
      },
      {
        id: 'role-active',
        name: 'الأعضاء المميزين 🚀',
        color: '#38bdf8',
        position: 3,
        hoist: true,
        permissions: ['send_messages'],
      },
    ],
    memberRoles: {},
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-welcome',
    channelId: 'ch-general',
    serverId: 'server-main',
    authorId: 'user-mod',
    content: 'أهلاً بكم في سيرفر **MODcord - مودكورد** الحقيقي! 🎉\nالآن تم تفعيل نظام تسجيل الحسابات الدائم، وحساب المشرف **! MOD** بالصلاحيات الكاملة، مع دعم مشاركة الشاشة المباشرة بدقة عالية! 🚀🖥️',
    timestamp: 'اليوم',
    isPinned: true,
    reactions: [{ emoji: '🔥', count: 1, users: ['user-mod'] }],
  },
];

export const INITIAL_DMS: DirectMessageChannel[] = [];

// Storage keys for ModeCord
const STORAGE_KEY_SERVERS = 'modecord_servers_v2';
const STORAGE_KEY_MESSAGES = 'modecord_messages_v2';
const STORAGE_KEY_USERS = 'modecord_users_v2';
const STORAGE_KEY_CURRENT_USER = 'modecord_current_user_v2';
const STORAGE_KEY_SETTINGS = 'modecord_settings_v2';

/**
 * Safely sets an item into localStorage.
 * Automatically recovers from QuotaExceededError by pruning old messages or stripping heavy data URLs.
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.number === -2147024882 ||
      (typeof err?.message === 'string' && err.message.includes('quota'));

    if (isQuota) {
      console.warn(`[Storage] Quota exceeded for key: ${key}. Performing emergency cleanup...`);

      // 1. If not saving messages, prune messages to free up storage
      if (key !== STORAGE_KEY_MESSAGES) {
        try {
          const rawMsgs = localStorage.getItem(STORAGE_KEY_MESSAGES);
          if (rawMsgs) {
            const msgs = JSON.parse(rawMsgs);
            if (Array.isArray(msgs) && msgs.length > 20) {
              localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(msgs.slice(-20)));
            } else {
              localStorage.removeItem(STORAGE_KEY_MESSAGES);
            }
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY_MESSAGES);
        }
      }

      // 2. If saving current user or users, remove or truncate massive data URLs
      let sanitizedValue = value;
      if (key === STORAGE_KEY_CURRENT_USER) {
        try {
          const userObj = JSON.parse(value);
          // If avatar or banner is a huge raw base64 string, drop it so essential account state persists
          if (typeof userObj.avatar === 'string' && userObj.avatar.startsWith('data:') && userObj.avatar.length > 30000) {
            userObj.avatar = '';
          }
          if (typeof userObj.banner === 'string' && userObj.banner.startsWith('data:') && userObj.banner.length > 50000) {
            userObj.banner = '';
          }
          sanitizedValue = JSON.stringify(userObj);
        } catch {
          // ignore
        }
      }

      // 3. Retry setting item
      try {
        localStorage.setItem(key, sanitizedValue);
        return true;
      } catch (retryErr) {
        console.warn(`[Storage] Retry for ${key} failed, falling back to memory/session.`);
        return false;
      }
    } else {
      console.warn(`[Storage] Could not write ${key}:`, err?.message || err);
      return false;
    }
  }
}

export function loadStoredServers(): Server[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SERVERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return INITIAL_SERVERS;
}

export function saveStoredServers(servers: Server[]) {
  safeSetItem(STORAGE_KEY_SERVERS, JSON.stringify(servers));
}

export function loadStoredMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return INITIAL_MESSAGES;
}

export function saveStoredMessages(messages: Message[]) {
  // Cap stored messages to prevent storage bloat
  const capped = messages.length > 100 ? messages.slice(-100) : messages;
  safeSetItem(STORAGE_KEY_MESSAGES, JSON.stringify(capped));
}

export function loadStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return INITIAL_USERS;
}

export function saveStoredUsers(users: User[]) {
  safeSetItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

export function loadStoredCurrentUser(): User {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Clean up legacy oversized data URLs only if truly extreme (> 500KB)
      let needsResave = false;
      if (typeof parsed.avatar === 'string' && parsed.avatar.startsWith('data:') && parsed.avatar.length > 500000) {
        parsed.avatar = '';
        needsResave = true;
      }
      if (typeof parsed.banner === 'string' && parsed.banner.startsWith('data:') && parsed.banner.length > 800000) {
        parsed.banner = '';
        needsResave = true;
      }
      if (needsResave) {
        safeSetItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.warn(e);
  }
  return CURRENT_USER;
}

export function saveStoredCurrentUser(user: User) {
  // Guard against truly massive uncompressed raw data URLs (> 500KB)
  const clone = { ...user };
  if (typeof clone.avatar === 'string' && clone.avatar.startsWith('data:') && clone.avatar.length > 500000) {
    clone.avatar = '';
  }
  if (typeof clone.banner === 'string' && clone.banner.startsWith('data:') && clone.banner.length > 800000) {
    clone.banner = '';
  }
  safeSetItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(clone));
}

export function clearStoredAuthUser() {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    localStorage.removeItem('modecord_token');
    localStorage.removeItem('modecord_is_logged_in_v3');
  } catch (e) {
    console.error(e);
  }
}

export function isUserLoggedIn(): boolean {
  try {
    return localStorage.getItem('modecord_is_logged_in_v3') === 'true';
  } catch {
    return false;
  }
}

export function setStoredLoggedIn(loggedIn: boolean) {
  try {
    if (loggedIn) {
      localStorage.setItem('modecord_is_logged_in_v3', 'true');
    } else {
      localStorage.removeItem('modecord_is_logged_in_v3');
    }
  } catch {}
}

export function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return {
    soundEnabled: true,
    theme: 'dark',
    language: 'ar',
    fontSize: 'normal',
  };
}

export function saveStoredSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}
