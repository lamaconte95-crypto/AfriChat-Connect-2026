import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  UserPlus, 
  UserMinus, 
  Users, 
  Phone, 
  Video, 
  MessageSquare, 
  Coins, 
  Crown, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Plus, 
  Check, 
  Sparkles,
  Smartphone,
  Globe,
  ArrowLeft,
  RefreshCw,
  Database,
  Swords
} from 'lucide-react';
import { Contact, User } from '../types';
import { COUNTRIES } from '../data/mockData';
import { supabaseSearchUsers } from '../services/supabaseService';
import { UserAvatar } from './UserAvatar';

interface ContactsModalProps {
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
  onRefreshUsers?: () => Promise<void>;
  isRefreshingUsers?: boolean;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
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
  onRefreshUsers,
  isRefreshingUsers = false,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'all' | 'blocked' | 'add'>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Contact Form State
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('CI');
  const [newCategory, setNewCategory] = useState<'friend' | 'business' | 'creator' | 'family'>('friend');
  const [addSuccessMsg, setAddSuccessMsg] = useState(false);

  const [remoteSearchResults, setRemoteSearchResults] = useState<Contact[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  // Dynamic search on Supabase users table as user types any letter
  useEffect(() => {
    const cleanSearch = searchQuery.replace(/[@]/g, '').trim();
    if (!isOpen || !cleanSearch) {
      setRemoteSearchResults([]);
      setIsSearchingRemote(false);
      return;
    }

    let isMounted = true;
    setIsSearchingRemote(true);

    const timer = setTimeout(async () => {
      try {
        const res = await supabaseSearchUsers(cleanSearch);
        if (isMounted && res.data) {
          const filtered = res.data.filter(
            (u) => u.id !== currentUser.id && u.username.toLowerCase().replace(/[@]/g, '') !== currentUser.username.toLowerCase().replace(/[@]/g, '')
          );
          setRemoteSearchResults(filtered);
        }
      } catch (e) {
        console.warn('Contacts dynamic search error:', e);
      } finally {
        if (isMounted) setIsSearchingRemote(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, searchQuery, currentUser.id, currentUser.username]);

  if (!isOpen) return null;

  const selectedCountry = COUNTRIES.find((c) => c.code === newCountryCode) || COUNTRIES[0];

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const formattedUsername = newUsername.trim().startsWith('@') 
      ? newUsername.trim() 
      : `@${newUsername.trim().toLowerCase() || newName.toLowerCase().replace(/\s+/g, '_')}`;

    const formattedPhone = newPhone.trim() ? `${selectedCountry.prefix} ${newPhone.trim()}` : undefined;

    onAddContact({
      name: newName.trim(),
      username: formattedUsername,
      avatar: '',
      flag: selectedCountry.flag,
      country: selectedCountry.name,
      phoneNumber: formattedPhone,
      bio: `Membre de la communauté AfriChat ${selectedCountry.flag}`,
      isVIP: false,
      isFriend: true,
      mutualFriendsCount: 1,
      category: newCategory,
    });

    setNewName('');
    setNewUsername('');
    setNewPhone('');
    setAddSuccessMsg(true);
    setTimeout(() => {
      setAddSuccessMsg(false);
      setActiveTab('friends');
    }, 1200);
  };

  // Filter logic + merge remote search results
  const localFiltered = contacts.filter((c) => {
    // Tab filtering
    if (activeTab === 'friends') {
      if (!c.isFriend || c.isBlocked) return false;
    } else if (activeTab === 'blocked') {
      if (!c.isBlocked) return false;
    } else if (activeTab === 'all') {
      if (c.isBlocked) return false;
    }

    // Search query filtering
    if (!searchQuery.trim()) return true;
    const cleanQ = searchQuery.replace(/[@]/g, '').trim().toLowerCase();
    const cName = (c.name || '').toLowerCase();
    const cUser = (c.username || '').toLowerCase().replace(/[@]/g, '');
    const cDisplayName = (c.displayName || '').toLowerCase();
    const cFullName = (c.fullName || '').toLowerCase();
    const cEmail = (c.email || '').toLowerCase();
    const cCountry = (c.country || '').toLowerCase();
    const cPhone = (c.phoneNumber || '').toLowerCase();
    const cBio = (c.bio || '').toLowerCase();

    return (
      cName.includes(cleanQ) ||
      cUser.includes(cleanQ) ||
      cDisplayName.includes(cleanQ) ||
      cFullName.includes(cleanQ) ||
      cEmail.includes(cleanQ) ||
      cCountry.includes(cleanQ) ||
      cPhone.includes(cleanQ) ||
      cBio.includes(cleanQ)
    );
  });

  // When searching, merge local contacts with remote Supabase matches seamlessly
  const mergedMap = new Map<string, Contact>();
  localFiltered.forEach((c) => mergedMap.set(c.id, c));
  if (searchQuery.trim() && activeTab !== 'blocked') {
    remoteSearchResults.forEach((rc) => {
      if (!mergedMap.has(rc.id)) {
        mergedMap.set(rc.id, rc);
      }
    });
  }
  const filteredContacts = Array.from(mergedMap.values());

  const friendsCount = contacts.filter((c) => c.isFriend && !c.isBlocked).length;
  const blockedCount = contacts.filter((c) => c.isBlocked).length;

  return (
    <AnimatePresence>
      <div
        id="contacts-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden text-stone-100 my-6 flex flex-col max-h-[88vh]"
        >
          {/* Top Bar */}
          <div className="p-5 border-b border-stone-800 bg-stone-950/70 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                id="contacts-modal-back-btn"
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
                  <span>Contacts & Répertoire</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {contacts.length} au total
                  </span>
                </h3>
                <p className="text-xs text-stone-400">
                  Gérez vos amis, contacts Mobile Money et synchronisation Supabase
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onRefreshUsers && (
                <button
                  id="contacts-modal-refresh-btn"
                  onClick={onRefreshUsers}
                  disabled={isRefreshingUsers}
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition-all flex items-center space-x-1.5 border border-stone-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                  title="Rafraîchir les utilisateurs inscrits depuis Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingUsers ? 'animate-spin text-amber-400' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>
              )}

              <button
                id="contacts-modal-close-btn"
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-stone-800 bg-stone-950/40 px-5 pt-3 space-x-2 overflow-x-auto">
            <button
              id="contacts-tab-friends"
              onClick={() => setActiveTab('friends')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'friends'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mes Amis ({friendsCount})</span>
            </button>

            <button
              id="contacts-tab-all"
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'all'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Annuaire & Tous</span>
            </button>

            <button
              id="contacts-tab-add"
              onClick={() => setActiveTab('add')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'add'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un Contact</span>
            </button>

            <button
              id="contacts-tab-blocked"
              onClick={() => setActiveTab('blocked')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeTab === 'blocked'
                  ? 'border-rose-500 text-rose-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloqués ({blockedCount})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {/* If Add Contact Tab is active */}
            {activeTab === 'add' ? (
              <form onSubmit={handleCreateContact} className="max-w-lg mx-auto space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Ajoutez un nouvel ami par son nom ou son numéro Mobile Money pour échanger instantanément !
                  </span>
                </div>

                {addSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
                    <Check className="w-4 h-4" />
                    <span>Contact ajouté avec succès dans votre liste d'amis !</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Nom complet du contact *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bakary Sanogo"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Identifiant (@pseudo)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: @bakary_tech"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">
                      Pays & Drapeau
                    </label>
                    <select
                      value={newCountryCode}
                      onChange={(e) => setNewCountryCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name} ({country.prefix})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Numéro de Téléphone (Mobile Money)
                  </label>
                  <div className="flex">
                    <span className="px-3.5 py-2.5 rounded-l-xl bg-stone-950 border border-r-0 border-stone-700 text-xs text-stone-400 font-mono flex items-center">
                      {selectedCountry.prefix}
                    </span>
                    <input
                      type="tel"
                      placeholder="07 48 92 10"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-r-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Catégorie
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'friend', label: 'Ami(e)' },
                      { id: 'business', label: 'Business' },
                      { id: 'creator', label: 'Créateur' },
                      { id: 'family', label: 'Famille' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewCategory(cat.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          newCategory === cat.id
                            ? 'bg-amber-500 text-stone-950 border-amber-400'
                            : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="submit-add-contact-btn"
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>Enregistrer dans mes contacts</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Contacts List Tabs (Friends / All / Blocked) */
              <>
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, @pseudo, pays ou numéro..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 p-1 text-stone-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* List of Contacts */}
                {filteredContacts.length === 0 ? (
                  <div className="p-8 text-center space-y-2 rounded-2xl bg-stone-950/40 border border-stone-800">
                    <p className="text-xs text-stone-300 font-bold">
                      {activeTab === 'blocked'
                        ? "Aucun contact bloqué"
                        : searchQuery
                        ? "Aucun contact trouvé"
                        : "Aucun utilisateur inscrit pour le moment"}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {activeTab === 'blocked'
                        ? "Vous n'avez bloqué aucun utilisateur."
                        : searchQuery
                        ? `Aucun contact ne correspond à "${searchQuery}".`
                        : "Votre répertoire est vide pour le moment. Dès que de nouveaux utilisateurs s'inscriront, vous pourrez les ajouter en ami."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-800/60 rounded-2xl bg-stone-950/50 border border-stone-800/80 overflow-hidden">
                    {filteredContacts.map((contact, idx) => (
                      <div
                        key={`contact-${contact.id || contact.userId || contact.username || idx}_${idx}`}
                        className="p-3.5 flex items-center justify-between hover:bg-stone-800/40 transition-colors"
                      >
                        {/* Avatar & Info */}
                        <div
                          onClick={() => onOpenContactProfile(contact)}
                          className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="relative shrink-0">
                            <UserAvatar
                              name={contact.name}
                              username={contact.username}
                              avatar={contact.avatar}
                              flag={contact.flag}
                              isVIP={contact.isVIP}
                              size="lg"
                              className={`w-11 h-11 rounded-2xl ${
                                contact.isBlocked ? 'border-rose-600 grayscale' : 'border-stone-700'
                              }`}
                            />
                            {!contact.isBlocked && (
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-stone-900 ${
                                  contact.isOnline ? 'bg-emerald-500' : 'bg-stone-500'
                                }`}
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-xs text-white truncate hover:text-amber-400 transition-colors">
                                {contact.name}
                              </span>
                              <span>{contact.flag}</span>
                              {contact.isVIP && (
                                <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-stone-400">
                              <span className="font-mono text-amber-400/80">{contact.username}</span>
                              <span>•</span>
                              <span>{contact.country}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions according to tab */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {contact.isBlocked ? (
                            <button
                              id={`unblock-contact-btn-${contact.id}`}
                              onClick={() => onToggleBlock(contact.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-700 text-emerald-400 hover:bg-emerald-900/60 font-bold text-xs flex items-center space-x-1 cursor-pointer transition-colors"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Débloquer</span>
                            </button>
                          ) : (
                            <>
                              {/* Game Challenge */}
                              {onOpenGameChallenge && (
                                <button
                                  id={`game-challenge-contact-${contact.id}`}
                                  onClick={() => {
                                    onOpenGameChallenge(contact);
                                    onClose();
                                  }}
                                  className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 hover:from-amber-500 hover:to-orange-500 hover:text-stone-950 border border-amber-500/30 transition-all cursor-pointer shadow-sm hover:scale-105"
                                  title="Défier au Morpion (Tic-Tac-Toe)"
                                >
                                  <Swords className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Direct Chat */}
                              <button
                                id={`chat-with-contact-${contact.id}`}
                                onClick={() => {
                                  onOpenChatWithContact(contact);
                                  onClose();
                                }}
                                className="p-2 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-stone-950 transition-colors cursor-pointer"
                                title="Envoyer un message"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {/* Audio Call */}
                              <button
                                id={`call-contact-${contact.id}`}
                                onClick={() => {
                                  onStartCallWithContact(contact, 'audio');
                                  onClose();
                                }}
                                className="p-2 rounded-xl bg-stone-800 text-stone-300 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                                title="Lancer un appel"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              </button>

                              {/* Pay MoMo Tip */}
                              <button
                                id={`tip-contact-${contact.id}`}
                                onClick={() => {
                                  onSendTipToContact(contact);
                                  onClose();
                                }}
                                className="p-2 rounded-xl bg-stone-800 text-orange-400 hover:bg-orange-600 hover:text-white transition-colors cursor-pointer"
                                title="Envoyer Mobile Money"
                              >
                                <Coins className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Friend */}
                              <button
                                id={`toggle-friend-btn-${contact.id}`}
                                onClick={() => onToggleFriend(contact.id)}
                                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                  contact.isFriend
                                    ? 'bg-stone-800 border-stone-700 text-stone-300 hover:text-rose-400'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 border-amber-400 hover:scale-105'
                                }`}
                                title={contact.isFriend ? 'Retirer des amis' : 'Ajouter en ami'}
                              >
                                {contact.isFriend ? (
                                  <UserMinus className="w-3.5 h-3.5" />
                                ) : (
                                  <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
