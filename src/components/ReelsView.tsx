import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Coins, 
  Lock, 
  Sparkles, 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronUp, 
  ChevronDown, 
  Send,
  X,
  CheckCircle,
  Crown,
  ArrowLeft
} from 'lucide-react';
import { Post, User, Contact } from '../types';

interface ReelsViewProps {
  reels: Post[];
  currentUser: User;
  contacts?: Contact[];
  onGoBack?: () => void;
  onLikeReel: (reelId: string) => void;
  onUnlockVIPReel: (reel: Post) => void;
  onTipCreator: (reel: Post) => void;
  onAddComment: (reelId: string, text: string) => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({
  reels,
  currentUser,
  contacts = [],
  onGoBack,
  onLikeReel,
  onUnlockVIPReel,
  onTipCreator,
  onAddComment,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Filter blocked & suspended authors from Reels
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

  const availableReels = reels.filter((reel) => {
    const authorId = reel.author.id || reel.userId;
    const authorUsername = reel.author.username ? reel.author.username.toLowerCase() : '';
    if (
      blockedIdentifiers.has(authorId) ||
      (authorUsername && blockedIdentifiers.has(authorUsername)) ||
      reel.author.isSuspended ||
      suspendedIdentifiers.has(authorId) ||
      (authorUsername && suspendedIdentifiers.has(authorUsername))
    ) {
      return false;
    }
    return true;
  });

  const currentReel = availableReels[currentIndex] || availableReels[0] || reels[0];
  if (!currentReel || availableReels.length === 0) {
    return (
      <div id="reels-empty-container" className="relative w-full max-w-md mx-auto h-[calc(100vh-140px)] min-h-[500px] max-h-[820px] rounded-3xl bg-stone-950 border border-stone-800 shadow-2xl flex flex-col items-center justify-center p-8 text-center space-y-4 text-stone-300">
        <div className="w-16 h-16 rounded-3xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-500">
          <Play className="w-8 h-8 ml-1" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-white">Aucun utilisateur trouvé</h3>
          <p className="text-xs text-stone-400">
            Aucun reel ou vidéo courte n'a encore été publié par les utilisateurs.
          </p>
        </div>
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:scale-105 transition-all"
          >
            Retour au fil d'actualité
          </button>
        )}
      </div>
    );
  }

