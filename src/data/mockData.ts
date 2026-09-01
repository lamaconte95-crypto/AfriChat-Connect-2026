import { 
  User, 
  Post, 
  Story, 
  ChatConversation, 
  MobileMoneyOperator, 
  Transaction, 
  Contact, 
  AdItem, 
  AdSettings,
  GroupMember,
  RolePermissionConfig,
  GlobalAdminUser,
  AdminAuditLog,
  SystemSettings,
  StripeVipPlan,
  FounderInfo,
  VirtualGift,
  OfficialPage,
  LiveStreamSession
} from '../types';

export const AFRICAN_COUNTRIES = [
  { name: 'Côte d’Ivoire', code: 'CI', flag: '🇨🇮', dialCode: '+225', currency: 'FCFA' },
  { name: 'Sénégal', code: 'SN', flag: '🇸🇳', dialCode: '+221', currency: 'FCFA' },
  { name: 'Cameroun', code: 'CM', flag: '🇨🇲', dialCode: '+237', currency: 'FCFA' },
  { name: 'Guinée', code: 'GN', flag: '🇬🇳', dialCode: '+224', currency: 'GNF' },
  { name: 'Mali', code: 'ML', flag: '🇲🇱', dialCode: '+223', currency: 'FCFA' },
  { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫', dialCode: '+226', currency: 'FCFA' },
  { name: 'Bénin', code: 'BJ', flag: '🇧🇯', dialCode: '+229', currency: 'FCFA' },
  { name: 'Togo', code: 'TG', flag: '🇹🇬', dialCode: '+228', currency: 'FCFA' },
  { name: 'RD Congo', code: 'CD', flag: '🇨🇩', dialCode: '+243', currency: 'USD' },
  { name: 'Gabon', code: 'GA', flag: '🇬🇦', dialCode: '+241', currency: 'FCFA' },
  { name: 'Congo-Brazzaville', code: 'CG', flag: '🇨🇬', dialCode: '+242', currency: 'FCFA' },
  { name: 'Niger', code: 'NE', flag: '🇳🇪', dialCode: '+227', currency: 'FCFA' },
  { name: 'Tchad', code: 'TD', flag: '🇹🇩', dialCode: '+235', currency: 'FCFA' },
  { name: 'France (Diaspora)', code: 'FR', flag: '🇫🇷', dialCode: '+33', currency: 'EUR' },
  { name: 'États-Unis (Diaspora)', code: 'US', flag: '🇺🇸', dialCode: '+1', currency: 'USD' },
  { name: 'Canada (Diaspora)', code: 'CA', flag: '🇨🇦', dialCode: '+1', currency: 'CAD' }
];

export const STRIPE_PUBLIC_KEY = 'pk_test_51U72LwEQURwOEWTW0islwbKG5RQfvpsZSPyf7MaSRjpnV9R5ZI4hq5u20eTXSrUEfNFyNPT0izhdJRhwKmyadJea00eZNa5uRq';

export const STRIPE_VIP_PLANS: StripeVipPlan[] = [
  {
    id: 'vip_monthly',
    name: 'Pass VIP Découverte',
    priceFcfa: 5000,
    priceEur: 7.99,
    durationLabel: '1 Mois',
    durationMonths: 1,
    badge: 'Essentiel',
    isPopular: false,
    features: [
      '👑 Couronne VIP & Badge Vérifié Gold',
      '🛡️ Expérience 100% Sans Publicité (Ad-Free)',
      '💬 Accès illimité aux Salons VIP Créateurs',
      '🎙️ Appels Vocaux & Vidéo HD Ultra-Flux',
      '✨ Pourboires et cadeaux illimités',
    ],
  },
  {
    id: 'vip_quarterly',
    name: 'Pass VIP Pro Créateur',
    priceFcfa: 12500,
    priceEur: 18.99,
    durationLabel: '3 Mois',
    durationMonths: 3,
    badge: 'Populaire 🔥',
    isPopular: true,
    features: [
      '👑 Tous les avantages VIP Découverte',
      '⚡️ 15% d’économie par rapport au mois',
      '🚀 Priorité d’affichage dans le Fil Explore',
      '🎥 Diffusion de Lives exclusifs jusqu’à 4K',
      '💰 0% de commission sur vos pourboires reçus',
      '🔐 Sauvegardes Cloud illimitées des médias',
    ],
  },
  {
    id: 'vip_yearly',
    name: 'Pass VIP Élite Ambassadeur',
    priceFcfa: 45000,
    priceEur: 68.99,
    durationLabel: '1 An (12 Mois)',
    durationMonths: 12,
    badge: 'Meilleure Offre ✨',
    isPopular: false,
    features: [
      '👑 Tous les avantages VIP Pro Créateur',
      '💎 Économisez plus de 30% à l’année',
      '⭐ Badge Vérifié Diamant exclusif',
      '📞 Support Client VIP Dédié 24/7 sur WhatsApp',
      '🎟️ Invitations VIP aux Masterclasses AfriChat',
      '🎁 10,000 FCFA de crédits publicitaires offerts',
    ],
  },
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionConfig = {
  founder: {
    canDeleteMessages: true,
    canAddMembers: true,
    canEditGroupInfo: true,
    canPinMessages: true,
    canManageAdmins: true,
    canManageVIPPricing: true,
    canSendMedia: true,
    canSendMessages: true,
  },
  admin: {
    canDeleteMessages: true,
    canAddMembers: true,
    canEditGroupInfo: true,
    canPinMessages: true,
    canManageAdmins: false,
    canManageVIPPricing: false,
    canSendMedia: true,
    canSendMessages: true,
  },
  moderator: {
    canDeleteMessages: true,
    canAddMembers: true,
    canEditGroupInfo: false,
    canPinMessages: true,
    canManageAdmins: false,
    canManageVIPPricing: false,
    canSendMedia: true,
    canSendMessages: true,
  },
  member: {
    canDeleteMessages: false,
    canAddMembers: true,
    canEditGroupInfo: false,
    canPinMessages: false,
    canManageAdmins: false,
    canManageVIPPricing: false,
    canSendMedia: true,
    canSendMessages: true,
  },
};

export const CURRENT_USER: User = {
  id: 'user_me',
  name: 'Utilisateur AfriChat',
  username: '@africhat_user',
  avatar: '',
  country: "Côte d'Ivoire",
  countryCode: 'CI',
  flag: '🇨🇮',
  bio: 'Membre AfriChat Connect 🌍',
  followersCount: 0,
  followingCount: 0,
  isVIP: false,
  isVerified: false,
  walletBalance: 0,
  currency: 'FCFA',
};

export const MOBILE_MONEY_OPERATORS: MobileMoneyOperator[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    color: '#FF7900',
    bgLight: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    textColor: 'text-orange-500',
    logoText: 'OM',
    iconName: 'Smartphone',
    supportedCountries: ['CI', 'SN', 'CM', 'GN', 'ML', 'BF', 'CD'],
    popularTag: 'Le + utilisé',
  },
  {
    id: 'wave',
    name: 'Wave Mobile Money',
    color: '#1EA0E6',
    bgLight: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    textColor: 'text-sky-500',
    logoText: '🌊',
    iconName: 'Waves',
    supportedCountries: ['SN', 'CI', 'ML', 'BF'],
    popularTag: '1% de frais',
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money (MoMo)',
    color: '#FFCC00',
    bgLight: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    textColor: 'text-yellow-400',
    logoText: 'MoMo',
    iconName: 'Zap',
    supportedCountries: ['CI', 'CM', 'BJ', 'CG', 'GH', 'UG'],
    popularTag: 'Partout avec vous',
  },
  {
    id: 'moov',
    name: 'Moov Money (Flooz)',
    color: '#005BAA',
    bgLight: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    textColor: 'text-blue-400',
    logoText: 'Moov',
    iconName: 'CreditCard',
    supportedCountries: ['CI', 'TG', 'BJ', 'NE', 'BF'],
  },
  {
    id: 'card',
    name: 'Carte Bancaire / Visa / Mastercard',
    color: '#8B5CF6',
    bgLight: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    textColor: 'text-purple-400',
    logoText: '💳',
    iconName: 'CreditCard',
    supportedCountries: ['INTL', 'FR', 'US', 'CA', 'ALL'],
    popularTag: 'Diaspora & International',
  },
];

export const COUNTRIES = [
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', prefix: '+225', currency: 'FCFA' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', prefix: '+221', currency: 'FCFA' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', prefix: '+237', currency: 'FCFA' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳', prefix: '+224', currency: 'GNF' },
  { code: 'CD', name: 'RDC (Kinshasa)', flag: '🇨🇩', prefix: '+243', currency: 'USD / FC' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', prefix: '+223', currency: 'FCFA' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', prefix: '+229', currency: 'FCFA' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', prefix: '+228', currency: 'FCFA' },
  { code: 'FR', name: 'France (Diaspora)', flag: '🇫🇷', prefix: '+33', currency: 'EUR' },
  { code: 'ALL', name: 'International / Autre', flag: '🌍', prefix: '+1', currency: 'USD' },
];

export const INITIAL_STORIES: Story[] = [];

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_REELS: Post[] = [];

export const INITIAL_CONVERSATIONS: ChatConversation[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_CONTACTS: Contact[] = [];

export const INITIAL_ADS: AdItem[] = [
  {
    id: 'ad_orange_maxit',
    title: 'Orange Money Max It 2026',
    sponsorName: 'Orange CI & SN',
    sponsorHandle: '@orange_africa_officiel',
    sponsorLogo: '',
    sponsorBadge: 'Partenaire Certifié 🍊',
    tagline: '0% de frais sur vos transferts régionaux !',
    description: 'Envoyez de l’argent instantanément entre la Côte d’Ivoire, le Sénégal, la Guinée et le Mali sans commission avec l’application Max It. Vos proches reçoivent les fonds en quelques secondes.',
    ctaText: 'Activer 0% Frais',
    ctaUrl: 'https://orangemoney.com',
    imageUrl: '',
    category: 'fintech',
    discountCode: 'MAXIT2026',
    placement: 'banner',
    rating: 4.9,
    countryTarget: 'Afrique de l’Ouest & Centrale',
    impressions: 48200,
  },
  {
    id: 'ad_wave_card',
    title: 'Nouvelle Carte Wave Visa Virtuelle & Physique',
    sponsorName: 'Wave Digital Finance',
    sponsorHandle: '@wave_mobile_money',
    sponsorLogo: '',
    sponsorBadge: 'Paiement Sécurisé 🌊',
    tagline: 'Payez partout dans le monde à 1% fixe',
    description: 'Commandez votre carte bancaire Wave Visa directement depuis l’application. Idéale pour vos abonnements Netflix, achats internationaux et voyages sans frais cachés.',
    ctaText: 'Commander ma Carte',
    ctaUrl: 'https://wave.com',
    imageUrl: '',
    category: 'fintech',
    discountCode: 'WAVECARD',
    placement: 'sponsored_post',
    rating: 4.8,
    countryTarget: 'Sénégal & Côte d’Ivoire',
    impressions: 39500,
  },
  {
    id: 'ad_mtn_5g',
    title: 'MTN MoMo Mega Pass 5G',
    sponsorName: 'MTN MoMo & Internet',
    sponsorHandle: '@mtn_africa_yellow',
    sponsorLogo: '',
    sponsorBadge: 'Réseau Leader 🟡',
    tagline: '100% de bonus Data offert ce week-end',
    description: 'Rechargez votre forfait Internet 5G via MTN MoMo et doublez votre volume de données pour streamer en 4K sur AfriChat, regarder les matchs et chatter en haute définition.',
    ctaText: 'Recharger mon Forfait',
    ctaUrl: 'https://mtn.com',
    imageUrl: '',
    category: 'telecom',
    discountCode: 'MOMO5G',
    placement: 'banner',
    rating: 4.7,
    countryTarget: 'Côte d’Ivoire, Cameroun, Bénin',
    impressions: 61000,
  },
  {
    id: 'ad_canal_afrique',
    title: 'Canal+ & Showmax Afrique',
    sponsorName: 'CANAL+ Afrique',
    sponsorHandle: '@canalplus_afrique',
    sponsorLogo: '',
    sponsorBadge: 'Divertissement VIP 📺',
    tagline: 'Tous vos matchs & séries africaines en direct',
    description: 'Ne manquez aucune rencontre de football continental, la Ligue des Champions et les séries cultes en exclusivité streaming sur votre smartphone ou TV connectée.',
    ctaText: 'S’abonner via MoMo',
    ctaUrl: 'https://canalplus-afrique.com',
    imageUrl: '',
    category: 'streaming',
    discountCode: 'CANALAFRIQUE',
    placement: 'sponsored_post',
    rating: 4.9,
    countryTarget: 'Panafricain',
    impressions: 54100,
  },
  {
    id: 'ad_jumia_deals',
    title: 'Jumia Tech & Fashion Days 2026',
    sponsorName: 'Jumia Afrique',
    sponsorHandle: '@jumia_online_market',
    sponsorLogo: '',
    sponsorBadge: 'Livraison Express 🛍️',
    tagline: 'Jusqu’à -45% sur smartphones & prêt-à-porter',
    description: 'Profitez des soldes exclusives de la saison ! Paiement sécurisé à la livraison ou par Mobile Money (Orange Money, Wave, MTN). Livraison en 24h à Abidjan et Dakar.',
    ctaText: 'Voir les Offres',
    ctaUrl: 'https://jumia.com',
    imageUrl: '',
    category: 'ecommerce',
    discountCode: 'AFRICHAT20',
    placement: 'banner',
    rating: 4.6,
    countryTarget: 'Abidjan, Dakar, Douala, Yaoundé',
    impressions: 72300,
  },
  {
    id: 'ad_air_senegal',
    title: 'Vols Directs Diaspora & Afrique de l’Ouest',
    sponsorName: 'Air Sénégal / Corsair',
    sponsorHandle: '@airsenegal_official',
    sponsorLogo: '',
    sponsorBadge: 'Voyages & Billetterie ✈️',
    tagline: 'Paris - Dakar - Abidjan : 2 bagages de 23kg inclus',
    description: 'Réservez vos billets pour vos vacances au pays ou vos déplacements professionnels aux meilleurs tarifs garantis avec paiement échelonné en Mobile Money.',
    ctaText: 'Réserver mon Vol',
    ctaUrl: 'https://flyairsenegal.com',
    imageUrl: '',
    category: 'travel',
    discountCode: 'TERANGA26',
    placement: 'channel_promo',
    rating: 4.7,
    countryTarget: 'Diaspora & Afrique',
    impressions: 29800,
  },
];

export const INITIAL_AD_SETTINGS: AdSettings = {
  adsEnabled: true,
  isVipAdFree: false,
  showBottomBanner: true,
  showFeedSponsoredPosts: true,
  showSalonPromotions: true,
  personalizedAds: true,
  interests: [
    'Mobile Money & FinTech',
    'Mode Africaine & Wax',
    'Tech & Innovations IA',
    'Voyages & Billetterie',
    'Musique & Spectacles'
  ],
};

export const INITIAL_GLOBAL_ADMINS: GlobalAdminUser[] = [
  {
    id: 'gadmin_root',
    userId: 'super_admin_root',
    name: 'Direction Générale AfriChat',
    username: '@africhat_admin',
    avatar: '',
    flag: '🌍',
    role: 'super_admin',
    assignedAt: '01 Janvier 2026',
    assignedBy: 'Système Racine AfriChat',
    status: 'active',
    permissions: ['all_permissions', 'manage_admins', 'system_config', 'financial_audit', 'global_moderation', 'ban_users'],
  },
];

export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log_1',
    actorName: 'Système Racine AfriChat',
    action: 'Initialisation Base Supabase',
    target: 'Synchronisation PostgreSQL & Sécurisation RLS Active',
    timestamp: '21 Août 2026, 18:20',
    severity: 'info',
  },
  {
    id: 'log_2',
    actorName: 'Passerelle Mobile Money',
    action: 'Validation Système Passerelle',
    target: 'Intégration Wave, Orange Money, MTN & Moov Active',
    timestamp: '21 Août 2026, 16:45',
    severity: 'info',
  },
  {
    id: 'log_3',
    actorName: 'Bouclier Sécurité & Anti-Spam',
    action: 'Surveillance des Inscriptions',
    target: 'Filtrage automatique et modération temps réel activés',
    timestamp: '21 Août 2026, 12:10',
    severity: 'info',
  },
];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  maintenanceMode: false,
  strictVipVerification: true,
  globalAntiSpam: true,
  newRegistrationsOpen: true,
  mobileMoneyInstantPayout: true,
  adsNetworkActive: true,
};

