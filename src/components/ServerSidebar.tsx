import React from 'react';
import { Server } from '../types';
import { Plus, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface ServerSidebarProps {
  servers: Server[];
  activeServerId: string | null; // null means DMs / Home
  onSelectServer: (serverId: string | null) => void;
  onOpenCreateServer: () => void;
  unreadDMsCount?: number;
  theme?: 'dark' | 'midnight' | 'light';
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({
  servers,
  activeServerId,
  onSelectServer,
  onOpenCreateServer,
  unreadDMsCount = 0,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const isHomeActive = activeServerId === null;

  return (
    <div
      id="server-sidebar"
      className={`w-[76px] flex flex-col items-center py-3 gap-2.5 flex-shrink-0 select-none z-30 transition-colors duration-200 border-l ${
        isLight
          ? 'bg-[#e3e5e8] border-[#dcdfe3]'
          : 'bg-[#111215] border-white/[0.04]'
      }`}
    >
      {/* Home / DMs Button */}
      <div className="relative group flex items-center justify-center w-full">
        {/* Active Pill Indicator */}
        <span
          className={`absolute right-0 w-1.5 rounded-l-full transition-all duration-300 ${
            isLight ? 'bg-gray-800' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
          } ${
            isHomeActive ? 'h-10 opacity-100' : 'h-0 opacity-0 group-hover:h-5 group-hover:opacity-80'
          }`}
        />

        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onSelectServer(null)}
          title="الرسائل المباشرة والأصدقاء"
          className={`relative w-12 h-12 flex items-center justify-center transition-all duration-300 shadow-sm ${
            isHomeActive
              ? 'bg-gradient-to-br from-[#5865f2] to-[#4752c4] text-white rounded-[16px] shadow-[0_0_20px_rgba(88,101,242,0.45)] border border-indigo-400/40'
              : isLight
              ? 'bg-[#ffffff] text-gray-700 hover:bg-[#5865f2] hover:text-white rounded-[24px] hover:rounded-[16px] border border-gray-300/80'
              : 'bg-[#1e2025] text-gray-300 hover:bg-[#5865f2] hover:text-white rounded-[24px] hover:rounded-[16px] border border-white/[0.05] hover:border-indigo-400/30'
          }`}
        >
          <Flame className={`w-6 h-6 transition-transform duration-300 ${isHomeActive ? 'rotate-0 scale-110 text-amber-300' : '-rotate-12 group-hover:rotate-0'}`} />
          {unreadDMsCount > 0 && (
            <span className={`absolute -top-1 -right-1 bg-[#ef4444] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 shadow-md animate-pulse ${
              isLight ? 'border-[#e3e5e8]' : 'border-[#111215]'
            }`}>
              {unreadDMsCount > 9 ? '+9' : unreadDMsCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Modern Divider */}
      <div
        className={`w-8 h-[2px] rounded-full my-0.5 ${
          isLight
            ? 'bg-gray-300'
            : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
        }`}
      />

      {/* Server List */}
      <div className="flex-1 w-full flex flex-col items-center gap-2.5 overflow-y-auto overflow-x-hidden no-scrollbar py-1">
        {servers.map((server) => {
          const isActive = activeServerId === server.id;

          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              {/* Active Pill Indicator */}
              <span
                className={`absolute right-0 w-1.5 rounded-l-full transition-all duration-300 ${
                  isLight ? 'bg-gray-800' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                } ${
                  isActive ? 'h-10 opacity-100' : 'h-0 opacity-0 group-hover:h-5 group-hover:opacity-80'
                }`}
              />

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onSelectServer(server.id)}
                title={server.name}
                className={`relative w-12 h-12 flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-br from-[#5865f2] to-[#3b47bd] text-white rounded-[16px] shadow-[0_0_20px_rgba(88,101,242,0.45)] border border-indigo-400/40'
                    : isLight
                    ? 'bg-[#ffffff] text-gray-800 hover:bg-[#5865f2] hover:text-white rounded-[24px] hover:rounded-[16px] border border-gray-300/80'
                    : 'bg-[#1e2025] text-gray-200 hover:bg-[#5865f2] hover:text-white rounded-[24px] hover:rounded-[16px] border border-white/[0.05] hover:border-indigo-400/30'
                }`}
              >
                <span className="truncate max-w-[36px]">{server.icon}</span>
              </motion.button>
            </div>
          );
        })}

        {/* Add Server Button */}
        <div className="relative group flex items-center justify-center w-full pt-1">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onOpenCreateServer}
            title="إضافة سيرفر جديد"
            className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-300 shadow-sm border ${
              isLight
                ? 'bg-[#ffffff] hover:bg-[#10b981] text-emerald-600 hover:text-white border-gray-300 hover:border-emerald-500 hover:shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                : 'bg-[#1e2025] hover:bg-[#10b981] text-[#10b981] hover:text-white border-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]'
            }`}
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

