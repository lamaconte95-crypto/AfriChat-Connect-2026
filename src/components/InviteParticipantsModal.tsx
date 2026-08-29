import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  UserPlus, 
  Check, 
  Copy, 
  Share2, 
  Radio, 
  Phone, 
  Video, 
  Sparkles, 
  Crown, 
  CheckCircle2, 
  Users, 
  MessageSquare,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { User, Contact } from '../types';
import { supabaseSearchUsers, supabaseSendInviteNotification } from '../services/supabaseService';

export interface InviteTargetInfo {
  type: 'live' | 'call';
  title: string;
  sessionId?: string;
  channelId?: string;
  conversationName?: string;
  callType?: 'audio' | 'video';
}

interface InviteParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  contacts: Contact[];
  inviteTarget: InviteTargetInfo;
  onTriggerToast?: (msg: string, type?: 'success' | 'danger' | 'info') => void;
}

export const InviteParticipantsModal: React.FC<InviteParticipantsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  contacts,
  inviteTarget,
  onTriggerToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'friends' | 'vip'>('all');
  const [invitedUserIds, setInvitedUserIds] = useState<Record<string, boolean>>({});
  const [sendingUserIds, setSendingUserIds] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [remoteSearchResults, setRemoteSearchResults] = useState<Contact[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  // Generate direct access invitation link
  const inviteLink = useMemo(() => {
    const baseUrl = window.location.origin || 'https://africhat.app';
    if (inviteTarget.type === 'live') {
      return `${baseUrl}/?live=${inviteTarget.sessionId || currentUser.id}`;
    } else {
      return `${baseUrl}/?call=${inviteTarget.channelId || currentUser.id}&type=${inviteTarget.callType || 'video'}`;
    }
  }, [inviteTarget, currentUser.id]);

  // Remote Supabase Search on typing if not found locally
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setRemoteSearchResults([]);
      return;
    }

    let isMounted = true;
    setIsSearchingRemote(true);

    const timer = setTimeout(async () => {
      try {
        const res = await supabaseSearchUsers(searchQuery);
        if (isMounted && res.data) {
          // Filter out current user
          const valid = res.data.filter(
            (u) => u.id !== currentUser.id && u.username.toLowerCase() !== currentUser.username.toLowerCase()
          );
          setRemoteSearchResults(valid);
        }
      } catch (err) {
        console.warn('Supabase remote search error:', err);
      } finally {
        if (isMounted) setIsSearchingRemote(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUser.id, currentUser.username]);

  // Combined and filtered contacts list
  const displayList = useMemo(() => {
    const listMap = new Map<string, Contact>();

    // 1. Add all local contacts
    contacts.forEach((c) => {
      if (c.id !== currentUser.id && c.username.toLowerCase() !== currentUser.username.toLowerCase() && !c.isBlocked) {
        listMap.set(c.id || c.username.toLowerCase(), c);
      }
    });

    // 2. Merge remote search results
    remoteSearchResults.forEach((c) => {
      const key = c.id || c.username.toLowerCase();
      if (!listMap.has(key)) {
        listMap.set(key, c);
      }
    });

    let all = Array.from(listMap.values());

    // Filter by tab
    if (activeFilter === 'online') {
      all = all.filter((c) => c.isOnline);
    } else if (activeFilter === 'friends') {
      all = all.filter((c) => c.isFriend);
    } else if (activeFilter === 'vip') {
      all = all.filter((c) => c.isVIP || c.isVerified);
    }

    // Filter by query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      all = all.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
      );
    }

    return all;
  }, [contacts, remoteSearchResults, activeFilter, searchQuery, currentUser.id, currentUser.username]);

  const handleSendInvite = async (contact: Contact) => {
    const id = contact.id || contact.username;
    if (invitedUserIds[id] || sendingUserIds[id]) return;

    setSendingUserIds((prev) => ({ ...prev, [id]: true }));

    try {
      // 1. Send via Supabase notification
      if (contact.id) {
        await supabaseSendInviteNotification(contact.id, {
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          senderFlag: currentUser.flag,
          type: inviteTarget.type,
          title: inviteTarget.title,
          inviteLink: inviteLink,
        });
      }

      setInvitedUserIds((prev) => ({ ...prev, [id]: true }));
      onTriggerToast?.(
        `✉️ Invitation envoyée avec succès à ${contact.name} (${contact.flag}) !`,
        'success'
      );
    } catch (err) {
      console.warn('Error sending invite:', err);
      setInvitedUserIds((prev) => ({ ...prev, [id]: true }));
      onTriggerToast?.(`Invitation envoyée à ${contact.name} !`, 'info');
    } finally {
      setSendingUserIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      onTriggerToast?.("🔗 Lien d'invitation copié dans le presse-papier !", 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      onTriggerToast?.("Lien prêt à être partagé !", 'info');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Rejoins-moi sur AfriChat Connect ! ${
        inviteTarget.type === 'live'
          ? `🔥 Je suis en direct sur le salon : "${inviteTarget.title}".`
          : `📞 Rejoins notre appel ${inviteTarget.callType === 'video' ? 'Vidéo' : 'Audio'} HD sur AfriChat.`
      }\nClique ici pour rejoindre : ${inviteLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareSms = () => {
    const text = encodeURIComponent(
      `Rejoins mon direct AfriChat Connect : ${inviteLink}`
    );
    window.open(`sms:?body=${text}`, '_blank');
  };

  if (!isOpen) return null;

  const isLive = inviteTarget.type === 'live';

  return (
    <AnimatePresence>
      <div 
        id="invite-participants-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-stone-950 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-stone-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-gradient-to-r from-stone-900 to-stone-950">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                isLive 
                  ? 'bg-gradient-to-tr from-rose-600 to-amber-500' 
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
              }`}>
                {isLive ? <Radio className="w-5 h-5 animate-pulse" /> : <Phone className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-black text-base text-white flex items-center space-x-1.5">
                  <span>Inviter / Ajouter des personnes</span>
                </h3>
                <p className="text-xs text-stone-400 truncate max-w-[220px]">
                  {isLive ? `Direct : ${inviteTarget.title}` : `Appel : ${inviteTarget.conversationName || 'AfriConnect HD'}`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-stone-900 border border-stone-800 text-stone-300 flex items-center justify-center hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Copy Link Bar */}
          <div className="p-4 bg-stone-900/60 border-b border-stone-800/80 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-400 truncate select-all">
              {inviteLink}
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                copiedLink
                  ? 'bg-emerald-500 text-stone-950 font-black'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
              }`}
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 pb-2 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, @pseudo ou pays..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-900 border border-stone-800 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
              />
              {isSearchingRemote && (
                <RefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400 animate-spin" />
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                }`}
              >
                Tous les membres
              </button>
              <button
                onClick={() => setActiveFilter('online')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 flex items-center space-x-1 ${
                  activeFilter === 'online'
                    ? 'bg-emerald-500 text-stone-950'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>En ligne</span>
              </button>
              <button
                onClick={() => setActiveFilter('friends')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  activeFilter === 'friends'
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                }`}
              >
                Mes Amis
              </button>
              <button
                onClick={() => setActiveFilter('vip')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0 flex items-center space-x-1 ${
                  activeFilter === 'vip'
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>VIP & Créateurs</span>
              </button>
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-4 pt-1 space-y-2 divide-y divide-stone-900">
            {displayList.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-stone-500">
                <Users className="w-10 h-10 mx-auto text-stone-600" />
                <p className="text-xs font-semibold">
                  {searchQuery ? `Aucun membre trouvé pour "${searchQuery}"` : 'Aucun membre dans cette catégorie'}
                </p>
                <p className="text-[11px] text-stone-600">
                  Partagez le lien direct ci-dessus pour inviter des participants.
                </p>
              </div>
            ) : (
              displayList.map((contact) => {
                const contactId = contact.id || contact.username;
                const isInvited = Boolean(invitedUserIds[contactId]);
                const isSending = Boolean(sendingUserIds[contactId]);

                return (
                  <div
                    key={contactId}
                    className="pt-2 flex items-center justify-between hover:bg-stone-900/40 p-2 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full object-cover border border-stone-800"
                        />
                        {contact.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-stone-950 shadow" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-white truncate max-w-[130px]">
                            {contact.name}
                          </span>
                          <span>{contact.flag}</span>
                          {contact.isVIP && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                          {contact.isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-stone-400">
                          <span className="truncate">{contact.username}</span>
                          {contact.isOnline && (
                            <span className="text-[10px] text-emerald-400 font-bold">• En ligne</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendInvite(contact)}
                      disabled={isInvited || isSending}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer shrink-0 ${
                        isInvited
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isSending
                          ? 'bg-stone-800 text-stone-400'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-md'
                      }`}
                    >
                      {isInvited ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Invité</span>
                        </>
                      ) : isSending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Envoi...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Inviter</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Social Share Buttons Footer */}
          <div className="p-3.5 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 py-2 px-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleShareSms}
              className="flex-1 py-2 px-3 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>SMS / Message</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