export const INITIAL_WEBTV_BOOST_PLANS: import('../types').WebTvBoostPlan[] = [
  {
    id: 'express',
    name: '⚡ Boost Express (1h)',
    priceFcfa: 1000,
    priceEur: 1.5,
    durationLabel: '1 Heure',
    description: 'Propulsez votre direct Web TV en tête d’affiche immédiate avec bandeau fluo et notification rapide.',
    features: [
      'Position #1 sur le carrousel Web TV',
      'Badge lumineux "EN TÊTE DU DIRECT"',
      'Mise en avant sur le fil d’actu principal',
      '+150% d’audience moyenne en direct',
    ],
  },
  {
    id: 'prime',
    name: '🔥 Boost Prime Star (24h)',
    priceFcfa: 5000,
    priceEur: 7.5,
    durationLabel: '24 Heures',
    description: 'Le boost recommandé pour les concerts, talk-shows, grands directs et lancements d’émissions.',
    isPopular: true,
    badge: 'LE PLUS CHOISI ⭐',
    features: [
      'Position prioritaire 24h garantie',
      'Notification push envoyée aux abonnés du pays',
      'Bannière animée dorée "ÉMISSION VEDETTE"',
      'Partage automatique dans les salons VIP',
      'Statistiques d’audience & replay en direct',
    ],
  },
  {
    id: 'grand_ecran',
    name: '👑 Grand Écran Panafricain (7 jours)',
    priceFcfa: 20000,
    priceEur: 30.0,
    durationLabel: '7 Jours',
    description: 'Visibilité maximale continue à l’échelle de toute l’Afrique et la diaspora.',
    badge: 'IMPACT TOTAL 🌍',
    features: [
      'Visibilité continue 7 jours sur 22 pays',
      'Mise en avant vidéo automatique sur la page d’accueil',
      'Accompagnement et modération assistée',
      'Accès prioritaire aux dons Mobile Money & Super Tips',
      'Rapport d’engagement & certification émission',
    ],
  },
];

