import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Sparkles, 
  Copy, 
  Check, 
  Crown, 
  Fingerprint, 
  Zap, 
  Info, 
  FileText,
  Smartphone,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StripeVipPlan, Transaction, User } from '../types';
import { STRIPE_PUBLIC_KEY, STRIPE_VIP_PLANS } from '../data/mockData';

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  initialPlanId?: string;
  onSuccess: (transaction: Transaction, activatedPlan: StripeVipPlan) => void;
  onOpenReceipt?: (transaction: Transaction) => void;
}

type PaymentTab = 'card' | 'apple_pay' | 'google_pay';
type CheckoutStep = 'plan_and_method' | 'stripe_3ds' | 'processing' | 'success';

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialPlanId = 'vip_quarterly',
  onSuccess,
  onOpenReceipt,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<StripeVipPlan>(() => {
    return STRIPE_VIP_PLANS.find((p) => p.id === initialPlanId) || STRIPE_VIP_PLANS[1];
  });
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('card');
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('plan_and_method');

  // Card Form State (Stripe Elements representation)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('424');
  const [cardName, setCardName] = useState(currentUser.name || 'Ibrahim Diallo');
  const [cardZip, setCardZip] = useState('00225');
  const [saveCard, setSaveCard] = useState(true);
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'amex' | 'generic'>('visa');
  const [copiedKey, setCopiedKey] = useState(false);

  // Digital Wallet sheets simulation
  const [showApplePaySheet, setShowApplePaySheet] = useState(false);
  const [showGooglePaySheet, setShowGooglePaySheet] = useState(false);
  const [walletProcessing, setWalletProcessing] = useState(false);

  // Completed transaction
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      const match = STRIPE_VIP_PLANS.find((p) => p.id === initialPlanId) || STRIPE_VIP_PLANS[1];
      setSelectedPlan(match);
      setCurrentStep('plan_and_method');
      setShowApplePaySheet(false);
      setShowGooglePaySheet(false);
      setCompletedTx(null);
    }
  }, [isOpen, initialPlanId]);

  // Card number input formatting and brand detection
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = '';
    for (let i = 0; i < raw.length; i += 4) {
      if (i > 0) formatted += ' ';
      formatted += raw.substring(i, i + 4);
    }
    setCardNumber(formatted);

    // Detect brand
    if (raw.startsWith('4')) setCardBrand('visa');
    else if (raw.startsWith('5') || raw.startsWith('2')) setCardBrand('mastercard');
    else if (raw.startsWith('3')) setCardBrand('amex');
    else setCardBrand('generic');
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setCardExpiry(val);
  };

  const handleCopyPublicKey = () => {
    navigator.clipboard.writeText(STRIPE_PUBLIC_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('424');
    setCardBrand('visa');
  };

  // Submit Card via Stripe Elements
  const handleCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    // Move to Stripe 3D Secure / SCA step
    setCurrentStep('stripe_3ds');
  };

  // Confirm 3DS / Finalize Stripe Payment
  const handleComplete3DS = (simulateFailure = false) => {
    setCurrentStep('processing');

    setTimeout(() => {
      if (simulateFailure) {
        alert('Simulation d’échec Stripe : Authentification 3D Secure refusée par l’émetteur.');
        setCurrentStep('plan_and_method');
        return;
      }

      finishSuccessfulPayment('card', `•••• ${cardNumber.slice(-4) || '4242'}`);
    }, 1400);
  };

  // Handle Apple Pay flow
  const handleApplePayClick = () => {
    setShowApplePaySheet(true);
  };

  const handleConfirmApplePay = () => {
    setWalletProcessing(true);
    setTimeout(() => {
      setWalletProcessing(false);
      setShowApplePaySheet(false);
      setCurrentStep('processing');
      setTimeout(() => {
        finishSuccessfulPayment('apple_pay', 'Apple Pay (Touch ID / Face ID)');
      }, 1000);
    }, 1200);
  };

  // Handle Google Pay flow
  const handleGooglePayClick = () => {
    setShowGooglePaySheet(true);
  };

  const handleConfirmGooglePay = () => {
    setWalletProcessing(true);
    setTimeout(() => {
      setWalletProcessing(false);
      setShowGooglePaySheet(false);
      setCurrentStep('processing');
      setTimeout(() => {
        finishSuccessfulPayment('google_pay', 'Google Pay (Compte Google)');
      }, 1000);
    }, 1200);
  };

  // Helper to finalize transaction & activate VIP
  const finishSuccessfulPayment = (provider: 'card' | 'apple_pay' | 'google_pay', methodLabel: string) => {
    const randomPi = `pi_3Mtw${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    const randomRec = `REC-STRIPE-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const mockHash = `sha256:stripe_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

    const newTx: Transaction = {
      id: `tx_stripe_${Date.now()}`,
      type: 'vip_membership',
      amount: selectedPlan.priceFcfa,
      currency: 'FCFA',
      provider: provider,
      gateway: 'Stripe',
      phoneNumber: currentUser.countryCode ? `Compte Stripe (${currentUser.countryCode})` : 'Stripe Client',
      description: `Abonnement VIP Stripe - ${selectedPlan.name} (${selectedPlan.durationLabel})`,
      targetTitle: selectedPlan.name,
      timestamp: 'À l’instant',
      status: 'success',
      reference: randomPi,
      receiptNumber: randomRec,
      encryptedHash: mockHash,
      sslSecured: true,
      fraudRiskScore: 0,
      fraudCheckPassed: true,
      customerName: cardName || currentUser.name,
      customerEmail: `${currentUser.username.replace('@', '')}@africhat.ci`,
    };

    setCompletedTx(newTx);
    setCurrentStep('success');

    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#635BFF', '#00D4FF', '#F59E0B', '#10B981', '#FF7900'],
      });
    } catch {
      // safe fallback
    }

    onSuccess(newTx, selectedPlan);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="stripe-payment-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          id="stripe-payment-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-stone-900 border border-[#635BFF]/50 rounded-3xl shadow-2xl overflow-hidden text-stone-100 my-auto"
        >
          {/* Top Stripe Brand Bar */}
          <div className="relative px-6 py-4 bg-gradient-to-r from-[#635BFF]/30 via-stone-900 to-stone-950 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Stripe Logo Badge */}
              <div className="w-10 h-10 rounded-2xl bg-[#635BFF] flex items-center justify-center font-black text-white text-lg tracking-tighter shadow-md shadow-[#635BFF]/30">
                stripe
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#A29BFE]">
                    Stripe Elements 3D-Secure
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                    Mode Test Actif
                  </span>
                </div>
                <h3 className="font-bold text-base text-white flex items-center space-x-1.5">
                  <span>Abonnement VIP AfriChat</span>
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                </h3>
              </div>
            </div>

            <button
              id="stripe-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stripe Public Key Inspector Bar */}
          <div className="px-6 py-2 bg-stone-950 border-b border-stone-850 flex items-center justify-between text-[11px] text-stone-400">
            <div className="flex items-center space-x-1.5 overflow-hidden">
              <span className="text-stone-400 font-mono text-[10px] shrink-0">Clé Publique Stripe :</span>
              <span className="font-mono text-stone-300 truncate max-w-[200px] sm:max-w-[280px]">
                {STRIPE_PUBLIC_KEY}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyPublicKey}
              className="flex items-center space-x-1 text-[10px] text-[#A29BFE] hover:text-white px-2 py-0.5 rounded bg-stone-800/80 transition-colors"
            >
              {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>

          {/* Main Body */}
          <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
            {/* STEP 1: Plan & Method Selection */}
            {currentStep === 'plan_and_method' && (
              <>
                {/* 1. SELECT VIP PLAN */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                      1. Choisissez votre Formule VIP
                    </label>
                    <span className="text-[11px] text-amber-400 font-medium">Activation immédiate ✨</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {STRIPE_VIP_PLANS.map((plan) => {
                      const isSelected = selectedPlan.id === plan.id;
                      return (
                        <div
                          key={plan.id}
                          id={`stripe-plan-${plan.id}`}
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gradient-to-b from-[#635BFF]/20 to-stone-900 border-[#635BFF] ring-2 ring-[#635BFF]/30 shadow-lg shadow-[#635BFF]/10'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                          }`}
                        >
                          {plan.badge && (
                            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-[9px] shadow">
                              {plan.badge}
                            </span>
                          )}

                          <div>
                            <div className="text-xs font-black text-white">{plan.name}</div>
                            <div className="text-[11px] text-stone-400">{plan.durationLabel}</div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-stone-800">
                            <div className="text-base font-black text-amber-400">
                              {plan.priceFcfa.toLocaleString()} <span className="text-xs">FCFA</span>
                            </div>
                            <div className="text-[10px] text-stone-400 font-medium">
                              environ {plan.priceEur.toFixed(2)} €
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Plan Features Preview */}
                  <div className="mt-2.5 p-3 rounded-2xl bg-stone-950/80 border border-stone-800 text-[11px] text-stone-300">
                    <div className="font-bold text-amber-400 mb-1 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Avantages inclus avec le {selectedPlan.name} :</span>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-stone-300">
                      {selectedPlan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center space-x-1.5">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 2. SELECT PAYMENT METHOD (Card, Apple Pay, Google Pay) */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                    2. Mode de Paiement Stripe
                  </label>

                  {/* Method Navigation Tabs */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {/* Carte Bancaire */}
                    <button
                      type="button"
                      id="stripe-tab-card"
                      onClick={() => setPaymentTab('card')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                        paymentTab === 'card'
                          ? 'bg-[#635BFF]/20 border-[#635BFF] text-white ring-2 ring-[#635BFF]/30'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-[#A29BFE]" />
                      <span>Carte Bancaire</span>
                      <span className="text-[9px] text-stone-400 font-normal">Visa, Master, CB, Amex</span>
                    </button>

                    {/* Apple Pay */}
                    <button
                      type="button"
                      id="stripe-tab-apple-pay"
                      onClick={() => setPaymentTab('apple_pay')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                        paymentTab === 'apple_pay'
                          ? 'bg-stone-800 border-white text-white ring-2 ring-white/20'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="text-base font-black tracking-tight text-white flex items-center">
                        Pay
                      </div>
                      <span>Apple Pay</span>
                      <span className="text-[9px] text-stone-400 font-normal">Touch ID / Face ID</span>
                    </button>

                    {/* Google Pay */}
                    <button
                      type="button"
                      id="stripe-tab-google-pay"
                      onClick={() => setPaymentTab('google_pay')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                        paymentTab === 'google_pay'
                          ? 'bg-blue-950/40 border-blue-400 text-white ring-2 ring-blue-400/20'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="text-sm font-black text-white flex items-center space-x-1">
                        <span className="text-blue-400">G</span>
                        <span className="text-red-400">P</span>
                        <span className="text-amber-400">a</span>
                        <span className="text-emerald-400">y</span>
                      </div>
                      <span>Google Pay</span>
                      <span className="text-[9px] text-stone-400 font-normal">1-Click Android</span>
                    </button>
                  </div>

                  {/* PAYMENT TAB 1: CARTE BANCAIRE (STRIPE ELEMENTS) */}
                  {paymentTab === 'card' && (
                    <form onSubmit={handleCardPayment} className="space-y-3.5">
                      {/* Auto Test Card Fill Helper */}
                      <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                        <span className="text-stone-400 text-[11px] flex items-center space-x-1">
                          <Info className="w-3.5 h-3.5 text-[#A29BFE]" />
                          <span>Carte de test Stripe : 4242 4242 4242 4242</span>
                        </span>
                        <button
                          type="button"
                          id="stripe-autofill-test-card-btn"
                          onClick={fillTestCard}
                          className="px-2 py-1 rounded-lg bg-[#635BFF]/20 hover:bg-[#635BFF]/30 text-[#A29BFE] font-bold text-[10px] border border-[#635BFF]/40 transition-colors"
                        >
                          Remplir auto ⚡️
                        </button>
                      </div>

                      {/* Cardholder Name */}
                      <div>
                        <label className="block text-xs text-stone-400 mb-1 font-medium">
                          Nom du titulaire de la carte
                        </label>
                        <input
                          id="stripe-card-name"
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Ibrahim Diallo"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-[#635BFF]"
                        />
                      </div>

                      {/* Card Number Input (Stripe Element Replica) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-stone-400 font-medium">
                            Numéro de carte bancaire
                          </label>
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${cardBrand === 'visa' ? 'bg-blue-600 text-white' : 'text-stone-500'}`}>
                              VISA
                            </span>
                            <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${cardBrand === 'mastercard' ? 'bg-orange-600 text-white' : 'text-stone-500'}`}>
                              MC
                            </span>
                            <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${cardBrand === 'amex' ? 'bg-emerald-600 text-white' : 'text-stone-500'}`}>
                              AMEX
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center rounded-xl overflow-hidden border border-stone-700 bg-stone-800 px-3 py-2.5 focus-within:border-[#635BFF] transition-colors">
                          <CreditCard className="w-4 h-4 text-[#A29BFE] mr-2.5 shrink-0" />
                          <input
                            id="stripe-card-number"
                            type="text"
                            required
                            maxLength={19}
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4242 4242 4242 4242"
                            className="flex-1 bg-transparent text-xs text-stone-100 font-mono tracking-wider focus:outline-none"
                          />
                          <Lock className="w-3.5 h-3.5 text-stone-500" />
                        </div>
                      </div>

                      {/* Expiry, CVC & ZIP in 3 columns */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-stone-400 mb-1 font-medium">Expiration</label>
                          <input
                            id="stripe-card-expiry"
                            type="text"
                            required
                            maxLength={5}
                            value={cardExpiry}
                            onChange={handleCardExpiryChange}
                            placeholder="MM/AA"
                            className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 font-mono text-center focus:outline-none focus:border-[#635BFF]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-stone-400 mb-1 font-medium">CVC / CVV</label>
                          <input
                            id="stripe-card-cvc"
                            type="password"
                            required
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="•••"
                            className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 font-mono text-center focus:outline-none focus:border-[#635BFF]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-stone-400 mb-1 font-medium">Code Postal</label>
                          <input
                            id="stripe-card-zip"
                            type="text"
                            value={cardZip}
                            onChange={(e) => setCardZip(e.target.value)}
                            placeholder="00225"
                            className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 font-mono text-center focus:outline-none focus:border-[#635BFF]"
                          />
                        </div>
                      </div>

                      {/* Save Card Checkbox */}
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          id="stripe-save-card"
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="w-4 h-4 rounded border-stone-700 bg-stone-800 text-[#635BFF] focus:ring-[#635BFF]"
                        />
                        <label htmlFor="stripe-save-card" className="text-[11px] text-stone-400 cursor-pointer">
                          Enregistrer cette carte pour les futurs renouvellements VIP automatiques
                        </label>
                      </div>

                      {/* Submit Card Button */}
                      <button
                        id="stripe-submit-card-btn"
                        type="submit"
                        className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#635BFF] via-[#7B73FF] to-[#635BFF] text-white font-black text-sm shadow-xl shadow-[#635BFF]/30 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <Lock className="w-4 h-4 stroke-[2.5]" />
                        <span>
                          Payer {selectedPlan.priceFcfa.toLocaleString()} FCFA ({selectedPlan.priceEur.toFixed(2)} €)
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* PAYMENT TAB 2: APPLE PAY */}
                  {paymentTab === 'apple_pay' && (
                    <div className="space-y-4 text-center py-2 animate-in fade-in duration-150">
                      <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-white text-xl font-bold mx-auto">
                          
                        </div>
                        <h4 className="font-bold text-sm text-white">Apple Pay en 1 Clic</h4>
                        <p className="text-xs text-stone-400 max-w-sm mx-auto">
                          Réglez votre abonnement <span className="font-bold text-amber-400">{selectedPlan.name}</span> instantanément avec Touch ID ou Face ID via votre appareil Apple.
                        </p>
                      </div>

                      <button
                        id="stripe-apple-pay-btn"
                        type="button"
                        onClick={handleApplePayClick}
                        className="w-full py-4 rounded-2xl bg-white hover:bg-stone-100 text-black font-black text-base shadow-xl flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <span className="text-xl"></span>
                        <span>Pay avec Apple Pay ({selectedPlan.priceFcfa.toLocaleString()} FCFA)</span>
                      </button>
                    </div>
                  )}

                  {/* PAYMENT TAB 3: GOOGLE PAY */}
                  {paymentTab === 'google_pay' && (
                    <div className="space-y-4 text-center py-2 animate-in fade-in duration-150">
                      <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-700 flex items-center justify-center text-white text-base font-black mx-auto">
                          <span className="text-blue-400">G</span>
                          <span className="text-red-400">P</span>
                          <span className="text-amber-400">a</span>
                          <span className="text-emerald-400">y</span>
                        </div>
                        <h4 className="font-bold text-sm text-white">Google Pay Rapide & Sécurisé</h4>
                        <p className="text-xs text-stone-400 max-w-sm mx-auto">
                          Paiement direct avec vos cartes associées à votre compte Google Play / Chrome.
                        </p>
                      </div>

                      <button
                        id="stripe-google-pay-btn"
                        type="button"
                        onClick={handleGooglePayClick}
                        className="w-full py-4 rounded-2xl bg-stone-950 hover:bg-stone-850 border border-stone-700 text-white font-black text-base shadow-xl flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <span className="text-blue-400 font-bold">G</span>
                        <span className="text-white font-bold">Pay</span>
                        <span className="text-stone-400 font-normal">|</span>
                        <span>{selectedPlan.priceFcfa.toLocaleString()} FCFA ({selectedPlan.priceEur.toFixed(2)} €)</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* STEP 2: STRIPE 3D-SECURE 2.0 SIMULATION MODAL */}
            {currentStep === 'stripe_3ds' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl bg-stone-950 border border-[#635BFF]/40 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-[#635BFF] flex items-center justify-center font-bold text-white text-xs">
                        stripe
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Stripe 3D-Secure 2.0 (SCA)</div>
                        <div className="text-[10px] text-stone-400">Vérification de l’émetteur bancaire</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Authentification Requise
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-stone-300">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Commerçant</span>
                      <span className="font-bold text-white">AfriChat Connect VIP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Montant</span>
                      <span className="font-bold text-amber-400">
                        {selectedPlan.priceFcfa.toLocaleString()} FCFA ({selectedPlan.priceEur.toFixed(2)} €)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Carte Utilisée</span>
                      <span className="font-mono text-stone-200">•••• {cardNumber.slice(-4) || '4242'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[11px] text-blue-200 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      En environnement Stripe Test, vous pouvez simuler l'approbation bancaire 3D Secure ou le rejet en un clic.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleComplete3DS(false)}
                    className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Autoriser le Paiement (Test)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleComplete3DS(true)}
                    className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Simuler Rejet 3DS</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PROCESSING STATE */}
            {currentStep === 'processing' && (
              <div className="py-12 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-[#635BFF] animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-white">Validation Stripe PaymentIntent...</h4>
                  <p className="text-xs text-stone-400">
                    Chiffrement AES-256 et confirmation avec le réseau bancaire Visa/Mastercard/Apple
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION & RECEIPT */}
            {currentStep === 'success' && completedTx && (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="p-5 rounded-2xl bg-gradient-to-b from-[#635BFF]/30 to-stone-950 border border-[#635BFF]/50 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                    <Crown className="w-7 h-7 fill-stone-950" />
                  </div>
                  <h4 className="font-black text-lg text-white">Félicitations ! Vous êtes VIP ⭐</h4>
                  <p className="text-xs text-stone-300">
                    Votre souscription au <span className="font-bold text-amber-300">{selectedPlan.name}</span> a été validée avec succès par Stripe.
                  </p>
                  <div className="text-2xl font-black text-amber-400 pt-1">
                    {selectedPlan.priceFcfa.toLocaleString()} FCFA
                  </div>
                </div>

                {/* Transaction receipt summary */}
                <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Passerelle de paiement</span>
                    <span className="font-bold text-[#A29BFE]">Stripe Inc. (Mode Test)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Stripe PaymentIntent ID</span>
                    <span className="font-mono text-stone-200 truncate max-w-[200px]">{completedTx.reference}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">N° de Reçu Fiscal</span>
                    <span className="font-mono font-bold text-stone-200">{completedTx.receiptNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Moyen utilisé</span>
                    <span className="font-bold text-stone-200 uppercase">{completedTx.provider}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Durée d'activation</span>
                    <span className="font-bold text-emerald-400">{selectedPlan.durationLabel} sans publicité</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    id="stripe-success-view-receipt-btn"
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenReceipt) onOpenReceipt(completedTx);
                    }}
                    className="py-3 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Voir le Reçu Officiel</span>
                  </button>

                  <button
                    id="stripe-success-finish-btn"
                    type="button"
                    onClick={onClose}
                    className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 fill-stone-950" />
                    <span>Profiter du VIP</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Security Badges */}
          <div className="p-3 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400 px-6">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conforme PCI-DSS Level 1 & 3DS 2.0</span>
            </span>
            <span className="font-mono text-[10px] text-stone-500">Stripe TLS v1.3</span>
          </div>
        </motion.div>
      </div>

      {/* APPLE PAY SHEET SIMULATION OVERLAY */}
      {showApplePaySheet && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-t-3xl sm:rounded-3xl p-6 text-stone-100 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold">Pay</span>
                <span className="text-xs text-stone-400">AfriChat Connect SAS</span>
              </div>
              <button
                type="button"
                onClick={() => setShowApplePaySheet(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">CARTE</span>
                <span className="font-bold flex items-center space-x-1">
                  <span>Apple Card •••• 8842</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">ARTICLE</span>
                <span className="font-bold text-white">{selectedPlan.name} ({selectedPlan.durationLabel})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-800/60">
                <span className="text-stone-400">CONTACT</span>
                <span>{currentUser.name}</span>
              </div>
              <div className="flex justify-between py-1 pt-2 text-sm font-black text-amber-400">
                <span>TOTAL DÉBIT</span>
                <span>{selectedPlan.priceFcfa.toLocaleString()} FCFA ({selectedPlan.priceEur.toFixed(2)} €)</span>
              </div>
            </div>

            <div className="py-4 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-stone-800 border-2 border-dashed border-[#A29BFE] flex items-center justify-center mx-auto text-[#A29BFE]">
                <Fingerprint className={`w-8 h-8 ${walletProcessing ? 'animate-pulse text-emerald-400' : ''}`} />
              </div>
              <p className="text-xs text-stone-300">
                {walletProcessing
                  ? 'Authentification Touch ID / Face ID en cours...'
                  : 'Confirmez avec Touch ID ou Face ID pour finaliser'}
              </p>
            </div>

            <button
              type="button"
              id="confirm-apple-pay-sheet-btn"
              disabled={walletProcessing}
              onClick={handleConfirmApplePay}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-stone-200 text-black font-black text-sm flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
            >
              {walletProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <>
                  <span className="text-lg"></span>
                  <span>Payer avec Touch ID</span>
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}

      {/* GOOGLE PAY SHEET SIMULATION OVERLAY */}
      {showGooglePaySheet && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-t-3xl sm:rounded-3xl p-6 text-stone-100 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center space-x-1.5 text-base font-black">
                <span className="text-blue-400">G</span>
                <span className="text-red-400">P</span>
                <span className="text-amber-400">a</span>
                <span className="text-emerald-400">y</span>
                <span className="text-xs font-normal text-stone-400 ml-2">AfriChat Connect</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGooglePaySheet(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Compte Google</div>
                  <div className="text-stone-400 text-[11px]">{currentUser.username.replace('@', '')}@gmail.com</div>
                </div>
                <span className="text-xs font-mono text-emerald-400">Vérifié ✓</span>
              </div>

              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Visa •••• 4242</div>
                  <div className="text-stone-400 text-[11px]">Enregistrée sur Google Pay</div>
                </div>
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>

              <div className="flex justify-between py-2 border-t border-stone-800 text-sm font-black text-amber-400">
                <span>TOTAL À PAYER</span>
                <span>{selectedPlan.priceFcfa.toLocaleString()} FCFA ({selectedPlan.priceEur.toFixed(2)} €)</span>
              </div>
            </div>

            <button
              type="button"
              id="confirm-google-pay-sheet-btn"
              disabled={walletProcessing}
              onClick={handleConfirmGooglePay}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-600/30"
            >
              {walletProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span>Continuer & Valider avec Google Pay</span>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
