import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Plus, 
  Search, 
  CheckCircle2, 
  Users, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Heart, 
  MessageSquare, 
  Share2, 
  Crown, 
  Sparkles, 
  Filter,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
  ArrowLeft
} from 'lucide-react';
import { OfficialPage, PageCategory, Post, User, VirtualGift } from '../types';
import { CreatePageModal } from './CreatePageModal';
import { SendGiftModal } from './SendGiftModal';

interface PagesViewProps {
  pages: OfficialPage[];
  posts: Post[];
  currentUser: User;
  onGoBack?: () => void;
  onToggleFollowPage: (pageId: string) => void;
  onCreatePage: (newPage: Omit<OfficialPage, 'id' | 'createdAt'>) => void;
  onOpenCreatePost: () => void;
  onOpenDeposit: () => void;
  onLikePost: (postId: string) => void;
}

export const PagesView: React.FC<PagesViewProps> = ({
  pages,
  posts,
  currentUser,
  onGoBack,
  onToggleFollowPage,
  onCreatePage,
  onOpenCreatePost,
  onOpenDeposit,
  onLikePost,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<OfficialPage | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [giftTargetPage, setGiftTargetPage] = useState<OfficialPage | null>(null);

  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'Toutes les Pages', icon: '🌟' },
    { id: 'business', label: 'Entreprises & Mode', icon: '🏢' },
    { id: 'artist', label: 'Artistes & Musique', icon: '🎤' },
    { id: 'startup', label: 'Tech & Startups', icon: '🚀' },
    { id: 'community', label: 'Communautés & Asso', icon: '🤝' },
    { id: 'media', label: 'Médias & TV', icon: '📺' },
  ];

  const filteredPages = pages.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Filter posts belonging to the selected page
  const pagePosts = selectedPage
    ? posts.filter((post) => post.author.username === selectedPage.handle || post.author.name === selectedPage.name)
    : [];

  return (
    <div id="pages-view-container" className="max-w-2xl mx-auto space-y-5 pb-24 text-stone-100 px-3 sm:px-0">
      {/* Top Universal Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          id="pages-back-btn"
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
          Pages Officielles AfriChat
        </span>
      </div>

      {/* Top Banner & Creation CTA */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-amber-500/40 shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                PAGES OFFICIELLES AFRICHAT
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Entreprises, Artistes & Startups Panafricaines
            </h2>
            <p className="text-xs text-stone-400 max-w-md">
              Abonnez-vous aux actualités officielles des marques, artistes et créateurs du continent ou lancez votre propre page.
            </p>
          </div>

          <button
            id="create-official-page-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 cursor-pointer hover:scale-102 active:scale-98 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Créer une Page</span>
          </button>
        </div>
      </motion.div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une page officielle, une entreprise, un artiste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-900 border border-stone-800 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Categories Carousel */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedPage(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail View of a Selected Page OR Pages Directory List */}
      {selectedPage ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Back Button */}
          <button
            onClick={() => setSelectedPage(null)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer"
          >
            <span>← Retour à l'annuaire des pages</span>
          </button>

          {/* Page Profile Header */}
          <div className="rounded-3xl bg-stone-900 border border-stone-800 overflow-hidden shadow-xl">
            {/* Cover */}
            <div className="relative aspect-[3/1] bg-stone-950">
              <img src={selectedPage.coverImage} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
            </div>

            {/* Content info */}
            <div className="p-5 relative -mt-10 sm:-mt-12 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="flex items-end space-x-3.5">
                  <img
                    src={selectedPage.avatar}
                    alt={selectedPage.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-stone-900 shadow-2xl bg-stone-900"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-lg sm:text-xl font-black text-white">{selectedPage.name}</h3>
                      {selectedPage.isVerified && (
                        <CheckCircle2 className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                      )}
                    </div>
                    <p className="text-xs font-mono text-amber-400">{selectedPage.handle}</p>
                    <span className="text-[11px] text-stone-400 flex items-center space-x-1 mt-0.5">
                      <span>{selectedPage.countryFlag} {selectedPage.country}</span>
                      <span>•</span>
                      <span className="text-amber-300 font-bold">{selectedPage.categoryLabel}</span>
                    </span>
                  </div>
                </div>

                {/* Follow Button & Gift */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onToggleFollowPage(selectedPage.id)}
                    className={`py-2.5 px-5 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-md flex items-center space-x-1.5 ${
                      selectedPage.isFollowing
                        ? 'bg-stone-800 border border-stone-700 text-stone-300 hover:text-rose-400'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 hover:scale-105'
                    }`}
                  >
                    <span>{selectedPage.isFollowing ? '✓ Abonné(e)' : '+ S’abonner'}</span>
                  </button>

                  <button
                    onClick={() => setGiftTargetPage(selectedPage)}
                    className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                    title="Offrir un cadeau à la page"
                  >
                    🎁
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-stone-300 leading-relaxed max-w-xl">
                {selectedPage.description}
              </p>

              {/* Page Stats & Contact Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-800/80 text-xs">
                <div className="flex items-center space-x-1 text-stone-300">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold">{selectedPage.followersCount.toLocaleString()} abonnés</span>
                </div>

                {selectedPage.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedPage.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 text-emerald-400 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {selectedPage.website && (
                  <a
                    href={selectedPage.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 text-amber-400 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Site Web</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Dedicated Page Feed Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center space-x-2">
                <span>Publications Officielles</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                  {pagePosts.length}
                </span>
              </h4>

              <button
                onClick={onOpenCreatePost}
                className="text-xs text-amber-400 hover:underline font-bold"
              >
                + Publier sur cette page
              </button>
            </div>

            {pagePosts.length > 0 ? (
              pagePosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-3xl bg-stone-900 border border-stone-800 space-y-3"
                >
                  <p className="text-xs text-stone-200 leading-relaxed">{post.content}</p>
                  {post.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden aspect-video bg-stone-950">
                      {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                    <button
                      onClick={() => onLikePost(post.id)}
                      className={`flex items-center space-x-1 cursor-pointer ${
                        post.isLiked ? 'text-rose-400' : 'hover:text-white'
                      }`}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                      <span>{post.likesCount}</span>
                    </button>
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-3xl bg-stone-900/60 border border-stone-800 text-stone-400 text-xs space-y-2">
                <p>Aucune publication récente sur cette page.</p>
                <button
                  onClick={onOpenCreatePost}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                >
                  Être le premier à publier
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        /* Pages Directory Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredPages.map((page) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl bg-stone-900 border border-stone-800/90 overflow-hidden shadow-lg hover:border-amber-500/40 transition-all flex flex-col justify-between group"
            >
              {/* Cover Banner */}
              <div
                onClick={() => setSelectedPage(page)}
                className="relative aspect-[3/1] bg-stone-950 cursor-pointer overflow-hidden"
              >
                <img
                  src={page.coverImage}
                  alt={page.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  {page.categoryLabel}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start space-x-3">
                    <img
                      src={page.avatar}
                      alt={page.name}
                      onClick={() => setSelectedPage(page)}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/80 shadow-md cursor-pointer -mt-7 bg-stone-900 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        onClick={() => setSelectedPage(page)}
                        className="flex items-center space-x-1 cursor-pointer"
                      >
                        <h3 className="text-sm font-black text-white truncate group-hover:text-amber-300 transition-colors">
                          {page.name}
                        </h3>
                        {page.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-amber-400/90 truncate block">
                        {page.handle}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 line-clamp-2 mt-2 leading-relaxed">
                    {page.description}
                  </p>
                </div>

                {/* Footer Bar */}
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[11px] text-stone-400">
                    <span>{page.countryFlag}</span>
                    <span className="font-bold text-stone-300">
                      {page.followersCount.toLocaleString()} abonnés
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleFollowPage(page.id)}
                      className={`py-1.5 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        page.isFollowing
                          ? 'bg-stone-800 text-stone-300 border border-stone-700 hover:text-rose-300'
                          : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow'
                      }`}
                    >
                      {page.isFollowing ? 'Abonné' : '+ Suivre'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPage(page)}
                      className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Page Modal */}
      {isCreateModalOpen && (
        <CreatePageModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          currentUser={currentUser}
          onCreatePage={onCreatePage}
        />
      )}

      {/* Send Gift to Page Modal */}
      {giftTargetPage && (
        <SendGiftModal
          isOpen={!!giftTargetPage}
          onClose={() => setGiftTargetPage(null)}
          currentUser={currentUser}
          recipientName={giftTargetPage.name}
          recipientAvatar={giftTargetPage.avatar}
          recipientFlag={giftTargetPage.countryFlag}
          onSendGift={(gift) => {
            setGiftTargetPage(null);
          }}
          onOpenDeposit={onOpenDeposit}
        />
      )}
    </div>
  );
};
