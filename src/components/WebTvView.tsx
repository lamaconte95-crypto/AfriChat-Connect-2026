import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { 
  Tv, 
  Radio, 
  Flame, 
  Sparkles, 
  Crown, 
  Heart, 
  MessageSquare, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Maximize2, 
  Coins, 
  Send, 
  Users, 
  Eye, 
  Zap, 
  Globe, 
  TrendingUp, 
  Video, 
  CheckCircle2,
  Calendar,
  Layers,
  Plus,
  X,
  ExternalLink,
  Youtube,
  Facebook,
  Cast,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { WebTvChannel, WebTvCategory, User, Contact } from '../types';

interface WebTvViewProps {
  channels: WebTvChannel[];
  currentUser: User;
  onGoBack?: () => void;
  onOpenBoostModal: (channel?: WebTvChannel) => void;
  onOpenStarVipModal: (star: { id: string; name: string; username: string; avatar: string; flag: string; country: string; isVIP?: boolean }) => void;
  onSendTip?: (hostName: string, channelTitle: string) => void;
}

interface LiveChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  senderFlag: string;
  text: string;
  timestamp: string;
  isTip?: boolean;
  tipAmount?: number;
}

// Helper to determine stream provider
export type StreamProvider = 'youtube' | 'facebook' | 'native';

export function parseStreamUrl(url: string): { provider: StreamProvider; embedUrl: string; originalUrl: string } {
  if (!url) {
    return { provider: 'native', embedUrl: '', originalUrl: '' };
  }

  // 1. YouTube Live / Video Detection
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID, youtube.com/embed/ID
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&rel=0&playsinline=1`,
      originalUrl: url,
    };
  }

  // 2. Facebook Live / Video Detection
  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    const encodedUrl = encodeURIComponent(url);
    return {
      provider: 'facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&autoplay=true&mute=1`,
      originalUrl: url,
    };
  }

  // 3. Direct Native Video / HLS Stream
  return {
    provider: 'native',
    embedUrl: url,
    originalUrl: url,
  };
}

