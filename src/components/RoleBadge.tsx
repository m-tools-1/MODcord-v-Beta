import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../types';
import { getRoleInfo } from '../utils/roles';
import {
  Crown,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Bot as BotIcon,
  User as UserIcon,
  CheckCircle2,
  X,
  Info,
} from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIconOnly?: boolean;
  showPermissionsModal?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'sm',
  showIconOnly = false,
  showPermissionsModal = true,
  className = '',
}) => {
  const roleInfo = getRoleInfo(role);
  const [showTooltip, setShowTooltip] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!showTooltip) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

  const renderIcon = (iconSizeClass: string) => {
    switch (roleInfo.id) {
      case 'owner':
        return <Crown className={`${iconSizeClass} text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]`} />;
      case 'admin':
        return <ShieldCheck className={`${iconSizeClass} text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]`} />;
      case 'mod':
        return <ShieldAlert className={`${iconSizeClass} text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]`} />;
      case 'vip':
        return <Sparkles className={`${iconSizeClass} text-pink-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]`} />;
      case 'bot':
        return <BotIcon className={`${iconSizeClass} text-indigo-400`} />;
      default:
        return <UserIcon className={`${iconSizeClass} text-slate-400`} />;
    }
  };

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.2 rounded gap-1',
    sm: 'text-[10px] px-2 py-0.5 rounded-md gap-1.5',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-bold',
    lg: 'text-sm px-3 py-1.5 rounded-xl gap-2 font-black',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  // If member, minimal render if requested
  if (roleInfo.id === 'member' && showIconOnly) {
    return null;
  }

  // Non-interactive Badge (when modal is disabled)
  if (!showPermissionsModal) {
    return (
      <span
        title={`${roleInfo.name}`}
        className={`inline-flex items-center font-bold tracking-wide border select-none ${
          roleInfo.bgClass
        } ${roleInfo.borderClass} ${roleInfo.textClass} ${sizeClasses[size]} ${className}`}
        style={{
          boxShadow:
            roleInfo.id === 'owner'
              ? '0 0 10px rgba(245, 158, 11, 0.25)'
              : roleInfo.id === 'admin'
              ? '0 0 10px rgba(239, 68, 68, 0.22)'
              : roleInfo.id === 'mod'
              ? '0 0 10px rgba(139, 92, 246, 0.2)'
              : roleInfo.id === 'vip'
              ? '0 0 10px rgba(236, 72, 153, 0.2)'
              : undefined,
        }}
      >
        {renderIcon(iconSizes[size])}
        {!showIconOnly && <span>{roleInfo.name}</span>}
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        title={`${roleInfo.name} - اضغط لمعرفة الصلاحيات`}
        className={`inline-flex items-center font-bold tracking-wide border transition-all select-none cursor-pointer hover:scale-105 active:scale-95 ${
          roleInfo.bgClass
        } ${roleInfo.borderClass} ${roleInfo.textClass} ${sizeClasses[size]} ${className} ${
          showTooltip ? 'ring-2 ring-white/20' : ''
        }`}
        style={{
          boxShadow:
            roleInfo.id === 'owner'
              ? '0 0 10px rgba(245, 158, 11, 0.25)'
              : roleInfo.id === 'admin'
              ? '0 0 10px rgba(239, 68, 68, 0.22)'
              : roleInfo.id === 'mod'
              ? '0 0 10px rgba(139, 92, 246, 0.2)'
              : roleInfo.id === 'vip'
              ? '0 0 10px rgba(236, 72, 153, 0.2)'
              : undefined,
        }}
      >
        {renderIcon(iconSizes[size])}
        {!showIconOnly && <span>{roleInfo.name}</span>}
      </button>

      {/* Permissions Popover on Click */}
      {showTooltip && (
        <div
          ref={popoverRef}
          className="absolute z-50 bottom-full right-0 mb-2 w-72 rounded-2xl bg-[#121317] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)] p-4 text-right animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center border"
                style={{
                  backgroundColor: `${roleInfo.color}20`,
                  borderColor: `${roleInfo.color}40`,
                }}
              >
                {renderIcon('w-4 h-4')}
              </div>
              <div>
                <h4 className="text-xs font-black text-white">{roleInfo.name}</h4>
                <span className="text-[10px] text-gray-400 font-mono">رتبة مستوى #{roleInfo.level}</span>
              </div>
            </div>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/[0.06] transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-gray-300 leading-relaxed mb-3">
            {roleInfo.description}
          </p>

          {/* Permissions list */}
          <div className="space-y-1.5 bg-black/30 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mb-1">
              <Info className="w-3 h-3 text-indigo-400" />
              <span>الصلاحيات المعتمدة للرتبة:</span>
            </div>
            {roleInfo.permissions.map((perm, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-300">
                <CheckCircle2
                  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                  style={{ color: roleInfo.color }}
                />
                <span className="leading-tight">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
