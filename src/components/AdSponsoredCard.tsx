import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ExternalLink, 
  Tag, 
  ShieldCheck, 
  Share2, 
  Check, 
  Info, 
  MoreHorizontal,
  Crown,
  Heart
} from 'lucide-react';
import { AdItem } from '../types';

interface AdSponsoredCardProps {
  ad: AdItem;
  onOpenAdDetail: (ad: AdItem) => void;
  onOpenAdSettings?: () => void;
}

export const AdSponsoredCard: React.FC<AdSponsoredCardProps> = ({
  ad,
  onOpenAdDetail,
  onOpenAdSettings,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(320);
  const [isCopied, setIsCopied] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${ad.title} - ${ad.tagline}`);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.article
      id={`sponsored-ad-card-${ad.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-stone-900 border border-amber-500/30 shadow-xl overflow-hidden text-stone-100 relative group"
    >
      {/* Top Gold Accent Stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {ad.sponsorLogo && ad.sponsorLogo.trim() ? (
              <img
                src={ad.sponsorLogo.trim()}
                alt={ad.sponsorName}
                className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-500/60 shadow"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl border-2 border-amber-500/60 shadow bg-stone-800 flex items-center justify-center font-bold text-amber-400">
                {ad.sponsorName?.charAt(0) || 'A'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-[8px] shadow">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="font-black text-sm text-white hover:underline cursor-pointer flex items-center space-x-1" onClick={() => onOpenAdDetail(ad)}>
                <span>{ad.sponsorName}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              </h4>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SPONSORISÉ
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-stone-400">
              <span className="text-amber-400/90 font-mono">{ad.sponsorHandle}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{ad.sponsorBadge || 'Partenaire Certifié'}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onOpenAdSettings}
          className="p-2 text-stone-400 hover:text-amber-400 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
          title="Paramètres des publicités"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Content Text */}
      <div className="px-4 pb-3 space-y-1">
        <h5 className="font-black text-base text-white hover:text-amber-300 transition-colors cursor-pointer" onClick={() => onOpenAdDetail(ad)}>
          {ad.title}
        </h5>
        <p className="text-xs text-stone-300 leading-relaxed">
          {ad.description}
        </p>
      </div>

      {/* Media Image */}
      {ad.imageUrl && ad.imageUrl.trim() && (
        <div 
          onClick={() => onOpenAdDetail(ad)}
          className="relative w-full aspect-video bg-stone-950 overflow-hidden cursor-pointer group/img"
        >
          <img
            src={ad.imageUrl.trim()}
            alt={ad.title}
            className="w-full h-full object-cover group-hover/img:scale-[1.02] transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
          
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-bold text-amber-300 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>{ad.tagline}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA bar */}
      <div className="p-4 bg-stone-950/60 border-t border-stone-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 text-xs font-bold p-2 rounded-xl transition-all cursor-pointer ${
              isLiked ? 'text-rose-500 bg-rose-500/10' : 'text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-1 text-xs font-bold text-stone-400 hover:text-white p-2 rounded-xl hover:bg-stone-800 transition-all cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{isCopied ? 'Copié' : 'Partager'}</span>
          </button>
        </div>

        <button
          onClick={() => onOpenAdDetail(ad)}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black text-xs shadow-lg shadow-orange-500/20 flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>{ad.ctaText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.article>
  );
};
