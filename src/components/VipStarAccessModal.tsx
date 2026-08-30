import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Crown, 
  Sparkles, 
  MessageSquare, 
  PhoneCall, 
  Video, 
  CheckCircle2, 
  ShieldCheck, 
  Wallet, 
  Smartphone, 
  CreditCard,
  Zap,
  Clock,
  Calendar,
  Lock,
  ArrowRight,
  Send
} from 'lucide-react';
import { Contact, User, PaymentProvider, Transaction } from '../types';
import { UserAvatar } from './UserAvatar';

interface VipStarAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  star: Contact | { id: string; name: string; username: string; avatar: string; flag: string; country: string; isVIP?: boolean };
  currentUser: User;
  onSuccess: (bookingType: 'direct_message' | 'call_reservation', transaction: Transaction) => void;
  initialService?: 'direct_message' | 'call_reservation';
}

export const VipStarAccessModal: React.FC<VipStarAccessModalProps> = ({
  isOpen,
  onClose,
  star,
  currentUser,
  onSuccess,
  initialService = 'direct_message',
}) => {
  const [selectedService, setSelectedService] = useState<'direct_message' | 'call_reservation'>(initialService);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('wave');
  const [momoPhone, setMomoPhone] = useState('0701020304');
  const [scheduledDate, setScheduledDate] = useState('2026-08-25');
  const [scheduledTime, setScheduledTime] = useState('18:30');
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [initialMessage, setInitialMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [lastTx, setLastTx] = useState<Transaction | null>(null);

  if (!isOpen) return null;

  const pricing = {
    direct_message: {
      fcfa: 1300,
      eur: 2.0,
      label: 'Message Direct VIP Star',
      sublabel: 'Canal prioritaire garanti • Notification sonore spéciale • Réponse directe de la star',
      icon: MessageSquare,
      color: 'from-amber-500 to-orange-500',
    },
    call_reservation: {
      fcfa: 2000,
      eur: 3.0,
      label: 'Réservation Appel VIP Star (1-à-1)',
      sublabel: 'Session privée Audio/Vidéo HD de 15 min • Date & Heure réservée • Enregistrement & souvenir',
      icon: Video,
      color: 'from-orange-500 to-rose-500',
    },
  };

  const currentPrice = pricing[selectedService];
  const hasEnoughWallet = currentUser.walletBalance >= currentPrice.fcfa;

  const handleConfirmAccess = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const txId = `tx_vip_star_${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        type: 'vip_unlock',
        amount: currentPrice.fcfa,
        currency: 'FCFA',
        provider: selectedProvider,
        targetTitle: `Accès VIP Star - ${star.name} (${selectedService === 'direct_message' ? 'Message Direct' : 'Appel Privé'})`,
        description: selectedService === 'direct_message' 
          ? `Accès Message Direct VIP Star avec ${star.name} (2 € / 1 300 FCFA)`
          : `Réservation Appel 1-à-1 Vidéo VIP avec ${star.name} (3 € / 2 000 FCFA) le ${scheduledDate} à ${scheduledTime}`,
        timestamp: 'À l’instant',
        status: 'success',
        reference: `VIP-STAR-${Math.floor(100000 + Math.random() * 900000)}`,
        receiptNumber: `REC-STAR-${Date.now().toString().slice(-6)}`,
        sslSecured: true,
        fraudCheckPassed: true,
      };

      setLastTx(newTx);
      setIsProcessing(false);
      setStep('success');
      onSuccess(selectedService, newTx);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div 
        id="vip-star-access-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-amber-500/30 shadow-2xl overflow-hidden text-stone-100 my-4"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-5 pb-6 text-stone-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-2xl bg-black/20 text-white backdrop-blur-md">
                  <Crown className="w-5 h-5 fill-amber-300 text-amber-300" />
                </span>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/30 text-white">
                      EXCLUSIVITÉ STAR VIP
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Accès VIP Star 👑
                  </h2>
                </div>
              </div>

              <button
                id="vip-star-close-btn"
                onClick={onClose}
                className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Star Profile Pill */}
            <div className="mt-4 flex items-center space-x-3 p-2.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
              <UserAvatar
                name={star.name}
                username={star.username}
                avatar={star.avatar}
                flag={star.flag}
                isVIP={star.isVIP}
                size="lg"
                className="w-12 h-12 rounded-xl border-2 border-amber-400 shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm truncate">{star.name}</span>
                  <span>{star.flag}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-stone-950">
                    VIP
                  </span>
                </div>
                <p className="text-xs text-amber-200 font-mono truncate">{star.username}</p>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-5 space-y-5">
            {step === 'select' && (
              <>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
                    Choisissez votre type d’accès privilégié :
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Direct Message (2 € / 1 300 FCFA) */}
                    <div
                      id="star-service-option-dm"
                      onClick={() => setSelectedService('direct_message')}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedService === 'direct_message'
                          ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {selectedService === 'direct_message' && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      )}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-white">Message Direct</div>
                          <div className="text-[10px] text-amber-300 font-bold">1-à-1 Prioritaire</div>
                        </div>
                      </div>
                      <div className="my-2">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-xl font-black text-amber-400">2 €</span>
                          <span className="text-xs text-stone-400">/ 1 300 FCFA</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-300 leading-snug">
                        Débloque une messagerie privée sans filtre avec accusé de lecture et badge VIP.
                      </p>
                    </div>

                    {/* Option 2: Call Reservation (3 € / 2 000 FCFA) */}
                    <div
                      id="star-service-option-call"
                      onClick={() => setSelectedService('call_reservation')}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedService === 'call_reservation'
                          ? 'bg-orange-500/15 border-orange-400 shadow-lg shadow-orange-500/10'
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {selectedService === 'call_reservation' && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" />
                      )}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-white">Appel Audio/Vidéo</div>
                          <div className="text-[10px] text-orange-300 font-bold">Session Privée</div>
                        </div>
                      </div>
                      <div className="my-2">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-xl font-black text-orange-400">3 €</span>
                          <span className="text-xs text-stone-400">/ 2 000 FCFA</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-300 leading-snug">
                        Réservation d’un créneau d’appel vidéo ou audio en direct avec {star.name}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional inputs depending on service */}
                {selectedService === 'direct_message' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                      <span>Message d'ouverture prioritaire :</span>
                      <span className="text-[10px] text-amber-400 font-mono">Visible immédiatement</span>
                    </label>
                    <textarea
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      placeholder={`Bonjour ${star.name}, j'adore vos contenus ! Je voulais vous poser une question...`}
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-950 border border-stone-800 focus:border-amber-400 text-xs text-stone-100 placeholder-stone-500 focus:outline-none resize-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                      <span className="flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-orange-400" />
                        <span>Créneau souhaité pour l'appel :</span>
                      </span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => setCallType('video')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            callType === 'video' ? 'bg-orange-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          Vidéo HD
                        </button>
                        <button
                          type="button"
                          onClick={() => setCallType('audio')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            callType === 'audio' ? 'bg-orange-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          Audio
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-stone-400 block mb-1">Date</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:border-orange-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 block mb-1">Heure (GMT/Afrique)</label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:border-orange-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Button */}
                <button
                  id="star-proceed-payment-btn"
                  onClick={() => setStep('payment')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-stone-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Continuer vers le paiement ({currentPrice.eur} € / {currentPrice.fcfa.toLocaleString()} FCFA)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 'payment' && (
              <div className="space-y-4">
                {/* Summary Box */}
                <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{currentPrice.label}</div>
                      <div className="text-[10px] text-stone-400">Pour {star.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-amber-400">{currentPrice.eur} €</div>
                    <div className="text-[10px] text-stone-400">{currentPrice.fcfa.toLocaleString()} FCFA</div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
                    Moyen de paiement :
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* AfriPay Wallet */}
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('wave')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedProvider === 'wave'
                          ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                          : 'bg-stone-950/60 border-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Smartphone className="w-4 h-4 text-sky-400" />
                        <span className="font-bold text-xs">Wave & Mobile Money</span>
                      </div>
                      <span className="text-[10px] text-stone-400 block">Orange, MTN, Moov</span>
                    </button>

                    {/* Card / Stripe */}
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('stripe')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedProvider === 'stripe'
                          ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                          : 'bg-stone-950/60 border-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <CreditCard className="w-4 h-4 text-purple-400" />
                        <span className="font-bold text-xs">Carte & Stripe</span>
                      </div>
                      <span className="text-[10px] text-stone-400 block">Visa, Mastercard, 2 €</span>
                    </button>
                  </div>
                </div>

                {selectedProvider === 'wave' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-stone-300">
                      Numéro Mobile Money (Wave / Orange / MTN / Moov) :
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-400 text-xs text-stone-100 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-emerald-400 font-bold">
                        Paiement Instantané ⚡
                      </span>
                    </div>
                  </div>
                )}

                {/* Security Guarantee */}
                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="text-[11px]">
                    Transaction 100% sécurisée et cryptée • Notification en temps réel à {star.name}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="py-3 px-4 rounded-2xl bg-stone-800 text-stone-300 font-bold text-xs hover:bg-stone-700 cursor-pointer"
                  >
                    Retour
                  </button>

                  <button
                    id="star-pay-confirm-btn"
                    disabled={isProcessing}
                    onClick={handleConfirmAccess}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                        <span>Validation en cours...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Payer {currentPrice.eur} € ({currentPrice.fcfa.toLocaleString()} FCFA)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && lastTx && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Accès VIP Star Débloqué ! 🎉</h3>
                  <p className="text-xs text-stone-300 mt-1 max-w-sm mx-auto">
                    Votre accès VIP avec <strong className="text-amber-400">{star.name}</strong> a été activé avec succès.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-left text-xs space-y-1.5">
                  <div className="flex justify-between text-stone-400">
                    <span>Reçu :</span>
                    <span className="font-mono text-amber-300">{lastTx.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Montant réglé :</span>
                    <span className="font-bold text-white">{currentPrice.eur} € ({currentPrice.fcfa.toLocaleString()} FCFA)</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Service :</span>
                    <span className="text-stone-200">{currentPrice.label}</span>
                  </div>
                </div>

                <button
                  id="star-success-done-btn"
                  onClick={onClose}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-sm shadow-md hover:scale-[1.02] cursor-pointer"
                >
                  {selectedService === 'direct_message' ? 'Ouvrir la discussion VIP 💬' : 'Voir ma réservation d’appel 📞'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
