export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export type UserRole = 'owner' | 'admin' | 'mod' | 'vip' | 'bot' | 'member';

export interface RoleInfo {
  id: UserRole;
  name: string;
  badgeLabel: string;
  description: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: string;
  permissions: string[];
  level: number;
}

export interface User {
  id: string;
  name: string;
  displayName: string;
  discriminator: string;
  avatar: string;
  banner?: string;
  bannerColor?: string;
  status: UserStatus;
  customStatus?: string;
  role: UserRole;
  roleTitle: string;
  roleColor: string;
  bio: string;
  color: string;
  joinedAt: string;
  customGradient?: {
    enabled: boolean;
    from: string;
    to: string;
    angle?: number;
  };
  badges?: string[];
  website?: string;
  activity?: string;
}

export type ChannelType = 'text' | 'voice';

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: ChannelType;
  topic?: string;
  categoryId?: string;
  isPrivate?: boolean;
}

export interface Category {
  id: string;
  serverId: string;
  name: string;
}

export interface ServerRole {
  id: string;
  name: string;
  color: string;
  position: number;
  hoist: boolean; // display role members separately in online list
  permissions: string[]; // e.g. 'manage_server' | 'manage_roles' | 'manage_channels' | 'kick_members' | 'mute_members' | 'move_members' | 'send_messages'
  icon?: string;
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  description: string;
  ownerId: string;
  channels: Channel[];
  categories: Category[];
  memberIds: string[];
  bannerColor?: string;
  roles?: ServerRole[];
  memberRoles?: Record<string, string[]>; // userId -> array of role ids
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs who reacted
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  size?: string;
}

export interface Message {
  id: string;
  channelId: string;
  serverId?: string; // empty if DM
  authorId: string;
  content: string;
  timestamp: string;
  edited?: boolean;
  replyTo?: {
    id: string;
    authorName: string;
    content: string;
  };
  attachments?: Attachment[];
  reactions?: Reaction[];
  isPinned?: boolean;
}

export interface DirectMessageChannel {
  id: string;
  targetUserId: string;
  unreadCount?: number;
}

export interface VoiceParticipant {
  userId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing?: boolean;
  isVideoOn?: boolean;
}

export interface VoiceSessionState {
  isConnected: boolean;
  channelId: string | null;
  serverId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  isVideoOn: boolean;
  ping: number;
  participants: VoiceParticipant[];
}

export interface ActiveScreenShare {
  userId: string;
  userName: string;
  channelId: string;
  frame?: string;
  stream?: MediaStream;
}

export interface AppSettings {
  soundEnabled: boolean;
  theme: 'dark' | 'midnight' | 'light';
  language: 'ar' | 'en';
  fontSize: 'compact' | 'normal' | 'large';
}
