import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { 
  X, 
  Users, 
  Crown, 
  Sparkles, 
  Check, 
  Plus, 
  ShieldCheck, 
  Smartphone, 
  Image as ImageIcon,
  Tag,
  Coins
} from 'lucide-react';
import { ChatConversation, User } from '../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: Partial<ChatConversation>) => void;
  currentUser: User;
}

const PRESET_CONTACTS = [
  { id: 'u_fatou', name: 'Fatou Diallo', avatar: '', flag: '🇸🇳', role: 'Designer UI/UX' },
  { id: 'u_samuel', name: 'Samuel Eto', avatar: '', flag: '🇨🇲', role: 'Dev Fullstack' },
  { id: 'u_aicha', name: 'Aïcha Traoré', avatar: '', flag: '🇨🇮', role: 'Fondatrice E-com' },
  { id: 'u_moussa', name: 'Moussa Camara', avatar: '', flag: '🇬🇳', role: 'Trader & Investisseur' },
  { id: 'u_grace', name: 'Grâce Kalala', avatar: '', flag: '🇨🇩', role: 'Créatrice Mode' },
];

const CATEGORIES = [
  'Business & Startup',
  'Crypto & E-commerce',
  'Tech & Intelligence Artificielle',
  'Mode Afro & Lifestyle',
  'Musique & Culture Africaine',
  'Diaspora & Investissement',
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
  currentUser,
}) => {
  const [groupType, setGroupType] = useState<'group' | 'vip_salon'>('group');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [vipPrice, setVipPrice] = useState<number>(2500);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['u_fatou', 'u_samuel']);

  if (!isOpen) return null;

  const toggleMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const isVIP = groupType === 'vip_salon';

    const newGroup: Partial<ChatConversation> = {
      id: `group_${Date.now()}`,
      type: isVIP ? 'vip_salon' : 'group',
      name: name.trim(),
      avatar: '',
      participantIds: [currentUser.id, ...selectedMembers],
      lastMessage: isVIP 
        ? '👑 Bienvenue dans ce Salon VIP exclusif monétisé avec Mobile Money !'
        : '👋 Bienvenue dans le nouveau groupe ! Échangez librement.',
      lastMessageTime: 'À l’instant',
      unreadCount: 0,
      isVIPRoom: isVIP,
      vipPrice: isVIP ? vipPrice : undefined,
      isUnlocked: true, // Creator has full unlocked access
      roomDescription: description || (isVIP ? 'Salon VIP privé avec accès Mobile Money direct.' : 'Groupe de discussion communautaire.'),
      memberCount: selectedMembers.length + 1,
      hostName: currentUser.name,
      hostFlag: currentUser.flag,
      category: category,
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          text: isVIP 
            ? `👑 Salon VIP officiel créé par ${currentUser.name}. Accès monétisé (${vipPrice.toLocaleString()} FCFA via Orange Money / Wave / MTN MoMo).`
            : `Bienvenue à tous ! J'ai créé ce groupe pour échanger sur ${category}.`,
          timestamp: 'À l’instant',
          status: 'sent',
          isVipMessage: isVIP,
        },
      ],
    };

    onCreateGroup(newGroup);
    onClose();
    // Reset form
    setName('');
    setDescription('');
  };

  return (
    <AnimatePresence>
      <div 
        id="create-group-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl p-6 text-stone-100 my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-800">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                {groupType === 'vip_salon' ? <Crown className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-black text-base text-white">
                  {groupType === 'vip_salon' ? 'Créer un Salon VIP Exclusif' : 'Créer un Groupe de Discussion'}
                </h3>
                <p className="text-xs text-stone-400">Échangez et monétisez vos cercles en Afrique</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Group Type Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-stone-950 border border-stone-800">
              <button
                type="button"
                onClick={() => setGroupType('group')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  groupType === 'group'
                    ? 'bg-stone-800 text-stone-100 shadow border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Groupe Gratuit</span>
              </button>

              <button
                type="button"
                onClick={() => setGroupType('vip_salon')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  groupType === 'vip_salon'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>Salon VIP Payant 🍊🌊</span>
              </button>
            </div>

            {/* VIP Info Banner if selected */}
            {groupType === 'vip_salon' && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-xs text-amber-300">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <p>
                  Les membres devront payer un abonnement Mobile Money (Orange Money, Wave, MTN MoMo) pour débloquer l'accès à votre salon. Vos gains sont crédités directement sur votre Portefeuille.
                </p>
              </div>
            )}

            {/* Group Name */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">
                Nom du {groupType === 'vip_salon' ? 'Salon VIP' : 'Groupe'} *
              </label>
              <input
                type="text"
                required
                placeholder={groupType === 'vip_salon' ? 'Ex: Club VIP E-commerce & Dropshipping Africa' : 'Ex: Développeurs & Créateurs Abidjan'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category Picker */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">
                Thématique / Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1">
                Description / Règles du groupe
              </label>
              <textarea
                rows={2}
                placeholder="Décrivez l'objectif de ce salon, les avantages pour les membres..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Group Icon Badge Preview */}
            <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 font-bold">
                {name.trim() ? name.trim().slice(0, 2).toUpperCase() : <Users className="w-5 h-5 text-emerald-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-stone-200 truncate">{name || 'Nom du groupe'}</div>
                <div className="text-[11px] text-stone-500 truncate">{category} • {selectedMembers.length + 1} membres</div>
              </div>
            </div>

            {/* VIP Price Configuration (If VIP) */}
            {groupType === 'vip_salon' && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300">Prix de l'abonnement mensuel :</span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {vipPrice.toLocaleString()} FCFA
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[1000, 2500, 5000, 10000].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setVipPrice(amt)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        vipPrice === amt
                          ? 'bg-amber-500 text-stone-950 border-amber-500 shadow'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      {amt.toLocaleString()} F
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Initial Members */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-2">
                Inviter des contacts ({selectedMembers.length} sélectionnés)
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-stone-800/40">
                {PRESET_CONTACTS.map((contact) => {
                  const isSelected = selectedMembers.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleMember(contact.id)}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-500/10' : 'hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <UserAvatar name={contact.name} avatar={contact.avatar} size="sm" />
                        <div>
                          <div className="text-xs font-bold text-stone-200 flex items-center space-x-1">
                            <span>{contact.name}</span>
                            <span>{contact.flag}</span>
                          </div>
                          <div className="text-[10px] text-stone-500">{contact.role}</div>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                        isSelected ? 'bg-amber-500 border-amber-500 text-stone-950' : 'border-stone-700'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="submit-create-group-btn"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-sm shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {groupType === 'vip_salon' ? <Crown className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                <span>
                  {groupType === 'vip_salon' ? 'Lancer mon Salon VIP Payant' : 'Créer le Groupe de Discussion'}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
