import React, { useState } from 'react';
import { User } from '../types';
import { Sparkles } from 'lucide-react';

interface JoinModalProps {
  onJoin: (user: User) => void;
}

const AVATAR_COLORS = [
  '#5865f2',
  '#23a55a',
  '#f0b232',
  '#f23f43',
  '#eb459e',
  '#00a8fc',
  '#8b5cf6',
  '#10b981',
];

export const JoinModal: React.FC<JoinModalProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const randomDisc = Math.floor(1000 + Math.random() * 9000).toString();
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName.toLowerCase().replace(/\s+/g, '_'),
      displayName: cleanName,
      discriminator: randomDisc,
      avatar: '',
      status: 'online',
      customStatus: 'عضو جديد في MODcord - مودكورد 🚀',
      role: 'member',
      roleTitle: 'عضو السيرفر',
      roleColor: '#38bdf8',
      bio: `صديق في سيرفر MODcord - مودكورد`,
      color: color,
      joinedAt: 'اليوم',
    };

    onJoin(newUser);
  };

  return (
    <div
      id="join-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#313338] border border-[#2b2d31] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-[#5865f2] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white font-extrabold text-2xl">
          M
        </div>

        <h2 className="text-xl font-black text-white mb-1.5 flex items-center justify-center gap-2">
          <span>مرحباً بك في MODcord - مودكورد</span>
          <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>

        <p className="text-xs text-gray-300 mb-6 leading-relaxed">
          سيرفر التواصل الحقيقي المباشر بين الأصدقاء. أدخل اسمك للدخول إلى القنوات النصية والصوتية فوراً!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              اسمك المستعار أو اسم الشهرة
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: خالد، أبو فهد، عمر..."
              className="w-full bg-[#1e1f22] text-sm text-white px-3.5 py-2.5 rounded-xl border border-[#3f4147] focus:outline-none focus:border-[#5865f2] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">
              اختر لون الأفاتار الخاص بك
            </label>
            <div className="flex justify-center gap-2.5">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition transform hover:scale-110 border-2 ${
                    color === c ? 'border-white scale-110 ring-2 ring-[#5865f2]' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-40 text-white font-bold text-sm rounded-xl transition shadow-lg mt-2"
          >
            دخول السيرفر والبدء بالدردشة 🚀
          </button>
        </form>
      </div>
    </div>
  );
};
