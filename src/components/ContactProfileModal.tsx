import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { 
  X, 
  Phone, 
  Video, 
  MessageSquare, 
  Coins, 
  UserPlus, 
  UserCheck, 
  ShieldAlert, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Crown, 
  Globe, 
  Share2,
  Heart,
  ShieldCheck,
  Swords,
  Gamepad2
} from 'lucide-react';
import { Contact, User } from '../types';

interface ContactProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  currentUser: User;
  onToggleFriend: (contactId: string) => void;
  onToggleBlock: (contactId: string) => void;
  onOpenReport: (contact: Contact) => void;
  contactPostsCount?: number;
  onStartCall?: (contact: Contact, type: 'audio' | 'video') => void;
  onOpenChat?: (contact: Contact) => void;
  onSendMobileMoneyTip?: (contact: Contact) => void;
  onOpenStarVip?: (contact: Contact, serviceType: 'direct_message' | 'call_reservation') => void;
  onOpenGameChallenge?: (contact: Contact) => void;
}

export const ContactProfileModal: React.FC<ContactProfileModalProps> = ({
  isOpen,
  onClose,
  contact,
  currentUser,
  onToggleFriend,
  onToggleBlock,
  onOpenReport,
  contactPostsCount = 0,
  onStartCall,
  onOpenChat,
  onSendMobileMoneyTip,
  onOpenStarVip,
  onOpenGameChallenge,
}) => {
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const isFollowing = Boolean(contact?.isFriend);

  if (!isOpen || !contact) return null;

  const handleBlockAction = () => {
    onToggleBlock(contact.id);
    setShowBlockConfirm(false);
  };

  const handleToggleFollow = () => {
    onToggleFriend(contact.id);
  };

  return (
    <AnimatePresence>
      <div
        id="contact-profile-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md rounded-3xl bg-[#09090b] border border-stone-800 shadow-2xl overflow-hidden text-stone-100 my-4"
        >
          {/* Large Cover Area */}
          <div className="relative h-32 sm:h-36 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 overflow-hidden">
            <div className="absolute inset-0 bg-stone-900/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-black/40" />

            <div className="absolute top-3 inset-x-3 flex justify-between items-center">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-emerald-300 font-bold">
                <span>{contact.flag}</span>
                <span>{contact.country}</span>
              </div>

              <button
                id="contact-profile-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Profile Card Body */}
          <div className="px-5 pb-5 pt-0 relative">
            {/* Avatar & Badges (Avatar en haut à gauche) */}
            <div className="flex justify-between items-end -mt-14 mb-3">
              <div className="relative">
                <UserAvatar
                  name={contact.name}
                  username={contact.username}
                  avatar={contact.avatar}
                  size="2xl"
                  isVIP={contact.isVIP}
                  isVerified={contact.isVerified}
                  className={`border-4 border-[#09090b] shadow-2xl ${
                    contact.isBlocked 
                      ? 'ring-2 ring-rose-600 grayscale' 
                      : 'ring-2 ring-emerald-500'
                  }`}
                />
                {!contact.isBlocked && (
                  <div
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#09090b] ${
                      contact.isOnline ? 'bg-emerald-500' : 'bg-stone-500'
                    }`}
                    title={contact.isOnline ? 'En ligne' : contact.lastSeen || 'Hors ligne'}
                  />
                )}
              </div>

              {/* Status Badge */}
              <div className="space-y-1 text-right">
                {contact.isSuspended ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs bg-rose-600/30 text-rose-300 font-bold border border-rose-500/60 shadow-lg">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Compte Suspendu</span>
                  </span>
                ) : contact.isBlocked ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40">
                    <Lock className="w-3 h-3" />
                    <span>Bloqué</span>
                  </span>
                ) : contact.isVIP ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm">
                    <Crown className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    <span>VIP Creator</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs bg-stone-800 text-stone-300 font-medium border border-stone-700">
                    <span>{contact.isOnline ? '🟢 En ligne' : `⚪ ${contact.lastSeen || 'Hors ligne'}`}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Names & Bio */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-xl text-white tracking-tight">{contact.name}</h3>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              </div>
              <p className="text-xs text-emerald-400 font-mono font-medium">{contact.username}</p>
              {contact.bio && (
                <p className="text-xs text-stone-300 leading-relaxed pt-1">{contact.bio}</p>
              )}
            </div>

            {/* Stats Bar (100% Dynamique & Connecté à la base de données) */}
            <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-stone-950 border border-stone-800/80 text-center mb-3">
              <div>
                <span className="block text-sm font-bold text-white">
                  {(contact.followersCount ?? 0).toLocaleString()}
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-wider">Abonnés</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-white">
                  {(contact.followingCount ?? 0).toLocaleString()}
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-wider">Suivis</span>
              </div>
              <div>
                <span className="block text-sm font-bold text-white">
                  {contactPostsCount !== undefined ? contactPostsCount : (contact.postsCount ?? 0)}
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-wider">Publications</span>
              </div>
            </div>

            {/* Suspended User Notification Banner */}
            {contact.isSuspended && (
              <div className="mb-3 p-3 rounded-2xl bg-rose-950/70 border border-rose-600 text-xs text-rose-200 space-y-1">
                <div className="font-bold text-rose-300 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Compte Suspendu</span>
                </div>
                <p className="text-[11px] text-rose-200/90">
                  Cet utilisateur a été suspendu suite à des signalements répétés.
                </p>
              </div>
            )}

            {/* Blocked Notification Banner */}
            {!contact.isSuspended && contact.isBlocked && (
              <div className="mb-3 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Contact bloqué</div>
                  <div className="text-[11px] text-rose-300/80">
                    Ses publications et messages sont masqués.
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons (Luminous Neon/Emerald Green Buttons) */}
            {!contact.isBlocked && !contact.isSuspended && (
              <div className="space-y-2 mb-4">
                {/* Primary Buttons: S'abonner / Abonné + Message */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Glowing Neon Green 'S'abonner' / 'Abonné' button */}
                  <button
                    id="contact-follow-primary-btn"
                    onClick={handleToggleFollow}
                    className={`py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                      isFollowing
                        ? 'bg-stone-800 text-stone-200 border border-stone-700 hover:bg-stone-750'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-500/25 active:scale-95'
                    }`}
                  >
                    {isFollowing ? (
                      <UserCheck className="w-3.5 h-3.5 stroke-[2.5] text-emerald-400" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>{isFollowing ? 'Abonné ✓' : "S'abonner"}</span>
                  </button>

                  <button
                    id="contact-action-chat-btn"
                    onClick={() => {
                      onOpenChat?.(contact);
                      onClose();
                    }}
                    className="py-2.5 px-4 rounded-full bg-stone-900 hover:bg-stone-800 border border-stone-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Message</span>
                  </button>
                </div>

                {/* Secondary Quick Action Row: Call, Video, MoMo */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="contact-action-audio-call-btn"
                    onClick={() => {
                      onStartCall?.(contact, 'audio');
                      onClose();
                    }}
                    className="py-2 px-2.5 rounded-2xl bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-300 font-medium text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Appel</span>
                  </button>

                  <button
                    id="contact-action-video-call-btn"
                    onClick={() => {
                      onStartCall?.(contact, 'video');
                      onClose();
                    }}
                    className="py-2 px-2.5 rounded-2xl bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-300 font-medium text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Vidéo</span>
                  </button>

                  <button
                    id="contact-action-momo-tip-btn"
                    onClick={() => {
                      onSendMobileMoneyTip?.(contact);
                      onClose();
                    }}
                    className="py-2 px-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1 transition-all cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span>MoMo</span>
                  </button>
                </div>

                {/* Game Challenge Button: Défier en jeu Morpion 3x3 */}
                <button
                  id="contact-action-game-challenge-btn"
                  onClick={() => {
                    onOpenGameChallenge?.(contact);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer hover:scale-102 active:scale-98"
                  title="Défier en jeu au Morpion (Tic-Tac-Toe multijoueur)"
                >
                  <Swords className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  <span>Défier en jeu (Morpion Tic-Tac-Toe) 🎮</span>
                </button>
              </div>
            )}

            {/* Moderation & Safety Actions (Block / Report) */}
            <div className="pt-3 border-t border-stone-850 flex items-center justify-between text-xs">
              {!contact.isBlocked ? (
                <button
                  onClick={() => setShowBlockConfirm(true)}
                  className="text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Bloquer ce contact
                </button>
              ) : (
                <button
                  onClick={handleBlockAction}
                  className="text-emerald-400 hover:underline cursor-pointer"
                >
                  Débloquer ce contact
                </button>
              )}

              <button
                onClick={() => {
                  onOpenReport(contact);
                  onClose();
                }}
                className="text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Signaler ce compte
              </button>
            </div>

            {/* Block Confirmation Modal */}
            {showBlockConfirm && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-950/80 border border-rose-600 text-xs space-y-2">
                <div className="font-bold text-rose-300">Confirmer le blocage ?</div>
                <p className="text-stone-300 text-[11px]">
                  Vous ne verrez plus les publications et messages de {contact.name}.
                </p>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    onClick={() => setShowBlockConfirm(false)}
                    className="px-3 py-1 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleBlockAction}
                    className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500"
                  >
                    Bloquer
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
