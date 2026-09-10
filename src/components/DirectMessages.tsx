import React, { useState } from 'react';
import { DirectMessageChannel, Message, User, VoiceSessionState } from '../types';
import { MessageItem } from './MessageItem';
import { EmojiPicker } from './EmojiPicker';
import {
  Users,
  MessageSquare,
  Phone,
  Video,
  Send,
  PlusCircle,
  Smile,
  X,
  UserCheck,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface DirectMessagesProps {
  currentUser: User;
  users: User[];
  dms: DirectMessageChannel[];
  activeDmId: string | null;
  onSelectDm: (dmId: string | null) => void;
  messages: Message[];
  theme?: 'dark' | 'midnight' | 'light';
  onToggleTheme?: () => void;
  onSendMessage: (content: string, replyTo?: Message, attachments?: { id: string; name: string; url: string; type: 'image' | 'file' }[]) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onOpenProfile: (user: User) => void;
  onStartVoiceCall: (targetUser: User) => void;
  onStartNewDM: (user: User) => void;
}

export const DirectMessages: React.FC<DirectMessagesProps> = ({
  currentUser,
  users,
  dms,
  activeDmId,
  onSelectDm,
  messages,
  theme = 'dark',
  onToggleTheme,
  onSendMessage,
  onReact,
  onDeleteMessage,
  onPinMessage,
  onOpenProfile,
  onStartVoiceCall,
  onStartNewDM,
}) => {
  const isLight = theme === 'light';
  const [friendsTab, setFriendsTab] = useState<'online' | 'all' | 'add'>('online');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchFriend, setSearchFriend] = useState('');

  const activeDm = dms.find((d) => d.id === activeDmId);
  const targetUser = activeDm ? users.find((u) => u.id === activeDm.targetUserId) : null;

  const dmMessages = activeDm ? messages.filter((m) => m.channelId === activeDm.id) : [];

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    soundEffects.playMessageSent();
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Friends list
  const otherUsers = users.filter((u) => u.id !== currentUser.id);
  const onlineFriends = otherUsers.filter((u) => u.status !== 'offline');
  const filteredFriends = (friendsTab === 'online' ? onlineFriends : otherUsers).filter((u) =>
    u.displayName.toLowerCase().includes(searchFriend.toLowerCase())
  );

  return (
    <div
      id="direct-messages-container"
      className={`flex-1 flex h-full select-none overflow-hidden transition-colors duration-200 ${
        isLight ? 'bg-white text-gray-900' : 'bg-[#313338] text-gray-100'
      }`}
    >
      {/* DM Sidebar */}
      <div
        id="dm-sidebar"
        className={`w-60 border-l flex flex-col h-full flex-shrink-0 transition-colors duration-200 ${
          isLight ? 'bg-[#f2f3f5] border-[#e3e5e8]' : 'bg-[#2b2d31] border-[#1f2023]'
        }`}
      >
        <div className={`p-3 border-b ${isLight ? 'border-[#e3e5e8]' : 'border-[#1f2023]'}`}>
          <button
            onClick={() => onSelectDm(null)}
            className={`w-full px-3 py-2 rounded-md flex items-center gap-3 transition font-semibold text-xs text-right ${
              activeDmId === null
                ? isLight
                  ? 'bg-black/[0.08] text-gray-900'
                  : 'bg-[#35373c] text-white'
                : isLight
                ? 'text-gray-700 hover:bg-black/[0.04]'
                : 'text-gray-300 hover:bg-[#35373c]/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-[#5865f2]" />
            <span>قائمة الأصدقاء</span>
          </button>
        </div>

        {/* DM List Header */}
        <div className={`p-3 flex items-center justify-between text-[11px] font-bold ${
          isLight ? 'text-gray-600' : 'text-gray-400'
        }`}>
          <span className="uppercase tracking-wider">الرسائل المباشرة</span>
        </div>

        {/* DM Conversations */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
          {dms.map((dm) => {
            const user = users.find((u) => u.id === dm.targetUserId);
            if (!user) return null;
            const isSelected = activeDmId === dm.id;

            return (
              <button
                key={dm.id}
                onClick={() => onSelectDm(dm.id)}
                className={`w-full px-2 py-2 rounded-md flex items-center gap-2.5 transition text-right group ${
                  isSelected
                    ? isLight
                      ? 'bg-black/[0.08] text-gray-900 font-semibold'
                      : 'bg-[#35373c] text-white font-semibold'
                    : isLight
                    ? 'text-gray-700 hover:bg-black/[0.04]'
                    : 'text-gray-300 hover:bg-[#35373c]/60 hover:text-white'
                }`}
              >
                {/* Avatar with status */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: user.color || '#5865f2' }}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      user.displayName.slice(0, 2)
                    )}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border ${
                      isLight ? 'border-[#f2f3f5]' : 'border-[#2b2d31]'
                    } ${
                      user.status === 'online'
                        ? 'bg-[#23a55a]'
                        : user.status === 'idle'
                        ? 'bg-[#f0b232]'
                        : user.status === 'dnd'
                        ? 'bg-[#f23f43]'
                        : 'bg-[#80848e]'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate font-medium">{user.displayName}</div>
                  {user.customStatus && (
                    <div className={`text-[10px] truncate ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{user.customStatus}</div>
                  )}
                </div>

                {dm.unreadCount && dm.unreadCount > 0 ? (
                  <span className="bg-[#f23f43] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {dm.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Friends View OR DM Chat */}
      {activeDmId === null || !targetUser ? (
        /* Friends Dashboard */
        <div className={`flex-1 flex flex-col h-full transition-colors duration-200 ${
          isLight ? 'bg-white' : 'bg-[#313338]'
        }`}>
          {/* Header */}
          <div className={`h-12 border-b px-4 flex items-center gap-4 transition-colors duration-200 ${
            isLight ? 'bg-white border-[#e3e5e8]' : 'bg-[#313338] border-[#1f2023]'
          }`}>
            <div className={`flex items-center gap-2 font-bold text-sm ${
              isLight ? 'text-gray-900' : 'text-white'
            }`}>
              <Users className="w-5 h-5 text-gray-400" />
              <span>الأصدقاء</span>
            </div>
            <div className={`w-px h-4 ${isLight ? 'bg-gray-300' : 'bg-[#3f4147]'}`} />

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setFriendsTab('online')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  friendsTab === 'online'
                    ? isLight ? 'bg-gray-100 text-gray-900 font-bold' : 'bg-[#3f4147] text-white font-bold'
                    : isLight ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                متصل ({onlineFriends.length})
              </button>
              <button
                onClick={() => setFriendsTab('all')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  friendsTab === 'all'
                    ? isLight ? 'bg-gray-100 text-gray-900 font-bold' : 'bg-[#3f4147] text-white font-bold'
                    : isLight ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                الكل ({otherUsers.length})
              </button>
            </div>

            {onToggleTheme && (
              <div className="mr-auto">
                <button
                  onClick={onToggleTheme}
                  title={theme === 'light' ? 'التبديل إلى المود الداكن 🌙' : 'التبديل إلى المود الفاتح ☀️'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    theme === 'light'
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
              </div>
            )}
          </div>

          {/* Search bar & Friends list */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="relative mb-4">
              <input
                type="text"
                value={searchFriend}
                onChange={(e) => setSearchFriend(e.target.value)}
                placeholder="بحث عن صديق..."
                className={`w-full text-sm px-3 py-2 pl-9 rounded-lg focus:outline-none border transition ${
                  isLight
                    ? 'bg-gray-100 text-gray-800 border-gray-200 focus:border-indigo-500 focus:bg-white'
                    : 'bg-[#1e1f22] text-gray-200 border-transparent focus:border-[#5865f2]'
                }`}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
            </div>

            <div className="space-y-1">
              {filteredFriends.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                    isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-[#2b2d31] text-[#5865f2]'
                  }`}>
                    <Users className="w-7 h-7" />
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>لا يوجد أصدقاء متصلون حالياً</h4>
                  <p className={`text-xs max-w-xs mb-4 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    شارك رابط MODcord - مودكورد مع أصحابك ليدخلوا ويتحدثوا معك فوراً عبر الدردشة والصوت!
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('تم نسخ رابط الدعوة! أرسله لأصحابك 🚀');
                    }}
                    className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-lg transition shadow"
                  >
                    نسخ رابط السيرفر للأصدقاء
                  </button>
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`p-2.5 rounded-xl border-b flex items-center justify-between transition ${
                      isLight
                        ? 'hover:bg-gray-50 border-gray-100'
                        : 'hover:bg-[#35373c] border-[#2b2d31]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                          style={{ backgroundColor: friend.color || '#5865f2' }}
                        >
                          {friend.displayName.slice(0, 2)}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 ${
                            isLight ? 'border-white' : 'border-[#313338]'
                          } ${
                            friend.status === 'online'
                              ? 'bg-[#23a55a]'
                              : friend.status === 'idle'
                              ? 'bg-[#f0b232]'
                              : friend.status === 'dnd'
                              ? 'bg-[#f23f43]'
                              : 'bg-[#80848e]'
                          }`}
                        />
                      </div>

                      <div>
                        <div className={`font-bold text-sm flex items-center gap-1.5 ${
                          isLight ? 'text-gray-900' : 'text-white'
                        }`}>
                          <span>{friend.displayName}</span>
                          <span className={`text-xs font-normal ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>#{friend.discriminator}</span>
                        </div>
                        <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{friend.customStatus || friend.roleTitle}</div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onStartNewDM(friend)}
                        title="إرسال رسالة خاصة"
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
                          isLight
                            ? 'bg-gray-100 hover:bg-[#5865f2] hover:text-white text-gray-700'
                            : 'bg-[#2b2d31] hover:bg-[#5865f2] hover:text-white text-gray-300'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onStartVoiceCall(friend)}
                        title="بدء مكالمة صوتية"
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
                          isLight
                            ? 'bg-gray-100 hover:bg-[#23a55a] hover:text-white text-gray-700'
                            : 'bg-[#2b2d31] hover:bg-[#23a55a] hover:text-white text-gray-300'
                        }`}
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Active 1-on-1 DM Chat */
        <div className={`flex-1 flex flex-col h-full transition-colors duration-200 ${
          isLight ? 'bg-white' : 'bg-[#313338]'
        }`}>
          {/* Header */}
          <div className={`h-12 border-b px-4 flex items-center justify-between transition-colors duration-200 ${
            isLight ? 'bg-white border-[#e3e5e8]' : 'bg-[#313338] border-[#1f2023]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: targetUser.color || '#5865f2' }}>
                {targetUser.displayName.slice(0, 2)}
              </div>
              <div>
                <span className={`font-bold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>{targetUser.displayName}</span>
                <span className={`text-xs mr-2 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>#{targetUser.discriminator}</span>
              </div>
            </div>

            {/* Voice / Video Call buttons & Theme Toggle */}
            <div className="flex items-center gap-2">
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  title={theme === 'light' ? 'التبديل إلى المود الداكن 🌙' : 'التبديل إلى المود الفاتح ☀️'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    theme === 'light'
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

              <button
                onClick={() => onStartVoiceCall(targetUser)}
                title="بدء مكالمة صوتية"
                className={`p-2 rounded transition cursor-pointer ${
                  isLight
                    ? 'hover:bg-gray-100 text-gray-600 hover:text-[#23a55a]'
                    : 'hover:bg-[#35373c] text-gray-300 hover:text-[#23a55a]'
                }`}
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => onStartVoiceCall(targetUser)}
                title="بدء مكالمة فيديو"
                className={`p-2 rounded transition cursor-pointer ${
                  isLight
                    ? 'hover:bg-gray-100 text-gray-600 hover:text-black'
                    : 'hover:bg-[#35373c] text-gray-300 hover:text-white'
                }`}
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className={`py-6 border-b mb-4 ${isLight ? 'border-gray-200' : 'border-[#35373c]'}`}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                style={{ backgroundColor: targetUser.color || '#5865f2' }}
              >
                {targetUser.displayName.slice(0, 2)}
              </div>
              <h3 className={`text-xl font-bold mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>{targetUser.displayName}</h3>
              <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                هذه بداية المحادثة المباشرة بينك وبين {targetUser.displayName}.
              </p>
            </div>

            {dmMessages.map((msg) => {
              const author = users.find((u) => u.id === msg.authorId) || currentUser;
              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  author={author}
                  currentUserId={currentUser.id}
                  isOwner={false}
                  theme={theme}
                  onReact={onReact}
                  onReply={() => {}}
                  onDelete={onDeleteMessage}
                  onPin={onPinMessage}
                  onOpenProfile={onOpenProfile}
                />
              );
            })}
          </div>

          {/* Chat Input */}
          <div className="p-4 pt-1">
            <div className={`rounded-xl flex items-center px-3 py-2 border transition shadow-inner ${
              isLight
                ? 'bg-[#ebedef] border-[#dcdfe3] focus-within:border-indigo-500'
                : 'bg-[#383a40] border-transparent focus-within:border-[#5865f2]'
            }`}>
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`أرسل رسالة إلى @${targetUser.displayName}`}
                className={`flex-1 bg-transparent text-sm px-3 focus:outline-none resize-none leading-5 ${
                  isLight
                    ? 'text-gray-900 placeholder-gray-500'
                    : 'text-[#dbdee1] placeholder-gray-400'
                }`}
              />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-1 rounded-full transition cursor-pointer ${
                    isLight
                      ? 'text-gray-500 hover:text-amber-500 hover:bg-black/5'
                      : 'text-gray-400 hover:text-amber-400 hover:bg-[#4e5058]/50'
                  }`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={(emoji) => {
                      setInputText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="mr-2 p-1.5 bg-[#5865f2] disabled:opacity-40 hover:bg-[#4752c4] text-white rounded-lg transition cursor-pointer"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
