import React, { useState, useRef, useEffect } from 'react';
import { Channel, Message, Server, User } from '../types';
import { MessageItem } from './MessageItem';
import { EmojiPicker } from './EmojiPicker';
import {
  Hash,
  Search,
  Pin,
  Users,
  UserPlus,
  Check,
  PlusCircle,
  Smile,
  Send,
  X,
  Sparkles,
  Command,
  HelpCircle,
  Trash2,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';
import { compressImageFile } from '../utils/imageCompressor';

interface ChatAreaProps {
  channel: Channel;
  server?: Server;
  messages: Message[];
  users: User[];
  currentUser: User;
  theme?: 'dark' | 'midnight' | 'light';
  onToggleTheme?: () => void;
  typingUsers?: string[];
  onSendMessage: (content: string, replyTo?: Message, attachments?: { id: string; name: string; url: string; type: 'image' | 'file' }[]) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onOpenProfile: (user: User) => void;
  onToggleMembers: () => void;
  showMembers: boolean;
  onTyping?: () => void;
  onOpenEditChannel?: (channel: Channel) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  channel,
  server,
  messages,
  users,
  currentUser,
  theme = 'dark',
  onToggleTheme,
  typingUsers = [],
  onSendMessage,
  onReact,
  onDeleteMessage,
  onPinMessage,
  onOpenProfile,
  onToggleMembers,
  showMembers,
  onTyping,
  onOpenEditChannel,
}) => {
  const isLight = theme === 'light';
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPinsModal, setShowPinsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string; type: 'image' | 'file' }[]>([]);
  const [showCommandList, setShowCommandList] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isOwner = currentUser.role === 'owner' || (server && server.ownerId === currentUser.id);
  const canManageChannels =
    currentUser.role === 'owner' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'mod' ||
    currentUser.id === 'user-mod' ||
    (server && server.ownerId === currentUser.id);

  // Filter messages for current channel
  const channelMessages = messages.filter((m) => m.channelId === channel.id);

  // Filter with search if active
  const filteredMessages = searchQuery.trim()
    ? channelMessages.filter(
        (m) =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          users.find((u) => u.id === m.authorId)?.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : channelMessages;

  const pinnedMessages = channelMessages.filter((m) => m.isPinned);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed && attachments.length === 0) return;

    // Check for slash commands
    if (trimmed.startsWith('/')) {
      handleSlashCommand(trimmed);
      setInputText('');
      setReplyingTo(null);
      setAttachments([]);
      return;
    }

    onSendMessage(trimmed, replyingTo || undefined, attachments.length > 0 ? attachments : undefined);
    soundEffects.playMessageSent();

    setInputText('');
    setReplyingTo(null);
    setAttachments([]);
    setShowCommandList(false);
  };

  const handleSlashCommand = (cmdText: string) => {
    const parts = cmdText.split(' ');
    const cmd = parts[0].toLowerCase();

    if (cmd === '/shrug') {
      onSendMessage('¯\\_(ツ)_/¯');
    } else if (cmd === '/roll') {
      const rollNum = Math.floor(Math.random() * 100) + 1;
      onSendMessage(`🎲 رمى **${currentUser.displayName}** النرد وحصل على الرقم: **${rollNum}** (من 100)`);
    } else if (cmd === '/ping') {
      onSendMessage(`🏓 بونغ! سرعة الاستجابة لخادم MODcord - مودكورد: **${Math.floor(Math.random() * 12) + 14}ms** ⚡`);
    } else if (cmd === '/clear') {
      channelMessages.forEach((m) => onDeleteMessage(m.id));
    } else {
      // General command help
      onSendMessage(
        `⚙️ **أوامر MODcord - مودكورد المتاحة:**\n• \`/roll\` - رمي نرد عشوائي بين الأصدقاء\n• \`/ping\` - فحص سرعة الاستجابة\n• \`/shrug\` - إرسال رمز ¯\\_(ツ)_/¯\n• \`/clear\` - مسح الرسائل`
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isImage = file.type.startsWith('image/');

    try {
      let resultUrl = '';
      if (isImage) {
        // Compress chat images to reasonable size (max 900x900, 0.78 quality)
        resultUrl = await compressImageFile(file, { maxWidth: 900, maxHeight: 900, quality: 0.78 });
      } else {
        const reader = new FileReader();
        resultUrl = await new Promise((resolve) => {
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      setAttachments((prev) => [
        ...prev,
        {
          id: `att-${Date.now()}`,
          name: file.name,
          url: resultUrl,
          type: isImage ? 'image' : 'file',
          size: `${Math.round(file.size / 1024)} KB`,
        },
      ]);
    } catch (err) {
      console.warn('File attachment error:', err);
    }

    e.target.value = '';
  };

  return (
    <div
      id="chat-area-container"
      className={`flex-1 flex flex-col h-full min-w-0 relative transition-colors duration-200 ${
        isLight ? 'bg-white' : 'bg-[#0e0f13]'
      }`}
    >
      {/* Channel Header Bar with Clean Minimal Discord Styling */}
      <div
        id="channel-header-bar"
        className={`h-13 border-b px-4 flex items-center justify-between z-10 select-none transition-colors duration-200 ${
          isLight
            ? 'bg-white/95 backdrop-blur-md border-[#e3e5e8]'
            : 'bg-[#121317]/90 backdrop-blur-md border-white/[0.05]'
        }`}
      >
        {/* Left Side: Channel Name & Topic */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isLight
              ? 'bg-indigo-50 text-indigo-600'
              : 'bg-white/[0.05] text-indigo-400'
          }`}>
            <Hash className="w-4 h-4" />
          </div>

          <span className={`font-bold text-sm sm:text-base tracking-normal truncate ${
            isLight ? 'text-gray-900' : 'text-white'
          }`}>
            {channel.name}
          </span>

          {canManageChannels && onOpenEditChannel && (
            <button
              onClick={() => onOpenEditChannel(channel)}
              title="تعديل اسم القناة وإدارتها"
              className={`w-6 h-6 rounded-md flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                isLight ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {channel.topic && (
            <>
              <div className={`w-px h-4 mx-1.5 hidden lg:block ${isLight ? 'bg-gray-300' : 'bg-white/10'}`} />
              <span className={`text-xs truncate max-w-xs xl:max-w-md hidden lg:block ${
                isLight ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {channel.topic}
              </span>
            </>
          )}
        </div>

        {/* Right Side: Clean, Calm & Balanced Action Icons */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Quick Invite Icon Button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopiedInvite(true);
              soundEffects.playJoin();
              setTimeout(() => setCopiedInvite(false), 2000);
            }}
            title={copiedInvite ? '✓ تم نسخ الرابط! 🎉' : 'نسخ رابط دعوة الأصدقاء'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              copiedInvite
                ? 'text-emerald-400 bg-emerald-500/15'
                : isLight
                ? 'text-gray-500 hover:text-indigo-600 hover:bg-black/[0.04]'
                : 'text-gray-400 hover:text-indigo-400 hover:bg-white/[0.06]'
            }`}
          >
            {copiedInvite ? (
              <Check className="w-4 h-4 text-emerald-400 animate-in zoom-in-50 duration-150" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </button>

          {/* Compact Discord-Style Search */}
          <div className="relative hidden sm:flex items-center">
            <div className="relative w-28 md:w-36 focus-within:w-52 transition-all duration-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث..."
                className={`w-full text-xs py-1.5 pl-7 pr-2.5 rounded-lg border focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-gray-100 text-gray-800 border-gray-200 focus:border-indigo-400 focus:bg-white'
                    : 'bg-white/[0.04] text-gray-200 border-white/[0.06] focus:border-indigo-500/60 focus:bg-white/[0.07]'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className={`w-px h-4 mx-0.5 hidden sm:block ${isLight ? 'bg-gray-200' : 'bg-white/[0.06]'}`} />

          {/* Pinned Messages Button */}
          <button
            onClick={() => setShowPinsModal(!showPinsModal)}
            title={`الرسائل المثبتة${pinnedMessages.length > 0 ? ` (${pinnedMessages.length})` : ''}`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center relative transition-colors cursor-pointer ${
              showPinsModal || pinnedMessages.length > 0
                ? isLight
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-amber-400 bg-amber-400/10'
                : isLight
                ? 'text-gray-500 hover:text-gray-800 hover:bg-black/[0.04]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]'
            }`}
          >
            <Pin className="w-4 h-4" />
            {pinnedMessages.length > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ${
                isLight ? 'ring-white' : 'ring-[#121317]'
              }`} />
            )}
          </button>

          {/* Theme Toggle Button (Icon Only - Clean & Quiet) */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'light' ? 'التبديل إلى المود الداكن 🌙' : 'التبديل إلى المود الفاتح ☀️'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isLight
                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                  : 'text-gray-400 hover:text-amber-300 hover:bg-white/[0.06]'
              }`}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-indigo-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}

          {/* Toggle Members Sidebar */}
          <button
            onClick={onToggleMembers}
            title={showMembers ? 'إخفاء قائمة الأعضاء' : 'إظهار قائمة الأعضاء'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              showMembers
                ? isLight
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-indigo-400 bg-indigo-500/15'
                : isLight
                ? 'text-gray-500 hover:text-gray-800 hover:bg-black/[0.04]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]'
            }`}
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Messages Modal / Dropdown */}
      {showPinsModal && (
        <div
          id="pinned-messages-popover"
          className="absolute top-15 left-4 z-40 w-80 sm:w-96 glass-dropdown rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[420px] animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="p-3.5 bg-black/40 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
              <Pin className="w-4 h-4" />
              <span>الرسائل المثبتة في #{channel.name}</span>
            </div>
            <button
              onClick={() => setShowPinsModal(false)}
              className="text-gray-400 hover:text-white text-xs p-1 rounded hover:bg-white/10 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-3 overflow-y-auto space-y-2.5">
            {pinnedMessages.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">لا توجد رسائل مثبتة في هذه القناة</div>
            ) : (
              pinnedMessages.map((msg) => {
                const author =
                  msg.authorId === currentUser.id
                    ? currentUser
                    : users.find((u) => u.id === msg.authorId) || currentUser;
                return (
                  <div key={msg.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-bold text-gray-200">{author.displayName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <div className="mt-2.5 flex justify-end">
                      <button
                        onClick={() => onPinMessage(msg.id)}
                        className="text-[11px] text-red-400 hover:text-red-300 transition flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        إلغاء التثبيت
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Main Messages List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-2">
        {/* Welcome Channel Header */}
        <div className={`px-4 py-8 mb-4 border-b ${isLight ? 'border-gray-200' : 'border-white/[0.05]'}`}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Hash className="w-8 h-8" />
          </div>
          <h2 className={`text-xl sm:text-2xl font-black mb-2 tracking-tight ${
            isLight ? 'text-gray-900' : 'text-white'
          }`}>
            مرحباً بك في بداية #{channel.name}!
          </h2>
          <p className={`text-xs sm:text-sm leading-relaxed max-w-xl ${
            isLight ? 'text-gray-600' : 'text-gray-400'
          }`}>
            هذه هي بداية قناة #{channel.name} في خادم {server?.name || 'MODcord - مودكورد'}. شارك أفكارك، نقاشاتك، وتواصل بكل حرية!
          </p>
        </div>

        {/* Messages */}
        {filteredMessages.map((msg) => {
          const author =
            msg.authorId === currentUser.id
              ? currentUser
              : users.find((u) => u.id === msg.authorId) || currentUser;
          return (
            <MessageItem
              key={msg.id}
              message={msg}
              author={author}
              currentUserId={currentUser.id}
              isOwner={Boolean(isOwner)}
              theme={theme}
              onReact={onReact}
              onReply={(m) => setReplyingTo(m)}
              onDelete={onDeleteMessage}
              onPin={onPinMessage}
              onOpenProfile={onOpenProfile}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Banner if replying */}
      {replyingTo && (
        <div className={`mx-4 px-3.5 py-2 rounded-t-xl border-t border-x flex items-center justify-between text-xs shadow-lg ${
          isLight
            ? 'bg-indigo-50 border-indigo-200 text-gray-800'
            : 'bg-[#171920] border-indigo-500/30 text-gray-300'
        }`}>
          <div className="flex items-center gap-2 truncate">
            <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>الرد على</span>
            <span className="font-bold text-indigo-500">
              @{users.find((u) => u.id === replyingTo.authorId)?.displayName || 'مستخدم'}
            </span>
            <span className={`truncate max-w-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{replyingTo.content}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className={`p-1 rounded cursor-pointer ${
              isLight ? 'text-gray-500 hover:text-black hover:bg-black/5' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments Preview before sending */}
      {attachments.length > 0 && (
        <div className={`mx-4 p-2.5 border-x flex gap-2.5 overflow-x-auto ${
          isLight ? 'bg-gray-100 border-gray-200' : 'bg-[#171920] border-white/[0.08]'
        }`}>
          {attachments.map((att) => (
            <div key={att.id} className={`relative rounded-xl overflow-hidden border ${
              isLight ? 'bg-white border-gray-200' : 'bg-[#121317] border-white/10'
            }`}>
              {att.type === 'image' ? (
                <img src={att.url} alt={att.name} className="h-16 w-16 object-cover" />
              ) : (
                <div className={`h-16 w-24 p-2 flex flex-col justify-center items-center text-[10px] ${
                  isLight ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  <span>📄 {att.name}</span>
                </div>
              )}
              <button
                onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-red-500 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Slash Commands Popup */}
      {showCommandList && (
        <div className={`mx-4 rounded-t-2xl p-2 text-xs space-y-1 z-30 animate-in fade-in zoom-in-95 ${
          isLight ? 'bg-white border border-gray-200 shadow-xl' : 'glass-dropdown'
        }`}>
          <div className={`font-bold px-2 py-1 flex items-center gap-1.5 border-b ${
            isLight ? 'text-gray-600 border-gray-200' : 'text-gray-400 border-white/[0.06]'
          }`}>
            <Command className="w-3.5 h-3.5 text-indigo-500" />
            <span>الأوامر السريعة المتاحة في السيرفر:</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setInputText('/bot ');
              setShowCommandList(false);
              textareaRef.current?.focus();
            }}
            className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
              isLight ? 'hover:bg-indigo-50 text-gray-800' : 'hover:bg-indigo-600/20 hover:text-indigo-300 text-gray-200'
            }`}
          >
            <span className="font-mono text-indigo-500 font-bold">/bot [سؤال]</span>
            <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>سؤال بوت السيرفر الذكي</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText('/roll');
              setShowCommandList(false);
              textareaRef.current?.focus();
            }}
            className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
              isLight ? 'hover:bg-indigo-50 text-gray-800' : 'hover:bg-indigo-600/20 hover:text-indigo-300 text-gray-200'
            }`}
          >
            <span className="font-mono text-indigo-500 font-bold">/roll</span>
            <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>رمي نرد عشوائي مع الشباب</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText('/ping');
              setShowCommandList(false);
              textareaRef.current?.focus();
            }}
            className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
              isLight ? 'hover:bg-indigo-50 text-gray-800' : 'hover:bg-indigo-600/20 hover:text-indigo-300 text-gray-200'
            }`}
          >
            <span className="font-mono text-indigo-500 font-bold">/ping</span>
            <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>فحص سرعة استجابة الخادم</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText('/shrug');
              setShowCommandList(false);
              textareaRef.current?.focus();
            }}
            className={`w-full text-right px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
              isLight ? 'hover:bg-indigo-50 text-gray-800' : 'hover:bg-indigo-600/20 hover:text-indigo-300 text-gray-200'
            }`}
          >
            <span className="font-mono text-indigo-500 font-bold">/shrug</span>
            <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>¯\_(ツ)_/¯</span>
          </button>
        </div>
      )}

      {/* Input Box Footer */}
      <div className="p-4 pt-1">
        <div className={`relative rounded-2xl flex items-center px-3.5 py-2.5 border transition ${
          isLight
            ? 'bg-[#ebedef] border-[#dcdfe3] focus-within:border-indigo-500 shadow-sm'
            : 'glass-input border-white/[0.08] focus-within:border-indigo-500/80 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
        }`}>
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="إرفاق ملف أو صورة"
            className={`p-1.5 rounded-xl transition flex-shrink-0 cursor-pointer ${
              isLight ? 'text-gray-500 hover:text-gray-800 hover:bg-black/[0.05]' : 'text-gray-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,application/pdf"
          />

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => {
              const val = e.target.value;
              setInputText(val);
              onTyping?.();
              if (val.startsWith('/') && val.length === 1) {
                setShowCommandList(true);
              } else if (!val.startsWith('/')) {
                setShowCommandList(false);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={`أرسل رسالة في #${channel.name} (اكتب / للأوامر)...`}
            className={`flex-1 bg-transparent text-sm px-3 focus:outline-none resize-none max-h-32 leading-5 ${
              isLight ? 'text-gray-900 placeholder-gray-500' : 'text-[#dbdee1] placeholder-gray-500'
            }`}
          />

          {/* Emoji Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="إيموجي"
              className={`p-1.5 rounded-xl transition flex-shrink-0 cursor-pointer ${
                isLight ? 'text-gray-500 hover:text-amber-500 hover:bg-black/[0.05]' : 'text-gray-400 hover:text-amber-400 hover:bg-white/[0.08]'
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <EmojiPicker
                onSelect={(emoji) => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                  textareaRef.current?.focus();
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() && attachments.length === 0}
            title="إرسال"
            className="mr-2 p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 disabled:opacity-30 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl transition flex-shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:shadow-[0_0_18px_rgba(99,102,241,0.6)]"
          >
            <Send className="w-4 h-4 transform rotate-180" />
          </button>
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="text-[11px] text-indigo-400 font-bold flex items-center gap-1.5 px-2 pt-1.5 animate-pulse">
            <span>✍️</span>
            <span>{typingUsers.join(' و ')} يكتب الآن...</span>
          </div>
        )}

        {/* Small tips footer */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-2 mt-1.5">
          <span>
            اضغط <strong className={isLight ? 'text-gray-700' : 'text-gray-400'}>Enter</strong> للإرسال، و <strong className={isLight ? 'text-gray-700' : 'text-gray-400'}>Shift + Enter</strong> لسطر جديد.
          </span>
          <span className="hidden sm:inline">
            جرّب كتابة <code className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
              isLight ? 'bg-black/[0.06] text-indigo-600' : 'bg-white/[0.06] text-indigo-300'
            }`}>/roll</code> أو <code className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
              isLight ? 'bg-black/[0.06] text-indigo-600' : 'bg-white/[0.06] text-indigo-300'
            }`}>/ping</code>
          </span>
        </div>
      </div>
    </div>
  );
};
