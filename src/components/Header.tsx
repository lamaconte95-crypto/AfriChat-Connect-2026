import React from 'react';
import { 
  Sparkles, 
  Wallet, 
  Bell, 
  Crown, 
  Smartphone, 
  Globe, 
  Flame,
  ChevronDown,
  Settings,
  Sun,
  Moon,
  ShieldAlert,
  Lock,
  LogOut,
  User as UserIcon,
  Share2,
  Download,
  QrCode,
  UserPlus,
  Users,
  ArrowLeft,
  Share
} from 'lucide-react';
import { User } from '../types';
import { isIOSDevice } from '../services/deviceDetection';

interface HeaderProps {
  currentUser: User;
  onOpenWallet: () => void;
  onOpenCreatePost: () => void;
  unreadMessagesCount: number;
  activeTab?: string;
  onGoBack?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenSettings?: () => void;
  onOpenSuperAdmin?: () => void;
  onOpenAdminPortal?: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenShareApp?: () => void;
  onOpenInstallPwa?: () => void;
  onOpenFriends?: () => void;
  onTriggerToast?: (message: string, type?: 'success' | 'danger' | 'info') => void;
  currentTheme?: 'dark' | 'light';
  onToggleTheme?: (theme: 'dark' | 'light') => void;
  onSelectTab?: (tab: 'feed' | 'reels' | 'messages' | 'webtv' | 'wallet' | 'profile' | 'pages') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenWallet,
  onOpenCreatePost,
  unreadMessagesCount,
  activeTab = 'feed',
  onGoBack,
  onOpenAiAssistant,
  onOpenSettings,
  onOpenSuperAdmin,
  onOpenAdminPortal,
  onOpenAuth,
  onLogout,
  onOpenShareApp,
  onOpenInstallPwa,
  onOpenFriends,
  onTriggerToast,
  currentTheme = 'dark',
  onToggleTheme,
  onSelectTab,
}) => {
  const handleShareAfriChat = async () => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://africhat-connect.firebaseapp.com';
    const shareUrl = currentUser
      ? `${appUrl}?ref=${encodeURIComponent(currentUser.username.replace('@', ''))}`
      : appUrl;
    const defaultShareText = `🌍 Rejoins-moi sur AfriChat Connect ! Le réseau social & messagerie 100% conçu pour l'Afrique et le monde : Fil d'actu, AfriShorts, Web TV live, salons VIP et paiement Mobile Money instantané. Clique ici : ${shareUrl}`;

    // 1. Try native Web Share API (mobile phones, Android, iOS, tablets)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AfriChat Connect',
          text: defaultShareText,
          url: shareUrl,
        });
        if (onTriggerToast) {
          onTriggerToast('Merci d\'avoir partagé AfriChat Connect ! 🌍', 'success');
        }
        return;
      } catch (err) {
        // User aborted or canceled native dialog, continue to copy fallback / open modal
      }
    }

    // 2. Automatic clipboard copy fallback
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(defaultShareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = defaultShareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      if (onTriggerToast) {
        onTriggerToast('✅ Lien et message copiés ! Prêt à être partagé 🚀', 'success');
      }
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }

    // 3. Open the rich Share Modal (with WhatsApp, QR Code, SMS, Telegram)
    if (onOpenShareApp) {
      onOpenShareApp();
    }
  };
  return (
    <header 
      id="app-main-header"
      className="sticky top-0 z-40 w-full bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/90 text-stone-100"
    >
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand Logo, Universal Back Button & Title */}
        <div className="flex items-center space-x-2">
          {/* Universal Back Arrow on secondary screens */}
          {activeTab !== 'feed' && (
            <button
              id="header-universal-back-btn"
              type="button"
              onClick={() => {
                if (onGoBack) onGoBack();
                else if (onSelectTab) onSelectTab('feed');
              }}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-all flex items-center space-x-1 cursor-pointer group shadow-sm"
              title="← Retour à la vue précédente"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-bold hidden sm:inline text-amber-300">Retour</span>
            </button>
          )}

          <div 
            onClick={() => onSelectTab && onSelectTab('feed')}
            className="flex items-center space-x-2.5 cursor-pointer group"
            title="AfriChat Connect - Accueil"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center">
                <span className="font-black text-lg bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  AC
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent">
                  AfriChat
                </span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-950">
                  CONNECT
                </span>
              </div>
              <p className="text-[10px] text-stone-400 flex items-center space-x-1 font-medium">
                <span>{currentUser.flag}</span>
                <span>Afrique & Monde 🌍</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Tools: Admin Suite, Super Admin, Wallet Badge, Quick Pay, Theme, Settings & Notifications */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Admin Portal (/admin) Button */}
          {onOpenAdminPortal && (
            <button
              id="header-admin-portal-btn"
              onClick={onOpenAdminPortal}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/60 hover:border-amber-400 text-amber-300 hover:text-white transition-all text-xs shadow-md cursor-pointer group"
              title="Ouvrir le Portail Administrateur (/admin) - Utilisateurs, VIP & Salons"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-black text-[11px] uppercase tracking-wide">
                /admin
              </span>
            </button>
          )}

          {/* Restricted Super Admin Panel Button */}
          {onOpenSuperAdmin && (
            <button
              id="header-super-admin-btn"
              onClick={onOpenSuperAdmin}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-stone-900 to-amber-950/60 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white transition-all text-xs shadow-md cursor-pointer group"
              title="Ouvrir le Panneau Super Admin & Gestion des Administrateurs Globaux"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline font-black text-[11px] uppercase tracking-wide">
                Super Admin
              </span>
            </button>
          )}

          {/* Quick Mobile Money Balance Pill */}
          <button
            id="header-wallet-pill"
            onClick={onOpenWallet}
            className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-gradient-to-r from-stone-900 to-amber-950/50 border border-amber-500/40 hover:border-amber-400 transition-all text-xs shadow-md cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden xs:block sm:block">
              <div className="text-[9px] text-stone-400 font-semibold leading-none">Solde Pay</div>
              <div className="text-xs font-black text-amber-400 leading-tight">
                {currentUser.walletBalance.toLocaleString()} {currentUser.currency}
              </div>
            </div>
          </button>

          {/* Post Action */}
          <button
            id="header-create-post-btn"
            onClick={onOpenCreatePost}
            className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <span>+</span>
            <span>Publier</span>
          </button>

          {/* Assistant IA AfriChat Button */}
          {onOpenAiAssistant && (
            <button
              id="header-ai-assistant-btn"
              onClick={onOpenAiAssistant}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-600/20 hover:shadow-orange-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              title="Assistant IA AfriChat (Posez vos questions, conseils créateurs, traduction panafricaine)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline font-bold text-[11px]">Assistant IA</span>
            </button>
          )}

          {/* Friends Management & Directory Button */}
          {onOpenFriends && (
            <button
              id="header-friends-manager-btn"
              onClick={onOpenFriends}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-800 text-stone-200 hover:text-amber-300 font-bold text-xs transition-all shadow-sm cursor-pointer group"
              title="Gestion des amis (Amis connectés, Ajouter des amis, Demandes d'amitié)"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-[11px]">Amis</span>
            </button>
          )}

          {/* Very Visible "Partager AfriChat" Action Button */}
          <button
            id="header-share-africhat-btn"
            onClick={handleShareAfriChat}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="Partager l'application AfriChat Connect (Menu natif, WhatsApp, SMS, QR Code)"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-950 stroke-[2.5] group-hover:rotate-12 transition-transform" />
            <span className="font-black text-[11px] sm:text-xs tracking-tight">Partager AfriChat</span>
          </button>

          {/* Install / Download PWA Button */}
          {onOpenInstallPwa && (
            <button
              id="header-install-pwa-btn"
              onClick={onOpenInstallPwa}
              className={`hidden xs:flex sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer group ${
                isIOSDevice()
                  ? 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-sky-500/50 hover:border-sky-400 text-sky-300 hover:text-white'
                  : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white'
              }`}
              title={
                isIOSDevice()
                  ? "Installer AfriChat sur iPhone / iPad (Safari : Partager 📤 > Sur l'écran d'accueil)"
                  : "Installer / Télécharger l'application sur votre téléphone (PWA)"
              }
            >
              {isIOSDevice() ? (
                <Share className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              )}
              <span className="hidden md:inline text-[11px]">
                {isIOSDevice() ? 'Installer iOS' : 'Installer'}
              </span>
            </button>
          )}

          {/* Quick Theme Toggle Button */}
          {onToggleTheme && (
            <button
              id="header-theme-toggle-btn"
              onClick={() => onToggleTheme(currentTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-stone-300 hover:text-amber-400 bg-stone-900 border border-stone-800 hover:bg-stone-800 transition-colors cursor-pointer"
              title={currentTheme === 'dark' ? 'Passer au Mode Clair' : 'Passer au Mode Sombre'}
            >
              {currentTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-stone-300 hover:text-amber-400 bg-stone-900 border border-stone-800 hover:bg-stone-800 transition-colors cursor-pointer"
              title="Ouvrir les Paramètres & Réglages"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Notifications button */}
          <button
            id="header-notifications-btn"
            className="p-2 rounded-xl text-stone-300 hover:text-white bg-stone-900 border border-stone-800 hover:bg-stone-800 relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500" />
          </button>

          {/* User Profile Avatar & Account Switcher */}
          <div className="flex items-center space-x-1 pl-1 border-l border-stone-800">
            <button
              id="header-user-avatar-btn"
              onClick={() => onSelectTab && onSelectTab('profile')}
              className="relative w-8 h-8 rounded-xl overflow-hidden border border-amber-500/40 hover:border-amber-400 p-0.5 transition-all cursor-pointer group"
              title={`Profil de ${currentUser.name} (${currentUser.username})`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full object-cover rounded-[9px]"
              />
              {currentUser.isVIP && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-stone-950" />
              )}
            </button>

            {onLogout && (
              <button
                id="header-logout-btn"
                onClick={onLogout}
                className="p-1.5 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Se déconnecter / Changer de compte"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
