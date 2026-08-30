import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Lock, 
  Sparkles,
  CreditCard,
  PhoneCall,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentProvider, Transaction } from '../types';
import { MOBILE_MONEY_OPERATORS, COUNTRIES } from '../data/mockData';
import { UserAvatar } from './UserAvatar';

interface MobileMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  amount: number;
  currency?: string;
  itemType: 'vip_post' | 'vip_reel' | 'vip_salon' | 'tip' | 'deposit';
  creatorName?: string;
  creatorAvatar?: string;
  onSuccess: (transaction: Transaction) => void;
}

export const MobileMoneyModal: React.FC<MobileMoneyModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  amount,
  currency = 'FCFA',
  itemType,
  creatorName,
  creatorAvatar,
  onSuccess,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('orange');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('07 89 45 12');
  const [step, setStep] = useState<'select' | 'ussd_pending' | 'success'>('select');
  const [ussdTimer, setUssdTimer] = useState(6);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setUssdTimer(6);
      setIsProcessing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'ussd_pending' && ussdTimer > 0) {
      interval = setInterval(() => {
        setUssdTimer((prev) => prev - 1);
      }, 1000);
    } else if (step === 'ussd_pending' && ussdTimer === 0) {
      triggerSuccess();
    }
    return () => clearInterval(interval);
  }, [step, ussdTimer]);

  const triggerSuccess = () => {
    setStep('success');
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#FF7900', '#1EA0E6', '#EC4899'],
      });
    } catch {
      // safe fallback
    }

    const txId = 'TX-' + Math.floor(10000000 + Math.random() * 90000000);
    const newTx: Transaction = {
      id: txId,
      type: itemType === 'deposit' ? 'deposit' : itemType === 'tip' ? 'tip' : itemType === 'vip_salon' ? 'salon_sub' : 'vip_unlock',
      amount: amount,
      currency: currency,
      provider: selectedProvider,
      phoneNumber: `${selectedCountry.prefix} ${phoneNumber}`,
      description: title,
      targetTitle: creatorName ? `Pour ${creatorName}` : title,
      timestamp: 'À l’instant',
      status: 'success',
      reference: `${selectedProvider.toUpperCase()}-${selectedCountry.code}-${Math.floor(1000000 + Math.random() * 9000000)}`,
    };

    setTimeout(() => {
      onSuccess(newTx);
    }, 1200);
  };

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('ussd_pending');
      setUssdTimer(5);
    }, 800);
  };

  const activeOperator = MOBILE_MONEY_OPERATORS.find((op) => op.id === selectedProvider) || MOBILE_MONEY_OPERATORS[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="mobile-money-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          id="mobile-money-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-stone-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-stone-100"
        >
          {/* Header Banner */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-emerald-600/20 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Paiement Sécurisé</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Instant ⚡️
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white">AfriPay Mobile Money</h3>
              </div>
            </div>

            <button
              id="close-mobile-money-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {step === 'select' && (
              <form onSubmit={handleInitiatePayment} className="space-y-5">
                {/* Item Summary Card */}
                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {creatorAvatar || creatorName ? (
                      <UserAvatar
                        name={creatorName || 'Créateur'}
                        avatar={creatorAvatar}
                        size="lg"
                        className="w-12 h-12 border-2 border-amber-500/50 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Lock className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-stone-400 font-medium">
                        {itemType === 'tip' ? 'Pourboire pour le créateur' : 'Déblocage Contenu VIP'}
                      </p>
                      <h4 className="font-bold text-sm text-stone-100 line-clamp-1">{title}</h4>
                      {subtitle && <p className="text-xs text-stone-400">{subtitle}</p>}
                    </div>
                  </div>

                  <div className="text-right pl-3">
                    <div className="text-xl font-black text-amber-400">
                      {amount.toLocaleString()} <span className="text-xs font-semibold">{currency}</span>
                    </div>
                    <span className="text-[11px] text-stone-400">TTC</span>
                  </div>
                </div>

                {/* Country Selector */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                    Pays & Devise
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {COUNTRIES.slice(0, 5).map((country) => (
                      <button
                        type="button"
                        key={country.code}
                        onClick={() => setSelectedCountry(country)}
                        className={`p-2 rounded-xl text-xs font-medium border flex flex-col items-center justify-center transition-all ${
                          selectedCountry.code === country.code
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-stone-800/50 border-stone-700 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                        }`}
                      >
                        <span className="text-lg mb-0.5">{country.flag}</span>
                        <span className="truncate w-full text-center">{country.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Operator Selector */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Moyen de paiement</span>
                    <span className="text-stone-400 font-normal lowercase">Mobile Money & CB</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {MOBILE_MONEY_OPERATORS.map((op) => {
                      const isSelected = selectedProvider === op.id;
                      return (
                        <button
                          type="button"
                          key={op.id}
                          onClick={() => setSelectedProvider(op.id)}
                          className={`relative p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-stone-800 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                              : 'bg-stone-800/40 border-stone-700/80 hover:bg-stone-800/80 text-stone-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow"
                              style={{
                                backgroundColor: op.id === 'orange' ? '#FF7900' : op.id === 'wave' ? '#1EA0E6' : op.id === 'mtn' ? '#FFCC00' : op.id === 'moov' ? '#005BAA' : '#7C3AED',
                                color: op.id === 'mtn' ? '#000000' : '#FFFFFF'
                              }}
                            >
                              {op.logoText}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-stone-100 flex items-center space-x-1.5">
                                <span>{op.name.split(' ')[0]}</span>
                                {op.popularTag && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                                    {op.popularTag}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-400">
                                {op.id === 'wave' ? 'Scan & Push direct' : op.id === 'card' ? 'Visa / Mastercard' : 'Paiement USSD direct'}
                              </div>
                            </div>
                          </div>

                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-500 bg-amber-500' : 'border-stone-600'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Details */}
                {selectedProvider === 'card' ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs text-stone-300 mb-1">Numéro de carte bancaire</label>
                      <div className="relative">
                        <input
                          type="text"
                          defaultValue="4532 •••• •••• 8821"
                          className="w-full px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                        />
                        <CreditCard className="w-5 h-5 text-stone-400 absolute right-3.5 top-3" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-stone-300 mb-1">Expiration</label>
                        <input
                          type="text"
                          defaultValue="12/28"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-300 mb-1">CVV</label>
                        <input
                          type="password"
                          defaultValue="789"
                          className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      Numéro de téléphone ({activeOperator.name})
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-stone-700 focus-within:border-amber-500 bg-stone-800">
                      <div className="px-3.5 py-3 bg-stone-800/80 border-r border-stone-700 text-stone-300 font-medium text-sm flex items-center space-x-1.5">
                        <span>{selectedCountry.flag}</span>
                        <span>{selectedCountry.prefix}</span>
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ex: 07 89 45 12"
                        className="flex-1 px-4 py-3 bg-stone-800 text-stone-100 text-sm font-semibold tracking-wider focus:outline-none placeholder:text-stone-500"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1.5 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Vous recevrez un prompt de validation sur votre téléphone.</span>
                    </p>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    id="submit-mobile-money-pay-btn"
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black text-base shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Connexion au réseau {activeOperator.name}...</span>
                      </>
                    ) : (
                      <>
                        <span>Payer {amount.toLocaleString()} {currency}</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {step === 'ussd_pending' && (
              <div className="py-6 text-center space-y-6">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                  <div className="relative w-24 h-24 rounded-full bg-stone-800 border-2 border-amber-500 flex items-center justify-center shadow-xl">
                    <PhoneCall className="w-10 h-10 text-amber-400 animate-bounce" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-semibold text-xs border border-amber-500/30">
                    Validation USSD / Push en cours
                  </span>
                  <h4 className="text-xl font-black text-stone-100">
                    Vérifiez votre téléphone 📱
                  </h4>
                  <p className="text-sm text-stone-400 max-w-sm mx-auto leading-relaxed">
                    Une demande de débit de <strong className="text-amber-400">{amount.toLocaleString()} {currency}</strong> a été envoyée au <strong className="text-stone-200">{selectedCountry.prefix} {phoneNumber}</strong> via <strong className="text-orange-400">{activeOperator.name}</strong>.
                  </p>
                </div>

                {/* USSD simulation box */}
                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-left font-mono text-xs text-amber-300/90 shadow-inner">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800 text-stone-400 text-[10px]">
                    <span>PROMPT USSD {activeOperator.name.toUpperCase()}</span>
                    <span>#144# / #150#</span>
                  </div>
                  <p>» Autoriser le paiement de {amount} {currency} pour AfriChat ?</p>
                  <p className="text-stone-400 mt-1">» Entrez votre code secret PIN à 4 chiffres sur votre mobile.</p>
                </div>

                <div className="flex items-center justify-center space-x-2 text-stone-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Attente de la confirmation réseau ({ussdTimer}s)...</span>
                </div>

                <button
                  type="button"
                  onClick={triggerSuccess}
                  className="text-xs text-amber-400/80 hover:text-amber-300 underline font-medium"
                >
                  ⚡️ Simuler validation immédiate
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="py-6 text-center space-y-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>

                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-emerald-400">Paiement Réussi !</h4>
                  <p className="text-sm text-stone-300">
                    Votre transaction a été validée avec succès via {activeOperator.name}.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/60 text-xs text-left space-y-2">
                  <div className="flex justify-between text-stone-400">
                    <span>Montant débité :</span>
                    <span className="font-bold text-stone-100">{amount.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Opérateur :</span>
                    <span className="font-bold text-amber-400">{activeOperator.name}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Numéro :</span>
                    <span className="font-mono text-stone-200">{selectedCountry.prefix} {phoneNumber}</span>
                  </div>
                  <div className="flex justify-between text-stone-400 border-t border-stone-700 pt-2">
                    <span>Statut :</span>
                    <span className="font-bold text-emerald-400 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Contenu Débloqué</span>
                    </span>
                  </div>
                </div>

                <button
                  id="done-mobile-money-btn"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Profiter de mon accès VIP 🎉
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