export const WebTvView: React.FC<WebTvViewProps> = ({
  channels: initialChannels,
  currentUser,
  onGoBack,
  onOpenBoostModal,
  onOpenStarVipModal,
  onSendTip,
}) => {
  // Prepend rich YouTube and Facebook Live stream channels if not already present
  const [channels, setChannels] = useState<WebTvChannel[]>(() => {
    const defaultChannels: WebTvChannel[] = [
      {
        id: 'webtv_yt_france24',
        title: 'France 24 Afrique & Monde • Direct 24/7',
        category: 'news',
        streamType: 'live',
        videoUrl: 'https://www.youtube.com/watch?v=h3MuIUNCCzI',
        thumbnailUrl: '',
        currentProgram: 'Le Journal Afrique & Les Clés de l’Économie',
        nextProgram: 'Débat Stratégique Panafricain',
        hostName: 'Rédaction France 24 & AfriChat',
        hostAvatar: '',
        hostCountry: 'Sénégal',
        hostFlag: '🇸🇳',
        viewersCount: 8420,
        likesCount: 32400,
        isLiked: true,
        isBoosted: true,
        boostTier: 'grand_ecran',
        boostExpiresAt: '2026-08-30T23:59:59Z',
        description: 'Flux en direct YouTube Live : Toute l’actualité politique, économique et culturelle de l’Afrique en continu.',
        tags: ['#YouTubeLive', '#AfriNews', '#Direct24', '#Afrique'],
      },
      {
        id: 'webtv_fb_afrobeats_gala',
        title: 'Festival Panafricain Facebook Live • Abidjan Stars',
        category: 'music',
        streamType: 'live',
        videoUrl: 'https://www.facebook.com/facebook/videos/10153231379946729/',
        thumbnailUrl: '',
        currentProgram: 'Show Live Afrobeats & Coupé-Décalé en direct',
        nextProgram: 'Freestyle Session & Rencontre Créateurs VIP',
        hostName: 'Sarah Star & DJ Bamba',
        hostAvatar: '',
        hostCountry: "Côte d'Ivoire",
        hostFlag: '🇨🇮',
        viewersCount: 6150,
        likesCount: 18900,
        isLiked: false,
        isBoosted: true,
        boostTier: 'prime',
        description: 'Flux Facebook Live : Concerts en direct, DJ sets et performances exclusives avec interaction instantanée.',
        tags: ['#FacebookLive', '#AfroLive', '#AbidjanVibes', '#Direct'],
      },
      ...initialChannels,
    ];

    // Deduplicate by ID
    const seen = new Set<string>();
    return defaultChannels.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  });

  const [selectedCategory, setSelectedCategory] = useState<WebTvCategory>('all');
  const [activeChannelId, setActiveChannelId] = useState<string>(channels[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [likesCount, setLikesCount] = useState<number>(14250);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);

  // Add Custom Stream Modal State
  const [isAddStreamOpen, setIsAddStreamOpen] = useState(false);
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [customStreamTitle, setCustomStreamTitle] = useState('');
  const [customStreamCategory, setCustomStreamCategory] = useState<'news' | 'music' | 'culture' | 'sports' | 'comedy' | 'cinema'>('music');
  const [customStreamHost, setCustomStreamHost] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const streamInfo = parseStreamUrl(activeChannel?.videoUrl || '');

  // Initial live chat messages
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    {
      id: 'msg_1',
      senderName: 'Fatou Diop',
      senderAvatar: '',
      senderFlag: '🇸🇳',
      text: 'La qualité du flux HD est incroyable sur AfriChat !! Bravo Abidjan & Dakar 🇨🇮🇸🇳🔥',
      timestamp: '19:42',
    },
    {
      id: 'msg_2',
      senderName: 'Ibrahim Touré',
      senderAvatar: '',
      senderFlag: '🇨🇮',
      text: 'En direct depuis Treichville, force à l’équipe AfriMusic TV & Web TV !',
      timestamp: '19:43',
    },
    {
      id: 'msg_3',
      senderName: 'Samuel Eto’o Fan',
      senderAvatar: '',
      senderFlag: '🇨🇲',
      text: 'A envoyé un Super Tip Mobile Money de 1 000 FCFA 💰',
      timestamp: '19:44',
      isTip: true,
      tipAmount: 1000,
    },
  ]);

  const categories: { id: WebTvCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Toutes les Chaînes', icon: '📺' },
    { id: 'news', label: 'Infos & Débats 24/7', icon: '🌍' },
    { id: 'music', label: 'Concerts & Afrobeats', icon: '🎵' },
    { id: 'sports', label: 'Sports & Football', icon: '⚽' },
    { id: 'comedy', label: 'Humour & Stand-up', icon: '😂' },
    { id: 'culture', label: 'Mode & Patrimoine', icon: '✨' },
  ];

  const filteredChannels = selectedCategory === 'all'
    ? channels
    : channels.filter(c => c.category === selectedCategory);

  const sortedChannels = [...filteredChannels].sort((a, b) => {
    if (a.isBoosted && !b.isBoosted) return -1;
    if (!a.isBoosted && b.isBoosted) return 1;
    return b.viewersCount - a.viewersCount;
  });

  const togglePlay = () => {
    if (streamInfo.provider === 'native' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (streamInfo.provider === 'native' && videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const triggerEmoji = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = Math.floor(Math.random() * 60) + 20;
    setFloatingEmojis(prev => [...prev.slice(-15), { id, emoji, x }]);

    if (emoji === '❤️') {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    }

    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2000);
  };

  const handleSendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: LiveChatMessage = {
      id: `chat_${Date.now()}`,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderFlag: currentUser.flag,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  // Handle Add Custom Live Stream (YouTube, Facebook, external M3U8/MP4)
  const handleCreateCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStreamUrl.trim() || !customStreamTitle.trim()) return;

    const parsed = parseStreamUrl(customStreamUrl.trim());
    const newChannelId = `custom_stream_${Date.now()}`;

    const newChannel: WebTvChannel = {
      id: newChannelId,
      title: customStreamTitle.trim(),
      category: customStreamCategory,
      streamType: 'live',
      videoUrl: customStreamUrl.trim(),
      thumbnailUrl: '',
      currentProgram: 'Diffusion en Direct Web TV',
      nextProgram: 'Édition Spéciale AfriChat',
      hostName: customStreamHost.trim() || currentUser.name,
      hostAvatar: currentUser.avatar,
      hostCountry: currentUser.country,
      hostFlag: currentUser.flag,
      viewersCount: Math.floor(Math.random() * 800 + 350),
      likesCount: Math.floor(Math.random() * 2000 + 450),
      isLiked: false,
      isBoosted: true,
      boostTier: 'express',
      description: `Flux en direct ${parsed.provider.toUpperCase()} diffusé sur AfriChat Connect par ${currentUser.name}.`,
      tags: ['#DirectLive', `#${parsed.provider}`, '#AfriChatTV'],
    };

    setChannels(prev => [newChannel, ...prev]);
    setActiveChannelId(newChannelId);
    setIsAddStreamOpen(false);
    setCustomStreamUrl('');
    setCustomStreamTitle('');
    setCustomStreamHost('');
  };

  return (
    <div id="webtv-main-view" className="space-y-4 pb-20 max-w-4xl mx-auto px-2 sm:px-0">
      {/* Top Universal Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          id="webtv-back-btn"
          type="button"
          onClick={() => {
            if (onGoBack) onGoBack();
          }}
          className="px-3.5 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-800 transition-all flex items-center space-x-2 text-xs font-bold shadow-md cursor-pointer group"
          title="Retour à la vue précédente"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Retour</span>
        </button>

        <span className="text-xs font-bold text-stone-400">
          AfriTV Web Directs & Lives
        </span>
      </div>

      {/* Top Banner: Web TV Hub, Add Stream & Boost CTA */}
      <div className="relative rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-stone-900 p-4 sm:p-5 shadow-2xl border border-orange-500/40 overflow-hidden text-stone-100">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-black/40 text-amber-300 text-[10px] font-black tracking-wider uppercase backdrop-blur-md border border-amber-400/30">
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>DIRECT WEB TV AFRIQUE & MONDE</span>
              </span>
              <span className="text-xs text-amber-200 font-bold">• YouTube & Facebook Live compatibles</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AfriTV Live Studio 📺
            </h1>
            <p className="text-xs text-amber-100/90 max-w-md">
              Regardez et diffusez des directs YouTube Live, Facebook Live et flux vidéo avec pourboires Mobile Money.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              id="webtv-add-stream-btn"
              onClick={() => setIsAddStreamOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-stone-950/80 hover:bg-stone-950 text-amber-300 font-bold text-xs border border-amber-400/40 hover:border-amber-300 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un direct</span>
            </button>

            <button
              id="webtv-hero-boost-btn"
              onClick={() => onOpenBoostModal(activeChannel)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 text-stone-950 font-black text-xs shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              <Flame className="w-4 h-4 fill-stone-950 text-stone-950 group-hover:animate-bounce" />
              <span>Booster 🚀</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`webtv-cat-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Live Screen & Interactive Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Main Universal Player & Controls */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative rounded-3xl bg-black border border-stone-800 overflow-hidden shadow-2xl group">
            {/* Universal Video Screen (YouTube / Facebook / Native HTML5 Video) */}
            <div className="relative aspect-video w-full bg-stone-950 flex items-center justify-center overflow-hidden">
              {/* A. YouTube Live Embed */}
              {streamInfo.provider === 'youtube' && streamInfo.embedUrl && streamInfo.embedUrl.trim() && (
                <iframe
                  key={activeChannel.id}
                  src={streamInfo.embedUrl.trim()}
                  title={activeChannel.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0 absolute inset-0 z-10"
                />
              )}

              {/* B. Facebook Live Embed */}
              {streamInfo.provider === 'facebook' && streamInfo.embedUrl && streamInfo.embedUrl.trim() && (
                <iframe
                  key={activeChannel.id}
                  src={streamInfo.embedUrl.trim()}
                  title={activeChannel.title}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0 absolute inset-0 z-10"
                />
              )}

              {/* C. Direct HTML5 / MP4 / HLS Video */}
              {streamInfo.provider === 'native' && activeChannel.videoUrl && activeChannel.videoUrl.trim() && (
                <video
                  ref={videoRef}
                  src={activeChannel.videoUrl.trim()}
                  poster={activeChannel.thumbnailUrl && activeChannel.thumbnailUrl.trim() ? activeChannel.thumbnailUrl.trim() : undefined}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}

              {/* Floating Reaction Animation */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {floatingEmojis.map((e, idx) => (
                  <motion.div
                    key={`floating-emoji-${e.id || idx}_${idx}`}
                    initial={{ opacity: 1, y: 150, scale: 0.8 }}
                    animate={{ opacity: 0, y: -50, scale: 1.5 }}
                    transition={{ duration: 1.8, ease: 'easeOut' }}
                    style={{ left: `${e.x}%` }}
                    className="absolute bottom-10 text-3xl select-none"
                  >
                    {e.emoji}
                  </motion.div>
                ))}
              </div>

              {/* Live Badge & Source Overlay */}
              <div className="absolute top-3 left-3 flex items-center space-x-2 z-20 pointer-events-none">
                <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs shadow-lg animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>EN DIRECT</span>
                </span>

                {streamInfo.provider === 'youtube' && (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-600/90 text-white font-bold text-[10px] shadow">
                    <Youtube className="w-3 h-3" />
                    <span>YouTube Live</span>
                  </span>
                )}

                {streamInfo.provider === 'facebook' && (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-600/90 text-white font-bold text-[10px] shadow">
                    <Facebook className="w-3 h-3" />
                    <span>Facebook Live</span>
                  </span>
                )}

                <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-amber-300 font-mono font-bold text-xs border border-white/10">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{activeChannel.viewersCount.toLocaleString()} spectateurs</span>
                </span>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-3 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {streamInfo.provider === 'native' && (
                  <>
                    <button
                      onClick={togglePlay}
                      className="p-2 rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-stone-950" />}
                    </button>

                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 transition-colors cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </>
                )}

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs truncate">{activeChannel.currentProgram}</div>
                  <div className="text-[10px] text-amber-300 truncate">{activeChannel.title}</div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => triggerEmoji('❤️')}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-xs font-bold cursor-pointer"
                >
                  <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span>{likesCount.toLocaleString()}</span>
                </button>

                <button
                  onClick={() => onSendTip?.(activeChannel.hostName, activeChannel.title)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 text-xs font-black shadow-md cursor-pointer hover:scale-105 transition-all"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Don MoMo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Channel Details & Host Star Access */}
          <div className="p-4 rounded-3xl bg-stone-900 border border-stone-800 text-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <UserAvatar
                name={activeChannel.hostName}
                avatar={activeChannel.hostAvatar}
                size="lg"
                className="border-2 border-amber-400 shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-black text-sm text-white">{activeChannel.hostName}</h3>
                  <span>{activeChannel.hostFlag}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-stone-950">
                    ANIMATEUR STAR
                  </span>
                </div>
                <p className="text-xs text-stone-300 font-medium line-clamp-1">{activeChannel.title}</p>
                <p className="text-[11px] text-amber-300/90 font-mono mt-0.5">
                  Prochain : {activeChannel.nextProgram || 'Édition spéciale'}
                </p>
              </div>
            </div>

            {/* Accès VIP Star Quick Button on Host */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                id="webtv-star-vip-access-btn"
                onClick={() => onOpenStarVipModal({
                  id: `host_${activeChannel.id}`,
                  name: activeChannel.hostName,
                  username: `@${activeChannel.hostName.toLowerCase().replace(/\s+/g, '_')}`,
                  avatar: activeChannel.hostAvatar,
                  flag: activeChannel.hostFlag,
                  country: activeChannel.hostCountry,
                  isVIP: true,
                })}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 fill-stone-950 text-stone-950" />
                <span>Accès VIP Star (Dès 2 €)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Live Chat & Instant Interaction */}
        <div className="rounded-3xl bg-stone-900 border border-stone-800 p-3.5 flex flex-col h-[480px] shadow-xl">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-800">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="font-black text-xs text-white uppercase tracking-wider">
                Direct Tchat & Réactions
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold">Actif</span>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto py-2.5 space-y-2.5 pr-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={`chat-msg-${msg.id || idx}_${idx}`}
                className={`p-2 rounded-2xl text-xs ${
                  msg.isTip
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-200'
                    : 'bg-stone-950/60 border border-stone-800 text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <UserAvatar
                      name={msg.senderName}
                      avatar={msg.senderAvatar}
                      size="xs"
                    />
                    <span className="font-bold text-[11px] text-amber-400 truncate max-w-[120px]">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px]">{msg.senderFlag}</span>
                  </div>
                  <span className="text-[9px] text-stone-500">{msg.timestamp}</span>
                </div>
                <p className="text-[11px] leading-relaxed pl-5">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Quick Reaction Bar */}
          <div className="py-2 flex items-center justify-around border-t border-stone-800/80 bg-stone-950/40 rounded-xl mb-2">
            {['🔥', '👏', '❤️', '👑', '💯'].map((emoji, idx) => (
              <button
                key={`webtv-quick-emoji-${emoji}_${idx}`}
                type="button"
                onClick={() => triggerEmoji(emoji)}
                className="text-lg hover:scale-125 active:scale-90 transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChatMessage} className="relative flex items-center space-x-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Écrire un message en direct..."
              className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-400 text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 disabled:opacity-40 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Grid of Channels */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tv className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white">
              Toutes les Chaînes & Directs ({sortedChannels.length})
            </h2>
          </div>
          <span className="text-xs text-stone-400">Cliquez pour regarder</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {sortedChannels.map((channel, idx) => {
            const isCurrent = channel.id === activeChannel.id;
            const parsed = parseStreamUrl(channel.videoUrl);

            return (
              <div
                key={`webtv-channel-${channel.id || idx}_${idx}`}
                id={`channel-card-${channel.id}`}
                onClick={() => {
                  setActiveChannelId(channel.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`relative rounded-3xl bg-stone-900 border overflow-hidden cursor-pointer group transition-all ${
                  channel.isBoosted
                    ? 'border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                    : isCurrent
                    ? 'border-orange-500 ring-2 ring-orange-500/40'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                {/* Thumbnail & Badges */}
                <div className="relative aspect-video w-full overflow-hidden bg-stone-950 flex items-center justify-center">
                  {channel.thumbnailUrl && channel.thumbnailUrl.trim() ? (
                    <img
                      src={channel.thumbnailUrl.trim()}
                      alt={channel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 flex flex-col items-center justify-center text-amber-400/80 group-hover:scale-105 transition-transform duration-300">
                      <Tv className="w-8 h-8 mb-1 opacity-70" />
                      <span className="text-[10px] font-bold text-stone-400">Direct Web TV</span>
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] flex items-center space-x-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>LIVE</span>
                    </span>

                    {parsed.provider === 'youtube' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center space-x-0.5">
                        <Youtube className="w-2.5 h-2.5" />
                        <span>YouTube</span>
                      </span>
                    )}

                    {parsed.provider === 'facebook' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-[9px] flex items-center space-x-0.5">
                        <Facebook className="w-2.5 h-2.5" />
                        <span>Facebook</span>
                      </span>
                    )}

                    {channel.isBoosted && (
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-[9px] shadow-sm flex items-center space-x-0.5">
                        <Flame className="w-2.5 h-2.5 fill-stone-950" />
                        <span>BOOSTÉ</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-amber-300 font-mono text-[10px] font-bold">
                    👥 {channel.viewersCount.toLocaleString()}
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-[11px] text-amber-400 font-bold">
                    <UserAvatar
                      name={channel.hostName}
                      avatar={channel.hostAvatar}
                      size="xs"
                    />
                    <span className="truncate">{channel.hostName}</span>
                    <span>{channel.hostFlag}</span>
                  </div>

                  <h3 className="font-black text-xs text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {channel.title}
                  </h3>

                  <p className="text-[11px] text-stone-400 line-clamp-2 leading-snug">
                    {channel.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[10px] text-stone-500 border-t border-stone-800/80">
                    <span className="truncate max-w-[130px]">{channel.currentProgram}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBoostModal(channel);
                      }}
                      className="text-amber-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Booster</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Live Stream Modal (YouTube, Facebook, External MP4/M3U8) */}
      <AnimatePresence>
        {isAddStreamOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-800 p-5 shadow-2xl text-stone-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">Ajouter un Direct Live</h3>
                    <p className="text-xs text-stone-400">Compatible YouTube Live, Facebook Live et MP4/M3U8</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddStreamOpen(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomStream} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Lien du Direct (YouTube, Facebook ou URL Vidéo) *
                  </label>
                  <input
                    type="url"
                    required
                    value={customStreamUrl}
                    onChange={(e) => setCustomStreamUrl(e.target.value)}
                    placeholder="ex: https://www.youtube.com/watch?v=... ou https://www.facebook.com/.../videos/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    Prend en charge les liens directs de chaînes YouTube, flux Facebook Live ou fichiers vidéo.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Titre de la Chaîne / Émission *
                  </label>
                  <input
                    type="text"
                    required
                    value={customStreamTitle}
                    onChange={(e) => setCustomStreamTitle(e.target.value)}
                    placeholder="ex: Grand Concert Live d'Abidjan • Édition Spéciale"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={customStreamCategory}
                      onChange={(e) => setCustomStreamCategory(e.target.value as 'news' | 'music' | 'culture' | 'sports' | 'comedy' | 'cinema')}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="news">Actualités & Débats</option>
                      <option value="music">Musique & Afrobeats</option>
                      <option value="sports">Sports & Football</option>
                      <option value="comedy">Humour & Stand-up</option>
                      <option value="culture">Culture & Mode</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Nom de l'Animateur / Chaîne
                    </label>
                    <input
                      type="text"
                      value={customStreamHost}
                      onChange={(e) => setCustomStreamHost(e.target.value)}
                      placeholder={currentUser.name}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                 <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-xs text-stone-950 hover:opacity-90 transition-opacity flex items-center space-x-1"
                  >
                    <span>Lancer la diffusion Live</span>
                    <Radio className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WebTvView;
