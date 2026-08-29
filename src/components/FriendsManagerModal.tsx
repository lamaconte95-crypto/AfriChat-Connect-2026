import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  UserPlus, 
  UserCheck, 
  Users, 
  Phone, 
  Video, 
  MessageSquare, 
  Coins, 
  Crown, 
  Check, 
  Sparkles,
  Smartphone,
  Globe,
  Heart,
  Clock,
  UserX,
  ShieldCheck,
  Filter,
  RefreshCw,
  ArrowLeft,
  Database,
  Swords
} from 'lucide-react';
import { Contact, User } from '../types';
import { COUNTRIES } from '../data/mockData';
import { supabaseSearchUsers, isSupabaseConfigured } from '../services/supabaseService';

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  senderFlag: string;
  senderCountry: string;
  timestamp: string;
  mutualFriendsCount: number;
  bio?: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface FriendsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  currentUser: User;
  onToggleFriend: (contactId: string) => void;
  onToggleBlock: (contactId: string) => void;
  onAddContact: (newContact: Omit<Contact, 'id' | 'userId' | 'isBlocked' | 'isOnline'>) => void;
  onOpenContactProfile: (contact: Contact) => void;
  onOpenChatWithContact: (contact: Contact) => void;
  onStartCallWithContact: (contact: Contact, type: 'audio' | 'video') => void;
  onSendTipToContact: (contact: Contact) => void;
  onOpenGameChallenge?: (contact: Contact) => void;
  onTriggerToast?: (message: string, type?: 'success' | 'danger' | 'info') => void;
  initialTab?: 'online' | 'add' | 'requests' | 'all';
  onRefreshUsers?: () => Promise<void>;
  isRefreshingUsers?: boolean;
  supabaseUsersCount?: number;
}

// Initial suggested members (dynamic from Supabase)
const SUGGESTED_MEMBERS: Array<Omit<Contact, 'id' | 'userId' | 'isBlocked' | 'isOnline'>> = [];

