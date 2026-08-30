import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Heart, Send, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Story, User } from '../types';
import { UserAvatar } from './UserAvatar';

interface StoriesBarProps {
  stories: Story[];
  currentUser: User;
  onOpenStory: (story: Story) => void;
  onAddStory: () => void;
  onUnlockVIP: (story: Story) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  currentUser,
  onOpenStory,
  onAddStory,
  onUnlockVIP,
}) => {
  return (
    <div id="stories-bar-container" className="w-full overflow-x-auto no-scrollbar py-3 px-4 bg-stone-900/60 border-b border-stone-800/80">
      <div className="flex items-center space-x-3.5 min-w-max">
        {/* Current User Add Story */}
        <button
          id="add-my-story-btn"
          onClick={onAddStory}
          className="flex flex-col items-center space-y-1.5 focus:outline-none group text-left cursor-pointer"
          title="Ajouter ou publier un nouveau statut / Story"
        >
          <div className="relative">
            <UserAvatar
              name={currentUser.name}
              username={currentUser.username}
              avatar={currentUser.avatar}
              flag={currentUser.flag}
              size="xl"
              className="w-16 h-16 p-0.5 border-2 border-dashed border-amber-500/80 group-hover:border-amber-400 group-hover:scale-105 transition-all shadow-md"
            />
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center shadow-lg border-2 border-stone-900 group-hover:scale-110 transition-transform">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-400 max-w-[72px] truncate">
            + Ma Story
          </span>
        </button>

        {/* Stories list */}
        {stories.map((story) => (
          <button
            id={`story-item-${story.id}`}
            key={story.id}
            onClick={() => onOpenStory(story)}
            className="flex flex-col items-center space-y-1.5 focus:outline-none group text-center cursor-pointer"
          >
            <div className="relative">
              <div
                className={`p-0.5 rounded-full ${
                  story.vipLocked
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-yellow-300 ring-1 ring-amber-400/50'
                    : story.hasUnseen
                    ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500'
                    : 'bg-stone-700'
                }`}
              >
                <UserAvatar
                  name={story.userName}
                  avatar={story.userAvatar}
                  flag={story.userFlag}
                  size="lg"
                  className="w-15 h-15 border-2 border-stone-900 group-hover:scale-105 transition-transform"
                />
              </div>

              {story.vipLocked && (
                <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              )}

              <span className="absolute bottom-0 right-0 text-xs drop-shadow-md">
                {story.userFlag}
              </span>
            </div>

            <span className="text-[11px] font-medium text-stone-300 max-w-[64px] truncate">
              {story.userName.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface StoryViewerModalProps {
  story: Story | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onUnlockVIP?: (story: Story) => void;
  onReply?: (story: Story, text: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  story,
  onClose,
  onNext,
  onPrev,
  onUnlockVIP,
  onReply,
}) => {
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);

  if (!story) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    if (onReply) {
      onReply(story, replyText);
    }
    setReplyText('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        id="story-viewer-modal" 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md h-[90vh] max-h-[780px] bg-stone-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-stone-800"
        >
          {/* Background Story Media */}
          <div className="absolute inset-0 z-0">
            {story.mediaUrl && story.mediaUrl.trim() ? (
              <img
                src={story.mediaUrl.trim()}
                alt={story.caption || 'Story'}
                className={`w-full h-full object-cover ${story.vipLocked ? 'filter blur-md brightness-75 scale-105' : ''}`}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-stone-900 via-stone-850 to-stone-950 flex items-center justify-center text-stone-500 text-xs">
                Story
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
          </div>

          {/* Top Progress & Header */}
          <div className="relative z-10 p-4 space-y-3">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 7, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
              />
            </div>

            {/* Author info */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <UserAvatar
                  name={story.userName}
                  avatar={story.userAvatar}
                  flag={story.userFlag}
                  size="md"
                  className="w-10 h-10 border-2 border-amber-500"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sm">{story.userName}</span>
                    <span>{story.userFlag}</span>
                    {story.vipLocked && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-stone-950 font-black">
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-300">{story.timestamp}</p>
                </div>
              </div>

              <button
                id="close-story-viewer-btn"
                onClick={onClose}
                className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Content / VIP Lock Screen */}
          <div className="relative z-10 px-6 py-4 flex-1 flex flex-col justify-center items-center text-center">
            {story.vipLocked ? (
              <div className="p-6 rounded-3xl bg-stone-900/90 border border-amber-500/40 shadow-2xl space-y-4 max-w-xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-stone-950 shadow-lg shadow-orange-500/20">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-stone-100">Statut VIP Privé</h4>
                  <p className="text-xs text-stone-400 mt-1">
                    Accédez aux coulisses et secrets studio de {story.userName} via Mobile Money.
                  </p>
                </div>
                <button
                  id="unlock-vip-story-btn"
                  onClick={() => onUnlockVIP && onUnlockVIP(story)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Débloquer (500 FCFA) 🍊 🌊</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* Bottom Caption & Interactive Reply Bar */}
          <div className="relative z-10 p-4 space-y-3">
            {story.caption && (
              <div className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-stone-100 text-xs">
                {story.caption}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <form onSubmit={handleSendReply} className="flex-1 flex items-center bg-black/60 backdrop-blur-md rounded-full border border-white/20 px-3.5 py-1.5">
                <input
                  type="text"
                  placeholder={`Répondre à ${story.userName.split(' ')[0]}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-stone-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="p-1.5 rounded-full text-amber-400 hover:text-amber-300 disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <button
                id="story-like-btn"
                onClick={() => setLiked(!liked)}
                className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                  liked 
                    ? 'bg-rose-500 border-rose-400 text-white scale-110' 
                    : 'bg-black/60 border-white/20 text-white hover:bg-black/80'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-white' : ''}`} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