  const isVipLocked = currentReel?.isVIPOnly && !currentReel.isUnlocked;

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const handleDoubleTap = () => {
    setShowHeartBurst(true);
    if (!currentReel.isLiked) {
      onLikeReel(currentReel.id);
    }
    setTimeout(() => {
      setShowHeartBurst(false);
    }, 900);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(currentReel.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div id="reels-view-container" className="relative w-full max-w-md mx-auto h-[calc(100vh-140px)] min-h-[580px] max-h-[820px] rounded-3xl overflow-hidden bg-black border border-stone-800 shadow-2xl flex flex-col justify-between select-none">
      {/* Video Container */}
      <div 
        className="absolute inset-0 z-0 bg-black cursor-pointer flex items-center justify-center"
        onClick={() => setIsPlaying(!isPlaying)}
        onDoubleClick={handleDoubleTap}
      >
        {currentReel.mediaUrl && !isVipLocked ? (
          <video
            key={currentReel.id}
            src={currentReel.mediaUrl}
            poster={currentReel.thumbnailUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            autoPlay
            muted={isMuted}
            ref={(el) => {
              if (el) {
                if (isPlaying) el.play().catch(() => {});
                else el.pause();
              }
            }}
          />
        ) : isVipLocked ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900">
            {currentReel.thumbnailUrl && (
              <img
                src={currentReel.thumbnailUrl}
                alt="Locked Reel"
                className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-40 scale-110"
              />
            )}
            <div className="relative z-10 p-6 rounded-3xl bg-stone-900/95 border border-amber-500/50 shadow-2xl max-w-xs space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-stone-950 font-black shadow-lg">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  REEL VIP EXCLUSIF
                </span>
                <h4 className="font-bold text-base text-stone-100 mt-2">
                  Vidéo réservée aux membres VIP
                </h4>
                <p className="text-xs text-stone-400 mt-1">
                  Débloquez instantanément ce tutoriel exclusif avec Orange Money, Wave ou MTN MoMo.
                </p>
              </div>

              <button
                id="unlock-vip-reel-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlockVIPReel(currentReel);
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              >
                <Sparkles className="w-4 h-4" />
                <span>Débloquer pour {currentReel.vipPrice || 1500} FCFA</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Play/Pause indicator overlay */}
        {!isPlaying && !isVipLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
              <Play className="w-8 h-8 ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Double-tap heart animation */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <Heart className="w-28 h-28 text-rose-500 fill-rose-500 drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Vignette & Controls */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onGoBack) onGoBack();
              }}
              className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all flex items-center space-x-1 cursor-pointer"
              title="Retour"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold hidden sm:inline">Retour</span>
            </button>

            <span className="font-black text-sm tracking-wide text-amber-400">AfriShorts</span>
            <span className="text-xs text-stone-300 hidden sm:inline">| Vidéos d'Afrique 🌍</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/80"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Right Action Sidebar (TikTok Style) */}
      <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center space-y-4">
        {/* Author Avatar with Follow Badge */}
        <div className="relative mb-2">
          <UserAvatar
            name={currentReel.author.name}
            avatar={currentReel.author.avatar}
            size="lg"
            className="border-2 border-amber-500 shadow-xl"
          />
          <div className="absolute -bottom-1 -right-1 text-sm">
            {currentReel.author.flag}
          </div>
        </div>

        {/* Like Button */}
        <button
          id={`reel-like-btn-${currentReel.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onLikeReel(currentReel.id);
          }}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className={`p-3 rounded-full backdrop-blur-md transition-all ${
            currentReel.isLiked ? 'bg-rose-500/30 text-rose-500 scale-110' : 'bg-black/50 text-white hover:bg-black/70'
          }`}>
            <Heart className={`w-6 h-6 ${currentReel.isLiked ? 'fill-rose-500' : ''}`} />
          </div>
          <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
            {currentReel.likesCount.toLocaleString()}
          </span>
        </button>

        {/* Comments Button */}
        <button
          id="reel-comments-toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsCommentsOpen(true);
          }}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
            {currentReel.commentsCount + (currentReel.comments?.length || 0)}
          </span>
        </button>

        {/* Pourboire Mobile Money Button */}
        <button
          id="reel-tip-creator-btn"
          onClick={(e) => {
            e.stopPropagation();
            onTipCreator(currentReel);
          }}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="p-3 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 font-black shadow-lg shadow-orange-500/20 hover:scale-110 transition-transform">
            <Coins className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-amber-300 mt-1 drop-shadow">
            Pourboire
          </span>
        </button>

        {/* Share Button */}
        <button
          id="reel-share-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
          }}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
            {currentReel.sharesCount}
          </span>
        </button>

        {/* Rotating Music Disc */}
        <div className="w-10 h-10 rounded-full bg-stone-900 border-2 border-amber-500/50 p-1 flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
          <Music className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      {/* Bottom Info & Caption Overlay */}
      <div className="relative z-10 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent space-y-2 max-w-[80%] text-white">
        <div className="flex items-center space-x-2">
          <h4 className="font-bold text-sm text-stone-100 flex items-center space-x-1">
            <span>{currentReel.author.name}</span>
            {currentReel.author.isVerified && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />}
          </h4>
          <span className="text-xs text-stone-300 font-mono">{currentReel.author.username}</span>
        </div>

        <p className="text-xs text-stone-200 line-clamp-2 leading-relaxed">
          {currentReel.content}
        </p>

        {currentReel.musicTrack && (
          <div className="flex items-center space-x-1.5 text-[11px] text-amber-300 truncate">
            <Music className="w-3 h-3 shrink-0" />
            <span className="truncate">{currentReel.musicTrack}</span>
          </div>
        )}
      </div>

      {/* Up/Down Scroll Navigation buttons */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col space-y-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white disabled:opacity-20 hover:bg-black/70 cursor-pointer"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === reels.length - 1}
          className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white disabled:opacity-20 hover:bg-black/70 cursor-pointer"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Comments Drawer Modal */}
      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 z-30 h-[70%] bg-stone-900/98 backdrop-blur-xl border-t border-stone-700 rounded-t-3xl p-4 flex flex-col justify-between text-stone-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <span className="font-bold text-sm">
                Commentaires ({currentReel.comments?.length || 0})
              </span>
              <button
                onClick={() => setIsCommentsOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {currentReel.comments && currentReel.comments.length > 0 ? (
                currentReel.comments.map((c) => (
                  <div key={c.id} className="flex items-start space-x-2.5 text-xs">
                    <UserAvatar
                      name={c.userName}
                      avatar={c.userAvatar}
                      size="xs"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-stone-200">{c.userName}</span>
                        <span>{c.userFlag}</span>
                        <span className="text-[10px] text-stone-500">{c.timestamp}</span>
                      </div>
                      <p className="text-stone-300 mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-stone-400">
                  Soyez le premier à commenter ce Reel !
                </div>
              )}
            </div>

            {/* Input Comment */}
            <form onSubmit={handleSendComment} className="flex items-center space-x-2 pt-2 border-t border-stone-800">
              <UserAvatar
                name={currentUser.name}
                avatar={currentUser.avatar}
                size="xs"
              />
              <input
                type="text"
                placeholder="Ajouter un commentaire..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-stone-800 rounded-full px-4 py-2 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2 rounded-full bg-amber-500 text-stone-950 disabled:opacity-30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
