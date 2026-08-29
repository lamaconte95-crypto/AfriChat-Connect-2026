import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Crown,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Copy,
  Check,
  Fingerprint,
  FileText,
  CreditCard,
  QrCode,
  Radio,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StripeVipPlan, Transaction, User, PaymentProvider, MobileMoneyOperator } from '../types';
import { COUNTRIES, MOBILE_MONEY_OPERATORS, STRIPE_VIP_PLANS } from '../data/mockData';

// Flutterwave Sandbox Demo / Test API Configuration
export const FLUTTERWAVE_CONFIG = {
  publicKey: 'FLWPUBK_TEST-5f8992a7e934d4001a4e5b92-X',
  secretKey: 'FLWSECK_TEST-sandbox-mock-92a10b44c',
  encryptionKey: 'FLWSECK_TEST_ENC-sandbox-449',
  environment: 'sandbox' as const,
  merchantName: 'AfriChat Connect SARL',
  merchantLogo: '',
  currency: 'XOF', // West African CFA Franc
};

interface FlutterwaveVipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  initialPlanId?: string;
  onSuccess: (transaction: Transaction, activatedPlan: StripeVipPlan) => void;
  onOpenReceipt?: (transaction: Transaction) => void;
}

type CheckoutStep = 'select_plan_and_operator' | 'otp_ussd_push' | 'flutterwave_processing' | 'success';

