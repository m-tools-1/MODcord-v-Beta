import React, { useState } from 'react';
import { Category, Channel, ChannelType } from '../types';
import { X, Hash, Volume2, Trash2, Settings, ShieldCheck } from 'lucide-react';

interface EditChannelModalProps {
  channel: Channel;
  categories: Category[];
  onUpdateChannel: (
    channelId: string,
    updates: { name: string; topic?: string; categoryId?: string; type?: ChannelType }
  ) => void;
  onDeleteChannel: (channelId: string) => void;
  onClose: () => void;
}

export const EditChannelModal: React.FC<EditChannelModalProps> = ({
  channel,
  categories,
  onUpdateChannel,
  onDeleteChannel,
  onClose,
}) => {
  const [name, setName] = useState(channel.name);
  const [topic, setTopic] = useState(channel.topic || '');
  const [categoryId, setCategoryId] = useState<string>(channel.categoryId || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isVoice = channel.type === 'voice';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, '-').toLowerCase();
    if (!cleanName) return;

    onUpdateChannel(channel.id, {
      name: cleanName,
      topic: topic.trim(),
      categoryId: categoryId || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDeleteChannel(channel.id);
    onClose();
  };

  return (
    <div
      id="edit-channel-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div className="bg-[#121318] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>إدارة وتعديل الروم</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> صلاحيات المشرف
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                {isVoice ? '🔊 قناة صوتية' : '# قناة نصية'}: {channel.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Channel Name */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              اسم الروم / القناة
            </label>
            <div className="relative flex items-center">
              <span className="absolute right-3 text-gray-400">
                {isVoice ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Hash className="w-4 h-4 text-indigo-400" />
                )}
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم-الروم-الجديد"
                className="w-full bg-[#181920] text-sm text-white pr-9 pl-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition font-medium"
              />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">
              سيتم استبدال المسافات بشرطات تلقائياً.
            </span>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              القسم التابع له (Category)
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#181920] text-sm text-white px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="">بدون قسم (في البداية)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  📁 {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Topic */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              وصف وموضوع القناة
            </label>
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="عن ماذا يتحدث هذا الروم؟"
              className="w-full bg-[#181920] text-sm text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Danger Zone: Delete */}
          <div className="pt-3 border-t border-white/[0.08]">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف هذا الروم نهائياً</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {confirmDelete
                    ? 'هل أنت متأكد؟ انقر مرة أخرى لتأكيد الحذف الفوري!'
                    : 'سيتم حذف القناة وجميع رسائلها من السيرفر'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDelete}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1 ${
                  confirmDelete
                    ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
              >
                <span>{confirmDelete ? 'نعم، احذف الروم!' : 'حذف الروم'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
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
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