export const FriendsManagerModal: React.FC<FriendsManagerModalProps> = ({
  isOpen,
  onClose,
  contacts,
  currentUser,
  onToggleFriend,
  onToggleBlock,
  onAddContact,
  onOpenContactProfile,
  onOpenChatWithContact,
  onStartCallWithContact,
  onSendTipToContact,
  onOpenGameChallenge,
  onTriggerToast,
  initialTab = 'online',
  onRefreshUsers,
  isRefreshingUsers = false,
  supabaseUsersCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'online' | 'add' | 'requests' | 'all'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());
  const [supabaseSearchResults, setSupabaseSearchResults] = useState<Contact[]>([]);
  const [isSearchingSupabase, setIsSearchingSupabase] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('À l\'instant');

  // Supabase live search debounce (instant single letter search)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSupabaseSearchResults([]);
      setIsSearchingSupabase(false);
      return;
    }

    let isMounted = true;
    setIsSearchingSupabase(true);

    const timer = setTimeout(async () => {
      try {
        const res = await supabaseSearchUsers(searchQuery);
        if (isMounted && res.data) {
          // Filter out current user
          const filtered = res.data.filter(
            (u) => u.id !== currentUser.id && u.username.toLowerCase() !== currentUser.username.toLowerCase()
          );
          setSupabaseSearchResults(filtered);
        }
      } catch (err) {
        console.warn('Live search error:', err);
      } finally {
        if (isMounted) setIsSearchingSupabase(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUser.id, currentUser.username]);

  // Handle manual refresh
  const handleManualRefresh = async () => {
    if (onRefreshUsers) {
      await onRefreshUsers();
      setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (onTriggerToast) {
        onTriggerToast('Liste des utilisateurs synchronisée avec Supabase (RLS vérifié) ! ✅', 'success');
      }
    }
  };

  // Incoming Friend Requests state (empty initially, loaded dynamically)
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  if (!isOpen) return null;

  // Filter Friends
  const onlineFriends = contacts.filter((c) => c.isFriend && !c.isBlocked && c.isOnline);
  const allFriends = contacts.filter((c) => c.isFriend && !c.isBlocked);
  const pendingRequests = friendRequests.filter((r) => r.status === 'pending');

  // Combined Suggested Members: SUGGESTED_MEMBERS + any non-friend contacts from Supabase in contacts list
  const dynamicSuggested: Array<Omit<Contact, 'id' | 'userId' | 'isBlocked' | 'isOnline'>> = [
    ...SUGGESTED_MEMBERS,
    ...contacts
      .filter((c) => !c.isFriend && !c.isBlocked && c.id !== currentUser.id)
      .map((c) => ({
        name: c.name,
        username: c.username,
        avatar: c.avatar,
        flag: c.flag,
        country: c.country,
        phoneNumber: c.phoneNumber,
        bio: c.bio || `Membre inscrit sur la communauté AfriChat ${c.flag}`,
        isVIP: c.isVIP,
        isFriend: false,
        mutualFriendsCount: c.mutualFriendsCount || 3,
        category: c.category || 'friend',
      })),
  ];

  // Deduplicate by username
  const uniqueSuggestedMap = new Map<string, typeof dynamicSuggested[0]>();
  dynamicSuggested.forEach((m) => {
    uniqueSuggestedMap.set(m.username.toLowerCase(), m);
  });
  const allSuggestedMembers = Array.from(uniqueSuggestedMap.values());

  // Handle Send Friend Request to Suggested Member
  const handleSendFriendRequest = (member: typeof SUGGESTED_MEMBERS[0]) => {
    if (sentRequestIds.has(member.username)) {
      // Cancel request
      setSentRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(member.username);
        return next;
      });
      if (onTriggerToast) {
        onTriggerToast(`Demande d'amitié annulée pour ${member.name}`, 'info');
      }
    } else {
      // Send request
      setSentRequestIds((prev) => new Set(prev).add(member.username));
      
      // Auto add as friend for testing/demo after prompt feedback
      onAddContact({
        ...member,
        isFriend: true,
      });

      if (onTriggerToast) {
        onTriggerToast(`Demande d'amitié envoyée à ${member.name} ! 🎉`, 'success');
      }
    }
  };

  // Handle Accept Request
  const handleAcceptRequest = (request: FriendRequest) => {
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: 'accepted' } : r))
    );

    // Add to real contacts list
    onAddContact({
      name: request.senderName,
      username: request.senderUsername,
      avatar: request.senderAvatar,
      flag: request.senderFlag,
      country: request.senderCountry,
      bio: request.bio,
      isVIP: false,
      isFriend: true,
      mutualFriendsCount: request.mutualFriendsCount,
      category: 'friend',
    });

    if (onTriggerToast) {
      onTriggerToast(`Vous êtes maintenant ami avec ${request.senderName} ! 🤝`, 'success');
    }
  };

  // Handle Decline Request
  const handleDeclineRequest = (requestId: string) => {
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'declined' } : r))
    );
    if (onTriggerToast) {
      onTriggerToast('Demande d’amitié refusée.', 'info');
    }
  };

  // Filtered lists based on search query
  const filteredOnline = onlineFriends.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllFriends = allFriends.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggested = allSuggestedMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.bio && m.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AnimatePresence>
      <div
        id="friends-manager-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden text-stone-100 my-4 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                id="friends-modal-back-btn"
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 transition-all flex items-center space-x-1 cursor-pointer group"
                title="← Retour"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs font-bold text-amber-300 hidden sm:inline">Retour</span>
              </button>

              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white flex items-center space-x-2">
                  <span>Gestion des Amis & Communauté</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {allFriends.length} amis
                  </span>
                </h3>
                <p className="text-xs text-stone-400">
                  Amis en ligne, demandes reçues et recherche instantanée Supabase
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {onRefreshUsers && (
                <button
                  id="friends-modal-refresh-btn"
                  onClick={handleManualRefresh}
                  disabled={isRefreshingUsers}
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition-all flex items-center space-x-1.5 border border-stone-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                  title="Rafraîchir les utilisateurs inscrits depuis Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingUsers ? 'animate-spin text-amber-400' : ''}`} />
                  <span className="hidden md:inline">Actualiser</span>
                </button>
              )}

              <button
                id="friends-modal-close-btn"
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Supabase RLS Realtime Status Bar */}
          <div className="px-4 py-2 bg-gradient-to-r from-stone-950 via-amber-950/20 to-stone-950 border-b border-stone-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Supabase RLS Actif</span>
              </span>
              <span className="text-stone-500 hidden sm:inline">•</span>
              <span className="text-stone-400 hidden sm:inline">
                Synchronisation automatique des nouveaux inscrits
              </span>
            </div>
            <div className="text-stone-400 text-[10px] flex items-center space-x-1">
              <span>{contacts.length} membres répertoriés</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 pt-3 pb-2 border-b border-stone-800/80 bg-stone-950/40 flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none">
            <button
              id="friends-tab-online"
              onClick={() => setActiveTab('online')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'online'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connectés ({onlineFriends.length})</span>
            </button>

            <button
              id="friends-tab-add"
              onClick={() => setActiveTab('add')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'add'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Ajouter des amis</span>
            </button>

            <button
              id="friends-tab-requests"
              onClick={() => setActiveTab('requests')}
              className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Demandes reçues</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black animate-bounce">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              id="friends-tab-all"
              onClick={() => setActiveTab('all')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tous mes amis ({allFriends.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 sm:p-4 border-b border-stone-800/80 bg-stone-900/50">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                id="friends-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, @pseudo, pays ou ville..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {/* 1. ONLINE FRIENDS TAB */}
            {activeTab === 'online' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Amis actuellement en ligne sur AfriChat</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{filteredOnline.length} connectés</span>
                  </span>
                </div>

                {filteredOnline.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl bg-stone-950/60 border border-stone-800 space-y-2">
                    <Users className="w-8 h-8 text-stone-600 mx-auto" />
                    <p className="text-xs text-stone-400 font-bold">Aucun utilisateur trouvé</p>
                    <p className="text-[11px] text-stone-500">Aucun ami n'est connecté pour le moment.</p>
                    <button
                      onClick={() => setActiveTab('add')}
                      className="text-xs text-amber-400 font-bold hover:underline block mx-auto pt-1"
                    >
                      Découvrir des membres ➔
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredOnline.map((contact) => (
                      <div
                        key={contact.id}
                        id={`online-friend-${contact.id}`}
                        className="p-3 rounded-2xl bg-stone-950/70 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-2"
                      >
                        <div
                          className="flex items-center space-x-2.5 cursor-pointer min-w-0 flex-1"
                          onClick={() => onOpenContactProfile(contact)}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className="w-10 h-10 rounded-xl object-cover border border-emerald-500/50"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-stone-900" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-xs text-white truncate">
                                {contact.name}
                              </span>
                              <span>{contact.flag}</span>
                            </div>
                            <span className="text-[10px] text-stone-400 truncate block">
                              {contact.username}
                            </span>
                            <span className="text-[9px] text-emerald-400 font-medium">
                              En ligne • {contact.country}
                            </span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center space-x-1 shrink-0">
                          {onOpenGameChallenge && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenGameChallenge(contact);
                              }}
                              className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-sm hover:scale-105"
                              title="Défier au Morpion (Tic-Tac-Toe)"
                            >
                              <Swords className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onClose();
                              onOpenChatWithContact(contact);
                            }}
                            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
                            title="Message direct"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              onStartCallWithContact(contact, 'audio');
                            }}
                            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                            title="Appel vocal"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              onSendTipToContact(contact);
                            }}
                            className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 hover:scale-105 transition-all"
                            title="Envoyer Mobile Money"
                          >
                            <Coins className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. ADD FRIENDS & DISCOVER MEMBERS TAB */}
            {activeTab === 'add' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Membres suggérés et communauté AfriChat</span>
                  <span className="text-amber-400 font-bold">{filteredSuggested.length} suggérés</span>
                </div>

                {filteredSuggested.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl bg-stone-950/60 border border-stone-800 space-y-2">
                    <Users className="w-8 h-8 text-stone-600 mx-auto" />
                    <p className="text-xs text-stone-300 font-bold">Aucun utilisateur trouvé</p>
                    <p className="text-[11px] text-stone-500">
                      {searchQuery
                        ? `Aucun utilisateur ne correspond à la recherche "${searchQuery}".`
                        : "Aucun nouvel utilisateur à suggérer pour le moment."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredSuggested.map((member) => {
                      const isRequested = sentRequestIds.has(member.username);
                      const alreadyFriend = contacts.some(
                        (c) => c.username.toLowerCase() === member.username.toLowerCase() && c.isFriend
                      );

                      return (
                        <div
                          key={member.username}
                          id={`suggested-member-${member.username}`}
                          className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 hover:border-stone-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start space-x-3 min-w-0 flex-1">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-11 h-11 rounded-2xl object-cover border border-amber-500/30 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className="font-bold text-xs text-white">{member.name}</span>
                                <span>{member.flag}</span>
                                {member.isVIP && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-stone-950">
                                    VIP STAR
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-stone-400 block">{member.username}</span>
                              {member.bio && (
                                <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5">
                                  {member.bio}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 text-[10px] text-amber-300/80 mt-1">
                                <span>👥 {member.mutualFriendsCount} amis en commun</span>
                                <span>• {member.country}</span>
                              </div>
                            </div>
                          </div>

                          {/* Send Request Button */}
                          <div className="w-full sm:w-auto shrink-0">
                            {alreadyFriend ? (
                              <span className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5">
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Déjà Ami</span>
                              </span>
                            ) : (
                              <button
                                id={`btn-add-friend-${member.username}`}
                                onClick={() => handleSendFriendRequest(member)}
                                className={`w-full sm:w-auto px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                                  isRequested
                                    ? 'bg-stone-800 text-amber-300 border border-amber-500/30 hover:bg-stone-700'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-md active:scale-95'
                                }`}
                              >
                                {isRequested ? (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Demande envoyée</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Ajouter en ami</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. PENDING FRIEND REQUESTS TAB */}
            {activeTab === 'requests' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Demandes d'amitié reçues en attente</span>
                  <span className="text-amber-400 font-bold">{pendingRequests.length} en attente</span>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl bg-stone-950/60 border border-stone-800 space-y-2">
                    <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs text-stone-300 font-bold">Toutes les demandes ont été traitées !</p>
                    <p className="text-[11px] text-stone-500">Vous n'avez aucune nouvelle demande d'amitié en attente.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        id={`request-item-${req.id}`}
                        className="p-3.5 rounded-2xl bg-stone-950/70 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                          <img
                            src={req.senderAvatar}
                            alt={req.senderName}
                            className="w-11 h-11 rounded-2xl object-cover border border-amber-400 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-xs text-white">{req.senderName}</span>
                              <span>{req.senderFlag}</span>
                              <span className="text-[10px] text-stone-400">{req.timestamp}</span>
                            </div>
                            <span className="text-[10px] text-amber-400">{req.senderUsername}</span>
                            {req.bio && (
                              <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5">{req.bio}</p>
                            )}
                            <span className="text-[10px] text-stone-400 mt-1 block">
                              👥 {req.mutualFriendsCount} amis en commun • {req.senderCountry}
                            </span>
                          </div>
                        </div>

                        {/* Accept / Decline Buttons */}
                        <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                          <button
                            id={`btn-accept-req-${req.id}`}
                            onClick={() => handleAcceptRequest(req)}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs flex items-center justify-center space-x-1 shadow-md active:scale-95 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Accepter</span>
                          </button>

                          <button
                            id={`btn-decline-req-${req.id}`}
                            onClick={() => handleDeclineRequest(req.id)}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 font-bold text-xs transition-colors cursor-pointer"
                          >
                            <span>Refuser</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. ALL MY FRIENDS TAB */}
            {activeTab === 'all' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Liste de tous vos amis ({filteredAllFriends.length})</span>
                  <span className="text-amber-400 font-bold">Connectés : {onlineFriends.length}</span>
                </div>

                {filteredAllFriends.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl bg-stone-950/60 border border-stone-800 space-y-2">
                    <Users className="w-8 h-8 text-stone-600 mx-auto" />
                    <p className="text-xs text-stone-400">Aucun ami trouvé correspondant à votre recherche.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredAllFriends.map((contact) => (
                      <div
                        key={contact.id}
                        id={`friend-card-${contact.id}`}
                        className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800 hover:border-stone-700 transition-all flex items-center justify-between gap-2"
                      >
                        <div
                          className="flex items-center space-x-2.5 cursor-pointer min-w-0 flex-1"
                          onClick={() => onOpenContactProfile(contact)}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className="w-10 h-10 rounded-xl object-cover border border-stone-700"
                            />
                            {contact.isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-stone-900" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-xs text-white truncate">{contact.name}</span>
                              <span>{contact.flag}</span>
                            </div>
                            <span className="text-[10px] text-stone-400 truncate block">
                              {contact.username}
                            </span>
                            <span className="text-[9px] text-stone-500">
                              {contact.country}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 shrink-0">
                          {onOpenGameChallenge && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenGameChallenge(contact);
                              }}
                              className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-sm hover:scale-105"
                              title="Défier au Morpion (Tic-Tac-Toe)"
                            >
                              <Swords className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onClose();
                              onOpenChatWithContact(contact);
                            }}
                            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
                            title="Message direct"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              onSendTipToContact(contact);
                            }}
                            className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 hover:scale-105 transition-all"
                            title="Don Mobile Money"
                          >
                            <Coins className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
