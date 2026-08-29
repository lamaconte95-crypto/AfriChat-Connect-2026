import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Tag, 
  Settings, 
  Crown,
  EyeOff
} from 'lucide-react';
import { AdItem, AdSettings } from '../types';

interface AdBannerProps {
  ads: AdItem[];
  adSettings: AdSettings;
  onOpenAdDetail: (ad: AdItem) => void;
  onOpenAdSettings: () => void;
  onActivateAdFreeVip?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  ads,
  adSettings,
  onOpenAdDetail,
  onOpenAdSettings,
  onActivateAdFreeVip,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // If ads are disabled or user is VIP Ad-Free or banner is turned off in settings, return null
  if (!adSettings.adsEnabled || adSettings.isVipAdFree || !adSettings.showBottomBanner || ads.length === 0) {
    return null;
  }

  // Filter banner ads or fallback to all ads
  const bannerAds = ads.filter((a) => a.placement === 'banner' || a.placement === 'sponsored_post');
  const activeAds = bannerAds.length > 0 ? bannerAds : ads;

  // Auto rotation every 9 seconds when not hovered
  useEffect(() => {
    if (isDismissed || isHovered || activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [isDismissed, isHovered, activeAds.length]);

  if (isDismissed) {
    return (
      <div className="fixed bottom-20 right-4 z-30">
        <button
          onClick={() => setIsDismissed(false)}
          className="py-1.5 px-3 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700/80 text-[10px] font-bold text-amber-400/90 shadow-xl backdrop-blur-md flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-105"
          title="Afficher les offres partenaires"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Partenaires AfriChat</span>
        </button>
      </div>
    );
  }

  const currentAd = activeAds[currentIndex % activeAds.length];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeAds.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeAds.length) % activeAds.length);
  };

  return (
    <div 
      id="bottom-ad-banner-container"
      className="fixed bottom-[68px] sm:bottom-4 left-2 right-2 sm:left-auto sm:right-4 sm:max-w-md z-30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        key={currentAd.id}
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl bg-stone-900/95 backdrop-blur-md border border-amber-500/30 p-2.5 shadow-2xl text-stone-100 flex items-center justify-between space-x-3 overflow-hidden relative"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Left Ad Media / Icon */}
        <div 
          onClick={() => onOpenAdDetail(currentAd)}
          className="relative shrink-0 cursor-pointer group"
        >
          <img
            src={currentAd.sponsorLogo}
            alt={currentAd.sponsorName}
            className="w-11 h-11 rounded-xl object-cover border border-amber-500/50 shadow group-hover:scale-105 transition-transform"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-[8px]">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Center Ad Info */}
        <div 
          onClick={() => onOpenAdDetail(currentAd)}
          className="flex-1 min-w-0 cursor-pointer"
        >
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              Sponsorisé
            </span>
            <span className="font-bold text-xs text-white truncate">{currentAd.sponsorName}</span>
          </div>

          <p className="text-[11px] font-bold text-amber-300 truncate mt-0.5">
            {currentAd.title}
          </p>
          <p className="text-[10px] text-stone-400 truncate">
            {currentAd.tagline}
          </p>
        </div>

        {/* Right CTA & Action Controls */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            id="banner-ad-cta-btn"
            onClick={() => onOpenAdDetail(currentAd)}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-[11px] shadow hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-1"
          >
            <span>Voir</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          {/* Quick controls menu */}
          <div className="flex flex-col space-y-1">
            <button
              id="banner-ad-settings-btn"
              onClick={onOpenAdSettings}
              className="p-1 text-stone-400 hover:text-amber-400 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              title="Gérer les publicités et le Pass VIP Sans Pub"
            >
              <Settings className="w-3 h-3" />
            </button>
            <button
              id="banner-ad-close-btn"
              onClick={() => setIsDismissed(true)}
              className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              title="Fermer temporairement la bannière"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
