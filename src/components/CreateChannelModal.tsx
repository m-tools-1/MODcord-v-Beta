import React, { useState } from 'react';
import { Category, ChannelType } from '../types';
import { X, Hash, Volume2 } from 'lucide-react';

interface CreateChannelModalProps {
  categories: Category[];
  defaultCategoryId?: string;
  defaultType?: ChannelType;
  onCreateChannel: (name: string, type: ChannelType, topic: string, categoryId?: string) => void;
  onClose: () => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  categories,
  defaultCategoryId,
  defaultType = 'text',
  onCreateChannel,
  onClose,
}) => {
  const [channelType, setChannelType] = useState<ChannelType>(defaultType);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [categoryId, setCategoryId] = useState<string>(defaultCategoryId || (categories[0]?.id ?? ''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, '-').toLowerCase();
    if (!cleanName) return;

    onCreateChannel(cleanName, channelType, topic.trim(), categoryId || undefined);
    onClose();
  };

  return (
    <div
      id="create-channel-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div className="bg-[#121318] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>إنشاء قناة / روم جديد</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                👑 إدارة المشرف
              </span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              قم بإنشاء روم نصي أو صوتي للأعضاء في السيرفر
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Channel Type */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">نوع القناة / الروم</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setChannelType('text')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition text-right cursor-pointer ${
                  channelType === 'text'
                    ? 'bg-indigo-500/15 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] text-white'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-gray-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${channelType === 'text' ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">قناة نصية</div>
                  <div className="text-[10px] text-gray-400">شات، صور، وملفات</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setChannelType('voice')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition text-right cursor-pointer ${
                  channelType === 'voice'
                    ? 'bg-emerald-500/15 border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.2)] text-white'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-gray-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${channelType === 'voice' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">روم صوتي</div>
                  <div className="text-[10px] text-gray-400">صوت وبث شاشة</div>
                </div>
              </button>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">اسم القناة</label>
            <div className="relative flex items-center">
              <span className="absolute right-3 text-gray-400">
                {channelType === 'text' ? (
                  <Hash className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={channelType === 'text' ? 'سوالف-عامة' : 'روم-السوالف-الصوتية'}
                className="w-full bg-[#181920] text-sm text-white pr-9 pl-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">القسم (Category)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#181920] text-sm text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    📁 {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Topic */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">وصف القناة (اختياري)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="عن ماذا تدور هذه القناة؟"
              className="w-full bg-[#181920] text-sm text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-xl transition shadow-[0_0_15px_rgba(99,102,241,0.35)] cursor-pointer"
            >
              إنشاء الروم الآن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
