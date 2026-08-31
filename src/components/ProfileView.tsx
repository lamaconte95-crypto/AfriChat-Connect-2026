import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { 
  User as UserIcon, 
  Crown, 
  CheckCircle2, 
  ShieldCheck, 
  Coins, 
  Grid, 
  Lock, 
  Bookmark, 
  Settings, 
  Sparkles, 
  Share2, 
  Edit3,
  Globe,
  Users,
  LogOut,
  LogIn,
  Download,
  Camera,
  UploadCloud,
  ArrowLeft,
  Share,
  Youtube,
  Facebook,
  Video,
  UserPlus,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { User, Post, OfficialPage } from '../types';
import { isIOSDevice } from '../services/deviceDetection';
import { openSocialDeepLink } from '../utils/socialDeepLinks';

interface ProfileViewProps {
  currentUser: User;
  userPosts: Post[];
  unlockedPostsCount: number;
  officialPages?: OfficialPage[];
  onGoBack?: () => void;
  onOpenDeposit: () => void;
  onOpenCreatePost: () => void;
  onOpenSettings?: () => void;
  onOpenContacts?: () => void;
  onOpenFriends?: () => void;
  onOpenStripeVIP?: () => void;
  onOpenFlutterwaveVIP?: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenShareApp?: () => void;
  onOpenInstallPwa?: () => void;
  onOpenFounderInfo?: () => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  userPosts,
  unlockedPostsCount,
  officialPages = [],
  onGoBack,
  onOpenDeposit,
  onOpenCreatePost,
  onOpenSettings,
  onOpenContacts,
  onOpenFriends,
  onOpenStripeVIP,
  onOpenFlutterwaveVIP,
  onOpenAuth,
  onLogout,
  onOpenShareApp,
  onOpenInstallPwa,
  onOpenFounderInfo,
  onUpdateAvatar,
}) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'unlocked' | 'stats'>('posts');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // Compress avatar with canvas to ensure instant cross-device synchronization (<60KB)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (onUpdateAvatar) {
            onUpdateAvatar(compressedDataUrl);
          }
        } else if (onUpdateAvatar) {
          onUpdateAvatar(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomCoverUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShareClick = async () => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://africhat-connect.firebaseapp.com';
    const shareUrl = `${appUrl}?ref=${encodeURIComponent(currentUser.username.replace('@', ''))}`;
    const defaultShareText = `🌍 Découvre mon profil sur AfriChat Connect ! Rejoins la première communauté connectée panafricaine : ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentUser.name} on AfriChat`,
          text: defaultShareText,
          url: shareUrl,
        });
        return;
      } catch (e) {}
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(defaultShareText);
      }
    } catch (e) {}

    if (onOpenShareApp) {
      onOpenShareApp();
    }
  };

  return (
    <div id="profile-view-container" className="max-w-2xl mx-auto space-y-4 pb-24 text-stone-100 px-3 sm:px-0 font-sans">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        onChange={handleAvatarFile}
        className="hidden"
        id="profile-direct-avatar-input"
      />
      <input
        type="file"
        ref={coverInputRef}
        accept="image/*"
        onChange={handleCoverFile}
        className="hidden"
        id="profile-direct-cover-input"
      />

      {/* Top Universal Back Navigation Bar */}
      <div className="flex items-center justify-between px-1">
        <button
          id="profile-back-btn"
          type="button"
          onClick={() => {
            if (onGoBack) onGoBack();
          }}
          className="px-3.5 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-all flex items-center space-x-2 text-xs font-medium shadow-sm cursor-pointer group"
          title="Retour à la vue précédente"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Retour</span>
        </button>

        <div className="flex items-center space-x-2">
          {onOpenSettings && (
            <button
              id="profile-top-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-emerald-400 border border-stone-800 transition-colors cursor-pointer"
              title="Paramètres du compte"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          <button
            id="profile-top-share-btn"
            onClick={handleShareClick}
            className="p-2 rounded-full bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-emerald-400 border border-stone-800 transition-colors cursor-pointer"
            title="Partager mon profil"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sleek Dark Mode Profile Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-[#09090b] border border-stone-800/80 shadow-2xl overflow-hidden relative"
      >
        {/* 1. Large Cover Area (Grande zone d'image de couverture) */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-stone-950">
          {customCoverUrl && customCoverUrl.trim() ? (
            <img
              src={customCoverUrl.trim()}
              alt="Couverture de profil"
              className="w-full h-full object-cover object-center opacity-85"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 flex items-center justify-center opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-black/40" />

          {/* Change Cover Button */}
          <button
            id="profile-edit-cover-btn"
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-stone-200 hover:text-emerald-400 text-[11px] font-medium transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Changer l'image de couverture"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Modifier la couverture</span>
          </button>
        </div>

        {/* 2. Avatar & Identity Section (Avatar en haut à gauche chevauchant la cover) */}
        <div className="px-5 sm:px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 gap-3">
            {/* Avatar on top left */}
            <div className="relative group self-start">
              <div className="relative rounded-full overflow-hidden border-4 border-[#09090b] ring-2 ring-emerald-500/80 shadow-2xl bg-stone-900 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                <UserAvatar
                  name={currentUser.name}
                  avatar={currentUser.avatar}
                  size="2xl"
                  className="w-full h-full text-2xl font-bold"
                />
                <button
                  id="profile-avatar-edit-overlay-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-emerald-300 text-[10px] font-bold transition-opacity cursor-pointer shadow-lg z-10"
                  title="Changer ma photo de profil"
                >
                  <Camera className="w-6 h-6 mb-1 text-emerald-400" />
                  <span>Photo</span>
                </button>

                {/* Country Flag Badge */}
                <span className="absolute bottom-1 right-1 text-2xl drop-shadow z-20 pointer-events-none">
                  {currentUser.flag}
                </span>

                {/* VIP Gold Crown */}
                {currentUser.isVIP && (
                  <div className="absolute top-1 left-1 w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-300 text-stone-950 flex items-center justify-center shadow-lg font-black text-xs">
                    <Crown className="w-4 h-4 fill-stone-950 text-stone-950" />
                  </div>
                )}
              </div>
            </div>

            {/* VIP & Plan Status Pills */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-end">
              <button
                type="button"
                id="profile-vip-gold-btn"
                onClick={onOpenFlutterwaveVIP || onOpenStripeVIP}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 border transition-all cursor-pointer ${
                  currentUser.isVIP
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-sm'
                    : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:border-emerald-500/50 hover:text-emerald-300'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentUser.isVIP ? 'VIP Gold Actif 👑' : 'Devenir VIP (MoMo)'}</span>
              </button>

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="py-1.5 px-3 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-stone-300 text-xs font-medium inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Photo Galerie</span>
              </button>
            </div>
          </div>

          {/* Name & Handle */}
          <div className="space-y-1 mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">{currentUser.name}</h2>
              {currentUser.isVerified && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
              )}
            </div>
            <p className="text-xs text-emerald-400/90 font-mono font-medium">{currentUser.username}</p>
          </div>

          {/* 3. Stats Bar (Abonnés / Suivis / Publications - 100% Dynamique & Temps Réel) */}
          <div className="grid grid-cols-4 gap-2 py-3.5 px-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 text-center mb-4">
            <div>
              <span className="block text-base sm:text-lg font-bold text-white tracking-tight">
                {(currentUser.followersCount ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">Abonnés</span>
            </div>
            <div>
              <span className="block text-base sm:text-lg font-bold text-white tracking-tight">
                {(currentUser.followingCount ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">Suivis</span>
            </div>
            <div>
              <span className="block text-base sm:text-lg font-bold text-white tracking-tight">
                {userPosts.length}
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">Publications</span>
            </div>
            <div>
              <span className="block text-base sm:text-lg font-bold text-emerald-400 tracking-tight">
                {currentUser.walletBalance.toLocaleString()} {currentUser.currency}
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider">Solde MoMo</span>
            </div>
          </div>

          {/* 4. Action Buttons (Neon Green / Emerald Green Rounded Buttons) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {/* Nouveau Post / Publier Button */}
            <button
              id="profile-create-post-btn"
              onClick={onOpenCreatePost}
              className="py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-500/25 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Publier</span>
            </button>

            {/* Modifier Profil Button */}
            <button
              id="profile-edit-btn"
              onClick={onOpenSettings}
              className="py-2.5 px-3 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-stone-200 hover:text-white font-medium text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modifier</span>
            </button>

            {/* Mes Amis Button */}
            {onOpenContacts && (
              <button
                id="profile-friends-btn"
                onClick={onOpenContacts}
                className="py-2.5 px-3 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-stone-200 hover:text-white font-medium text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mes Amis</span>
              </button>
            )}

            {/* Recharge MoMo Button */}
            <button
              id="profile-deposit-btn"
              onClick={onOpenDeposit}
              className="py-2.5 px-3 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recharge MoMo</span>
            </button>
          </div>

          {/* 5. Bio Section */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 space-y-2 mb-4">
            <p className="text-xs text-stone-200 leading-relaxed">
              {currentUser.bio || "Membre passionné de la communauté AfriChat Connect 🚀"}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400 pt-1 border-t border-stone-850">
              <div className="flex items-center space-x-1">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>{currentUser.country}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Membre Authentifié Supabase</span>
              </div>
            </div>
          </div>

          {/* Founder Support & Official Contact */}
          {onOpenFounderInfo && (
            <div className="mb-4">
              <button
                id="profile-founder-info-btn"
                onClick={onOpenFounderInfo}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-emerald-950/30 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-emerald-400" />
                  <span>Coordonnées Officielles du Fondateur & Support</span>
                </div>
                <span className="text-[11px] text-emerald-400/90 font-mono">Consulter →</span>
              </button>
            </div>
          )}

          {/* Official Social Media Channels (Facebook, TikTok, YouTube with 1-Click Deep Links) */}
          <div className="pt-3 border-t border-stone-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chaînes Officielles AfriChat • 1-Clic</span>
              </span>
              <span className="text-[10px] text-stone-500 font-mono">Deep Links App</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => openSocialDeepLink('facebook')}
                className="py-2 px-2.5 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-[#1877F2] font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm group"
                title="Suivre sur Facebook"
              >
                <Facebook className="w-3.5 h-3.5 text-[#1877F2] group-hover:scale-110 transition-transform" />
                <span className="text-white text-[11px]">Facebook</span>
              </button>

              <button
                type="button"
                onClick={() => openSocialDeepLink('tiktok')}
                className="py-2 px-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm group"
                title="S'abonner sur TikTok"
              >
                <Video className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-white text-[11px]">TikTok</span>
              </button>

              <button
                type="button"
                onClick={() => openSocialDeepLink('youtube')}
                className="py-2 px-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm group"
                title="S'abonner sur YouTube"
              >
                <Youtube className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="text-white text-[11px]">YouTube</span>
              </button>
            </div>
          </div>

          {/* Quick App Actions: Share App & Install PWA */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-850">
            <button
              id="profile-share-app-btn"
              onClick={handleShareClick}
              className="py-2 px-3 rounded-full bg-stone-900 hover:bg-stone-850 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Partager l'App</span>
            </button>

            {onOpenInstallPwa && (
              <button
                id="profile-install-pwa-btn"
                onClick={onOpenInstallPwa}
                className={`py-2 px-3 rounded-full border font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  isIOSDevice()
                    ? 'bg-sky-950/40 hover:bg-sky-900/50 border-sky-500/40 text-sky-300'
                    : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/40 text-emerald-300'
                }`}
              >
                {isIOSDevice() ? (
                  <Share className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{isIOSDevice() ? 'Installer iOS' : 'Installer PWA'}</span>
              </button>
            )}
          </div>

          {/* Account Status / Auth Actions */}
          <div className="mt-3 pt-3 border-t border-stone-850 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-2 text-stone-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono">
                {currentUser.email ? currentUser.email : `ID: ${currentUser.id.substring(0, 12)}...`}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {onOpenAuth && (
                <button
                  id="profile-open-auth-btn"
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-emerald-300 border border-stone-800 text-[11px] font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <LogIn className="w-3 h-3 text-emerald-400" />
                  <span>Compte</span>
                </button>
              )}
              {onLogout && (
                <button
                  id="profile-logout-btn"
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-medium flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Déconnexion</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6. Grille / Contenus / Statistiques Tabs */}
      <div className="flex items-center justify-around border-b border-stone-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('posts')}
          className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'posts'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Publications ({userPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('unlocked')}
          className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'unlocked'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Contenus VIP ({unlockedPostsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Statistiques</span>
        </button>
      </div>

      {/* Tab 1: Posts Grid */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {userPosts.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#09090b] border border-stone-800 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-900 text-emerald-400 flex items-center justify-center">
                <Grid className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-stone-200">Aucune publication pour l'instant</h4>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Partagez votre première photo, vidéo ou pensée avec la communauté AfriChat Connect !
              </p>
              <button
                onClick={onOpenCreatePost}
                className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                + Créer une publication
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 group"
                >
                  {post.mediaUrl && post.mediaUrl.trim() ? (
                    post.mediaType === 'video' ? (
                      <video
                        src={post.mediaUrl.trim()}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <img
                        src={post.mediaUrl.trim()}
                        alt={post.content}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )
                  ) : (
                    <div className="p-3 text-xs text-stone-300 flex items-center justify-center h-full text-center">
                      {post.content.slice(0, 70)}...
                    </div>
                  )}
                  {post.isVIPOnly && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 font-black text-[9px] shadow flex items-center space-x-0.5">
                      <Crown className="w-2.5 h-2.5" />
                      <span>VIP</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-3">
                    <span className="flex items-center space-x-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>{post.likesCount}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                      <span>{post.commentsCount}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: VIP Content */}
      {activeTab === 'unlocked' && (
        <div className="p-6 rounded-3xl bg-[#09090b] border border-stone-800 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-stone-200">Accès VIP & Salons Actifs</h4>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            Vous avez accès à tous les tutoriels exclusifs, directs et salons VIP débloqués via Orange Money, Wave, MTN MoMo et Carte Bancaire.
          </p>
        </div>
      )}

      {/* Tab 3: Detailed Stats */}
      {activeTab === 'stats' && (
        <div className="p-5 rounded-3xl bg-[#09090b] border border-stone-800 space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Statistiques Détaillées de votre Profil</span>
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-850">
              <span className="text-[11px] text-stone-400 block">Vues du profil (30j)</span>
              <span className="text-xl font-bold text-white">18 420</span>
              <span className="text-[10px] text-emerald-400 mt-1 block">↑ +24% ce mois-ci</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-850">
              <span className="text-[11px] text-stone-400 block">Taux d'engagement</span>
              <span className="text-xl font-bold text-emerald-400">8.7%</span>
              <span className="text-[10px] text-stone-400 mt-1 block">Top 5% créateurs</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
