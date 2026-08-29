import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Sparkles, 
  Key, 
  FileText, 
  RefreshCw, 
  Check, 
  Fingerprint, 
  Zap,
  Globe,
  Radio,
  Sliders,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentProvider, PaymentGateway, Transaction, FraudCheckResult } from '../types';
import { MOBILE_MONEY_OPERATORS, COUNTRIES } from '../data/mockData';

interface SecurePaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  amount: number;
  currency?: string;
  itemType: 'vip_membership' | 'vip_post' | 'vip_reel' | 'vip_salon' | 'tip' | 'deposit';
  customerName?: string;
  customerEmail?: string;
  onSuccess: (transaction: Transaction) => void;
  onOpenReceipt?: (transaction: Transaction) => void;
}

export const SecurePaymentGatewayModal: React.FC<SecurePaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  amount,
  currency = 'FCFA',
  itemType,
  customerName = 'Ibrahim Diallo',
  customerEmail = 'ibrahim.diallo@africhat.ci',
  onSuccess,
  onOpenReceipt,
}) => {
  // Gateway & Provider
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('Flutterwave');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('orange');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  
  // Form Inputs
  const [phoneNumber, setPhoneNumber] = useState('07 89 45 12');
  const [email, setEmail] = useState(customerEmail);
  const [name, setName] = useState(customerName);
  
  // Card Inputs (if card selected)
  const [cardNumber, setCardNumber] = useState('4234 •••• •••• 9012');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('842');

  // Step flow: 'details' -> 'fraud_check' -> 'otp_verify' -> 'processing' -> 'success'
  const [currentStep, setCurrentStep] = useState<'details' | 'fraud_check' | 'otp_verify' | 'processing' | 'success'>('details');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('849201');
  const [otpCountdown, setOtpCountdown] = useState(30);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  // Anti-fraud simulation state
  const [fraudAnalysis, setFraudAnalysis] = useState<FraudCheckResult>({
    riskScore: 2,
    riskLevel: 'low',
    isAllowed: true,
    checks: {
      ipReputation: true,
      deviceFingerprintMatch: true,
      velocityCheck: true,
      kycMatch: true,
      geoCorrelation: true,
    },
  });
  const [fraudSimulationMode, setFraudSimulationMode] = useState<'normal' | 'simulate_high_risk'>('normal');

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('details');
      setOtpCode('');
      setGeneratedOtp(Math.floor(100000 + Math.random() * 900000).toString());
      setOtpCountdown(30);
      setCompletedTx(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStep === 'otp_verify' && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, otpCountdown]);

  // Execute Step 1: Submit details -> Go to Fraud Check
  const handleProceedToFraudCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('fraud_check');

    // Run simulated AI anti-fraud verification
    setTimeout(() => {
      if (fraudSimulationMode === 'simulate_high_risk') {
        setFraudAnalysis({
          riskScore: 88,
          riskLevel: 'high',
          isAllowed: false,
          checks: {
            ipReputation: false,
            deviceFingerprintMatch: true,
            velocityCheck: false,
            kycMatch: false,
            geoCorrelation: false,
          },
          reasons: ['Suspicion d’usurpation de numéro ou proxy anonyme détecté.'],
        });
      } else {
        setFraudAnalysis({
          riskScore: 2,
          riskLevel: 'low',
          isAllowed: true,
          checks: {
            ipReputation: true,
            deviceFingerprintMatch: true,
            velocityCheck: true,
            kycMatch: true,
            geoCorrelation: true,
          },
        });
      }
    }, 900);
  };

  // Continue from Fraud Check to OTP
  const handleProceedToOtp = () => {
    setCurrentStep('otp_verify');
    setOtpCountdown(30);
  };

  // Submit OTP & Finish payment
  const handleVerifyOtpAndPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== generatedOtp && otpCode !== '123456') {
      alert(`Code OTP incorrect. Utilisez le code ${generatedOtp} ou cliquez sur 'Remplir auto'.`);
      return;
    }

    setCurrentStep('processing');

    setTimeout(() => {
      // Create finalized Transaction record
      const randRef = `${selectedGateway.substring(0, 3).toUpperCase()}-${selectedProvider.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const recNo = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const mockHash = `sha256:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        type: itemType === 'vip_membership' ? 'vip_membership' : itemType === 'deposit' ? 'deposit' : itemType === 'tip' ? 'tip' : itemType === 'vip_salon' ? 'salon_sub' : 'vip_unlock',
        amount: amount,
        currency: currency,
        provider: selectedProvider,
        gateway: selectedGateway,
        phoneNumber: `${selectedCountry.prefix} ${phoneNumber}`,
        description: title,
        targetTitle: title,
        timestamp: 'À l’instant',
        status: 'success',
        reference: randRef,
        receiptNumber: recNo,
        encryptedHash: mockHash,
        sslSecured: true,
        fraudRiskScore: fraudAnalysis.riskScore,
        fraudCheckPassed: true,
        customerName: name,
        customerEmail: email,
      };

      setCompletedTx(newTx);
      setCurrentStep('success');

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#FF7900', '#1EA0E6', '#8B5CF6'],
        });
      } catch {
        // safe fallback
      }

      onSuccess(newTx);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="secure-gateway-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          id="secure-gateway-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-stone-100 my-auto"
        >
          {/* Header Banner */}
          <div className="relative px-4 sm:px-6 py-4 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/60 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <button
                id="secure-gateway-back-btn"
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 transition-all flex items-center space-x-1 cursor-pointer group"
                title="← Retour"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-xs font-bold text-amber-300 hidden sm:inline">Retour</span>
              </button>

              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">Passerelle Certifiée SSL</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                    AES-256
                  </span>
                </div>
                <h3 className="font-bold text-base text-white">{title}</h3>
              </div>
            </div>

            <button
              id="close-secure-gateway-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Indicator */}
          <div className="grid grid-cols-3 border-b border-stone-800 bg-stone-950/60 text-xs font-bold py-2.5 px-4 text-center">
            <div className={`flex items-center justify-center space-x-1.5 ${currentStep === 'details' ? 'text-amber-400' : 'text-emerald-400'}`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-stone-800 border border-current">
                {currentStep !== 'details' ? '✓' : '1'}
              </span>
              <span className="hidden sm:inline">Détails & Moyens</span>
              <span className="sm:hidden text-[10px]">Moyens</span>
            </div>

            <div className={`flex items-center justify-center space-x-1.5 ${currentStep === 'fraud_check' ? 'text-amber-400' : currentStep === 'otp_verify' || currentStep === 'processing' || currentStep === 'success' ? 'text-emerald-400' : 'text-stone-500'}`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-stone-800 border border-current">
                {currentStep === 'otp_verify' || currentStep === 'processing' || currentStep === 'success' ? '✓' : '2'}
              </span>
              <span className="hidden sm:inline">Anti-Fraude</span>
              <span className="sm:hidden text-[10px]">Sécurité</span>
            </div>

            <div className={`flex items-center justify-center space-x-1.5 ${currentStep === 'otp_verify' || currentStep === 'processing' ? 'text-amber-400' : currentStep === 'success' ? 'text-emerald-400' : 'text-stone-500'}`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-stone-800 border border-current">
                {currentStep === 'success' ? '✓' : '3'}
              </span>
              <span className="hidden sm:inline">Validation OTP</span>
              <span className="sm:hidden text-[10px]">OTP</span>
            </div>
          </div>

          {/* Amount Badge */}
          <div className="p-4 bg-stone-950/90 border-b border-stone-850 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-stone-400 block font-medium">Montant net à débiter</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400">
                {amount.toLocaleString()} {currency}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-stone-400 block">Frais de passerelle</span>
              <span className="text-xs font-bold text-emerald-400">0% (Inclus) ✨</span>
            </div>
          </div>

          {/* Body Content by Step */}
          <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto space-y-4">
            {/* STEP 1: Details & Method Selection */}
            {currentStep === 'details' && (
              <form onSubmit={handleProceedToFraudCheck} className="space-y-4">
                {/* Gateway Selector */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5 flex items-center justify-between">
                    <span>Passerelle Financière Partenaire</span>
                    <span className="text-[10px] text-amber-400 font-normal">Chiffrement AES-256</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Flutterwave', 'CinetPay', 'Wave', 'Paystack'] as PaymentGateway[]).map((gw) => (
                      <button
                        type="button"
                        key={gw}
                        onClick={() => setSelectedGateway(gw)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                          selectedGateway === gw
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                            : 'bg-stone-800/80 border-stone-700/80 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 mb-1 text-amber-400" />
                        <span className="text-[11px]">{gw}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Operator / Payment Channel */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Moyen de Paiement Mobile Money & Cartes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MOBILE_MONEY_OPERATORS.map((op) => (
                      <button
                        type="button"
                        key={op.id}
                        onClick={() => setSelectedProvider(op.id)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center space-x-2.5 transition-all cursor-pointer ${
                          selectedProvider === op.id
                            ? 'bg-stone-800 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                            : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0"
                          style={{
                            backgroundColor: op.id === 'orange' ? '#FF7900' : op.id === 'wave' ? '#1EA0E6' : op.id === 'mtn' ? '#FFCC00' : op.id === 'moov' ? '#005BAA' : '#8B5CF6',
                            color: op.id === 'mtn' ? '#000000' : '#FFFFFF'
                          }}
                        >
                          {op.logoText}
                        </div>
                        <span className="truncate text-left">{op.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inputs: Country + Phone */}
                {selectedProvider !== 'card' ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Pays du compte</label>
                      <select
                        value={selectedCountry.code}
                        onChange={(e) => {
                          const found = COUNTRIES.find((c) => c.code === e.target.value);
                          if (found) setSelectedCountry(found);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name} ({c.prefix})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Numéro de téléphone Mobile Money</label>
                      <div className="flex rounded-xl overflow-hidden border border-stone-700 bg-stone-800">
                        <span className="px-3.5 py-2.5 bg-stone-700/80 text-xs font-bold text-amber-400">
                          {selectedCountry.prefix}
                        </span>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="07 89 45 12"
                          required
                          className="flex-1 px-3 py-2.5 bg-transparent text-xs text-stone-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Card details form */
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Numéro de carte Visa / Mastercard</label>
                      <div className="flex items-center rounded-xl overflow-hidden border border-stone-700 bg-stone-800 px-3 py-2.5">
                        <CreditCard className="w-4 h-4 text-purple-400 mr-2" />
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4234 0000 0000 9012"
                          className="flex-1 bg-transparent text-xs text-stone-100 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-stone-400 mb-1">Expiration (MM/AA)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-400 mb-1">Cryptogramme CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                          className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Anti-Fraud Test Toggle Helper */}
                <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span className="flex items-center space-x-1">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Mode test du bouclier anti-fraude</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFraudSimulationMode(fraudSimulationMode === 'normal' ? 'simulate_high_risk' : 'normal')}
                      className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px] font-bold text-amber-400 hover:text-white"
                    >
                      {fraudSimulationMode === 'normal' ? 'Normal (Score 2%)' : 'Simuler Risque Élevé ⚠️'}
                    </button>
                  </div>
                </div>

                <button
                  id="secure-gateway-submit-details-btn"
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                  <span>Vérifier & Sécuriser la Transaction</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Anti-Fraud Analysis Screen */}
            {currentStep === 'fraud_check' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
                    <Fingerprint className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="font-bold text-base text-stone-100">Analyse Anti-Fraude AfriShield</h4>
                  <p className="text-xs text-stone-400">
                    Vérification de sécurité biométrique, cohérence IP et conformité KYC.
                  </p>
                </div>

                {/* Checks List */}
                <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-300">Empreinte de l'appareil (Device Fingerprint)</span>
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Conforme</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-300">Vérification de réputation IP & Géolocalisation</span>
                    <span className={`font-bold flex items-center space-x-1 ${fraudAnalysis.checks.ipReputation ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {fraudAnalysis.checks.ipReputation ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{fraudAnalysis.checks.ipReputation ? 'Abidjan (IP Sûre)' : 'IP Suspecte'}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-300">Contrôle de vitesse (Velocity Check)</span>
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Validé (1ère tentative)</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-300">Conformité Titulaire & Compte</span>
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{name} (Vérifié)</span>
                    </span>
                  </div>

                  <div className="border-t border-stone-800/80 pt-2 flex items-center justify-between font-bold">
                    <span className="text-stone-200">Score de Risque Global</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                      fraudAnalysis.isAllowed 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}>
                      {fraudAnalysis.riskScore}% ({fraudAnalysis.isAllowed ? 'Risque Très Faible' : 'Risque Élevé - Bloqué'})
                    </span>
                  </div>
                </div>

                {fraudAnalysis.isAllowed ? (
                  <button
                    id="secure-gateway-proceed-otp-btn"
                    type="button"
                    onClick={handleProceedToOtp}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Key className="w-4 h-4 stroke-[2.5]" />
                    <span>Autoriser et Envoyer le Code OTP / SMS</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-center space-y-2">
                    <p className="text-xs text-rose-200 font-bold">
                      ⚠️ Transaction bloquée par le bouclier anti-fraude.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFraudSimulationMode('normal');
                        setCurrentStep('details');
                      }}
                      className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
                    >
                      Revenir en mode normal
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: OTP / SMS Verification */}
            {currentStep === 'otp_verify' && (
              <form onSubmit={handleVerifyOtpAndPay} className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold">Code OTP 3D-Secure envoyé par SMS</span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Un SMS contenant un code à 6 chiffres a été envoyé au <span className="font-mono font-bold text-amber-300">{selectedCountry.prefix} {phoneNumber}</span>.
                  </p>
                </div>

                {/* Auto Fill Helper for easy preview testing */}
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-stone-400">
                    Code reçu en simulation : <span className="font-mono font-bold text-emerald-400">{generatedOtp}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(generatedOtp)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] hover:bg-emerald-500/30 transition-colors"
                  >
                    Remplir auto ⚡️
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Entrez le code de confirmation OTP
                  </label>
                  <input
                    id="secure-gateway-otp-input"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="••••••"
                    required
                    className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black px-4 py-3 rounded-2xl bg-stone-800 border border-stone-700 text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Renvoi de code possible dans :</span>
                  <span className="font-mono text-amber-400 font-bold">{otpCountdown}s</span>
                </div>

                <button
                  id="secure-gateway-confirm-otp-btn"
                  type="submit"
                  disabled={otpCode.length < 6}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-stone-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirmer le Débit Sécurisé ({amount.toLocaleString()} {currency})</span>
                </button>
              </form>
            )}

            {/* PROCESSING SPINNER */}
            {currentStep === 'processing' && (
              <div className="py-12 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-stone-100">Chiffrement & Signature Cryptographique...</h4>
                  <p className="text-xs text-stone-400">Communication avec l'API {selectedGateway} via protocole TLS 1.3</p>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS & RECEIPT */}
            {currentStep === 'success' && completedTx && (
              <div className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-stone-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <h4 className="font-black text-lg text-emerald-300">Paiement Validé avec Succès !</h4>
                  <p className="text-xs text-stone-300">
                    Votre transaction a été traitée et certifiée par <span className="font-bold text-amber-400">{selectedGateway}</span>.
                  </p>
                  <div className="text-2xl font-black text-white pt-1">
                    {amount.toLocaleString()} {currency}
                  </div>
                </div>

                <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">N° de Reçu Fiscal</span>
                    <span className="font-mono font-bold text-stone-200">{completedTx.receiptNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Référence Passerelle</span>
                    <span className="font-mono text-amber-400">{completedTx.reference}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Opérateur</span>
                    <span className="font-bold text-stone-200 uppercase">{completedTx.provider} ({selectedCountry.prefix} {phoneNumber})</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    id="secure-gateway-view-receipt-btn"
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
                    id="secure-gateway-finish-btn"
                    type="button"
                    onClick={onClose}
                    className="py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <span>Terminer</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Security Badge */}
          <div className="p-3 bg-stone-950/80 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400 px-6">
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Conforme PCI-DSS Level 1</span>
            </span>
            <span className="font-mono text-[10px] text-stone-500">SSL 256-Bit TLS v1.3</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
