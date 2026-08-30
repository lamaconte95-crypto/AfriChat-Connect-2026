import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Lock, 
  Unlock, 
  Sparkles, 
  Crown, 
  CheckCircle, 
  Coins, 
  Send, 
  MoreHorizontal, 
  Music, 
  MapPin, 
  Tag, 
  Bookmark, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Download,
  Smartphone,
  Search,
  Radio,
  Gift,
  Building2,
  Users,
  Video,
  ShieldAlert,
  AlertTriangle,
  Shield,
  Youtube,
  Facebook,
  UserPlus
} from 'lucide-react';
import { Post, User, Comment, AdItem, AdSettings, LiveStreamSession, OfficialPage, VirtualGift, Contact } from '../types';
import { AdSponsoredCard } from './AdSponsoredCard';
import { SendGiftModal } from './SendGiftModal';
import { FeedVideoPlayer } from './FeedVideoPlayer';
import { UserAvatar } from './UserAvatar';
import { openSocialDeepLink } from '../utils/socialDeepLinks';
import { supabaseSearchUsers } from '../services/supabaseService';

interface FeedViewProps {
  posts: Post[];
  currentUser: User;
  contacts?: Contact[];
  onLikePost: (postId: string) => void;
  onUnlockVIPPost: (post: Post) => void;
  onTipCreator: (post: Post) => void;
  onAddComment: (postId: string, text: string) => void;
  onOpenCreatePost: () => void;
  onOpenCreateStory?: () => void;
  onOpenUserProfile?: (author: { id: string; name: string; username: string; avatar: string; country?: string; flag?: string; isVIPCreator?: boolean }) => void;
  onOpenStarVip?: (star: any, serviceType: 'direct_message' | 'call_reservation') => void;
  onOpenShareApp?: () => void;
  onOpenInstallPwa?: () => void;
  onToggleBlockUser?: (userId: string) => void;
  onOpenReportUser?: (target: Contact | { id: string; name: string; username: string; avatar: string }) => void;
  ads?: AdItem[];
  adSettings?: AdSettings;
  onOpenAdDetail?: (ad: AdItem) => void;
  onOpenAdSettings?: () => void;
  liveStreams?: LiveStreamSession[];
  onOpenLiveSession?: (session: LiveStreamSession) => void;
  onOpenBroadcastLive?: () => void;
  officialPages?: OfficialPage[];
  onSelectTab?: (tab: any) => void;
  onOpenDeposit?: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  currentUser,
  contacts = [],
  onLikePost,
  onUnlockVIPPost,
  onTipCreator,
  onAddComment,
  onOpenCreatePost,
  onOpenCreateStory,
  onOpenUserProfile,
  onOpenStarVip,
  onOpenShareApp,
  onOpenInstallPwa,
  onToggleBlockUser,
  onOpenReportUser,
  ads = [],
  adSettings,
  onOpenAdDetail,
  onOpenAdSettings,
  liveStreams = [],
  onOpenLiveSession,
  onOpenBroadcastLive,
  officialPages = [],
  onSelectTab,
  onOpenDeposit,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'vip' | 'videos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [mutedVideoId, setMutedVideoId] = useState<string | null>(null);
  const [giftTargetPost, setGiftTargetPost] = useState<Post | null>(null);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);

  // Set of blocked and suspended user IDs / usernames to instantly mask posts
  const blockedIdentifiers = new Set<string>();
  (currentUser.blockedUserIds || []).forEach((id) => blockedIdentifiers.add(id));
  contacts
    .filter((c) => c.isBlocked)
    .forEach((c) => {
      if (c.id) blockedIdentifiers.add(c.id);
      if (c.userId) blockedIdentifiers.add(c.userId);
      if (c.username) blockedIdentifiers.add(c.username.toLowerCase());
    });

  const suspendedIdentifiers = new Set<string>();
  contacts
    .filter((c) => c.isSuspended)
    .forEach((c) => {
      if (c.id) suspendedIdentifiers.add(c.id);
      if (c.userId) suspendedIdentifiers.add(c.userId);
      if (c.username) suspendedIdentifiers.add(c.username.toLowerCase());
    });

  const [matchedUsers, setMatchedUsers] = useState<Contact[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Dynamic user search by letter directly from Supabase users/profiles
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchedUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    let isMounted = true;
    setIsSearchingUsers(true);

    const timer = setTimeout(async () => {
      try {
        const res = await supabaseSearchUsers(searchQuery);
        if (isMounted && res.data) {
          const filtered = res.data.filter(
            (u) => u.id !== currentUser.id && u.username.toLowerCase() !== currentUser.username.toLowerCase()
          );
          setMatchedUsers(filtered);
        }
      } catch (err) {
        console.warn('Feed user search error:', err);
      } finally {
        if (isMounted) setIsSearchingUsers(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUser.id, currentUser.username]);

  const filteredPosts = posts.filter((post) => {
    const authorId = post.author.id || post.userId;
    const authorUsername = post.author.username ? post.author.username.toLowerCase() : '';

    // 1. Instant Masking: Filter out blocked users
    if (
      blockedIdentifiers.has(authorId) ||
      (authorUsername && blockedIdentifiers.has(authorUsername)) ||
      (post.userId && blockedIdentifiers.has(post.userId))
    ) {
      return false;
    }

    // 2. Automated Moderation Masking: Filter out suspended accounts (3+ reports)
    if (
      post.author.isSuspended ||
      suspendedIdentifiers.has(authorId) ||
      (authorUsername && suspendedIdentifiers.has(authorUsername)) ||
      (post.userId && suspendedIdentifiers.has(post.userId))
    ) {
      return false;
    }

    // Search query filter
    const matchesSearch =
      !searchQuery.trim() ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (activeTab === 'vip') return post.isVIPOnly;
    if (activeTab === 'videos') return post.mediaType === 'video';
    return true;
  });

  const handleCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    onAddComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleShare = (postId: string) => {
    setCopiedShareId(postId);
    const postUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
    }
    setTimeout(() => {
      setCopiedShareId(null);
    }, 2000);
  };

  return (
    <div id="feed-view-container" className="space-y-4 max-w-2xl mx-auto pb-24">
      {/* 1. Global Search Bar */}
      <div className="px-4 pt-1">
        <div className="relative">
          <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="global-feed-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des utilisateurs, amis, publications (ex: tapez une lettre)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-900 border border-stone-800 focus:border-amber-400 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dynamic Real-time Users List from Supabase Table */}
        {searchQuery.trim() && (
          <div className="mt-2 p-3 rounded-2xl bg-stone-900/95 border border-amber-500/30 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 border-b border-stone-800 pb-1.5">
              <span className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Membres trouvés dans Supabase ({matchedUsers.length})</span>
              </span>
              {isSearchingUsers && <span className="text-[10px] text-stone-400 animate-pulse">Recherche en temps réel...</span>}
            </div>

            {matchedUsers.length === 0 && !isSearchingUsers ? (
              <p className="text-xs text-stone-400 py-1 text-center">Aucun membre enregistré ne correspond à "{searchQuery}".</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {matchedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 flex items-center justify-between transition-colors"
                  >
                    <div
                      onClick={() => onOpenUserProfile?.({
                        id: user.userId || user.id,
                        name: user.name,
                        username: user.username,
                        avatar: user.avatar,
                        country: user.country,
                        flag: user.flag,
                        isVIPCreator: user.isVIP,
                      })}
                      className="flex items-center space-x-2 min-w-0 flex-1 cursor-pointer"
                    >
                      <UserAvatar
                        name={user.name}
                        username={user.username}
                        avatar={user.avatar}
                        flag={user.flag}
                        size="sm"
                        className="w-8 h-8 rounded-lg shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate flex items-center space-x-1">
                          <span>{user.name}</span>
                          <span>{user.flag}</span>
                        </p>
                        <p className="text-[10px] text-amber-400/90 truncate">{user.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenUserProfile?.({
                        id: user.userId || user.id,
                        name: user.name,
                        username: user.username,
                        avatar: user.avatar,
                        country: user.country,
                        flag: user.flag,
                        isVIPCreator: user.isVIP,
                      })}
                      className="ml-2 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 shrink-0 transition-colors"
                    >
                      Voir Profil
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Live Broadcast & Active Streams Strip */}
      <div className="px-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs font-black text-white">DIRECTS & SALONS EN LIGNE</span>
          </div>

          <button
            id="go-live-studio-btn"
            onClick={onOpenBroadcastLive}
            className="py-1 px-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] flex items-center space-x-1 shadow-md shadow-rose-600/30 cursor-pointer hover:scale-105 transition-all"
          >
            <Radio className="w-3 h-3" />
            <span>Lancer un Live</span>
          </button>
        </div>

        {/* Live Stories Horizontal Scroll */}
        <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-none">
          {/* My Live Bubble */}
          <button
            onClick={onOpenBroadcastLive}
            className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-rose-500 via-amber-500 to-orange-500 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-stone-950 flex items-center justify-center text-rose-400">
                <Radio className="w-6 h-6" />
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-300">Mon Live</span>
          </button>

          {/* Active Live Sessions */}
          {liveStreams.length === 0 ? (
            <div className="text-[11px] text-stone-500 italic pl-1 self-center">
              Aucun direct en cours • Soyez le premier à diffuser !
            </div>
          ) : (
            liveStreams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => onOpenLiveSession?.(stream)}
                className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
              >
                <div className="relative w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-rose-600 to-amber-500 group-hover:scale-105 transition-transform flex items-center justify-center">
                  <UserAvatar
                    name={stream.hostName}
                    avatar={stream.hostAvatar}
                    size="lg"
                    className="w-full h-full rounded-[14px]"
                  />
                  <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-rose-600 text-white font-black text-[8px] animate-pulse">
                    LIVE
                  </span>
                </div>
                <span className="text-[10px] font-medium text-stone-300 truncate max-w-[64px]">
                  {stream.hostName.split(' ')[0]}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 3. Feed Filters & Create Post CTA */}
      <div className="flex items-center justify-between px-4 pt-1">
        <div className="flex items-center space-x-1 p-1 bg-stone-900 border border-stone-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            🔥 Fil d’actualité
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeTab === 'vip'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Exclusifs VIP</span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'videos'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            🎬 Vidéos
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenCreateStory && (
            <button
              id="feed-create-story-btn"
              onClick={onOpenCreateStory}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs border border-amber-500/40 hover:border-amber-400 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>+ Story</span>
              <span>📸</span>
            </button>
          )}

          <button
            id="feed-create-post-btn"
            onClick={onOpenCreatePost}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold text-xs shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-1"
          >
            <span>Publier</span>
            <span>✍🏾</span>
          </button>
        </div>
      </div>

      {/* 4. Quick App Actions & Social Deep Links Bar */}
      <div className="px-4 space-y-2">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-stone-950 via-[#18181B] to-stone-950 border border-stone-800/90 shadow-xl flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-black text-amber-300 tracking-tight">
              PAGES OFFICIELLES & COMMUNAUTÉS
            </span>
          </div>

          <button
            onClick={() => onSelectTab && onSelectTab('pages')}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center space-x-1"
          >
            <span>Découvrir les Pages →</span>
          </button>
        </div>

        {/* 1-Click Social Media Subscribe Bar (Facebook, TikTok, YouTube) */}
        <div className="p-2.5 rounded-2xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center space-x-2 min-w-0">
            <Share2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-black text-stone-300 truncate">Suivez AfriChat sur les Réseaux :</span>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => openSocialDeepLink('facebook')}
              className="px-2.5 py-1 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/30 border border-[#1877F2]/40 text-[#1877F2] text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
              title="Ouvrir Facebook & S'abonner"
            >
              <Facebook className="w-3 h-3" />
              <span>Facebook</span>
            </button>
            <button
              type="button"
              onClick={() => openSocialDeepLink('tiktok')}
              className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 border border-cyan-500/40 text-cyan-400 text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
              title="Ouvrir TikTok & S'abonner"
            >
              <Video className="w-3 h-3 text-cyan-400" />
              <span>TikTok</span>
            </button>
            <button
              type="button"
              onClick={() => openSocialDeepLink('youtube')}
              className="px-2.5 py-1 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/40 text-rose-400 text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
              title="Ouvrir YouTube & S'abonner 1-Clic"
            >
              <Youtube className="w-3 h-3 text-rose-500" />
              <span>YouTube</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Posts Stream */}
      <div className="space-y-4 px-2 sm:px-0">
        {/* VIP Ad-Free Active Notification Pill */}
        {adSettings?.isVipAdFree && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold">Mode Sans Publicité VIP Actif ✨ (0 interruption)</span>
            </div>
            <button
              onClick={onOpenAdSettings}
              className="text-[11px] underline text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              Gérer
            </button>
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-stone-900 border border-stone-800 text-stone-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-stone-600 mx-auto" />
            <p className="text-sm font-bold text-stone-300">
              {searchQuery ? "Aucun utilisateur trouvé" : "Aucune publication pour le moment"}
            </p>
            <p className="text-xs text-stone-500">
              {searchQuery 
                ? `Aucun post ou utilisateur ne correspond à "${searchQuery}".` 
                : "Soyez le premier membre à publier un message sur AfriChat !"}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
              >
                Effacer la recherche
              </button>
            ) : (
              <button
                onClick={onOpenCreatePost}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold hover:scale-105 transition-all"
              >
                Créer une publication ✍🏾
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post, index) => {
            const isVipLocked = post.isVIPOnly && !post.isUnlocked;
            const isCommentsOpen = activeCommentPostId === post.id;

            const shouldShowSponsoredAd =
              adSettings?.adsEnabled &&
              !adSettings?.isVipAdFree &&
              adSettings?.showFeedSponsoredPosts &&
              ads.length > 0 &&
              index === 1;

            const sponsoredAd = ads.find((a) => a.placement === 'sponsored_post') || ads[0];

            return (
              <React.Fragment key={post.id}>
                <motion.article
                  id={`post-card-${post.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl bg-stone-900 border border-stone-800/90 shadow-xl overflow-hidden text-stone-100"
                >
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div 
                      onClick={() => onOpenUserProfile?.(post.author)}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <div className="relative">
                        <UserAvatar
                          name={post.author.name}
                          username={post.author.username}
                          avatar={post.author.avatar}
                          flag={post.author.flag}
                          isVIP={post.author.isVIPCreator}
                          isVerified={post.author.isVerified}
                          size="lg"
                          className="w-11 h-11 border-2 border-stone-700 group-hover:border-amber-400 transition-colors"
                        />
                        <span className="absolute -bottom-1 -right-1 text-xs drop-shadow">
                          {post.author.flag}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-bold text-sm text-stone-100 group-hover:text-amber-400 transition-colors">
                            {post.author.name}
                          </h4>
                          {post.author.isVerified && (
                            <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                          )}
                          {post.author.isVIPCreator && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-0.5">
                              <Crown className="w-2.5 h-2.5" />
                              <span>CREATOR VIP</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-stone-400">
                          <span className="font-mono text-amber-400/80">{post.author.username}</span>
                          <span>•</span>
                          <span>{post.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {post.author.isVIPCreator && (
                        <button
                          id={`feed-post-vip-star-btn-${post.id}`}
                          onClick={() => onOpenStarVip?.(post.author, 'direct_message')}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300 hover:text-white hover:bg-amber-500/30 text-[10px] font-black shadow-sm transition-all cursor-pointer"
                          title="Accès VIP Star (Message 2 € / Appel 3 €)"
                        >
                          <Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>Accès VIP Star</span>
                        </button>
                      )}
                      {post.location && (
                        <span className="hidden sm:flex items-center space-x-1 text-[11px] text-amber-400/80 bg-stone-800/80 px-2 py-1 rounded-full border border-stone-700">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{post.location}</span>
                        </span>
                      )}
                      {/* Post Options Menu */}
                      <div className="relative">
                        <button 
                          id={`feed-post-more-btn-${post.id}`}
                          onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                          className="p-2 text-stone-400 hover:text-stone-200 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
                          title="Options de la publication & Sécurité"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {activeMenuPostId === post.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 top-10 w-56 rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl p-1.5 z-50 text-xs space-y-1"
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuPostId(null);
                                  onOpenUserProfile?.(post.author);
                                }}
                                className="w-full p-2 rounded-xl text-left hover:bg-stone-800 text-stone-200 flex items-center space-x-2 cursor-pointer font-medium"
                              >
                                <Users className="w-3.5 h-3.5 text-amber-400" />
                                <span>Voir le profil</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuPostId(null);
                                  handleShare(post.id);
                                }}
                                className="w-full p-2 rounded-xl text-left hover:bg-stone-800 text-stone-200 flex items-center space-x-2 cursor-pointer font-medium"
                              >
                                <Share2 className="w-3.5 h-3.5 text-sky-400" />
                                <span>Partager la publication</span>
                              </button>

                              <div className="h-px bg-stone-800 my-1" />

                              {/* Security Options: Block & Report */}
                              {post.author.id !== currentUser.id && (
                                <>
                                  <button
                                    id={`post-block-author-btn-${post.id}`}
                                    onClick={() => {
                                      setActiveMenuPostId(null);
                                      if (onToggleBlockUser) {
                                        onToggleBlockUser(post.author.id || post.userId);
                                      }
                                    }}
                                    className="w-full p-2 rounded-xl text-left hover:bg-rose-950/30 text-rose-400 flex items-center space-x-2 cursor-pointer font-bold"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Bloquer {post.author.name}</span>
                                  </button>

                                  <button
                                    id={`post-report-btn-${post.id}`}
                                    onClick={() => {
                                      setActiveMenuPostId(null);
                                      if (onOpenReportUser) {
                                        onOpenReportUser({
                                          id: post.author.id || post.userId,
                                          userId: post.author.id || post.userId,
                                          name: post.author.name,
                                          username: post.author.username,
                                          avatar: post.author.avatar,
                                          country: post.author.country || 'Côte d’Ivoire',
                                          flag: post.author.flag || '🇨🇮',
                                          isFriend: false,
                                          isVIP: post.author.isVIPCreator || false,
                                          isOnline: true,
                                          isBlocked: false,
                                        } as any);
                                      }
                                    }}
                                    className="w-full p-2 rounded-xl text-left hover:bg-amber-500/20 text-amber-300 flex items-center space-x-2 cursor-pointer font-bold"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Signaler la publication ⚠️</span>
                                  </button>
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Post Text */}
                  <div className="px-4 pb-3">
                    <p className="text-sm text-stone-200 leading-relaxed font-normal whitespace-pre-line">
                      {post.content}
                    </p>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs text-amber-400/90 font-medium hover:underline cursor-pointer">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Media Container (Image or Video or VIP Lock Screen) */}
                  {isVipLocked ? (
                    <div className="relative aspect-video sm:aspect-[16/10] w-full bg-stone-950 overflow-hidden flex items-center justify-center p-6 border-y border-stone-800">
                      {post.mediaUrl && (
                        <img
                          src={post.mediaUrl}
                          alt="Contenu VIP"
                          className="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-30 scale-110"
                        />
                      )}
                      <div className="relative z-10 max-w-sm w-full p-6 rounded-3xl bg-stone-900/90 backdrop-blur-md border border-amber-500/40 text-center space-y-3.5 shadow-2xl">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-orange-500/20">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            Contenu Exclusif VIP
                          </span>
                          <h4 className="font-bold text-base text-stone-100 mt-2">
                            Accédez au contenu complet
                          </h4>
                          <p className="text-xs text-stone-400 mt-1">
                            Débloquez instantanément avec votre compte Mobile Money.
                          </p>
                        </div>

                        <div className="pt-1">
                          <button
                            id={`unlock-post-btn-${post.id}`}
                            onClick={() => onUnlockVIPPost(post)}
                            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Débloquer pour {post.vipPrice?.toLocaleString() || 500} FCFA</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : post.mediaType === 'video' && post.mediaUrl ? (
                    <FeedVideoPlayer
                      src={post.mediaUrl}
                      poster={post.thumbnailUrl}
                      musicTrack={post.musicTrack}
                      isVipUnlocked={post.isVIPOnly && post.isUnlocked}
                    />
                  ) : post.mediaUrl ? (
                    <div 
                      onClick={() => setSelectedLightboxImage(post.mediaUrl || null)}
                      className="relative w-full aspect-auto max-h-[520px] bg-stone-950 overflow-hidden cursor-zoom-in group"
                    >
                      <img
                        src={post.mediaUrl}
                        alt={post.content}
                        className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur text-[10px] text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>HD • Agrandir</span>
                      </div>
                      {post.isVIPOnly && post.isUnlocked && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-stone-950 text-[11px] font-black backdrop-blur-md flex items-center space-x-1 shadow-lg">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>VIP DÉBLOQUÉ</span>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Post Interaction Bar */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800/80 pb-3 flex-wrap gap-2">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        {/* Like */}
                        <button
                          id={`like-post-btn-${post.id}`}
                          onClick={() => onLikePost(post.id)}
                          className={`flex items-center space-x-1 text-xs sm:text-sm font-semibold transition-all group ${
                            post.isLiked ? 'text-rose-500 scale-105' : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          <div className={`p-1.5 rounded-full group-hover:bg-rose-500/10 transition-colors ${post.isLiked ? 'bg-rose-500/20' : ''}`}>
                            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${post.isLiked ? 'fill-rose-500' : ''}`} />
                          </div>
                          <span>{post.likesCount.toLocaleString()}</span>
                        </button>

                        {/* Comment */}
                        <button
                          id={`comment-toggle-btn-${post.id}`}
                          onClick={() => setActiveCommentPostId(isCommentsOpen ? null : post.id)}
                          className="flex items-center space-x-1 text-xs sm:text-sm font-semibold text-stone-300 hover:text-white transition-all group"
                        >
                          <div className="p-1.5 rounded-full group-hover:bg-amber-500/10 transition-colors">
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <span>{post.commentsCount + (post.comments?.length || 0)}</span>
                        </button>

                        {/* Share */}
                        <button
                          id={`share-post-btn-${post.id}`}
                          onClick={() => handleShare(post.id)}
                          className="flex items-center space-x-1 text-xs sm:text-sm font-semibold text-stone-300 hover:text-white transition-all group"
                        >
                          <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                            {copiedShareId === post.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </div>
                          <span>{post.sharesCount}</span>
                        </button>
                      </div>

                      {/* Right Gift & Tip Buttons */}
                      <div className="flex items-center space-x-1.5">
                        {/* Send Virtual Gift Button */}
                        <button
                          id={`gift-post-btn-${post.id}`}
                          onClick={() => setGiftTargetPost(post)}
                          className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Gift className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cadeau 🎁</span>
                        </button>

                        {/* Pourboire Mobile Money Button */}
                        <button
                          id={`tip-creator-btn-${post.id}`}
                          onClick={() => onTipCreator(post)}
                          className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 font-bold text-xs items-center space-x-1 transition-all cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pourboire</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Comments Section */}
                    <div className="space-y-3">
                      {/* Latest Comments Preview */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="space-y-2">
                          {post.comments.slice(-2).map((c) => (
                            <div key={c.id} className="flex items-start space-x-2.5 text-xs">
                              <UserAvatar
                                name={c.userName}
                                avatar={c.userAvatar}
                                flag={c.userFlag}
                                size="xs"
                                className="w-6 h-6 mt-0.5 shrink-0"
                              />
                              <div className="flex-1 bg-stone-800/60 rounded-2xl px-3 py-2 border border-stone-800">
                                <div className="flex items-center space-x-1">
                                  <span className="font-bold text-stone-200">{c.userName}</span>
                                  <span>{c.userFlag}</span>
                                  <span className="text-[10px] text-stone-400 ml-auto">{c.timestamp}</span>
                                </div>
                                <p className="text-stone-300 mt-0.5">{c.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Input */}
                      <form
                        onSubmit={(e) => handleCommentSubmit(post.id, e)}
                        className="flex items-center space-x-2 pt-1"
                      >
                        <UserAvatar
                          name={currentUser.name}
                          username={currentUser.username}
                          avatar={currentUser.avatar}
                          flag={currentUser.flag}
                          size="sm"
                          className="w-8 h-8 shrink-0"
                        />
                        <div className="flex-1 flex items-center bg-stone-800 rounded-full border border-stone-700/80 px-3 py-1.5 focus-within:border-amber-500">
                          <input
                            type="text"
                            placeholder="Écrire un commentaire pour l'auteur..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            className="flex-1 bg-transparent text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!commentInputs[post.id]?.trim()}
                            className="p-1 rounded-full text-amber-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-amber-400 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.article>

                {shouldShowSponsoredAd && sponsoredAd && (
                  <AdSponsoredCard
                    ad={sponsoredAd}
                    onOpenAdDetail={onOpenAdDetail || (() => {})}
                    onOpenAdSettings={onOpenAdSettings}
                  />
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Send Gift to Post Author Modal */}
      {giftTargetPost && (
        <SendGiftModal
          isOpen={!!giftTargetPost}
          onClose={() => setGiftTargetPost(null)}
          currentUser={currentUser}
          recipientName={giftTargetPost.author.name}
          recipientAvatar={giftTargetPost.author.avatar}
          recipientFlag={giftTargetPost.author.flag}
          onSendGift={(gift) => {
            setGiftTargetPost(null);
          }}
          onOpenDeposit={onOpenDeposit || (() => {})}
        />
      )}

      {/* High Quality Photo Lightbox Modal */}
      <AnimatePresence>
        {selectedLightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-6"
            onClick={() => setSelectedLightboxImage(null)}
          >
            {/* Top Toolbar with Universal Back Arrow */}
            <div className="w-full max-w-4xl flex items-center justify-between p-3 absolute top-0 inset-x-0 z-10 mx-auto">
              <button
                type="button"
                onClick={() => setSelectedLightboxImage(null)}
                className="px-3 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700 flex items-center space-x-1.5 text-xs font-bold transition-all cursor-pointer"
              >
                <span>← Retour</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLightboxImage(null)}
                className="p-2 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div 
              className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl flex items-center justify-center shadow-2xl border border-stone-800/80"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedLightboxImage}
                alt="Aperçu HD"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