export const INITIAL_WEBTV_CHANNELS: import('../types').WebTvChannel[] = [];

export const DEFAULT_FOUNDER_INFO: FounderInfo = {
  name: 'Lama Conte',
  role: 'Fondateur & Architecte en Chef AfriChat Connect',
  email: 'lamaconte95@gmail.com',
  whatsappNumber: '+351 920 41 46 60',
  phoneNumber: '+351 920 41 46 60',
  location: 'Portugal 🇵🇹 (Résidence) • Origine Panafricaine',
  countryFlag: '🇵🇹',
  avatar: '',
  bio: 'Passionné de technologies panafricaines et de solutions numériques connectant l’Afrique au reste du monde. Bâtisseur de la plateforme AfriChat Connect pour l’autonomisation des créateurs, des entreprises et de la diaspora africaine.',
  missionStatement: 'Offrir à notre continent et à la diaspora un réseau social moderne, souverain et hautement performant avec monétisation Mobile Money instantanée, Web TV Live et salons VIP.',
  socials: {
    facebook: 'https://facebook.com/africhat.connect',
    whatsapp: 'https://wa.me/351920414660',
    twitter: 'https://twitter.com/africhat_app',
    linkedin: 'https://linkedin.com/in/lama-conte',
    instagram: 'https://instagram.com/africhat.official',
    youtube: 'https://youtube.com/@africhattv',
    telegram: 'https://t.me/africhat_official',
    website: 'https://africhat-connect.firebaseapp.com'
  },
  supportHours: 'Support Direct 7j/7 • 08h00 - 23h00',
  lastUpdated: '2026-08-24'
};

