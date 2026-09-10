import React from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'تعبيرات شائعة',
    emojis: ['👍', '❤️', '🔥', '😂', '🎉', '🚀', '💯', '✨', '👏', '😍', '😎', '🙌'],
  },
  {
    name: 'وجوه',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '🙂', '😉', '😊', '😇', '🥰', '🤩', '😘', '😋', '😜', '🤪', '🤫', '🤔', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥'],
  },
  {
    name: 'تفاعل وديسكورد',
    emojis: ['👑', '🛡️', '🤖', '🎮', '💻', '💡', '📌', '🔔', '💬', '🎙️', '🎧', '⚡', '☕', '🌟', '🎯', '🏆', '💎', '🎨', '📝', '🔒', '🔑', '🏷️', '📢', '🔊'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  return (
    <div
      id="emoji-picker-popover"
      className="absolute bottom-14 left-4 z-50 w-72 sm:w-80 bg-[#2b2d31] border border-[#1f2023] rounded-xl shadow-2xl overflow-hidden text-right flex flex-col max-h-80"
    >
      <div className="p-3 bg-[#1e1f22] border-b border-[#1f2023] flex items-center justify-between">
        <span className="text-xs font-bold text-gray-300">اختر إيموجي (Emoji)</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-[#313338] transition"
        >
          ✕
        </button>
      </div>

      <div className="p-3 overflow-y-auto space-y-4">
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <div key={idx}>
            <div className="text-[11px] font-semibold text-gray-400 mb-1.5">{cat.name}</div>
            <div className="grid grid-cols-7 gap-1">
              {cat.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSelect(emoji);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-xl hover:bg-[#35373c] rounded-lg transition-transform hover:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
