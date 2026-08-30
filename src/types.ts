export type PaymentProvider = 'orange' | 'mtn' | 'wave' | 'moov' | 'card' | 'apple_pay' | 'google_pay' | 'stripe';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  avatar: string;
  country: string;
  countryCode: string; // e.g., 'CI', 'SN', 'CM', 'GN', 'CD'
  flag: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  isVIP: boolean;
  isVerified: boolean;
  walletBalance: number; // in FCFA (XOF/XAF)
  currency: string;
  createdAt?: string;
  authProvider?: string;
  isSuperAdmin?: boolean;
  isGlobalAdmin?: boolean;
  role?: string;
  isSuspended?: boolean;
  suspensionReason?: string;
  reportsCount?: number;
  blockedUserIds?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userFlag: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    flag: string;
    country: string;
    isVerified: boolean;
    isVIPCreator: boolean;
    isSuspended?: boolean;
    reportsCount?: number;
  };
  content: string;
  mediaType: 'image' | 'video' | 'text';
  mediaUrl?: string;
  videoDuration?: string;
  thumbnailUrl?: string;
  musicTrack?: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isVIPOnly: boolean;
  vipPrice?: number; // In FCFA
  isUnlocked?: boolean;
  comments: Comment[];
  location?: string;
  tags?: string[];
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userFlag: string;
  mediaUrl: string;
  type: 'image' | 'video';
  caption: string;
  timestamp: string;
  hasUnseen: boolean;
  vipLocked?: boolean;
  createdAt?: number;
  expiresAt?: number;
}

export interface GameChallengeData {
  gameId: string;
  gameType: 'tictactoe' | 'connect4';
  hostId?: string;
  hostName?: string;
  hostAvatar?: string;
  hostFlag?: string;
  guestId?: string;
  guestName?: string;
  guestAvatar?: string;
  guestFlag?: string;
  challengerId?: string;
  challengerName?: string;
  challengerAvatar?: string;
  opponentId?: string;
  opponentName?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  stakeFcfa?: number;
  winnerName?: string;
  createdAt: number | string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text?: string;
  audioUrl?: string;
  audioDuration?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isVipMessage?: boolean;
  gameChallenge?: GameChallengeData;
}

export type TicTacToeCell = 'X' | 'O' | null;

export interface GamePlayerInfo {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  flag?: string;
  role: 'X' | 'O';
  isOnline?: boolean;
}

export interface TicTacToeGameState {
  id: string;
  roomCode: string;
  host: GamePlayerInfo;
  guest?: GamePlayerInfo;
  board: TicTacToeCell[];
  currentTurn: 'X' | 'O';
  status: 'waiting' | 'in_progress' | 'won' | 'draw' | 'abandoned';
  winner?: 'X' | 'O' | 'draw' | null;
  winningLine?: [number, number, number] | null;
  scores: {
    playerX: number;
    playerO: number;
    draws: number;
  };
  stakeFcfa?: number;
  rematchRequestedBy?: string | null;
  isAiOpponent?: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  lastMove?: {
    index: number;
    player: 'X' | 'O';
    timestamp: number;
  };
  createdAt: number;
  updatedAt: number;
}

export type GroupRole = 'founder' | 'admin' | 'moderator' | 'member';

export interface GroupPermissions {
  canDeleteMessages: boolean;
  canAddMembers: boolean;
  canEditGroupInfo: boolean;
  canPinMessages: boolean;
  canManageAdmins: boolean;
  canManageVIPPricing: boolean;
  canSendMedia: boolean;
  canSendMessages: boolean;
}

export type RolePermissionConfig = Record<GroupRole, GroupPermissions>;

export interface GroupMember {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar: string;
  flag: string;
  role: GroupRole;
  joinedAt: string;
  customTitle?: string;
  isOnline?: boolean;
}

export type GlobalAdminRole = 'super_admin' | 'global_moderator' | 'security_auditor' | 'financial_officer';

export interface GlobalAdminUser {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar: string;
  flag: string;
  role: GlobalAdminRole;
  assignedAt: string;
  assignedBy: string;
  status: 'active' | 'suspended';
  permissions: string[];
}

