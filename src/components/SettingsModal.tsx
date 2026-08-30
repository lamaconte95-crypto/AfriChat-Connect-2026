import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { 
  X, 
  User as UserIcon, 
  Sun, 
  Moon, 
  Shield, 
  Bell, 
  Smartphone, 
  Check, 
  Camera, 
  Sparkles, 
  Crown, 
  Globe, 
  Save, 
  CheckCircle,
  Palette,
  Lock,
  Unlock,
  Wallet,
  ArrowRight,
  Megaphone,
  EyeOff,
  Tag,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Square,
  UserX,
  Search,
  Users,
  ShieldAlert,
  AlertTriangle,
  CreditCard,
  Copy,
  Zap,
  CheckCircle2,
  Info,
  Fingerprint,
  LogOut,
  Mail,
  MessageCircle,
  MapPin,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { User, AdSettings, AdItem, Contact, StripeVipPlan } from '../types';
import { STRIPE_PUBLIC_KEY, STRIPE_VIP_PLANS } from '../data/mockData';

export type AppTheme = 'dark' | 'light';

export type SettingsTabType = 'profile' | 'vip' | 'appearance' | 'notifications' | 'ads' | 'blocked' | 'about';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  currentTheme: AppTheme;
  onToggleTheme: (theme: AppTheme) => void;
  adSettings?: AdSettings;
  onUpdateAdSettings?: (updatedSettings: AdSettings) => void;
  ads?: AdItem[];
  onTestAd?: (ad: AdItem) => void;
  contacts?: Contact[];
  onToggleBlock?: (contactId: string) => void;
  onOpenContactProfile?: (contact: Contact) => void;
  onOpenStripePayment?: (planId?: string) => void;
  onOpenFlutterwaveVip?: (planId?: string) => void;
  onOpenAdminPortal?: () => void;
  onLogout?: () => void;
  onOpenAuth?: () => void;
  initialTab?: SettingsTabType;
}

// Avatar color styles (Initials on neutral colored backgrounds)
const AVATAR_COLOR_STYLES = [
  { id: 'stone', bg: 'bg-stone-800', border: 'border-stone-700', text: 'text-stone-200' },
  { id: 'amber', bg: 'bg-amber-950/60', border: 'border-amber-700/60', text: 'text-amber-300' },
  { id: 'emerald', bg: 'bg-emerald-950/60', border: 'border-emerald-700/60', text: 'text-emerald-300' },
  { id: 'sky', bg: 'bg-sky-950/60', border: 'border-sky-700/60', text: 'text-sky-300' },
  { id: 'purple', bg: 'bg-purple-950/60', border: 'border-purple-700/60', text: 'text-purple-300' },
  { id: 'rose', bg: 'bg-rose-950/60', border: 'border-rose-700/60', text: 'text-rose-300' },
];

