import { User, UserRole, RoleInfo } from '../types';

export const ROLE_DEFINITIONS: Record<UserRole, RoleInfo> = {
  owner: {
    id: 'owner',
    name: 'المالك والمؤسس',
    badgeLabel: 'المالك 👑',
    description: 'المالك والمؤسس للسيرفر - الصلاحية السيادية الكاملة والمطلقة على كافة الإعدادات والرومات والأعضاء.',
    color: '#f59e0b', // Amber / Gold
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/35',
    textClass: 'text-amber-400',
    icon: 'Crown',
    level: 1,
    permissions: [
      'التحكم الإداري المطلق بالسيرفر',
      'إنشاء وتعديل وإعادة تسمية وحذف الرومات',
      'تعيين وسحب وترقية رتب جميع الأعضاء والمشرفين',
      'طرد، ونقل، وإسكات أي عضو في الرومات الصوتية',
      'تثبيت وحذف أي رسالة في القنوات الكتابية',
      'تعديل اسم وشعار وهوية وإعدادات السيرفر',
    ],
  },
  admin: {
    id: 'admin',
    name: 'مشرف عام',
    badgeLabel: 'مشرف عام 🛡️',
    description: 'إدارة متقدمة وشاملة - الإشراف على الرومات وتوجيه الأعضاء وتنفيذ القرارات الإدارية.',
    color: '#ef4444', // Ruby Crimson / Red
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-500/35',
    textClass: 'text-rose-400',
    icon: 'ShieldCheck',
    level: 2,
    permissions: [
      'إنشاء وتعديل الرومات الصوتية والكتابية',
      'ترقية وتعيين رتب المشرفين والأعضاء (Mod / VIP)',
      'نقل الأعضاء وإسكاتهم في الرومات الصوتية',
      'حذف وتثبيت رسائل الأعضاء في الشات',
      'طرد المخالفين وإدارة قائمة الأعضاء',
    ],
  },
  mod: {
    id: 'mod',
    name: 'مشرف السيرفر',
    badgeLabel: 'مشرف ⚡',
    description: 'مراقبة الرومات والمحادثات - الحفاظ على النظام وإسكات المزعجين ومساعدة الأعضاء.',
    color: '#8b5cf6', // Royal Purple
    bgClass: 'bg-purple-500/15',
    borderClass: 'border-purple-500/35',
    textClass: 'text-purple-300',
    icon: 'ShieldAlert',
    level: 3,
    permissions: [
      'مراقبة المحادثات وتوجيه الأعضاء',
      'إسكات الأعضاء المزعجين في الرومات الصوتية',
      'حذف الرسائل غير اللائقة أو المخالفة',
      'تثبيت التنبيهات والإعلانات الهامة',
      'تعديل رومات الدردشة المحددة',
    ],
  },
  vip: {
    id: 'vip',
    name: 'عضو مميز VIP',
    badgeLabel: 'VIP 🌟',
    description: 'رتبة شرفية تقديرية - لون خاص وشارة مميزة ومميزات تفاعلية موسعة.',
    color: '#ec4899', // Rose Pink
    bgClass: 'bg-pink-500/15',
    borderClass: 'border-pink-500/35',
    textClass: 'text-pink-400',
    icon: 'Sparkles',
    level: 4,
    permissions: [
      'لون مخصص وبارز في الشات وقائمة الأعضاء',
      'أيقونة شرفية VIP بجانب الاسم',
      'مشاركة الشاشة بدقة كاملة في الرومات الصوتية',
      'تفاعل مباشر ومتميز مع بوت السيرفر',
    ],
  },
  bot: {
    id: 'bot',
    name: 'بوت معتمد',
    badgeLabel: 'BOT 🤖',
    description: 'مساعد ذكي آلي - تنفيذ الأوامر السريعة والرد على استفسارات الأعضاء.',
    color: '#6366f1', // Indigo / Discord Blurple
    bgClass: 'bg-indigo-500/20',
    borderClass: 'border-indigo-500/40',
    textClass: 'text-indigo-300',
    icon: 'Bot',
    level: 5,
    permissions: [
      'الرد الذكي التلقائي على أوامر /bot',
      'تنفيذ العمليات الآلية في السيرفر',
      'إرسال التنبيهات ورسائل الترحيب',
    ],
  },
  member: {
    id: 'member',
    name: 'عضو',
    badgeLabel: 'عضو 👤',
    description: 'عضو في مجتمع السيرفر - الصلاحيات الأساسية للتواصل والتفاعل والمشاركة.',
    color: '#94a3b8', // Slate Gray
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/20',
    textClass: 'text-slate-300',
    icon: 'User',
    level: 6,
    permissions: [
      'المحادثة والكتابة في القنوات النصية',
      'الانضمام والتحدث في الرومات الصوتية',
      'مشاركة الشاشة مع الأصدقاء',
      'إضافة تفاعلات الإيموجي والرد على الرسائل',
    ],
  },
};

export const ROLE_HIERARCHY: UserRole[] = ['owner', 'admin', 'mod', 'vip', 'bot', 'member'];

/**
 * Returns role definition or fallback to member
 */
export function getRoleInfo(role?: UserRole | string): RoleInfo {
  if (role && role in ROLE_DEFINITIONS) {
    return ROLE_DEFINITIONS[role as UserRole];
  }
  return ROLE_DEFINITIONS.member;
}

/**
 * Check if a user can manage roles (Owner or Admin)
 */
export function canManageRoles(user: User): boolean {
  return user.role === 'owner' || user.role === 'admin' || user.id === 'user-mod';
}

/**
 * Check if viewer can change target user's role
 */
export function canAssignRole(
  currentUser: User,
  targetUser: User,
  newRole: UserRole
): boolean {
  if (currentUser.id === targetUser.id && currentUser.role === 'owner') {
    return false; // Owner cannot demote self
  }

  // Owner can assign any role
  if (currentUser.role === 'owner' || currentUser.id === 'user-mod') {
    return newRole !== 'owner'; // cannot create a second owner via dropdown
  }

  // Admin can assign Mod, VIP, or Member to users below them
  if (currentUser.role === 'admin') {
    if (targetUser.role === 'owner' || targetUser.role === 'admin') {
      return false; // Admin cannot modify owner or other admins
    }
    return ['mod', 'vip', 'member'].includes(newRole);
  }

  return false;
}