export interface AdminAuditLog {
  id: string;
  actorName: string;
  action: string;
  target: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface SystemSettings {
  maintenanceMode: boolean;
  strictVipVerification: boolean;
  globalAntiSpam: boolean;
  newRegistrationsOpen: boolean;
  mobileMoneyInstantPayout: boolean;
  adsNetworkActive: boolean;
}

export interface ChatConversation {
  id: string;
  type: 'direct' | 'vip_salon' | 'group';
  name: string;
  avatar: string;
  participantIds: string[];
  founderId?: string;
  members?: GroupMember[];
  rolePermissions?: RolePermissionConfig;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isVIPRoom?: boolean;
  vipPrice?: number; // Subscription price
  isUnlocked?: boolean;
  roomDescription?: string;
  memberCount?: number;
  hostName?: string;
  hostFlag?: string;
  category?: string;
  isOnline?: boolean;
  isCommunity?: boolean;
  messages: Message[];
}

export type PaymentGateway = 'Flutterwave' | 'CinetPay' | 'Wave' | 'Paystack' | 'AfriPay' | 'Stripe';

export interface StripeVipPlan {
  id: string;
  name: string;
  priceFcfa: number;
  priceEur: number;
  durationLabel: string;
  durationMonths: number;
  badge?: string;
  isPopular?: boolean;
  features: string[];
}


export interface FraudCheckResult {
  riskScore: number; // e.g. 2 (low)
  riskLevel: 'low' | 'medium' | 'high';
  isAllowed: boolean;
  checks: {
    ipReputation: boolean;
    deviceFingerprintMatch: boolean;
    velocityCheck: boolean;
    kycMatch: boolean;
    geoCorrelation: boolean;
  };
  reasons?: string[];
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'vip_unlock' | 'tip' | 'salon_sub' | 'payout' | 'vip_membership';
  amount: number;
  currency: string;
  provider: PaymentProvider;
  gateway?: PaymentGateway;
  phoneNumber?: string;
  description: string;
  targetTitle?: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  reference: string;
  encryptedHash?: string;
  receiptNumber?: string;
  sslSecured?: boolean;
  fraudRiskScore?: number;
  fraudCheckPassed?: boolean;
  failureReason?: string;
  customerEmail?: string;
  customerName?: string;
}

export interface MobileMoneyOperator {
  id: PaymentProvider;
  name: string;
  color: string;
  bgLight: string;
  textColor: string;
  logoText: string;
  iconName: string;
  supportedCountries: string[];
  popularTag?: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar: string;
  flag: string;
  country: string;
  phoneNumber?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen?: string;
  isVIP: boolean;
  isVerified?: boolean;
  isFriend: boolean;
  isBlocked: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
  reportsCount?: number;
  distinctReporters?: string[];
  mutualFriendsCount?: number;
  category?: 'friend' | 'creator' | 'family' | 'business';
}

export interface ReportTicket {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  timestamp: string;
  status: 'received' | 'investigating' | 'resolved' | 'auto_suspended';
  distinctReportersCount?: number;
}

export interface AdItem {
  id: string;
  title: string;
  sponsorName: string;
  sponsorHandle: string;
  sponsorLogo: string;
  sponsorBadge?: string;
  tagline: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  videoUrl?: string;
  category: 'fintech' | 'telecom' | 'ecommerce' | 'events' | 'streaming' | 'travel';
  discountCode?: string;
  placement: 'banner' | 'sponsored_post' | 'channel_promo';
  rating?: number;
  countryTarget?: string;
  impressions?: number;
}

export interface AdSettings {
  adsEnabled: boolean;
  isVipAdFree: boolean;
  showBottomBanner: boolean;
  showFeedSponsoredPosts: boolean;
  showSalonPromotions: boolean;
  personalizedAds: boolean;
  interests: string[];
}

export type WebTvCategory = 'all' | 'news' | 'music' | 'culture' | 'sports' | 'comedy' | 'cinema';

export interface WebTvChannel {
  id: string;
  title: string;
  category: 'news' | 'music' | 'culture' | 'sports' | 'comedy' | 'cinema';
  streamType: 'live' | 'replay' | 'premiere';
  videoUrl: string;
  thumbnailUrl: string;
  currentProgram: string;
  nextProgram?: string;
  hostName: string;
  hostAvatar: string;
  hostCountry: string;
  hostFlag: string;
  viewersCount: number;
  likesCount: number;
  isLiked?: boolean;
  isBoosted: boolean;
  boostTier?: 'express' | 'prime' | 'grand_ecran';
  boostExpiresAt?: string;
  description: string;
  tags: string[];
}

export interface WebTvBoostPlan {
  id: 'express' | 'prime' | 'grand_ecran';
  name: string;
  priceFcfa: number;
  priceEur: number;
  durationLabel: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  badge?: string;
}

export interface StarVipBooking {
  id: string;
  starId: string;
  starName: string;
  starAvatar: string;
  serviceType: 'direct_message' | 'call_reservation';
  priceFcfa: number;
  priceEur: number;
  status: 'active' | 'scheduled' | 'completed';
  scheduledTime?: string;
  notes?: string;
  timestamp: string;
}

export interface FounderInfo {
  name: string;
  role: string;
  email: string;
  whatsappNumber: string;
  phoneNumber?: string;
  location: string;
  countryFlag: string;
  avatar: string;
  bio: string;
  missionStatement: string;
  socials: {
    facebook?: string;
    whatsapp?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    telegram?: string;
    website?: string;
  };
  supportHours?: string;
  lastUpdated?: string;
}

export type PageCategory = 'business' | 'artist' | 'community' | 'media' | 'creator' | 'startup';

export interface OfficialPage {
  id: string;
  name: string;
  handle: string;
  category: PageCategory;
  categoryLabel?: string;
  description: string;
  avatar: string;
  coverImage: string;
  creatorId?: string;
  creatorName?: string;
  isVerified: boolean;
  followersCount: number;
  isFollowing?: boolean;
  country: string;
  countryFlag?: string;
  flag?: string;
  website?: string;
  whatsapp?: string;
  email?: string;
  location?: string;
  createdAt: string;
  ownerId?: string;
  postsCount?: number;
}

export interface VirtualGift {
  id: string;
  name: string;
  icon: string;
  priceFcfa: number;
  priceEur: number;
  price?: number; // Alias for priceFcfa
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LiveChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userFlag: string;
  text: string;
  gift?: VirtualGift;
  timestamp: string;
  isHost?: boolean;
}

export interface LiveStreamSession {
  id: string;
  hostId: string;
  hostName: string;
  hostUsername: string;
  hostAvatar: string;
  hostFlag: string;
  title: string;
  category: string;
  viewerCount: number;
  likesCount: number;
  totalGiftsFcfa: number;
  startedAt: string;
  isLive: boolean;
  streamType: 'camera' | 'external' | 'preset';
  videoUrl?: string;
  coverUrl?: string;
}

export interface WebhookConfig {
  enabled: boolean;
  targetUrl: string;
  secretToken?: string;
  publishPublicPosts: boolean;
  publishShortVideos: boolean;
  targetPlatforms: ('facebook' | 'tiktok' | 'instagram' | 'twitter')[];
  lastTriggeredAt?: string;
  lastStatus?: 'success' | 'failed' | 'idle';
  lastStatusCode?: number;
  lastErrorMessage?: string;
}

export interface SocialPublishPayload {
  event: 'public_post.created' | 'short_video.created';
  id: string;
  title: string;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text';
  link: string;
  platforms: ('facebook' | 'tiktok' | 'instagram' | 'twitter')[];
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    flag?: string;
    country?: string;
  };
  tags?: string[];
  location?: string;
  created_at: string;
  app_source: string;
}

export interface WebhookDeliveryLog {
  id: string;
  timestamp: string;
  event: string;
  url: string;
  status: 'success' | 'failed' | 'simulated';
  statusCode?: number;
  payload: SocialPublishPayload;
  response?: string;
}
