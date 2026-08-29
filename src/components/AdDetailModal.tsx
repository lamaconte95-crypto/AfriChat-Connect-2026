import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Crown, 
  Coins, 
  Star, 
  Tag,
  Share2,
  ChevronRight,
  Info
} from 'lucide-react';
import { AdItem } from '../types';

interface AdDetailModalProps {
  isOpen: boolean;
  ad: AdItem | null;
  onClose: () => void;
  onOpenAdSettings?: () => void;
  onActivateAdFreeVip?: () => void;
}

export const AdDetailModal: React.FC<AdDetailModalProps> = ({
  isOpen,
  ad,
  onClose,
  onOpenAdSettings,
  onActivateAdFreeVip,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !ad) return null;

  const handleCopyCode = () => {
    if (!ad.discountCode) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ad.discountCode);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${ad.title} - ${ad.tagline} via AfriChat Connect`);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <AnimatePresence>
      <div 
        id="ad-detail-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden text-stone-100 my-6"
        >
          {/* Header Image Banner */}
          <div className="relative h-48 sm:h-56 w-full bg-stone-950 overflow-hidden">
            {ad.imageUrl ? (
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-orange-700 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white/50" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent" />

            {/* Badges & Close Button */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <div className="flex items-center space-x-1.5">
                <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-black text-amber-400 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>ANNONCE SPONSORISÉE</span>
                </span>
                {ad.sponsorBadge && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-stone-950 text-[10px] font-black shadow">
                    {ad.sponsorBadge}
                  </span>
                )}
              </div>

              <button
                id="ad-detail-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-stone-300 hover:text-white hover:bg-black/80 transition-colors cursor-pointer border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sponsor Info Card on Image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center space-x-3">
              <img
                src={ad.sponsorLogo}
                alt={ad.sponsorName}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500 shadow-lg bg-stone-900"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-black text-sm text-white drop-shadow truncate">{ad.sponsorName}</h4>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-amber-300 font-mono drop-shadow">{ad.sponsorHandle}</p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-black text-white leading-tight">
                {ad.title}
              </h3>
              <p className="text-xs font-bold text-amber-400 mt-1 flex items-center space-x-1">
                <span>{ad.tagline}</span>
              </p>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/70 p-3.5 rounded-2xl border border-stone-800">
              {ad.description}
            </p>

            {/* Promo Code Box */}
            {ad.discountCode && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/40 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Code Promo Exclusif</div>
                    <div className="text-sm font-black text-white font-mono">{ad.discountCode}</div>
                  </div>
                </div>

                <button
                  id="ad-copy-code-btn"
                  onClick={handleCopyCode}
                  className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                    copiedCode
                      ? 'bg-emerald-500 text-stone-950'
                      : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Target Countries & Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 block font-medium">Zone éligible</span>
                <span className="font-bold text-stone-200">{ad.countryTarget || 'Panafricain'}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800/80">
                <span className="text-[10px] text-stone-400 block font-medium">Partenaire Vérifié</span>
                <span className="font-bold text-emerald-400 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Conforme AfriChat</span>
                </span>
              </div>
            </div>

            {/* Direct Action Button */}
            <div className="space-y-2 pt-1">
              <a
                href={ad.ctaUrl}
                target="_blank"
                rel="noreferrer"
                id="ad-cta-button-main"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{ad.ctaText}</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleShare}
                className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Lien de l'offre copié !</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Partager ce bon plan avec un ami</span>
                  </>
                )}
              </button>
            </div>

            {/* Ad-Free Upgrade Banner Promo */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-stone-200">Ne plus voir de publicités ?</div>
                  <div className="text-[10px] text-stone-400">Passez au Pass VIP Sans Pub</div>
                </div>
              </div>

              <button
                id="ad-modal-go-ad-free-btn"
                onClick={() => {
                  onClose();
                  if (onActivateAdFreeVip) onActivateAdFreeVip();
                  else if (onOpenAdSettings) onOpenAdSettings();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] cursor-pointer transition-colors"
              >
                Pass VIP Sans Pub
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
