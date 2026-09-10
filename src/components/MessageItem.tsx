import React, { useState } from 'react';
import { Message, User } from '../types';
import { Pin, Reply, Smile, Trash2, Check, Copy } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { RoleBadge } from './RoleBadge';
import { getRoleInfo } from '../utils/roles';

interface MessageItemProps {
  message: Message;
  author: User;
  currentUserId: string;
  isOwner: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onOpenProfile: (user: User) => void;
  theme?: 'dark' | 'midnight' | 'light';
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  author,
  currentUserId,
  isOwner,
  onReact,
  onReply,
  onDelete,
  onPin,
  onOpenProfile,
  theme = 'dark',
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const isLight = theme === 'light';

  const isAuthor = message.authorId === currentUserId;
  const canDelete = isAuthor || isOwner;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Render markdown-like formatting (code blocks, bold, mentions)
  const renderFormattedContent = (content: string) => {
    // Check for code blocks ```code```
    if (content.includes('```')) {
      const parts = content.split(/(```[\s\S]*?```)/g);
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const rawCode = part.slice(3, -3);
          const firstLineBreak = rawCode.indexOf('\n');
          const codeText = firstLineBreak !== -1 ? rawCode.slice(firstLineBreak + 1) : rawCode;
          const language = firstLineBreak !== -1 ? rawCode.slice(0, firstLineBreak).trim() : '';

          return (
            <div key={index} className={`my-2 rounded-lg border overflow-hidden text-left ${
              isLight ? 'bg-[#f2f3f5] border-[#dcdfe3]' : 'bg-[#1e1f22] border-[#2b2d31]'
            }`} dir="ltr">
              <div className={`flex items-center justify-between px-3 py-1.5 text-xs font-mono ${
                isLight ? 'bg-[#e3e5e8] text-gray-700' : 'bg-[#18191c] text-gray-400'
              }`}>
                <span>{language || 'code'}</span>
                <button
                  onClick={() => handleCopyCode(codeText.trim())}
                  className={`flex items-center gap-1 transition ${
                    isLight ? 'hover:text-black' : 'hover:text-white'
                  }`}
                >
                  {copiedCode === codeText.trim() ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-600 text-[11px]">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">نسخ الكود</span>
                    </>
                  )}
                </button>
              </div>
              <pre className={`p-3 text-sm font-mono overflow-x-auto whitespace-pre ${
                isLight ? 'text-gray-800' : 'text-[#dbdee1]'
              }`}>
                <code>{codeText.trim()}</code>
              </pre>
            </div>
          );
        }
        return <span key={index}>{renderInlineStyles(part)}</span>;
      });
    }

    return renderInlineStyles(content);
  };

  const renderInlineStyles = (text: string) => {
    // Split by inline code `code`
    const codeParts = text.split(/(`[^`]+`)/g);
    return codeParts.map((codePart, i) => {
      if (codePart.startsWith('`') && codePart.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-[#1e1f22] text-[#f23f43] font-mono text-xs mx-0.5">
            {codePart.slice(1, -1)}
          </code>
        );
      }

      // Check for bold **text**
      const boldParts = codePart.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((boldPart, j) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          return (
            <strong key={j} className="font-bold text-white">
              {boldPart.slice(2, -2)}
            </strong>
          );
        }

        // Check for mentions @name
        const mentionParts = boldPart.split(/(@\S+)/g);
        return mentionParts.map((mentionPart, k) => {
          if (mentionPart.startsWith('@')) {
            return (
              <span
                key={k}
                className="bg-[#5865f2]/20 text-[#5865f2] px-1 py-0.5 rounded font-medium cursor-pointer hover:underline"
              >
                {mentionPart}
              </span>
            );
          }
          return mentionPart;
        });
      });
    });
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`relative group px-4 py-2.5 rounded-xl mx-1 transition-all duration-150 flex gap-3.5 items-start ${
        isLight ? 'hover:bg-black/[0.03]' : 'hover:bg-white/[0.025]'
      } ${
        message.isPinned
          ? isLight
            ? 'bg-amber-500/10 border-r-2 border-amber-500'
            : 'bg-indigo-500/[0.06] border-r-2 border-indigo-500'
          : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Reply Banner */}
      {message.replyTo && (
        <div className="absolute -top-3.5 right-12 flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-5 h-2.5 border-t border-r border-indigo-500/40 rounded-tr" />
          <span className="font-semibold text-indigo-400">رد على @{message.replyTo.authorName}:</span>
          <span className={`truncate max-w-[260px] italic ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            {message.replyTo.content}
          </span>
        </div>
      )}

      {/* Floating Glass Action Menu */}
      {showActions && (
        <div
          id={`message-actions-${message.id}`}
          className={`absolute -top-3.5 left-4 z-20 flex items-center rounded-xl shadow-xl overflow-visible px-1.5 py-1 animate-in fade-in zoom-in-95 duration-100 ${
            isLight
              ? 'bg-white border border-gray-200 text-gray-700 shadow-gray-300/50'
              : 'glass-dropdown border border-white/10'
          }`}
        >
          {/* Quick Reaction Emojis */}
          <button
            onClick={() => onReact(message.id, '👍')}
            title="إعجاب"
            className="p-1 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition text-sm cursor-pointer"
          >
            👍
          </button>
          <button
            onClick={() => onReact(message.id, '❤️')}
            title="قلب"
            className="p-1 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition text-sm cursor-pointer"
          >
            ❤️
          </button>
          <button
            onClick={() => onReact(message.id, '🔥')}
            title="نار"
            className="p-1 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition text-sm cursor-pointer"
          >
            🔥
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Emoji Picker toggle */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="إضافة تفاعل"
              className="p-1 hover:bg-white/10 text-gray-300 hover:text-amber-400 rounded-lg transition cursor-pointer"
            >
              <Smile className="w-4 h-4" />
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={(emoji) => {
                  onReact(message.id, emoji);
                  setShowEmojiPicker(false);
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          {/* Reply */}
          <button
            onClick={() => onReply(message)}
            title="رد"
            className="p-1 hover:bg-white/10 text-gray-300 hover:text-indigo-400 rounded-lg transition cursor-pointer"
          >
            <Reply className="w-4 h-4" />
          </button>

          {/* Pin */}
          <button
            onClick={() => onPin(message.id)}
            title={message.isPinned ? 'إلغاء التثبيت' : 'تثبيت الرسالة'}
            className={`p-1 hover:bg-white/10 rounded-lg transition cursor-pointer ${
              message.isPinned ? 'text-amber-400' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Delete */}
          {canDelete && (
            <button
              onClick={() => onDelete(message.id)}
              title="حذف الرسالة"
              className="p-1 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Author Avatar */}
      <button
        onClick={() => onOpenProfile(author)}
        className="relative flex-shrink-0 cursor-pointer group/avatar mt-0.5"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md transition transform group-hover/avatar:scale-105"
          style={{ backgroundColor: author.color || '#5865f2' }}
        >
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.displayName}
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            author.displayName.slice(0, 2)
          )}
        </div>
        {/* Status Dot */}
        <span
          className={`absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full border-2 ${
            isLight ? 'border-white' : 'border-[#0e0f13]'
          } ${
            author.status === 'online'
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
              : author.status === 'idle'
              ? 'bg-amber-400'
              : author.status === 'dnd'
              ? 'bg-red-500'
              : 'bg-gray-500'
          }`}
        />
      </button>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <button
            onClick={() => onOpenProfile(author)}
            className="font-extrabold text-sm hover:underline cursor-pointer tracking-wide"
            style={{ color: author.roleColor || getRoleInfo(author.role).color }}
          >
            {author.displayName}
          </button>

          {/* Role Badge */}
          {author.role && author.role !== 'member' && (
            <RoleBadge
              role={author.role}
              size="xs"
              showPermissionsModal={true}
            />
          )}

          {/* Timestamp */}
          <span className={`text-[11px] font-mono font-normal ${
            isLight ? 'text-gray-600' : 'text-gray-500'
          }`}>
            {message.timestamp}
          </span>

          {message.isPinned && (
            <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-500 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-bold">
              <Pin className="w-2.5 h-2.5" /> مثبّتة
            </span>
          )}
        </div>

        {/* Text Content */}
        <div className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${
          isLight ? 'text-[#2e3338]' : 'text-[#dbdee1]'
        }`}>
          {renderFormattedContent(message.content)}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className={`max-w-md rounded-xl overflow-hidden border shadow-sm ${
                  isLight ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-[#121317]'
                }`}
              >
                {att.type === 'image' ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="max-h-72 w-auto object-cover rounded-xl hover:opacity-95 transition cursor-pointer"
                    onClick={() => window.open(att.url, '_blank')}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-3.5 flex items-center gap-2.5 text-xs text-gray-300">
                    <span>📎</span>
                    <a href={att.url} download={att.name} className="underline text-indigo-400 hover:text-indigo-300 font-semibold">
                      {att.name}
                    </a>
                    {att.size && <span className="text-gray-500 font-mono">({att.size})</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.reactions.map((react, i) => {
              const hasReacted = react.users.includes(currentUserId);
              return (
                <button
                  key={i}
                  onClick={() => onReact(message.id, react.emoji)}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border transition duration-150 cursor-pointer ${
                    hasReacted
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                      : 'bg-white/[0.04] border-white/[0.08] text-gray-300 hover:bg-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <span>{react.emoji}</span>
                  <span className="font-bold text-[11px] font-mono">{react.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