const AFRICAN_COUNTRIES = [
  { name: 'Côte d’Ivoire', code: 'CI', flag: '🇨🇮' },
  { name: 'Sénégal', code: 'SN', flag: '🇸🇳' },
  { name: 'Cameroun', code: 'CM', flag: '🇨🇲' },
  { name: 'Guinée', code: 'GN', flag: '🇬🇳' },
  { name: 'RD Congo', code: 'CD', flag: '🇨🇩' },
  { name: 'Mali', code: 'ML', flag: '🇲🇱' },
  { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫' },
  { name: 'Gabon', code: 'GA', flag: '🇬🇦' },
  { name: 'Togo', code: 'TG', flag: '🇹🇬' },
  { name: 'Bénin', code: 'BJ', flag: '🇧🇯' },
  { name: 'France (Diaspora)', code: 'FR', flag: '🇫🇷' },
  { name: 'Canada / USA', code: 'US', flag: '🌍' },
];

const INTEREST_TOPICS = [
  'Mobile Money & FinTech',
  'Mode Africaine & Wax',
  'Tech & Innovations IA',
  'Voyages & Billetterie',
  'Musique & Spectacles',
  'Gastronomie & Recettes',
  'Investissement & Immobilier',
  'E-Commerce & Bonnes Affaires'
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  currentTheme,
  onToggleTheme,
  adSettings,
  onUpdateAdSettings,
  ads = [],
  onTestAd,
  contacts = [],
  onToggleBlock,
  onOpenContactProfile,
  onOpenStripePayment,
  onOpenFlutterwaveVip,
  onOpenAdminPortal,
  onLogout,
  onOpenAuth,
  initialTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);
  const [blockedSearchQuery, setBlockedSearchQuery] = useState('');
  const [selectedContactToBlock, setSelectedContactToBlock] = useState('');

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Blocked contacts list
  const blockedContacts = contacts.filter((c) => c.isBlocked);
  const unblockedContacts = contacts.filter((c) => !c.isBlocked);

  const filteredBlockedContacts = blockedContacts.filter((c) => {
    if (!blockedSearchQuery.trim()) return true;
    const q = blockedSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    );
  });

  // Form State
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [selectedCountry, setSelectedCountry] = useState(currentUser.country);
  const [selectedFlag, setSelectedFlag] = useState(currentUser.flag);
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [isVIP, setIsVIP] = useState(currentUser.isVIP);
  const [currency, setCurrency] = useState(currentUser.currency || 'FCFA');
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

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
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedAvatar(compressed);
          setCustomAvatarInput(compressed);
        } else {
          setSelectedAvatar(rawDataUrl);
          setCustomAvatarInput(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // VIP & Stripe state in Settings
  const [selectedVipPlan, setSelectedVipPlan] = useState<StripeVipPlan>(STRIPE_VIP_PLANS[1]);
  const [settingsPayMethod, setSettingsPayMethod] = useState<'card' | 'apple_pay' | 'google_pay'>('card');
  const [settingsCardNumber, setSettingsCardNumber] = useState('4242 4242 4242 4242');
  const [settingsCardExpiry, setSettingsCardExpiry] = useState('12/28');
  const [settingsCardCvc, setSettingsCardCvc] = useState('424');
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [copiedKeyInSettings, setCopiedKeyInSettings] = useState(false);

  // Preferences
  const [notificationsPush, setNotificationsPush] = useState(true);
  const [callSounds, setCallSounds] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [saveAlertMessage, setSaveAlertMessage] = useState('Profil et préférences enregistrés avec succès ! ✨');

  // Ads local state
  const [adsEnabled, setAdsEnabled] = useState(adSettings?.adsEnabled ?? true);
  const [isVipAdFree, setIsVipAdFree] = useState(adSettings?.isVipAdFree ?? false);
  const [showBottomBanner, setShowBottomBanner] = useState(adSettings?.showBottomBanner ?? true);
  const [showFeedSponsoredPosts, setShowFeedSponsoredPosts] = useState(adSettings?.showFeedSponsoredPosts ?? true);
  const [showSalonPromotions, setShowSalonPromotions] = useState(adSettings?.showSalonPromotions ?? true);
  const [personalizedAds, setPersonalizedAds] = useState(adSettings?.personalizedAds ?? true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    adSettings?.interests ?? ['Mobile Money & FinTech', 'Mode Africaine & Wax', 'Tech & Innovations IA']
  );

  if (!isOpen) return null;

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = AFRICAN_COUNTRIES.find((c) => c.name === e.target.value);
    if (found) {
      setSelectedCountry(found.name);
      setSelectedFlag(found.flag);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUser: User = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      username: username.trim().startsWith('@') ? username.trim() : `@${username.trim()}`,
      bio: bio.trim(),
      country: selectedCountry,
      flag: selectedFlag,
      avatar: customAvatarInput.trim() || selectedAvatar,
      isVIP: isVIP,
      currency: currency,
    };

    onUpdateUser(updatedUser);
    setSaveAlertMessage('Profil enregistré avec succès ! ✨');
    setShowSaveAlert(true);
    setTimeout(() => {
      setShowSaveAlert(false);
      onClose();
    }, 1200);
  };

  const handleSaveAdSettings = () => {
    if (onUpdateAdSettings) {
      onUpdateAdSettings({
        adsEnabled,
        isVipAdFree,
        showBottomBanner,
        showFeedSponsoredPosts,
        showSalonPromotions,
        personalizedAds,
        interests: selectedInterests,
      });
    }
    setSaveAlertMessage('Paramètres des publicités mis à jour ! 🎯');
    setShowSaveAlert(true);
    setTimeout(() => {
      setShowSaveAlert(false);
    }, 2000);
  };

  const handleToggleInterest = (topic: string) => {
    setSelectedInterests((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleQuickAdFreeToggle = () => {
    const nextState = !isVipAdFree;
    setIsVipAdFree(nextState);
    if (onUpdateAdSettings) {
      onUpdateAdSettings({
        adsEnabled,
        isVipAdFree: nextState,
        showBottomBanner,
        showFeedSponsoredPosts,
        showSalonPromotions,
        personalizedAds,
        interests: selectedInterests,
      });
    }
    setSaveAlertMessage(
      nextState
        ? 'Pass VIP Sans Pub Activé ! Toutes les annonces sont masquées. 🛡️✨'
        : 'Pass VIP Sans Pub Désactivé. Annonces réactivées.'
    );
    setShowSaveAlert(true);
    setTimeout(() => {
      setShowSaveAlert(false);
    }, 2500);
  };

  return (
    <AnimatePresence>
      <div
        id="settings-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden text-stone-100 my-6"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-950/60">
            <div className="flex items-center space-x-2.5">
              <button
                id="settings-modal-back-btn"
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 transition-all flex items-center space-x-1 cursor-pointer group"
                title="← Retour"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs font-bold text-amber-300">Retour</span>
              </button>

              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white flex items-center space-x-1.5">
                  <span>Paramètres & Réglages</span>
                  <span className="text-xs text-amber-400">⚙️</span>
                </h3>
                <p className="text-xs text-stone-400">Personnalisez votre profil et votre expérience AfriChat</p>
              </div>
            </div>

            <button
              id="settings-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Save Success Alert */}
          {showSaveAlert && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-emerald-500/20 border-b border-emerald-500/40 p-3 px-5 text-xs text-emerald-300 flex items-center space-x-2 font-bold"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveAlertMessage}</span>
            </motion.div>
          )}

          {/* Navigation Sub-Tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-stone-800 bg-stone-950/40 text-xs font-bold">
            <button
              id="settings-tab-profile"
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-1.5 flex items-center justify-center space-x-1 border-b-2 transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="text-xs">Profil</span>
            </button>

            <button
              id="settings-tab-vip"
              onClick={() => setActiveTab('vip')}
              className={`py-3 px-1.5 flex items-center justify-center space-x-1 border-b-2 transition-all cursor-pointer ${
                activeTab === 'vip'
                  ? 'border-[#635BFF] text-[#A29BFE] bg-[#635BFF]/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-black text-amber-300">VIP Stripe</span>
            </button>

            <button
              id="settings-tab-appearance"
              onClick={() => setActiveTab('appearance')}
              className={`py-3 px-1.5 flex items-center justify-center space-x-1 border-b-2 transition-all cursor-pointer ${
                activeTab === 'appearance'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              {currentTheme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span className="text-xs">Thème</span>
            </button>

            <button
              id="settings-tab-notifications"
              onClick={() => setActiveTab('notifications')}
              className={`py-3 px-1.5 flex items-center justify-center space-x-1 border-b-2 transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="text-xs">Options</span>
            </button>

            <button
              id="settings-tab-ads"
              onClick={() => setActiveTab('ads')}
              className={`py-3 px-1.5 flex items-center justify-center space-x-1 border-b-2 transition-all cursor-pointer ${
                activeTab === 'ads'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs">Pubs</span>
            </button>

            <button
              id="settings-tab-blocked"
              onClick={() => setActiveTab('blocked')}
              className={`py-3 px-1.5 flex items-center justify-center space-x-1 border-b-2 transition-all cursor-pointer ${
                activeTab === 'blocked'
                  ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserX className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs">Bloqués</span>
              {blockedContacts.length > 0 && (
                <span className="px-1 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                  {blockedContacts.length}
                </span>
              )}
            </button>

            <button
              id="settings-tab-about"
              onClick={() => setActiveTab('about')}
              className={`py-3 px-1.5 flex items-center justify-center space-x-1 border-b-2 transition-all cursor-pointer ${
                activeTab === 'about'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs">À propos</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
            {/* TAB 1: PROFILE EDITING */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Live Preview Card */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center space-x-4">
                  <div className="relative">
                    <UserAvatar
                      name={name}
                      username={username}
                      avatar={customAvatarInput.trim() || selectedAvatar}
                      size="xl"
                      flag={selectedFlag}
                      isVIP={isVIP}
                    />
                    {isVIP && (
                      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-[9px] shadow">
                        <Crown className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-black text-sm text-white truncate">{name || 'Votre nom'}</h4>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-xs text-amber-400 font-mono">{username || '@pseudo'}</p>
                    <p className="text-[11px] text-stone-400 truncate mt-0.5">{bio || 'Aucun statut renseigné'}</p>
                  </div>
                </div>

                {/* Avatar Presets Selection */}
                <div>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                    id="settings-avatar-file-input"
                  />

                  <label className="block text-xs font-bold text-stone-300 mb-2">
                    Photo de profil & Avatar (Téléphone & Ordinateur)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
                    >
                      <Camera size={14} className="text-emerald-400" />
                      <span>📸 Choisir une photo depuis mon appareil</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAvatar('');
                        setCustomAvatarInput('');
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition-all cursor-pointer ${
                        !selectedAvatar && !customAvatarInput
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 ring-2 ring-amber-500/30'
                          : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <UserIcon size={14} />
                      <span>Initiales par défaut (Neutre)</span>
                    </button>
                  </div>

                  {/* Or Custom Image URL */}
                  <div className="mt-2.5">
                    <label className="block text-[11px] text-stone-400 mb-1">
                      Ou coller une URL d'image directe
                    </label>
                    <input
                      type="url"
                      placeholder="https://votre-domaine.com/photo.jpg ou data:image/..."
                      value={customAvatarInput}
                      onChange={(e) => {
                        setCustomAvatarInput(e.target.value);
                        setSelectedAvatar(e.target.value);
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Full Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Nom complet *
                    </label>
                    <input
                      id="settings-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Nom d'utilisateur (@) *
                    </label>
                    <input
                      id="settings-username-input"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Country & Flag */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Pays de résidence / Région 🌍
                  </label>
                  <div className="relative">
                    <select
                      id="settings-country-select"
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    >
                      {AFRICAN_COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status / Bio */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Statut & Bio (visible sur votre profil)
                  </label>
                  <textarea
                    id="settings-bio-input"
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Parlez de votre activité, de vos passions ou de vos créations..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* VIP Membership Toggle */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-300">Badge Créateur VIP AfriChat</div>
                      <div className="text-[10px] text-amber-400/80">Afficher la couronne et le badge vérifié</div>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVIP}
                      onChange={(e) => setIsVIP(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Save Profile Button */}
                <div className="pt-2">
                  <button
                    id="settings-save-profile-btn"
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-xs shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les Modifications du Profil</span>
                  </button>
                </div>

                {/* Account & Session Section */}
                <div className="pt-4 border-t border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-stone-200 flex items-center space-x-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                        <span>Compte & Authentification Firebase</span>
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {currentUser.email ? `Connecté avec ${currentUser.email}` : `ID: ${currentUser.id.substring(0, 12)}...`}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {onOpenAuth && (
                      <button
                        type="button"
                        id="settings-switch-account-btn"
                        onClick={() => {
                          onClose();
                          onOpenAuth();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>Changer de Compte</span>
                      </button>
                    )}
                    {onLogout && (
                      <button
                        type="button"
                        id="settings-logout-btn"
                        onClick={() => {
                          onClose();
                          onLogout();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Se Déconnecter</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* TAB: VIP STRIPE SUBSCRIPTION */}
            {activeTab === 'vip' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* VIP Status Card */}
                <div className={`p-5 rounded-3xl border-2 relative overflow-hidden ${
                  isVIP 
                    ? 'bg-gradient-to-br from-amber-500/20 via-stone-900 to-stone-950 border-amber-500 shadow-xl shadow-amber-500/10'
                    : 'bg-gradient-to-br from-[#635BFF]/20 via-stone-900 to-stone-950 border-[#635BFF]/50 shadow-xl'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                        isVIP 
                          ? 'bg-gradient-to-tr from-amber-400 to-amber-600 text-stone-950 shadow-amber-500/30'
                          : 'bg-[#635BFF] text-white shadow-[#635BFF]/30'
                      }`}>
                        <Crown className="w-7 h-7 fill-current" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isVIP ? 'bg-amber-400 text-stone-950' : 'bg-[#635BFF]/30 text-[#A29BFE] border border-[#635BFF]/50'
                          }`}>
                            {isVIP ? 'Statut VIP Actif ⭐' : 'Formule Standard'}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">Stripe SCA 2.0</span>
                        </div>
                        <h4 className="font-bold text-base text-white mt-0.5">
                          {isVIP ? 'Abonnement VIP Or Illimité' : 'Passez au VIP AfriChat Connect'}
                        </h4>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isVIP}
                        onChange={(e) => {
                          setIsVIP(e.target.checked);
                          onUpdateUser({ ...currentUser, isVIP: e.target.checked });
                          if (onUpdateAdSettings && adSettings) {
                            onUpdateAdSettings({ ...adSettings, isVipAdFree: e.target.checked });
                          }
                          setSaveAlertMessage(e.target.checked ? 'Statut VIP activé ! Expérience sans publicité activée.' : 'Statut VIP désactivé.');
                          setShowSaveAlert(true);
                          setTimeout(() => setShowSaveAlert(false), 3000);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  <p className="text-xs text-stone-300 mt-3 leading-relaxed">
                    {isVIP 
                      ? '✨ Vous bénéficiez du badge vérifié Gold, de la suppression totale des publicités, des salons créateurs exclusifs et des appels HD illimités.'
                      : 'Rejoignez le club VIP pour supprimer 100% des publicités, obtenir votre badge officiel Gold et accéder aux salons exclusifs des créateurs africains.'}
                  </p>

                  {/* Active Perks Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-800/80 text-[11px]">
                    <div className="flex items-center space-x-1.5 text-stone-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>100% Sans Publicité</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-stone-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Badge Gold Vérifié</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-stone-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Salons & Lives 4K</span>
                    </div>
                  </div>
                </div>

                {/* Stripe Live Config Inspector Box */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-[#635BFF] flex items-center justify-center text-white font-black text-[10px]">
                        S
                      </div>
                      <span className="font-bold text-white">Passerelle Stripe Connect Intégrée</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30">
                        Mode Test
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(STRIPE_PUBLIC_KEY);
                        setCopiedKeyInSettings(true);
                        setTimeout(() => setCopiedKeyInSettings(false), 2000);
                      }}
                      className="flex items-center space-x-1 text-[11px] text-[#A29BFE] hover:text-white px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 transition-colors"
                    >
                      {copiedKeyInSettings ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKeyInSettings ? 'Copié !' : 'Copier Clé Publique'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-900 font-mono text-[10px] text-stone-300 break-all select-all border border-stone-800/80">
                    {STRIPE_PUBLIC_KEY}
                  </div>
                </div>

                {/* Plans Selection */}
                <div>
                  <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Choisissez votre Formule VIP Stripe</span>
                    <span className="text-[11px] text-amber-400 normal-case font-medium">Reçu fiscal & TVA inclus</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {STRIPE_VIP_PLANS.map((plan) => {
                      const isSelected = selectedVipPlan.id === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedVipPlan(plan)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gradient-to-b from-[#635BFF]/20 to-stone-900 border-[#635BFF] ring-2 ring-[#635BFF]/30'
                              : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          {plan.badge && (
                            <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-[9px]">
                              {plan.badge}
                            </span>
                          )}
                          <div>
                            <div className="text-xs font-black text-white">{plan.name}</div>
                            <div className="text-[11px] text-stone-400">{plan.durationLabel}</div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-stone-800">
                            <div className="text-base font-black text-amber-400">
                              {plan.priceFcfa.toLocaleString()} <span className="text-xs">FCFA</span>
                            </div>
                            <div className="text-[10px] text-stone-400">
                              env. {plan.priceEur.toFixed(2)} €
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Methods Selection for VIP */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                      Méthodes de Règlement Stripe Actives
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>3D-Secure 2.0</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettingsPayMethod('card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                        settingsPayMethod === 'card'
                          ? 'bg-[#635BFF]/20 border-[#635BFF] text-white'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-[#A29BFE]" />
                      <span>Carte Bancaire</span>
                      <span className="text-[9px] font-normal text-stone-400">Visa, MC, CB</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettingsPayMethod('apple_pay')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                        settingsPayMethod === 'apple_pay'
                          ? 'bg-stone-800 border-white text-white'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      <span className="text-sm font-black">Pay</span>
                      <span>Apple Pay</span>
                      <span className="text-[9px] font-normal text-stone-400">Touch ID</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettingsPayMethod('google_pay')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                        settingsPayMethod === 'google_pay'
                          ? 'bg-blue-950/40 border-blue-400 text-white'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}
                    >
                      <span className="text-xs font-black text-blue-400">G Pay</span>
                      <span>Google Pay</span>
                      <span className="text-[9px] font-normal text-stone-400">1-Click</span>
                    </button>
                  </div>

                  {/* Card quick form */}
                  {settingsPayMethod === 'card' && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span>Carte de test Stripe :</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsCardNumber('4242 4242 4242 4242');
                            setSettingsCardExpiry('12/28');
                            setSettingsCardCvc('424');
                          }}
                          className="text-[#A29BFE] hover:underline font-bold"
                        >
                          Remplir 4242 ⚡️
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={settingsCardNumber}
                            onChange={(e) => setSettingsCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs font-mono text-stone-100 focus:outline-none focus:border-[#635BFF]"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={settingsCardExpiry}
                            onChange={(e) => setSettingsCardExpiry(e.target.value)}
                            placeholder="MM/AA"
                            className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs font-mono text-center text-stone-100 focus:outline-none focus:border-[#635BFF]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Primary Trigger / Modal Launcher */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      id="settings-open-stripe-modal-btn"
                      onClick={() => {
                        if (onOpenStripePayment) {
                          onOpenStripePayment(selectedVipPlan.id);
                        }
                      }}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#635BFF] via-[#7B73FF] to-[#635BFF] text-white font-black text-xs shadow-lg shadow-[#635BFF]/30 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Ouvrir Stripe Elements (Carte)</span>
                    </button>

                    <button
                      type="button"
                      id="settings-quick-stripe-pay-btn"
                      disabled={isStripeProcessing}
                      onClick={() => {
                        setIsStripeProcessing(true);
                        setTimeout(() => {
                          setIsStripeProcessing(false);
                          setIsVIP(true);
                          onUpdateUser({ ...currentUser, isVIP: true });
                          if (onUpdateAdSettings && adSettings) {
                            onUpdateAdSettings({ ...adSettings, isVipAdFree: true });
                          }
                          setSaveAlertMessage(`Paiement Stripe de ${selectedVipPlan.priceFcfa.toLocaleString()} FCFA confirmé ! Vous êtes maintenant VIP Or ⭐`);
                          setShowSaveAlert(true);
                          setTimeout(() => setShowSaveAlert(false), 3500);
                        }, 1200);
                      }}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
                    >
                      {isStripeProcessing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                          <span>Validation Stripe en cours...</span>
                        </>
                      ) : (
                        <>
                          <Crown className="w-3.5 h-3.5 fill-stone-950" />
                          <span>Payer {selectedVipPlan.priceFcfa.toLocaleString()} FCFA ({settingsPayMethod === 'apple_pay' ? 'Pay' : settingsPayMethod === 'google_pay' ? 'GPay' : 'Carte'})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* FLUTTERWAVE MOBILE MONEY VIP SUBSCRIPTION CARD */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-orange-500/20 via-stone-900 to-stone-950 border-2 border-orange-500/60 shadow-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FB702B] via-[#F55E1D] to-[#E24A12] flex items-center justify-center text-white font-black text-sm shadow-md">
                        FW
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-white">
                            Abonnement VIP Flutterwave Mobile Money
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-orange-500/30 text-orange-300 border border-orange-500/50 text-[9px] font-black uppercase">
                            Sandbox ⚡️
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-300">
                          Orange Money, Wave, MTN MoMo, Moov Flooz • Sans carte bancaire
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-amber-400">
                      {selectedVipPlan.priceFcfa.toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-300 bg-stone-950/80 p-2.5 rounded-xl border border-stone-800">
                    <span className="text-orange-400 font-bold">Réseaux pris en charge :</span>
                    <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded font-semibold">Orange Money CI/SN</span>
                    <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 rounded font-semibold">Wave SN/CI</span>
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded font-semibold">MTN MoMo</span>
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded font-semibold">Moov Flooz</span>
                  </div>

                  <button
                    type="button"
                    id="settings-open-flutterwave-vip-btn"
                    onClick={() => {
                      if (onOpenFlutterwaveVip) {
                        onOpenFlutterwaveVip(selectedVipPlan.id);
                      }
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FB702B] via-[#F55E1D] to-[#E24A12] hover:brightness-110 active:scale-[0.99] text-white font-black text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>S’abonner au VIP via Flutterwave Mobile Money ({selectedVipPlan.priceFcfa.toLocaleString()} FCFA)</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: THEME & APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-3">
                    Sélectionnez le Thème Visuel
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Dark Theme Card */}
                    <div
                      id="theme-option-dark"
                      onClick={() => onToggleTheme('dark')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        currentTheme === 'dark'
                          ? 'bg-stone-950 border-amber-500 ring-2 ring-amber-500/30 shadow-xl'
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center border border-stone-800">
                            <Moon className="w-4 h-4" />
                          </div>
                          {currentTheme === 'dark' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black">
                              Actif ✓
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-sm text-white">Mode Sombre (Dark Obsidian)</h5>
                        <p className="text-[11px] text-stone-400 leading-relaxed">
                          Élégant, reposant pour les yeux et économe en batterie avec accents Or Africain.
                        </p>
                      </div>

                      {/* Mini Preview Mockup */}
                      <div className="mt-4 p-2.5 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                        <div className="h-2 w-16 bg-amber-500 rounded" />
                        <div className="h-1.5 w-full bg-stone-800 rounded" />
                        <div className="h-1.5 w-2/3 bg-stone-800 rounded" />
                      </div>
                    </div>

                    {/* Light Theme Card */}
                    <div
                      id="theme-option-light"
                      onClick={() => onToggleTheme('light')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        currentTheme === 'light'
                          ? 'bg-stone-100 text-stone-900 border-amber-500 ring-2 ring-amber-500/30 shadow-xl'
                          : 'bg-stone-200/90 text-stone-800 border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300">
                            <Sun className="w-4 h-4" />
                          </div>
                          {currentTheme === 'light' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black">
                              Actif ✓
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-sm text-stone-950">Mode Clair (Light Sand)</h5>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          Palette lumineuse et chaleureuse, idéale pour une consultation en plein jour.
                        </p>
                      </div>

                      {/* Mini Preview Mockup Light */}
                      <div className="mt-4 p-2.5 rounded-xl bg-white border border-stone-200 space-y-1.5 shadow-sm">
                        <div className="h-2 w-16 bg-amber-500 rounded" />
                        <div className="h-1.5 w-full bg-stone-200 rounded" />
                        <div className="h-1.5 w-2/3 bg-stone-200 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography & Visual Accents */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-300">Police d'affichage</span>
                    <span className="text-amber-400 font-mono font-bold">Plus Jakarta Sans (AfriCraft)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-300">Couleur d'accentuation</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500 ring-2 ring-amber-400/50" />
                      <span className="text-stone-400 text-[11px]">Or Soleil & Ambre</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PREFERENCES & NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {/* Mobile Money Currency Setting */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                  <label className="block text-xs font-bold text-stone-300">
                    Devise par défaut pour le Mobile Money
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['FCFA', 'EUR', 'USD', 'GNF'].map((curr) => (
                      <button
                        type="button"
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          currency === curr
                            ? 'bg-amber-500 text-stone-950 border-amber-500 shadow'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification Toggles */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3 divide-y divide-stone-800/60">
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-xs font-bold text-stone-200">Notifications Push Instantanées</div>
                      <div className="text-[10px] text-stone-400">Nouveaux messages, likes et abonnements</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationsPush}
                      onChange={(e) => setNotificationsPush(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-xs font-bold text-stone-200">Sonneries d'appels audio & vidéo</div>
                      <div className="text-[10px] text-stone-400">Jouer les tonalités lors de la réception d'appels</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={callSounds}
                      onChange={(e) => setCallSounds(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-xs font-bold text-stone-200">Accusés de lecture (✓✓)</div>
                      <div className="text-[10px] text-stone-400">Indiquer quand vos messages sont vus</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={readReceipts}
                      onChange={(e) => setReadReceipts(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Security info */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start space-x-3 text-xs text-emerald-300">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <p className="text-[11px] leading-relaxed">
                    Vos conversations et transactions Mobile Money sont protégées par le chiffrement de bout en bout et les protocoles sécurisés Orange Money, Wave et MTN MoMo.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: ADS MANAGEMENT & VIP AD-FREE PASS */}
            {activeTab === 'ads' && (
              <div className="space-y-4">
                {/* VIP Pass Sans Pub Banner Card */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-stone-950 via-amber-950/30 to-stone-950 border-2 border-amber-500/50 shadow-xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-orange-500/20">
                        <Crown className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-black text-sm text-white">Pass AfriChat VIP Sans Pub</h4>
                          {isVipAdFree ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black">
                              ACTIF ✓
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                              Option Premium
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-300 mt-0.5">
                          Supprimez 100% des bannières et annonces sponsorisées pour une navigation ultra-fluide.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                    <div className="text-[11px] text-amber-300 font-mono">
                      {isVipAdFree ? '✨ Expérience Pure Ad-Free Activée' : '1.000 FCFA / mois ou Gratuit Créateur VIP'}
                    </div>

                    <button
                      id="toggle-ad-free-vip-btn"
                      type="button"
                      onClick={handleQuickAdFreeToggle}
                      className={`px-4 py-2 rounded-xl font-black text-xs transition-all shadow cursor-pointer flex items-center space-x-1.5 ${
                        isVipAdFree
                          ? 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white border border-stone-700'
                          : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 shadow-orange-500/20 scale-105'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>{isVipAdFree ? 'Désactiver le Pass' : 'Activer le Pass Sans Pub'}</span>
                    </button>
                  </div>
                </div>

                {/* Granular Ads Toggles */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3 divide-y divide-stone-800/60">
                  <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider pb-1">
                    Préférences d’Affichage des Annonces
                  </h4>

                  {/* Master Toggle */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-xs font-bold text-stone-200">Autoriser les annonces partenaires</div>
                      <div className="text-[10px] text-stone-400">Soutenir le réseau AfriChat et découvrir des offres locales</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adsEnabled && !isVipAdFree}
                        disabled={isVipAdFree}
                        onChange={(e) => setAdsEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-disabled:opacity-50"></div>
                    </label>
                  </div>

                  {/* Bottom Banner Toggle */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-xs font-bold text-stone-200">Bannière discrète en bas d’écran</div>
                      <div className="text-[10px] text-stone-400">Mini encart discret avec offres de télécom & banques</div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!adsEnabled || isVipAdFree}
                      checked={showBottomBanner}
                      onChange={(e) => setShowBottomBanner(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>

                  {/* Sponsored Feed Posts Toggle */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-xs font-bold text-stone-200">Publications sponsorisées dans le fil</div>
                      <div className="text-[10px] text-stone-400">Annonces natives certifiées avec codes promo exclusifs</div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!adsEnabled || isVipAdFree}
                      checked={showFeedSponsoredPosts}
                      onChange={(e) => setShowFeedSponsoredPosts(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>

                  {/* Salon Promotions Toggle */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-xs font-bold text-stone-200">Promotions des salons VIP & créateurs</div>
                      <div className="text-[10px] text-stone-400">Suggestions d'événements et masterclasses africaines</div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!adsEnabled || isVipAdFree}
                      checked={showSalonPromotions}
                      onChange={(e) => setShowSalonPromotions(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>

                  {/* Algorithmic Personalization */}
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-xs font-bold text-stone-200">Personnalisation intelligente</div>
                      <div className="text-[10px] text-stone-400">Adapter les offres à votre pays et centres d'intérêts</div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!adsEnabled || isVipAdFree}
                      checked={personalizedAds}
                      onChange={(e) => setPersonalizedAds(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Personalized Interests Selection */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-300">
                      Vos centres d'intérêt pour les bons plans
                    </label>
                    <span className="text-[10px] text-amber-400">
                      {selectedInterests.length} sélectionnés
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {INTEREST_TOPICS.map((topic) => {
                      const isSelected = selectedInterests.includes(topic);
                      return (
                        <button
                          type="button"
                          key={topic}
                          onClick={() => handleToggleInterest(topic)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                              : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
                          }`}
                        >
                          <span>{topic}</span>
                          {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Preview & Direct Testing Section */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                      Tester une Annonce Partenaire en Direct
                    </h4>
                    <span className="text-[10px] text-stone-400">Mode Démo / Aperçu</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ads.slice(0, 4).map((ad) => (
                      <button
                        type="button"
                        key={ad.id}
                        onClick={() => {
                          if (onTestAd) {
                            onTestAd(ad);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/40 text-left transition-all flex items-center space-x-2.5 cursor-pointer group"
                      >
                        {ad.sponsorLogo ? (
                          <img
                            src={ad.sponsorLogo}
                            alt={ad.sponsorName}
                            className="w-8 h-8 rounded-lg object-cover border border-stone-700 group-hover:border-amber-500 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-stone-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {ad.sponsorName?.charAt(0) || 'A'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-stone-200 truncate group-hover:text-amber-400">
                            {ad.sponsorName}
                          </div>
                          <div className="text-[10px] text-stone-400 truncate">
                            {ad.title}
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Ad Settings Button */}
                <div className="pt-1">
                  <button
                    id="save-ad-settings-btn"
                    type="button"
                    onClick={handleSaveAdSettings}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-xs shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les Préférences Publicitaires</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: BLOCKED CONTACTS & SECURITY */}
            {activeTab === 'blocked' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Security Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-stone-900 to-rose-950/40 border border-rose-800/60 text-stone-200 space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-rose-300">Sécurité & Contacts Bloqués</h4>
                      <p className="text-[11px] text-stone-400">
                        Gérez les utilisateurs restreints sur votre compte AfriChat Connect.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-300 pl-1 leading-relaxed border-t border-rose-900/50 pt-2">
                    🔒 <span className="font-semibold text-rose-300">Effet du blocage :</span> Les utilisateurs bloqués ne peuvent plus vous envoyer de messages, vous appeler en audio/vidéo HD, ni voir vos publications privées.
                  </p>
                </div>

                {/* Quick Block Helper / Selector for testing */}
                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-200 flex items-center space-x-1.5">
                      <UserX className="w-4 h-4 text-amber-400" />
                      <span>Bloquer un utilisateur de l'annuaire</span>
                    </label>
                    <span className="text-[10px] text-stone-400 font-mono">Test rapide</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      id="settings-select-contact-to-block"
                      value={selectedContactToBlock}
                      onChange={(e) => setSelectedContactToBlock(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Choisir un contact à bloquer --</option>
                      {unblockedContacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.username}) {c.flag}
                        </option>
                      ))}
                    </select>

                    <button
                      id="settings-execute-block-btn"
                      type="button"
                      disabled={!selectedContactToBlock}
                      onClick={() => {
                        if (selectedContactToBlock && onToggleBlock) {
                          onToggleBlock(selectedContactToBlock);
                          setSelectedContactToBlock('');
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow transition-all cursor-pointer shrink-0"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloquer</span>
                    </button>
                  </div>
                </div>

                {/* Blocked List Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-stone-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <span>Utilisateurs bloqués</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                        {blockedContacts.length}
                      </span>
                    </h4>
                    {blockedContacts.length > 0 && (
                      <span className="text-[11px] text-stone-400">
                        Déblocage instantané en 1 clic
                      </span>
                    )}
                  </div>

                  {blockedContacts.length > 0 && (
                    <div className="relative">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <input
                        id="search-blocked-contacts-input"
                        type="text"
                        placeholder="Rechercher dans les contacts bloqués..."
                        value={blockedSearchQuery}
                        onChange={(e) => setBlockedSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                      />
                      {blockedSearchQuery && (
                        <button
                          onClick={() => setBlockedSearchQuery('')}
                          className="absolute right-3 top-2.5 p-1 text-stone-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {filteredBlockedContacts.length === 0 ? (
                    <div className="p-8 text-center space-y-3 rounded-2xl bg-stone-950/60 border border-stone-800/80">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-200">
                          {blockedContacts.length === 0
                            ? 'Aucun contact bloqué'
                            : 'Aucun contact ne correspond à votre recherche'}
                        </p>
                        <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                          {blockedContacts.length === 0
                            ? 'Votre liste de blocage est vide. Tous vos contacts peuvent communiquer librement avec vous.'
                            : 'Vérifiez l’orthographe du nom ou du @pseudo recherché.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-800/80 rounded-2xl bg-stone-900/80 border border-stone-800 overflow-hidden shadow-lg">
                      {filteredBlockedContacts.map((contact) => (
                        <div
                          key={contact.id}
                          id={`blocked-contact-row-${contact.id}`}
                          className="p-3.5 flex items-center justify-between hover:bg-stone-800/50 transition-colors"
                        >
                          {/* Contact Info */}
                          <div 
                            onClick={() => onOpenContactProfile?.(contact)}
                            className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer group"
                          >
                            <div className="relative shrink-0">
                              <UserAvatar
                                name={contact.name}
                                username={contact.username}
                                avatar={contact.avatar}
                                flag={contact.flag}
                                isVIP={contact.isVIP}
                                size="lg"
                                className="w-11 h-11 rounded-2xl border-2 border-rose-700/80 grayscale contrast-125 group-hover:border-amber-400 transition-all"
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                                <Lock className="w-2.5 h-2.5" />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-xs text-stone-200 truncate group-hover:text-amber-400 transition-colors">
                                  {contact.name}
                                </span>
                                <span>{contact.flag}</span>
                                {contact.isVIP && (
                                  <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-stone-400">
                                <span className="font-mono text-rose-400/90">{contact.username}</span>
                                <span>•</span>
                                <span>{contact.country}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button: 1-Click Unblock */}
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              id={`settings-unblock-btn-${contact.id}`}
                              type="button"
                              onClick={() => {
                                if (onToggleBlock) {
                                  onToggleBlock(contact.id);
                                }
                              }}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-stone-950 font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                              title={`Débloquer ${contact.name}`}
                            >
                              <Unlock className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Débloquer</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 7: ABOUT & FOUNDER SUPPORT */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                {/* App Brand Header */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/20 border border-amber-500/30 flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center font-black text-xl shadow-lg">
                    🌍
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white flex items-center space-x-1.5">
                      <span>AfriChat Connect Panafricain</span>
                      <span className="text-amber-400 text-xs">v2.6</span>
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Réseau Social • Messagerie Sécurisée • Live Studio RTC • Monétisation Mobile Money
                    </p>
                  </div>
                </div>

                {/* Founder Official Profile & Residence Portugal */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3.5">
                  <div className="flex items-start space-x-3.5">
                    <UserAvatar
                      name="Lama Conte"
                      username="@lamaconte"
                      size="lg"
                      flag="🇵🇹"
                      isVerified={true}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h5 className="font-black text-sm text-white">Lama Conte</h5>
                        <span className="text-base" title="Résidence au Portugal">🇵🇹</span>
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-xs font-bold text-amber-400">Fondateur & Architecte en Chef</p>
                      <div className="flex items-center space-x-1 text-[11px] text-stone-300 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>Résidence :</strong> Portugal 🇵🇹 (Europe) • Origine Panafricaine</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/90 p-3 rounded-xl border border-stone-800">
                    "Passionné de technologies panafricaines et de solutions numériques reliant le continent à sa diaspora. Bâtisseur de la plateforme AfriChat Connect pour l’autonomisation des créateurs et des entreprises africaines."
                  </p>

                  {/* Direct Contact & WhatsApp Button */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">
                      Support Direct & Ligne Fondateur
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* WhatsApp Direct */}
                      <a
                        href="https://wa.me/351920414660"
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-900/40 transition-all flex items-center justify-between group cursor-pointer shadow"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold shadow">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block font-semibold">WhatsApp Direct</span>
                            <span className="text-xs font-black text-emerald-300">+351 920 41 46 60</span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-300" />
                      </a>

                      {/* Direct Phone Call */}
                      <a
                        href="tel:+351920414660"
                        className="p-3 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-400 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block font-semibold">Téléphone Ligne Directe</span>
                            <span className="text-xs font-bold text-stone-200">+351 920 41 46 60</span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400" />
                      </a>

                      {/* Official Email */}
                      <a
                        href="mailto:lamaconte95@gmail.com"
                        className="p-3 rounded-xl bg-stone-900 border border-stone-700 hover:border-amber-400 transition-all flex items-center justify-between group cursor-pointer sm:col-span-2"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 block font-semibold">Email Direction & Partenariats</span>
                            <span className="text-xs font-bold text-stone-200">lamaconte95@gmail.com</span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400" />
                      </a>
                    </div>
                  </div>

                  {/* Connected Services Status */}
                  <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 space-y-2 text-xs">
                    <span className="text-[11px] font-bold text-stone-300 block">État des Services Connectés (Backend) :</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center space-x-2 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Supabase Database : Connecté (hhpuulthqvbjdwtcxftt)</span>
                      </div>
                      <div className="flex items-center space-x-2 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Agora Live & Appels RTC : Connecté (bec7d2fdad...)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-800 bg-stone-950 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
            <div className="flex items-center space-x-3">
              <span>AfriChat Connect v2.6 • Afrique & Monde</span>
              {onOpenAdminPortal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminPortal();
                  }}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center space-x-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3 inline" />
                  <span>Portail Administrateur (/admin)</span>
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
