import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, 
  X, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  Crown, 
  Flame, 
  Zap, 
  Heart,
  ArrowRight
} from 'lucide-react';
import { User, VirtualGift } from '../types';
import { INITIAL_VIRTUAL_GIFTS } from '../data/mockData';

interface SendGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  recipientName: string;
  recipientAvatar: string;
  recipientFlag?: string;
  onSendGift: (gift: VirtualGift, message?: string) => void;
  onOpenDeposit: () => void;
}

export const SendGiftModal: React.FC<SendGiftModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  recipientName,
  recipientAvatar,
  recipientFlag = '🌍',
  onSendGift,
  onOpenDeposit,
}) => {
  const [selectedGift, setSelectedGift] = useState<VirtualGift>(INITIAL_VIRTUAL_GIFTS[0]);
  const [personalMessage, setPersonalMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const hasEnoughFunds = currentUser.walletBalance >= selectedGift.priceFcfa;

  const handleSend = () => {
    if (!hasEnoughFunds) {
      onOpenDeposit();
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      onSendGift(selectedGift, personalMessage.trim() || undefined);
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <AnimatePresence>
      <div 
        id="send-gift-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-stone-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl text-stone-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white flex items-center space-x-1.5">
                  <span>Offrir un Cadeau Virtuel</span>
                  <span>🎁</span>
                </h3>
                <p className="text-[11px] text-stone-400">Soutenez instantanément ce créateur via Mobile Money</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success State */}
          {sentSuccess ? (
            <div className="p-8 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 text-5xl flex items-center justify-center shadow-2xl border border-amber-500/40"
              >
                {selectedGift.icon}
              </motion.div>
              <h3 className="text-lg font-black text-white">Cadeau envoyé avec succès !</h3>
              <p className="text-xs text-amber-300">
                {selectedGift.name} ({selectedGift.priceFcfa.toLocaleString()} FCFA) a été crédité sur le portefeuille de {recipientName}.
              </p>
            </div>
          ) : (
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Recipient Card */}
              <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={recipientAvatar}
                    alt={recipientName}
                    className="w-11 h-11 rounded-2xl object-cover border border-amber-500"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-white">{recipientName}</span>
                      <span>{recipientFlag}</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-medium">Bénéficiaire des gains</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block">Votre Solde</span>
                  <span className="text-xs font-black text-amber-300">
                    {currentUser.walletBalance.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {/* Gift Grid */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-2">
                  Sélectionnez un cadeau panafricain :
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {INITIAL_VIRTUAL_GIFTS.map((gift) => {
                    const isSelected = selectedGift.id === gift.id;
                    return (
                      <button
                        key={gift.id}
                        type="button"
                        onClick={() => setSelectedGift(gift)}
                        className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 scale-105 shadow-lg shadow-orange-500/10'
                            : 'bg-stone-800/80 border-stone-700/80 hover:border-stone-600 hover:bg-stone-800'
                        }`}
                      >
                        <span className="text-3xl mb-1 drop-shadow">{gift.icon}</span>
                        <span className="text-[11px] font-bold text-stone-200 line-clamp-1">
                          {gift.name}
                        </span>
                        <span className="text-[10px] font-black text-amber-400 mt-0.5">
                          {gift.priceFcfa.toLocaleString()} F
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Gift Summary */}
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-2xl">{selectedGift.icon}</span>
                  <div>
                    <h4 className="text-xs font-black text-amber-300">{selectedGift.name}</h4>
                    <p className="text-[10px] text-stone-400">{selectedGift.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-sm font-black text-white">{selectedGift.priceFcfa.toLocaleString()} FCFA</span>
                  <span className="text-[10px] text-stone-400 block">≈ {selectedGift.priceEur} €</span>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-[11px] font-bold text-stone-400 mb-1">
                  Message d'encouragement (optionnel) :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Bravo pour le direct ! Force à toi 👏"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Action Button */}
              <div>
                {hasEnoughFunds ? (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-sm shadow-xl shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>{isSending ? 'Envoi en cours...' : `Envoyer pour ${selectedGift.priceFcfa.toLocaleString()} FCFA`}</span>
                    <span>🎁</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenDeposit}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-black text-sm shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Solde insuffisant • Recharger MoMo ({selectedGift.priceFcfa.toLocaleString()} F requis)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