export const INITIAL_VIRTUAL_GIFTS: VirtualGift[] = [
  {
    id: 'gift_flame',
    name: 'Flamme Africaine',
    icon: '🔥',
    priceFcfa: 100,
    priceEur: 0.15,
    description: 'Une flamme d’encouragement pour enflammer le direct !',
    rarity: 'common'
  },
  {
    id: 'gift_rose',
    name: 'Rose Royale',
    icon: '🌹',
    priceFcfa: 250,
    priceEur: 0.38,
    description: 'Une touche d’élégance pour féliciter le créateur.',
    rarity: 'common'
  },
  {
    id: 'gift_drum',
    name: 'Tam-Tam Djembé',
    icon: '🥁',
    priceFcfa: 500,
    priceEur: 0.76,
    description: 'Rythme traditionnel mandingue pour booster l’ambiance !',
    rarity: 'rare'
  },
  {
    id: 'gift_mask',
    name: 'Masque Baoulé d’Or',
    icon: '🎭',
    priceFcfa: 1000,
    priceEur: 1.52,
    description: 'Œuvre d’art traditionnelle pour honorer le talent.',
    rarity: 'rare'
  },
  {
    id: 'gift_diamond',
    name: 'Diamant Panafricain',
    icon: '💎',
    priceFcfa: 2000,
    priceEur: 3.05,
    description: 'Éclat pur et précieux pour un contenu d’exception.',
    rarity: 'epic'
  },
  {
    id: 'gift_lion',
    name: 'Lion Majestueux',
    icon: '🦁',
    priceFcfa: 3500,
    priceEur: 5.34,
    description: 'Le roi de la savane pour récompenser les meilleurs lives.',
    rarity: 'epic'
  },
  {
    id: 'gift_crown',
    name: 'Couronne Impériale',
    icon: '👑',
    priceFcfa: 5000,
    priceEur: 7.62,
    description: 'Le cadeau ultime pour couronner la star du moment !',
    rarity: 'legendary'
  }
];

export const INITIAL_OFFICIAL_PAGES: OfficialPage[] = [];

export const INITIAL_LIVE_STREAMS: LiveStreamSession[] = [];