export const FlutterwaveVipModal: React.FC<FlutterwaveVipModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialPlanId = 'vip_quarterly',
  onSuccess,
  onOpenReceipt,
}) => {
  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<StripeVipPlan>(() => {
    return STRIPE_VIP_PLANS.find((p) => p.id === initialPlanId) || STRIPE_VIP_PLANS[1];
  });

  // Flutterwave Mobile Money Provider selection
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('orange');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('07 89 45 12');
  const [customerName, setCustomerName] = useState(currentUser.name || 'Ibrahim Diallo');
  const [customerEmail, setCustomerEmail] = useState('ibrahim.diallo@africhat.africa');

  // Checkout flow state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('select_plan_and_operator');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('849201');
  const [countdownTimer, setCountdownTimer] = useState(45);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  // USSD / Push notification simulation toggle
  const [pushType, setPushType] = useState<'instant_push' | 'ussd_code'>('instant_push');

  useEffect(() => {
    if (isOpen) {
      if (initialPlanId) {
        const found = STRIPE_VIP_PLANS.find((p) => p.id === initialPlanId);
        if (found) setSelectedPlan(found);
      }
      setCurrentStep('select_plan_and_operator');
      setOtpCode('');
      setGeneratedOtp(Math.floor(100000 + Math.random() * 900000).toString());
      setCountdownTimer(45);
      setIsProcessing(false);
      setCompletedTx(null);
    }
  }, [isOpen, initialPlanId]);

  // Countdown timer in OTP step
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStep === 'otp_ussd_push' && countdownTimer > 0) {
      interval = setInterval(() => {
        setCountdownTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, countdownTimer]);

  if (!isOpen) return null;

  // Step 1: Initiate Flutterwave Checkout
  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert('Veuillez renseigner un numéro de téléphone mobile money valide.');
      return;
    }
    setIsProcessing(true);

    // Simulate Flutterwave v3 API handshake (`/v3/charges?type=mobile_money_franco`)
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep('otp_ussd_push');
    }, 700);
  };

  // Step 2: Confirm OTP / USSD Push
  const handleConfirmOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== generatedOtp && otpCode !== '123456' && otpCode.length < 4) {
      alert(`Veuillez entrer le code de validation reçu par SMS (${generatedOtp}) ou cliquez sur 'Remplir auto'.`);
      return;
    }

    setCurrentStep('flutterwave_processing');

    setTimeout(() => {
      // Create finalized Transaction record
      const randRef = `FLW-MOMO-${selectedProvider.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const recNo = `REC-FLW-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const mockHash = `sha256:flw_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

      const newTx: Transaction = {
        id: `tx_flw_${Date.now()}`,
        type: 'vip_membership',
        amount: selectedPlan.priceFcfa,
        currency: 'FCFA',
        provider: selectedProvider,
        gateway: 'Flutterwave',
        phoneNumber: `${selectedCountry.prefix} ${phoneNumber}`,
        description: `Abonnement VIP ${selectedPlan.name} (${selectedPlan.durationLabel}) via Flutterwave Mobile Money`,
        targetTitle: `Abonnement VIP ${selectedPlan.name}`,
        timestamp: 'À l’instant',
        status: 'success',
        reference: randRef,
        receiptNumber: recNo,
        encryptedHash: mockHash,
        sslSecured: true,
        fraudRiskScore: 1,
        fraudCheckPassed: true,
        customerName: customerName,
        customerEmail: customerEmail,
      };

      setCompletedTx(newTx);
      setCurrentStep('success');

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#FF7900', '#1EA0E6', '#EC4899', '#FB702B'],
        });
      } catch {
        // safe fallback
      }

      onSuccess(newTx, selectedPlan);
    }, 1200);
  };

  const selectedOperatorObj = MOBILE_MONEY_OPERATORS.find((op) => op.id === selectedProvider) || MOBILE_MONEY_OPERATORS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-950 via-[#18181B] to-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Flutterwave Brand Icon */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FB702B] via-[#E24A12] to-[#FF9F43] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 font-black text-sm">
              <span>FW</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  Abonnement VIP Flutterwave
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[9px] font-black tracking-wider uppercase">
                  Mobile Money 🚀
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Paiement direct sécurisé par Orange Money, Wave & MTN MoMo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white bg-stone-800/80 hover:bg-stone-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Flutterwave Sandbox Header Banner */}
        <div className="px-4 sm:px-5 py-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-amber-300 font-bold">
              Flutterwave API v3 : Environnement Sandbox Actif
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(FLUTTERWAVE_CONFIG.publicKey);
              setCopiedKey(true);
              setTimeout(() => setCopiedKey(false), 2000);
            }}
            className="text-[10px] text-stone-300 hover:text-white flex items-center space-x-1 font-mono bg-stone-800/80 px-2 py-0.5 rounded-md cursor-pointer"
            title="Copier la clé publique Flutterwave Test"
          >
            {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedKey ? 'Copié !' : 'Clé Test'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* STEP 1: SELECT PLAN & OPERATOR */}
          {currentStep === 'select_plan_and_operator' && (
            <form onSubmit={handleInitiatePayment} className="space-y-5">
              {/* VIP Perks Overview Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-stone-900 to-stone-950 border border-amber-500/30 flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-md">
                  <Crown className="w-5 h-5 fill-current" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-white text-sm">Privilèges VIP AfriChat Connect</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-stone-950 text-[9px] font-black">
                      GOLD CROWN
                    </span>
                  </div>
                  <p className="text-stone-300">
                    Suppression de 100% des publicités, badge créateur vérifié, accès aux salons privés et lives HD.
                  </p>
                </div>
              </div>

              {/* 1. Plan Selector */}
              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-2">
                  1. Choisissez votre Formule VIP
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {STRIPE_VIP_PLANS.map((plan) => {
                    const isSelected = selectedPlan.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        id={`flw-plan-card-${plan.id}`}
                        onClick={() => setSelectedPlan(plan)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gradient-to-b from-orange-500/20 to-stone-900 border-orange-500 ring-2 ring-orange-500/30'
                            : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {plan.badge && (
                          <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-[9px] shadow-sm">
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
                          <div className="text-[10px] text-stone-400">
                            env. {plan.priceEur.toFixed(2)} €
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Mobile Money Operator Selection */}
              <div>
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider block mb-2">
                  2. Choisissez votre Opérateur Mobile Money
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MOBILE_MONEY_OPERATORS.slice(0, 4).map((op) => {
                    const isSelected = selectedProvider === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        id={`flw-op-btn-${op.id}`}
                        onClick={() => setSelectedProvider(op.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-400 ring-2 ring-orange-500/30'
                            : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-md"
                          style={{
                            backgroundColor: op.id === 'orange' ? '#FF7900' : op.id === 'wave' ? '#1EA0E6' : op.id === 'mtn' ? '#FFCC00' : '#005BAA',
                            color: op.id === 'mtn' ? '#000000' : '#FFFFFF'
                          }}
                        >
                          {op.logoText}
                        </div>
                        <span className="text-xs font-bold text-stone-200 text-center truncate w-full">
                          {op.name.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-emerald-400 font-medium">Instant ⚡️</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Phone & Customer Info */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    3. Coordonnées Mobile Money du Payeur
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Chiffrement SSL 256-bit</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Country Prefix */}
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">Pays</label>
                    <select
                      value={selectedCountry.code}
                      onChange={(e) => {
                        const found = COUNTRIES.find((c) => c.code === e.target.value);
                        if (found) setSelectedCountry(found);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.prefix})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-stone-400 block mb-1">
                      Numéro {selectedOperatorObj.name.split(' ')[0]}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-stone-400 font-mono">
                        {selectedCountry.prefix}
                      </div>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="07 89 45 12"
                        className="w-full pl-16 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-xs font-mono text-stone-100 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Name & Email for receipt */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">Nom du titulaire</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">Email pour reçu fiscal</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Test quick fill buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-stone-400">
                  <span>Numéros Sandbox Démo :</span>
                  <button
                    type="button"
                    onClick={() => setPhoneNumber('07 89 45 12')}
                    className="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-orange-400 font-mono border border-stone-700 cursor-pointer"
                  >
                    07 89 45 12 (CI)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCountry(COUNTRIES.find((c) => c.code === 'SN') || COUNTRIES[0]);
                      setPhoneNumber('77 123 45 67');
                    }}
                    className="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-sky-400 font-mono border border-stone-700 cursor-pointer"
                  >
                    77 123 45 67 (SN)
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="flw-initiate-checkout-btn"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FB702B] via-[#F55E1D] to-[#E24A12] hover:brightness-110 active:scale-[0.99] text-white font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connexion à Flutterwave v3 API...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>
                        Payer {selectedPlan.priceFcfa.toLocaleString()} FCFA avec Flutterwave
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-stone-400 text-center mt-2">
                  🔒 Transaction sécurisée par Flutterwave Sandbox • Activation VIP immédiate sur votre compte
                </p>
              </div>
            </form>
          )}

          {/* STEP 2: USSD PUSH / OTP VALIDATION */}
          {currentStep === 'otp_ussd_push' && (
            <form onSubmit={handleConfirmOtp} className="space-y-5 animate-in fade-in duration-200">
              {/* Flutterwave Push notification card */}
              <div className="p-5 rounded-3xl bg-stone-950 border border-orange-500/40 text-center space-y-3 relative overflow-hidden">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-stone-950 shadow-xl shadow-orange-500/25">
                  <Smartphone className="w-7 h-7 animate-bounce" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                    Validation Mobile Money Requise
                  </span>
                  <h3 className="text-base font-black text-white mt-2">
                    Demande de débit envoyée au {selectedCountry.prefix} {phoneNumber}
                  </h3>
                  <p className="text-xs text-stone-300 mt-1">
                    Un message de confirmation <span className="font-bold text-amber-400">{selectedOperatorObj.name}</span> a été émis pour un montant de <span className="font-black text-white">{selectedPlan.priceFcfa.toLocaleString()} FCFA</span>.
                  </p>
                </div>

                {/* USSD Helper Prompt */}
                <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 text-left text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-stone-300">
                    <span className="flex items-center space-x-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Code USSD direct :</span>
                    </span>
                    <span className="font-mono text-amber-400 bg-stone-950 px-2 py-0.5 rounded border border-stone-700">
                      {selectedProvider === 'orange' ? '#144#' : selectedProvider === 'wave' ? 'Wave App' : '#133#'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Composez le code sur votre combiné ou entrez le code de sécurité SMS reçu ci-dessous pour valider en 1-clic dans la sandbox.
                  </p>
                </div>
              </div>

              {/* OTP Input Field */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-300">Code OTP / PIN de validation SMS :</span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(generatedOtp)}
                    className="text-[11px] text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer"
                  >
                    Remplir auto ({generatedOtp}) ⚡️
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder={generatedOtp}
                    className="w-full text-center tracking-[0.4em] font-mono text-xl sm:text-2xl font-black py-3 rounded-2xl bg-stone-900 border-2 border-stone-700 focus:border-orange-500 text-white focus:outline-none shadow-inner"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                  <span>Expiration du jeton de sécurité :</span>
                  <span className="font-mono font-bold text-amber-400">{countdownTimer}s</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep('select_plan_and_operator')}
                  className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 font-bold text-xs cursor-pointer"
                >
                  Changer de formule / numéro
                </button>

                <button
                  type="submit"
                  id="flw-verify-otp-btn"
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer le Débit Mobile Money</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PROCESSING HANDSHAKE */}
          {currentStep === 'flutterwave_processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-black text-white">Validation Flutterwave en cours</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                  Enregistrement du webhook Flutterwave, validation du jeton Mobile Money et activation de votre abonnement VIP...
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONGRATULATIONS */}
          {currentStep === 'success' && completedTx && (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/20 via-stone-900 to-stone-950 border-2 border-amber-400 text-center space-y-3 relative overflow-hidden shadow-2xl">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-stone-950 flex items-center justify-center font-black shadow-xl shadow-orange-500/30">
                  <Crown className="w-8 h-8 fill-current" />
                </div>

                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Abonnement VIP Actif ⭐
                  </span>
                  <h2 className="text-xl font-black text-white mt-2">
                    Félicitations {currentUser.name} !
                  </h2>
                  <p className="text-xs text-stone-300 mt-1">
                    Votre pass <span className="font-bold text-amber-300">{selectedPlan.name} ({selectedPlan.durationLabel})</span> a été validé avec succès par Flutterwave Mobile Money.
                  </p>
                </div>

                {/* Perks unlocked grid */}
                <div className="grid grid-cols-2 gap-2 text-left text-xs pt-3 border-t border-stone-800 text-stone-300">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Couronne Or & Badge vérifié</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>100% Zéro Publicité</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Salons VIP & Lives 4K</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Appels HD & Cloud illimité</span>
                  </div>
                </div>
              </div>

              {/* Transaction Mini Receipt Card */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-400">
                  <span>Passerelle de paiement :</span>
                  <span className="font-bold text-white flex items-center space-x-1">
                    <span>Flutterwave (Sandbox)</span>
                    <span className="text-emerald-400">● Reçu</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-400">
                  <span>Référence transaction :</span>
                  <span className="font-mono text-amber-400 font-bold">{completedTx.reference}</span>
                </div>
                <div className="flex items-center justify-between text-stone-400">
                  <span>Montant débité :</span>
                  <span className="font-black text-white">{completedTx.amount.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {onOpenReceipt && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenReceipt(completedTx);
                    }}
                    className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Télécharger Reçu Officiel</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-stone-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Profiter de mon Compte VIP</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Security Badge */}
        <div className="p-3 bg-stone-950 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>AfriChat Connect • Flutterwave ISO/IEC 27001 PCI-DSS Level 1</span>
          </div>
          <span className="font-mono text-[10px] text-orange-400">v3-sandbox</span>
        </div>
      </motion.div>
    </div>
  );
};
