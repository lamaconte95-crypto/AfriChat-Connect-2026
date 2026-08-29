import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, Sparkles, Check, ArrowRight, Share } from 'lucide-react';
import { isIOSDevice, isStandalonePWA } from '../services/deviceDetection';

interface PwaInstallBannerProps {
  onOpenInstallModal: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
  onOpenInstallModal,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (isStandalonePWA()) {
      setIsStandalone(true);
      return;
    }

    setIsIOS(isIOSDevice());

    // Check if user dismissed banner recently
    try {
      const dismissed = localStorage.getItem('africhat_pwa_banner_dismissed');
      if (dismissed && Date.now() - parseInt(dismissed, 10) < 1000 * 60 * 60 * 24) {
        setIsDismissed(true);
        return;
      }
    } catch (e) {}

    // Show banner after brief initial delay for smooth UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      localStorage.setItem('africhat_pwa_banner_dismissed', Date.now().toString());
    } catch (e) {}
  };

  const handleInstallClick = async () => {
    // On iOS (iPhone / iPad), do NOT attempt Chrome download or prompt; open the iOS step-by-step help window directly
    if (isIOSDevice()) {
      onOpenInstallModal();
      return;
    }

    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsVisible(false);
          if (onInstallSuccess) onInstallSuccess();
        }
      } catch (err) {
        console.error('PWA Install error:', err);
        onOpenInstallModal();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Open detailed step-by-step modal
      onOpenInstallModal();
    }
  };

  if (isStandalone || isDismissed || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        id="pwa-install-smart-banner"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed top-14 sm:top-16 inset-x-2 sm:inset-x-auto sm:right-4 sm:max-w-md z-40"
      >
        <div className="relative rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 p-3 sm:p-3.5 border border-amber-500/40 shadow-2xl shadow-amber-500/10 backdrop-blur-xl text-stone-100 flex items-center justify-between gap-3">
          {/* Glowing Aura Accent */}
          <div className="absolute -top-1 -right-1 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

          {/* App Icon + Text */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-0.5 shadow-md shrink-0 flex items-center justify-center">
              <div className="w-full h-full rounded-[10px] bg-stone-950 flex items-center justify-center">
                <span className="text-base font-black text-amber-400">🌍</span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-xs text-white truncate">
                  {isIOS ? 'Installer sur iPhone/iPad' : 'Installer AfriChat'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {isIOS ? 'iOS Safari' : 'Application Gratuite'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 truncate mt-0.5">
                {isIOS
                  ? 'Bouton Partager 📤 puis « Sur l\'écran d\'accueil »'
                  : 'Accès instantané 1-clic • 0 Mo Store • Mode hors-ligne'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              id="pwa-banner-install-btn"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {isIOS ? (
                <Share className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>{isInstalling ? 'Installation...' : isIOS ? 'Aide Installer' : 'Installer'}</span>
            </button>

            <button
              id="pwa-banner-dismiss-btn"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

