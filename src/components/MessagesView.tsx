import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Send, 
  Mic, 
  Image as ImageIcon, 
  Lock, 
  Unlock, 
  Sparkles, 
  Crown, 
  Phone, 
  Video, 
  MoreVertical, 
  ArrowLeft, 
  Check, 
  CheckCheck, 
  Play, 
  Pause, 
  Coins, 
  Users, 
  Smile,
  ShieldCheck,
  Plus,
  UserPlus,
  UserMinus,
  ShieldAlert,
  AlertTriangle,
  X,
  UserCheck,
  Swords,
  Gamepad2
} from 'lucide-react';
import { ChatConversation, Message, User, Contact } from '../types';
import { supabaseSearchUsers } from '../services/supabaseService';
import { UserAvatar } from './UserAvatar';

interface MessagesViewProps {
  conversations: ChatConversation[];
  contacts: Contact[];
  currentUser: User;
  onGoBack?: () => void;
  onSendMessage: (conversationId: string, text?: string, audioDuration?: string) => void;
  onUnlockVIPSalon: (conversation: ChatConversation) => void;
  onSendMobileMoneyTip: (recipientName: string) => void;
  onOpenCreateGroup?: () => void;
  onStartCall?: (conversation: ChatConversation | Contact, type: 'audio' | 'video') => void;
  onOpenContactsModal?: () => void;
  onOpenContactProfile?: (contact: Contact) => void;
  onOpenReportContact?: (contact: Contact) => void;
  onToggleBlockContact?: (contactId: string) => void;
  onToggleFriend?: (contactId: string) => void;
  onOpenGroupRoles?: (conversation: ChatConversation) => void;
  onOpenFriendsModal?: () => void;
  onOpenGameChallenge?: (contact?: Contact | User | null, gameId?: string, stakeFcfa?: number) => void;
  selectedChatId?: string | null;
  onSelectChatId?: (id: string | null) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  conversations,
  contacts,
  currentUser,
  onGoBack,
  onSendMessage,
  onUnlockVIPSalon,
  onSendMobileMoneyTip,
  onOpenCreateGroup,
  onStartCall,
  onOpenContactsModal,
  onOpenContactProfile,
  onOpenReportContact,
  onToggleBlockContact,
  onToggleFriend,
  onOpenGroupRoles,
  onOpenFriendsModal,
  onOpenGameChallenge,
  selectedChatId: externalSelectedChatId,
  onSelectChatId: externalOnSelectChatId,
}) => {
  const [internalSelectedChatId, setInternalSelectedChatId] = useState<string | null>(() => {
    return conversations.length > 0 ? conversations[0].id : null;
  });

  const selectedChatId = externalSelectedChatId !== undefined ? externalSelectedChatId : internalSelectedChatId;
  const setSelectedChatId = externalOnSelectChatId || setInternalSelectedChatId;

  const [filterType, setFilterType] = useState<'all' | 'vip' | 'direct' | 'contacts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [remoteContacts, setRemoteContacts] = useState<Contact[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChat = conversations.find((c) => c.id === selectedChatId);

  // Find corresponding contact if direct chat
  const correspondingContact = contacts.find((c) => 
    activeChat?.participantIds.includes(c.userId) ||
    activeChat?.name.toLowerCase().includes(c.name.toLowerCase()) ||
    c.name.toLowerCase().includes(activeChat?.name.toLowerCase() || '')
  );

  const isContactBlocked = correspondingContact?.isBlocked || false;
  const isContactSuspended = correspondingContact?.isSuspended || false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Real-time Supabase user search by letter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setRemoteContacts([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const res = await supabaseSearchUsers(searchQuery);
        if (isMounted && res.data) {
          const filtered = res.data.filter(
            (u) => u.id !== currentUser.id && u.username.toLowerCase() !== currentUser.username.toLowerCase()
          );
          setRemoteContacts(filtered);
        }
      } catch (err) {
        console.warn('Messages search error:', err);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUser.id, currentUser.username]);

  // Filter Conversations
  const rawQ = searchQuery.trim().toLowerCase();
  const cleanQ = rawQ.replace(/^@+/, '');

  const filteredConversations = conversations.filter((c) => {
    if (filterType === 'vip') return c.isVIPRoom;
    if (filterType === 'direct') return !c.isVIPRoom;
    return true;
  }).filter((c) => {
    if (!cleanQ) return true;
    return (c.name || '').toLowerCase().includes(cleanQ) || 
           (c.lastMessage || '').toLowerCase().includes(cleanQ) ||
           (c.hostName || '').toLowerCase().includes(cleanQ);
  });

  // Filter Contacts for search & contacts tab
  const localFilteredContacts = contacts.filter((c) => {
    if (!cleanQ) return true;
    const cName = (c.name || '').toLowerCase();
    const cUser = (c.username || '').toLowerCase();
    const cUserClean = cUser.replace(/^@+/, '');
    const cCountry = (c.country || '').toLowerCase();
    const cPhone = (c.phoneNumber || '').toLowerCase();

    return (
      cName.includes(cleanQ) ||
      cUser.includes(rawQ) ||
      cUserClean.includes(cleanQ) ||
      cCountry.includes(cleanQ) ||
      cPhone.includes(cleanQ)
    );
  });

  const contactsMap = new Map<string, Contact>();
  localFilteredContacts.forEach((c) => contactsMap.set(c.id, c));
  if (searchQuery.trim()) {
    remoteContacts.forEach((rc) => {
      if (!contactsMap.has(rc.id)) {
        contactsMap.set(rc.id, rc);
      }
    });
  }
  const filteredContacts = Array.from(contactsMap.values());

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !inputText.trim() || isContactBlocked) return;
    onSendMessage(selectedChatId, inputText.trim());
    setInputText('');
  };

  const handleStopRecording = () => {
    if (!selectedChatId || isContactBlocked) return;
    setIsRecording(false);
    const duration = `0:${recordTimer < 10 ? '0' + recordTimer : recordTimer}`;
    onSendMessage(selectedChatId, undefined, duration);
  };

  const isVipLocked = activeChat?.isVIPRoom && !activeChat.isUnlocked;

  return (
    <div id="messages-view-container" className="max-w-4xl mx-auto h-[calc(100vh-130px)] min-h-[580px] bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-stone-100">
      
      {/* Left Conversations Sidebar */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-stone-800 flex flex-col bg-stone-900/95 ${
          selectedChatId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {onGoBack && (
                <button
                  id="messages-back-btn"
                  type="button"
                  onClick={onGoBack}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-all flex items-center cursor-pointer group"
                  title="Retour au fil d'actualité"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )}
              <h2 className="font-black text-lg tracking-tight text-white flex items-center space-x-2">
                <span>Discussions</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  Direct
                </span>
              </h2>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Friends & Add Friends Button */}
              {onOpenFriendsModal && (
                <button
                  id="sidebar-friends-manager-btn"
                  onClick={onOpenFriendsModal}
                  className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold transition-all flex items-center space-x-1 cursor-pointer border border-amber-500/30"
                  title="Ajouter des amis & voir amis connectés"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span className="text-xs hidden sm:inline font-bold">Amis</span>
                </button>
              )}

              {/* Manage Contacts & Friends Button */}
              <button
                id="sidebar-contacts-manager-btn"
                onClick={onOpenContactsModal}
                className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-amber-400 font-bold transition-all flex items-center space-x-1 cursor-pointer border border-stone-700/80"
                title="Gérer le répertoire complet de contacts"
              >
                <Users className="w-4 h-4" />
                <span className="text-xs hidden sm:inline font-bold">Contacts</span>
              </button>

              {/* Create Group / Salon */}
              <button
                id="sidebar-create-group-btn"
                onClick={onOpenCreateGroup}
                className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 hover:from-amber-400 hover:to-orange-400 font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
                title="Créer un groupe ou Salon VIP"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="text-xs hidden sm:inline font-bold">Groupe</span>
              </button>
            </div>
          </div>

          {/* Search Input Bar (Filters both conversations and contacts) */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              id="messages-search-bar"
              type="text"
              placeholder="Rechercher contact, message ou salon VIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-800/90 border border-stone-700/80 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto pb-0.5">
            <button
              id="filter-tab-all"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterType === 'all'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              Tous ({conversations.length})
            </button>

            <button
              id="filter-tab-vip"
              onClick={() => setFilterType('vip')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shrink-0 cursor-pointer ${
                filterType === 'vip'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Crown className="w-3 h-3" />
              <span>Salons VIP</span>
            </button>

            <button
              id="filter-tab-direct"
              onClick={() => setFilterType('direct')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterType === 'direct'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              Privés
            </button>

            <button
              id="filter-tab-contacts"
              onClick={() => setFilterType('contacts')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shrink-0 cursor-pointer ${
                filterType === 'contacts'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Contacts ({contacts.length})</span>
            </button>
          </div>
        </div>

        {/* Sidebar Content Area (Conversations List OR Contacts Directory) */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-800/50">
          {filterType === 'contacts' ? (
            /* Contacts Tab List */
            <div className="p-2 space-y-1">
              <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-stone-400">
                <span>RÉPERTOIRE DES CONTACTS</span>
                <button
                  onClick={onOpenContactsModal}
                  className="text-amber-400 hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nouveau</span>
                </button>
              </div>

              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center space-y-2 rounded-2xl bg-stone-900/50 border border-stone-800">
                  <Users className="w-8 h-8 text-stone-600 mx-auto" />
                  <p className="text-xs font-bold text-stone-300">Aucun utilisateur trouvé</p>
                  <p className="text-[11px] text-stone-500">
                    {searchQuery ? `Aucun contact pour "${searchQuery}".` : "Aucun contact dans votre répertoire."}
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-2.5 rounded-2xl flex items-center justify-between hover:bg-stone-800/60 transition-colors ${
                      contact.isBlocked ? 'opacity-60 bg-rose-950/20' : ''
                    }`}
                  >
                    <div
                      onClick={() => onOpenContactProfile?.(contact)}
                      className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <UserAvatar
                          name={contact.name}
                          username={contact.username}
                          avatar={contact.avatar}
                          flag={contact.flag}
                          isVIP={contact.isVIP}
                          size="md"
                          className="w-10 h-10 rounded-xl"
                        />
                        {!contact.isBlocked && (
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-stone-900 ${
                              contact.isOnline ? 'bg-emerald-500' : 'bg-stone-500'
                            }`}
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-xs text-white truncate">{contact.name}</span>
                          <span>{contact.flag}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-mono truncate">{contact.username}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <button
                        onClick={() => onOpenContactProfile?.(contact)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400"
                        title="Profil & Sécurité"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Conversations List */
            <>
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-800/60 border border-stone-700 flex items-center justify-center mx-auto text-stone-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-stone-300">
                    {searchQuery ? "Aucun utilisateur trouvé" : "Aucune conversation"}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {searchQuery
                      ? `Aucune conversation ou contact ne correspond à "${searchQuery}".`
                      : "Démarrez une nouvelle conversation avec un utilisateur ou créez un groupe."}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedChatId === conv.id;
                  const isLocked = conv.isVIPRoom && !conv.isUnlocked;

                  return (
                    <button
                      key={conv.id}
                      id={`conversation-item-${conv.id}`}
                      onClick={() => setSelectedChatId(conv.id)}
                      className={`w-full p-3.5 flex items-center space-x-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-l-4 border-amber-500'
                          : 'hover:bg-stone-800/60'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <UserAvatar
                          name={conv.name}
                          avatar={conv.avatar}
                          isVIP={conv.isVIPRoom}
                          type={conv.isVIPRoom || conv.isCommunity ? 'channel' : 'user'}
                          size="lg"
                          className="w-12 h-12 rounded-2xl"
                        />
                        {conv.isVIPRoom && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center shadow">
                            {isLocked ? <Lock className="w-2.5 h-2.5" /> : <Crown className="w-2.5 h-2.5" />}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-stone-100 truncate flex items-center space-x-1">
                            <span>{conv.name}</span>
                          </h4>
                          <span className="text-[10px] text-stone-400 shrink-0 ml-1">
                            {conv.lastMessageTime}
                          </span>
                        </div>

                        <p className="text-xs text-stone-400 truncate mt-0.5">
                          {conv.lastMessage || 'Démarrer une discussion...'}
                        </p>

                        {conv.isVIPRoom && isLocked && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                            Accès {conv.vipPrice?.toLocaleString()} FCFA/mois 🍊 🌊
                          </span>
                        )}
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px]">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Active Chat Pane */}
      {activeChat ? (
        <div className="flex-1 flex flex-col bg-stone-950/60 relative">
          {/* Active Chat Header */}
          <div className="p-3.5 border-b border-stone-800 bg-stone-900/90 flex items-center justify-between z-20">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedChatId(null)}
                className="md:hidden p-1.5 rounded-full text-stone-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div 
                onClick={() => {
                  if (correspondingContact && onOpenContactProfile) {
                    onOpenContactProfile(correspondingContact);
                  }
                }}
                className="relative cursor-pointer group"
              >
                <UserAvatar
                  name={activeChat.name}
                  avatar={activeChat.avatar}
                  isVIP={activeChat.isVIPRoom}
                  type={activeChat.isVIPRoom || activeChat.isCommunity ? 'channel' : 'user'}
                  size="md"
                  className={`w-10 h-10 rounded-2xl ${
                    isContactBlocked ? 'border-rose-600 grayscale' : 'border-amber-500/50 group-hover:border-amber-400'
                  }`}
                />
                {activeChat.isVIPRoom && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center">
                    <Crown className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>

              <div 
                onClick={() => {
                  if (correspondingContact && onOpenContactProfile) {
                    onOpenContactProfile(correspondingContact);
                  }
                }}
                className="cursor-pointer"
              >
                <h3 className="font-bold text-sm text-stone-100 flex items-center space-x-1.5 hover:text-amber-400 transition-colors">
                  <span>{activeChat.name}</span>
                </h3>
                <p className="text-[11px] text-stone-400 flex items-center space-x-1">
                  {isContactSuspended ? (
                    <span className="text-rose-400 font-black flex items-center space-x-1 animate-pulse">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      <span>Compte suspendu (3 signalements)</span>
                    </span>
                  ) : isContactBlocked ? (
                    <span className="text-rose-400 font-bold flex items-center space-x-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Contact bloqué</span>
                    </span>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400">
                        {activeChat.isVIPRoom ? `${activeChat.memberCount} membres actifs` : 'En ligne'}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-1.5">
              {/* Direct Block / Report Fast Actions for 1-on-1 Chats */}
              {correspondingContact && !activeChat.isVIPRoom && activeChat.type !== 'group' && (
                <div className="hidden sm:flex items-center space-x-1 mr-1">
                  <button
                    id="chat-quick-block-btn"
                    onClick={() => onToggleBlockContact?.(correspondingContact.id)}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                      isContactBlocked
                        ? 'bg-emerald-950/40 border-emerald-700 text-emerald-400 hover:bg-emerald-900/50'
                        : 'bg-stone-800/80 border-stone-700/80 text-stone-300 hover:text-rose-300 hover:border-rose-700'
                    }`}
                    title={isContactBlocked ? 'Débloquer cet utilisateur' : 'Bloquer cet utilisateur (masque ses messages et posts)'}
                  >
                    {isContactBlocked ? (
                      <>
                        <Unlock className="w-3 h-3 text-emerald-400" />
                        <span>Débloquer</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-stone-400" />
                        <span>Bloquer</span>
                      </>
                    )}
                  </button>

                  <button
                    id="chat-quick-report-btn"
                    onClick={() => onOpenReportContact?.(correspondingContact)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-800/80 hover:bg-rose-950/40 border border-stone-700/80 hover:border-rose-700 text-stone-300 hover:text-rose-300 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-all"
                    title="Signaler ce contact (enregistre le motif dans Supabase)"
                  >
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    <span>Signaler</span>
                  </button>
                </div>
              )}

              {/* Group / VIP Salon Admin & Role Management Button */}
              {(activeChat.type === 'group' || activeChat.isVIPRoom || activeChat.members) && onOpenGroupRoles && (
                <button
                  id="chat-header-roles-btn"
                  onClick={() => onOpenGroupRoles(activeChat)}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/30 hover:from-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-black flex items-center space-x-1.5 cursor-pointer shadow-sm transition-all hover:scale-105"
                  title="Gérer les administrateurs, modérateurs et permissions du groupe"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Admins & Rôles</span>
                  <span className="sm:hidden">Rôles</span>
                </button>
              )}

              {!activeChat.isVIPRoom && !isContactBlocked && !isContactSuspended && activeChat.type !== 'group' && (
                <>
                  <button
                    id="chat-header-game-challenge-btn"
                    onClick={() => {
                      if (onOpenGameChallenge) {
                        onOpenGameChallenge(correspondingContact || {
                          id: activeChat.participantIds.find(id => id !== currentUser.id) || activeChat.id,
                          userId: activeChat.participantIds.find(id => id !== currentUser.id) || activeChat.id,
                          name: activeChat.name,
                          username: `@${activeChat.name.toLowerCase().replace(/\s+/g, '')}`,
                          avatar: activeChat.avatar,
                          country: 'Afrique',
                          flag: '🌍',
                          isOnline: activeChat.isOnline || false,
                          isFriend: true,
                          isVIP: false,
                          isVerified: false,
                          isBlocked: false,
                        });
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/30 hover:from-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-black flex items-center space-x-1.5 cursor-pointer shadow-sm transition-all hover:scale-105 active:scale-95"
                    title="Défier en jeu : Lancer une partie de Morpion (Tic-Tac-Toe) multijoueur en temps réel"
                  >
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Défier en jeu</span>
                    <span className="sm:hidden">Défier</span>
                  </button>

                  <button
                    id="chat-send-money-btn"
                    onClick={() => onSendMobileMoneyTip(activeChat.name)}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
                    title="Envoyer de l'argent Mobile Money"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Pay MoMo</span>
                  </button>
                </>
              )}

              {!isContactBlocked && !isContactSuspended && (
                <>
                  <button 
                    id="chat-header-audio-call-btn"
                    onClick={() => onStartCall && onStartCall(activeChat, 'audio')}
                    className="p-2 text-stone-300 hover:text-amber-400 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
                    title="Lancer un appel audio HD"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button 
                    id="chat-header-video-call-btn"
                    onClick={() => onStartCall && onStartCall(activeChat, 'video')}
                    className="p-2 text-stone-300 hover:text-amber-400 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
                    title="Lancer un appel vidéo HD"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* More Actions Dropdown Menu */}
              <div className="relative">
                <button 
                  id="chat-header-menu-btn"
                  onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Options de la discussion et sécurité"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {isHeaderMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      className="absolute right-0 top-10 w-60 rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl p-1.5 z-50 text-xs space-y-1"
                    >
                      {/* Group Role Manager in Dropdown */}
                      {(activeChat.type === 'group' || activeChat.isVIPRoom || activeChat.members) && onOpenGroupRoles && (
                        <button
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            onOpenGroupRoles(activeChat);
                          }}
                          className="w-full p-2 rounded-xl text-left hover:bg-amber-500/20 text-amber-300 flex items-center space-x-2 cursor-pointer font-bold border border-amber-500/20"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Gestion des Administrateurs & Rôles</span>
                        </button>
                      )}

                      {correspondingContact && (
                        <>
                          <button
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              onOpenContactProfile?.(correspondingContact);
                            }}
                            className="w-full p-2 rounded-xl text-left hover:bg-stone-800 text-stone-200 flex items-center space-x-2 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 text-amber-400" />
                            <span>Voir le Profil complet</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              if (onToggleFriend) onToggleFriend(correspondingContact.id);
                            }}
                            className="w-full p-2 rounded-xl text-left hover:bg-stone-800 text-stone-200 flex items-center space-x-2 cursor-pointer"
                          >
                            {correspondingContact.isFriend ? (
                              <>
                                <UserMinus className="w-3.5 h-3.5 text-stone-400" />
                                <span>Retirer des amis</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Ajouter à mes amis</span>
                              </>
                            )}
                          </button>

                          <div className="h-px bg-stone-800 my-1" />

                          {/* Security Options */}
                          <button
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              if (onToggleBlockContact) onToggleBlockContact(correspondingContact.id);
                            }}
                            className={`w-full p-2 rounded-xl text-left flex items-center space-x-2 cursor-pointer ${
                              correspondingContact.isBlocked
                                ? 'text-emerald-400 hover:bg-emerald-950/30'
                                : 'text-rose-400 hover:bg-rose-950/30'
                            }`}
                          >
                            {correspondingContact.isBlocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Débloquer ce contact</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Bloquer ce contact</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setIsHeaderMenuOpen(false);
                              if (onOpenReportContact) onOpenReportContact(correspondingContact);
                            }}
                            className="w-full p-2 rounded-xl text-left hover:bg-rose-950/30 text-rose-400 flex items-center space-x-2 cursor-pointer font-bold"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Signaler ce contact ⚠️</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          if (onOpenContactsModal) onOpenContactsModal();
                        }}
                        className="w-full p-2 rounded-xl text-left hover:bg-stone-800 text-stone-400 flex items-center space-x-2 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Ouvrir l'annuaire complet</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Suspended Contact Warning Banner */}
          {isContactSuspended && (
            <div className="p-3.5 bg-rose-950/90 border-b border-rose-700 text-xs text-rose-200 flex items-center justify-between px-4 z-10">
              <div className="flex items-center space-x-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="font-black text-rose-300">Compte Suspendu par Modération Automatique</div>
                  <div className="text-[11px] text-rose-200/90">Cet utilisateur a reçu 3 signalements de membres différents dans Supabase. Ses accès et messages sont suspendus.</div>
                </div>
              </div>
            </div>
          )}

          {/* Blocked Contact Warning Banner */}
          {!isContactSuspended && isContactBlocked && (
            <div className="p-3 bg-rose-950/80 border-b border-rose-800 text-xs text-rose-200 flex items-center justify-between px-4 z-10">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Ce contact est bloqué. Ses messages et publications sont masqués pour vous.</span>
              </div>
              <button
                onClick={() => correspondingContact && onToggleBlockContact?.(correspondingContact.id)}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow"
              >
                Débloquer
              </button>
            </div>
          )}

          {/* Active Chat Message Stream OR VIP Lock screen */}
          {isVipLocked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 font-black shadow-xl shadow-orange-500/20">
                <Lock className="w-10 h-10" />
              </div>

              <div className="max-w-md space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
                  Salon VIP Réservé aux Membres
                </span>
                <h3 className="text-xl font-black text-stone-100">{activeChat.name}</h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {activeChat.roomDescription || 'Rejoignez ce salon exclusif pour échanger en direct avec les experts et créateurs certifiés.'}
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-stone-300 pt-2">
                  <span>👑 Hôte : {activeChat.hostName} {activeChat.hostFlag}</span>
                  <span>👥 {activeChat.memberCount} VIPs</span>
                </div>
              </div>

              <button
                id="unlock-vip-salon-btn"
                onClick={() => onUnlockVIPSalon(activeChat)}
                className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-sm shadow-xl shadow-orange-500/25 flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Rejoindre le Salon VIP ({activeChat.vipPrice?.toLocaleString()} FCFA)</span>
              </button>

              <div className="flex items-center space-x-2 text-[11px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Validation instantanée par Orange Money, Wave, MTN MoMo ou Moov</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeChat.messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {!isMe && (activeChat.isVIPRoom || activeChat.type === 'group' || activeChat.members) && (() => {
                      const memberInfo = activeChat.members?.find((m) => m.userId === msg.senderId);
                      const isFounder = memberInfo?.role === 'founder' || activeChat.founderId === msg.senderId;
                      const isAdmin = memberInfo?.role === 'admin';
                      const isModerator = memberInfo?.role === 'moderator';

                      return (
                        <div className="text-[10px] font-bold text-amber-400 mb-1 ml-2 flex items-center space-x-1.5">
                          <span>{msg.senderName}</span>
                          {isFounder && (
                            <span className="px-1.5 py-0.2 text-[9px] rounded-md bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center space-x-0.5">
                              <span>👑</span>
                              <span>{memberInfo?.customTitle || 'Fondateur'}</span>
                            </span>
                          )}
                          {isAdmin && !isFounder && (
                            <span className="px-1.5 py-0.2 text-[9px] rounded-md bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center space-x-0.5">
                              <span>🛡️</span>
                              <span>{memberInfo?.customTitle || 'Admin'}</span>
                            </span>
                          )}
                          {isModerator && !isFounder && !isAdmin && (
                            <span className="px-1.5 py-0.2 text-[9px] rounded-md bg-blue-500/30 text-blue-300 border border-blue-500/40 flex items-center space-x-0.5">
                              <span>⚡</span>
                              <span>{memberInfo?.customTitle || 'Modérateur'}</span>
                            </span>
                          )}
                          {msg.isVipMessage && !isFounder && !isAdmin && (
                            <Crown className="w-2.5 h-2.5 text-amber-400" />
                          )}
                        </div>
                      );
                    })()}

                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md space-y-2 ${
                        msg.gameChallenge
                          ? 'bg-stone-900 border border-amber-500/60 text-stone-100 shadow-xl shadow-amber-500/10'
                          : isMe
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-stone-950 font-medium rounded-br-none'
                          : 'bg-stone-800 border border-stone-700/80 text-stone-100 rounded-bl-none'
                      }`}
                    >
                      {/* Game Challenge Card */}
                      {msg.gameChallenge ? (
                        <div className="space-y-2.5 py-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center font-black shadow">
                              <Swords className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <div>
                              <div className="font-black text-amber-400 text-xs flex items-center space-x-1.5">
                                <span>Défi Morpion Panafricain</span>
                                <span className="px-1 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  3x3
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-400">Match multijoueur synchronisé</div>
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between text-[11px]">
                            <div className="flex items-center space-x-1.5">
                              <UserAvatar name={msg.gameChallenge.hostName} avatar={msg.gameChallenge.hostAvatar} size="xs" />
                              <span className="font-bold text-stone-200">{msg.gameChallenge.hostName}</span>
                            </div>
                            <span className="font-black text-amber-400 text-[10px] px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800">VS</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-stone-200">{msg.gameChallenge.guestName}</span>
                              <UserAvatar name={msg.gameChallenge.guestName} avatar={msg.gameChallenge.guestAvatar} size="xs" />
                            </div>
                          </div>

                          {msg.text && (
                            <p className="text-[11px] text-stone-300 italic">{msg.text}</p>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenGameChallenge) {
                                const targetContact = correspondingContact || ({
                                  id: isMe ? msg.gameChallenge!.guestId : msg.gameChallenge!.hostId,
                                  userId: isMe ? msg.gameChallenge!.guestId : msg.gameChallenge!.hostId,
                                  name: isMe ? msg.gameChallenge!.guestName : msg.gameChallenge!.hostName,
                                  username: '',
                                  avatar: isMe ? msg.gameChallenge!.guestAvatar : msg.gameChallenge!.hostAvatar,
                                  flag: '🌍',
                                  isOnline: true,
                                } as Contact);
                                onOpenGameChallenge(targetContact, msg.gameChallenge!.gameId);
                              }
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Rejoindre la partie ⚔️</span>
                          </button>
                        </div>
                      ) : msg.mediaType === 'audio' ? (
                        /* Audio voice note display */
                        <div className="flex items-center space-x-3 py-1">
                          <button
                            onClick={() => setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center shadow cursor-pointer ${
                              isMe ? 'bg-stone-950 text-amber-400' : 'bg-amber-500 text-stone-950'
                            }`}
                          >
                            {playingAudioId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                          </button>
                          <div>
                            <div className="flex items-center space-x-1">
                              {[3, 6, 8, 4, 9, 5, 7, 3, 6, 4, 8, 5, 3].map((h, i) => (
                                <span
                                  key={i}
                                  className={`w-1 rounded-full ${playingAudioId === msg.id ? 'bg-amber-300 animate-pulse' : isMe ? 'bg-stone-900/60' : 'bg-stone-500'}`}
                                  style={{ height: `${h * 2.5}px` }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] opacity-75">{msg.audioDuration || '0:15'}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}

                      <div className={`flex items-center justify-end space-x-1 text-[9px] ${
                        msg.gameChallenge
                          ? 'text-stone-400'
                          : isMe
                          ? 'text-stone-950/70 font-bold'
                          : 'text-stone-400'
                      }`}>
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-emerald-950" /> : <Check className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Message Input Bar (Disabled if contact is blocked or suspended) */}
          {!isVipLocked && (
            <div className="p-3 border-t border-stone-800 bg-stone-900/90">
              {isContactSuspended ? (
                <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-center space-x-2.5 px-4">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Les échanges sont temporairement désactivés car ce compte est suspendu par la modération automatique.</span>
                </div>
              ) : isContactBlocked ? (
                <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-xs text-stone-300 flex flex-col sm:flex-row items-center justify-between gap-2 px-4">
                  <div className="flex items-center space-x-2 text-rose-300">
                    <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Vous ne pouvez pas envoyer de message à un contact bloqué.</span>
                  </div>
                  {correspondingContact && onToggleBlockContact && (
                    <button
                      id="chat-unblock-direct-btn"
                      onClick={() => onToggleBlockContact(correspondingContact.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-md transition-all shrink-0"
                    >
                      <Unlock className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Débloquer le contact</span>
                    </button>
                  )}
                </div>
              ) : isRecording ? (
                <div className="flex items-center justify-between bg-rose-500/20 border border-rose-500/40 rounded-2xl p-3 text-rose-400">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold">Enregistrement note vocale... (0:{recordTimer < 10 ? '0' + recordTimer : recordTimer})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsRecording(false)}
                      className="text-xs text-stone-400 hover:text-white px-2 py-1 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleStopRecording}
                      className="px-3 py-1 rounded-xl bg-rose-500 text-white font-bold text-xs shadow cursor-pointer"
                    >
                      Envoyer 🎙️
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendText} className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onSendMobileMoneyTip(activeChat.name)}
                    className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                    title="Envoyer Mobile Money"
                  >
                    <Coins className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    id="chat-input-game-challenge-btn"
                    onClick={() => {
                      if (onOpenGameChallenge) {
                        onOpenGameChallenge(correspondingContact || {
                          id: activeChat.participantIds.find(id => id !== currentUser.id) || activeChat.id,
                          userId: activeChat.participantIds.find(id => id !== currentUser.id) || activeChat.id,
                          name: activeChat.name,
                          username: `@${activeChat.name.toLowerCase().replace(/\s+/g, '')}`,
                          avatar: activeChat.avatar,
                          country: 'Afrique',
                          flag: '🌍',
                          isOnline: activeChat.isOnline || false,
                          isFriend: true,
                          isVIP: false,
                          isVerified: false,
                          isBlocked: false,
                        });
                      }
                    }}
                    className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer border border-amber-500/30 shadow-sm"
                    title="Défier en jeu (Morpion Tic-Tac-Toe multijoueur)"
                  >
                    <Swords className="w-4 h-4" />
                  </button>

                  <div className="flex-1 flex items-center bg-stone-800 rounded-2xl border border-stone-700/80 px-3.5 py-2 focus-within:border-amber-500">
                    <input
                      id="chat-message-input"
                      ref={inputRef}
                      type="text"
                      placeholder={`Écrivez à ${activeChat.name}...`}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setInputText((prev) => prev + ' 🇨🇮 🇸🇳 🔥')}
                      className="text-stone-400 hover:text-amber-400 p-1 cursor-pointer"
                      title="Ajouter des emojis africains"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>

                  {inputText.trim() ? (
                    <button
                      id="chat-send-message-btn"
                      type="submit"
                      className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
                      title="Envoyer le message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      id="chat-record-voice-btn"
                      type="button"
                      onClick={() => setIsRecording(true)}
                      className="p-2.5 rounded-2xl bg-stone-800 text-amber-400 hover:bg-amber-500 hover:text-stone-950 transition-colors cursor-pointer"
                      title="Enregistrer note vocale"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty selection state for desktop */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-stone-950/40 text-stone-400 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-stone-800/80 border border-stone-700 flex items-center justify-center text-amber-400 shadow-xl">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-stone-200">Discutez en temps réel</h3>
          <p className="text-xs text-stone-400 max-w-xs">
            Sélectionnez un contact pour démarrer une conversation ou ouvrez le gestionnaire de contacts.
          </p>
          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={onOpenContactsModal}
              className="py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gérer les Contacts</span>
            </button>
            {onOpenCreateGroup && (
              <button
                onClick={onOpenCreateGroup}
                className="py-2 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Groupe</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
