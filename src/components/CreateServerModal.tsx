import React, { useState } from 'react';
import { Server } from '../types';
import { X, Sparkles } from 'lucide-react';

interface CreateServerModalProps {
  currentUserId: string;
  onCreateServer: (server: Server) => void;
  onClose: () => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({
  currentUserId,
  onCreateServer,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const serverId = `server-${Date.now()}`;
    const newServer: Server = {
      id: serverId,
      name: cleanName,
      icon: icon.trim() || cleanName.slice(0, 2).toUpperCase(),
      description: description.trim() || `خادم ${cleanName} على منصة MODcord - مودكورد`,
      ownerId: currentUserId,
      categories: [
        { id: `cat-text-${serverId}`, serverId, name: '💬 قنوات نصية' },
        { id: `cat-voice-${serverId}`, serverId, name: '🔊 غرف صوتية' },
      ],
      channels: [
        {
          id: `ch-gen-${serverId}`,
          serverId,
          name: 'الدردشة-العامة',
          type: 'text',
          topic: `المحادثة العامة لخادم ${cleanName}`,
          categoryId: `cat-text-${serverId}`,
        },
        {
          id: `ch-voice-${serverId}`,
          serverId,
          name: 'الغرفة الصوتية',
          type: 'voice',
          topic: 'تحدث صوتي ومشاركة الشاشة',
          categoryId: `cat-voice-${serverId}`,
        },
      ],
      memberIds: [currentUserId, 'user-bot'],
      roles: [
        {
          id: `role-admin-${serverId}`,
          name: 'المشرفين 🛡️',
          color: '#ef4444',
          position: 1,
          hoist: true,
          permissions: ['manage_server', 'manage_roles', 'manage_channels', 'kick_members', 'mute_members', 'move_members', 'send_messages'],
        },
        {
          id: `role-vip-${serverId}`,
          name: 'كبار الشخصيات VIP ✨',
          color: '#f59e0b',
          position: 2,
          hoist: true,
          permissions: ['send_messages'],
        },
        {
          id: `role-member-${serverId}`,
          name: 'الأعضاء النشطين 🚀',
          color: '#38bdf8',
          position: 3,
          hoist: true,
          permissions: ['send_messages'],
        },
      ],
      memberRoles: {},
    };

    onCreateServer(newServer);
    onClose();
  };

  return (
    <div
      id="create-server-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#313338] border border-[#1f2023] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base text-white">
            <Sparkles className="w-5 h-5 text-[#5865f2]" />
            <span>إنشاء خادمك الخاص</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#35373c]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-gray-300 leading-relaxed">
            خادمك هو المكان الذي تجتمع فيه أنت وأصدقاؤك. أنشئ خادمك وابدأ الدردشة فوراً!
          </p>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#5865f2] flex items-center justify-center text-xl font-bold text-white shadow-md flex-shrink-0">
              {icon.slice(0, 2) || (name.slice(0, 2) || 'خ')}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-300 mb-1">رمز الخادم</label>
              <input
                type="text"
                maxLength={4}
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="مثال: H"
                className="w-20 bg-[#1e1f22] text-sm text-center font-bold text-white px-2 py-1.5 rounded-lg border border-[#3f4147] focus:outline-none focus:border-[#5865f2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">اسم السيرفر</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: ديوانية الأصدقاء"
              className="w-full bg-[#1e1f22] text-sm text-white px-3 py-2 rounded-lg border border-[#3f4147] focus:outline-none focus:border-[#5865f2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">الوصف (اختياري)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="عن ماذا يدور هذا الخادم؟"
              className="w-full bg-[#1e1f22] text-sm text-white px-3 py-2 rounded-lg border border-[#3f4147] focus:outline-none focus:border-[#5865f2]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white rounded-lg hover:bg-[#35373c] transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-40 rounded-lg transition shadow-md"
            >
              إنشاء السيرفر
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
