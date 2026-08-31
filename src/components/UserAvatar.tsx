import React, { useState, useEffect } from 'react';
import { User, Image as ImageIcon, Building, Tv } from 'lucide-react';

interface UserAvatarProps {
  name?: string;
  username?: string;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'huge';
  className?: string;
  flag?: string;
  isVIP?: boolean;
  isVerified?: boolean;
  type?: 'user' | 'page' | 'channel';
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
  huge: 'w-24 h-24 text-2xl',
};

const iconSizes = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 20,
  xl: 26,
  '2xl': 32,
  huge: 38,
};

export const getInitials = (name?: string, username?: string): string => {
  const cleanName = (name || username || '').replace(/^[@+]/, '').trim();
  if (!cleanName) return 'A';
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  username,
  avatar,
  size = 'md',
  className = '',
  flag,
  isVIP,
  type = 'user',
}) => {
  const [imageError, setImageError] = useState(false);

  // Automatically reset image error state whenever avatar URL changes
  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  // Check if avatar is valid string
  const isInvalidOrExternal = !avatar || 
    avatar.includes('via.placeholder') || 
    avatar.trim() === '';

  const initials = getInitials(name, username);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || 18;

  if (isInvalidOrExternal || imageError || !avatar || typeof avatar !== 'string' || !avatar.trim()) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full bg-stone-800 border border-stone-700/60 text-stone-200 font-bold select-none shrink-0 shadow-inner ${sizeClass} ${className}`}
        title={name || username || 'Utilisateur'}
      >
        {initials ? (
          <span className="tracking-tighter">{initials}</span>
        ) : type === 'page' ? (
          <Building size={iconSize} className="text-stone-400" />
        ) : type === 'channel' ? (
          <Tv size={iconSize} className="text-stone-400" />
        ) : (
          <User size={iconSize} className="text-stone-400" />
        )}

        {flag && (
          <span className="absolute -bottom-0.5 -right-0.5 text-[10px] leading-none bg-stone-900/80 rounded-full px-0.5 shadow-sm border border-stone-800">
            {flag}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-block rounded-full shrink-0 overflow-hidden ${sizeClass} ${className}`}>
      <img
        src={avatar.trim()}
        alt={name || username || 'Avatar'}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
      {flag && (
        <span className="absolute -bottom-0.5 -right-0.5 text-[10px] leading-none bg-stone-900/80 rounded-full px-0.5 shadow-sm border border-stone-800">
          {flag}
        </span>
      )}
    </div>
  );
};
