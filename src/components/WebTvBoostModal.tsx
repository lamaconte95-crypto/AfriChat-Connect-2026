import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Tv, 
  Flame, 
  Zap, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  ArrowRight,
  Lock,
  Radio,
  Eye,
  Share2
} from 'lucide-react';
import { WebTvChannel, WebTvBoostPlan, User, PaymentProvider, Transaction } from '../types';
import { INITIAL_WEBTV_BOOST_PLANS } from '../data/mockData';

interface WebTvBoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: WebTvChannel[];
  selectedChannel?: WebTvChannel | null;
  currentUser: User;
  onBoostSuccess: (channelId: string, plan: WebTvBoostPlan, transaction: Transaction) => void;
}

export const WebTvBoostModal: React.FC<WebTvBoostModalProps> = ({
  isOpen,
  onClose,
  channels,
  selectedChannel,
  currentUser,
  onBoostSuccess,
}) => {
  const [activeChannelId, setActiveChannelId] = useState<string>(
    selectedChannel ? selectedChannel.id : channels[0]?.id || ''
  );
  const [selectedPlanId, setSelectedPlanId] = useState<'express' | 'prime' | 'grand_ecran'>('prime');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('wave');
  const [momoPhone, setMomoPhone] = useState('0701020304');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan');
  const [lastTx, setLastTx] = useState<Transaction | null>(null);

  if (!isOpen) return null;

  const currentPlan = INITIAL_WEBTV_BOOST_PLANS.find(p => p.id === selectedPlanId) || INITIAL_WEBTV_BOOST_PLANS[1];
  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

  const handleConfirmBoost = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const txId = `tx_webtv_boost_${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        type: 'vip_unlock',
        amount: currentPlan.priceFcfa,
        currency: 'FCFA',
        provider: selectedProvider,
        targetTitle: `Boost Web TV - ${activeChannel?.title || 'Chaîne Web TV'}`,
        description: `Boost de visibilité ${currentPlan.name} (${currentPlan.durationLabel}) pour ${activeChannel?.title}`,
        timestamp: 'À l’instant',
        status: 'success',
        reference: `BOOST-TV-${Math.floor(100000 + Math.random() * 900000)}`,
        receiptNumber: `REC-TV-${Date.now().toString().slice(-6)}`,
        sslSecured: true,
        fraudCheckPassed: true,
      };

      setLastTx(newTx);
      setIsProcessing(false);
      setStep('success');
      onBoostSuccess(activeChannelId, currentPlan, newTx);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div
        id="webtv-boost-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-orange-500/30 shadow-2xl overflow-hidden text-stone-100 my-4"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-2xl bg-black/30 backdrop-blur-md">
                  <Flame className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/30 text-amber-200">
                    BOOST DE VISIBILITÉ WEB TV 🚀
                  </span>
                  <h2 className="text-xl font-black tracking-tight">
                    Propulsez votre Direct en Tête
                  </h2>
                </div>
              </div>

              <button
                id="webtv-boost-close-btn"
                onClick={onClose}
                className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {step === 'plan' && (
              <>
                {/* Channel Selector */}
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                    Sélectionnez la chaîne ou émission à booster :
                  </label>
                  <select
                    value={activeChannelId}
                    onChange={(e) => setActiveChannelId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-950 border border-stone-800 focus:border-amber-400 text-xs text-stone-100 font-bold focus:outline-none"
                  >
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.title} ({ch.hostName} • {ch.hostFlag})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Boost Plans */}
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
                    Choisissez votre formule de boost :
                  </label>

                  <div className="space-y-2.5">
                    {INITIAL_WEBTV_BOOST_PLANS.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          id={`boost-plan-${plan.id}`}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 shadow-md'
                              : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          {plan.badge && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] font-black text-stone-950 shadow-sm">
                              {plan.badge}
                            </span>
                          )}

                          <div className="flex items-start justify-between pr-14">
                            <div>
                              <div className="font-black text-sm text-white flex items-center space-x-1.5">
                                <span>{plan.name}</span>
                              </div>
                              <p className="text-[11px] text-stone-300 mt-0.5">{plan.description}</p>
                            </div>
                          </div>

                          <div className="mt-2.5 flex items-baseline space-x-2">
                            <span className="text-lg font-black text-amber-400">
                              {plan.priceFcfa.toLocaleString()} FCFA
                            </span>
                            <span className="text-xs text-stone-400">({plan.priceEur} €)</span>
                            <span className="text-[10px] text-stone-500">• {plan.durationLabel}</span>
                          </div>

                          {/* Features list */}
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 pt-2 border-t border-stone-800/80">
                            {plan.features.slice(0, 2).map((feat, idx) => (
                              <div key={idx} className="flex items-center space-x-1 text-[10px] text-stone-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Continue button */}
                <button
                  id="webtv-boost-continue-btn"
                  onClick={() => setStep('payment')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-stone-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Booster ma chaîne ({currentPlan.priceFcfa.toLocaleString()} FCFA / {currentPlan.priceEur} €)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 'payment' && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-white">{currentPlan.name}</div>
                    <div className="text-[10px] text-stone-400">Pour : {activeChannel?.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-amber-400">{currentPlan.priceFcfa.toLocaleString()} FCFA</div>
                    <div className="text-[10px] text-stone-400">{currentPlan.priceEur} €</div>
                  </div>
                </div>

                {/* Providers */}
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
                    Moyen de paiement :
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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
                        <span className="font-bold text-xs">Mobile Money</span>
                      </div>
                      <span className="text-[10px] text-stone-400 block">Wave, Orange, MTN, Moov</span>
                    </button>

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
                      <span className="text-[10px] text-stone-400 block">Visa, Mastercard</span>
                    </button>
                  </div>
                </div>

                {selectedProvider === 'wave' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-stone-300">
                      Numéro Mobile Money (Débit direct) :
                    </label>
                    <input
                      type="tel"
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-400 text-xs text-stone-100 focus:outline-none"
                    />
                  </div>
                )}

                {/* Guarantees */}
                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="text-[11px]">
                    Activation immédiate • Badge animé flamme doré activé pendant {currentPlan.durationLabel}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('plan')}
                    className="py-3 px-4 rounded-2xl bg-stone-800 text-stone-300 font-bold text-xs hover:bg-stone-700 cursor-pointer"
                  >
                    Retour
                  </button>

                  <button
                    id="webtv-boost-pay-btn"
                    disabled={isProcessing}
                    onClick={handleConfirmBoost}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                        <span>Activation du Boost...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Payer {currentPlan.priceFcfa.toLocaleString()} FCFA</span>
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
                  <h3 className="text-lg font-black text-white">Boost Web TV Activé avec Succès ! 🚀</h3>
                  <p className="text-xs text-stone-300 mt-1 max-w-sm mx-auto">
                    La chaîne <strong className="text-amber-400">{activeChannel?.title}</strong> est désormais propulsée en tête de liste pour {currentPlan.durationLabel}.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-left text-xs space-y-1.5">
                  <div className="flex justify-between text-stone-400">
                    <span>Reçu de transaction :</span>
                    <span className="font-mono text-amber-300">{lastTx.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Plan :</span>
                    <span className="font-bold text-white">{currentPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Statut :</span>
                    <span className="text-emerald-400 font-bold">Actif en continu ⚡</span>
                  </div>
                </div>

                <button
                  id="webtv-boost-done-btn"
                  onClick={onClose}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 font-black text-sm shadow-md hover:scale-[1.02] cursor-pointer"
                >
                  Voir ma chaîne en tête du direct 📺
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
