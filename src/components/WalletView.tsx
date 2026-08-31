import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  Smartphone, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Crown,
  CreditCard,
  History,
  TrendingUp,
  AlertCircle,
  FileText,
  Lock,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { User, Transaction, PaymentProvider } from '../types';
import { MOBILE_MONEY_OPERATORS, COUNTRIES, STRIPE_PUBLIC_KEY } from '../data/mockData';

interface WalletViewProps {
  currentUser: User;
  transactions: Transaction[];
  onGoBack?: () => void;
  onOpenDeposit: () => void;
  onOpenPayout: (amount: number, provider: PaymentProvider, phone: string) => void;
  onOpenStripePayment?: (planId?: string) => void;
  onOpenFlutterwaveVip?: (planId?: string) => void;
  onOpenReceipt?: (transaction: Transaction) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  currentUser,
  transactions,
  onGoBack,
  onOpenDeposit,
  onOpenPayout,
  onOpenStripePayment,
  onOpenFlutterwaveVip,
  onOpenReceipt,
}) => {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('10000');
  const [payoutProvider, setPayoutProvider] = useState<PaymentProvider>('orange');
  const [payoutPhone, setPayoutPhone] = useState('07 89 45 12');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [filterType, setFilterType] = useState<'all' | 'earnings' | 'payouts'>('all');

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'earnings') return t.type === 'tip' || t.amount > 0;
    if (filterType === 'payouts') return t.type === 'payout';
    return true;
  });

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    if (amt > 0 && amt <= currentUser.walletBalance) {
      onOpenPayout(amt, payoutProvider, `${selectedCountry.prefix} ${payoutPhone}`);
      setShowPayoutModal(false);
    }
  };

  return (
    <div id="wallet-view-container" className="max-w-2xl mx-auto space-y-5 pb-24 text-stone-100 px-3 sm:px-0">
      {/* Top Universal Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          id="wallet-back-btn"
          type="button"
          onClick={() => {
            if (onGoBack) onGoBack();
          }}
          className="px-3.5 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-800 transition-all flex items-center space-x-2 text-xs font-bold shadow-md cursor-pointer group"
          title="Retour à la vue précédente"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Retour</span>
        </button>

        <span className="text-xs font-bold text-stone-400">
          AfriChat Pay & Mobile Money
        </span>
      </div>

      {/* Wallet Balance Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border border-amber-500/40 shadow-2xl overflow-hidden"
      >
        {/* Glowing background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider">
                  Portefeuille AfriChat Pay
                </span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-white">{currentUser.name}</span>
                  <span>{currentUser.flag}</span>
                  {currentUser.isVIP && (
                    <span className="px-2 py-0.2 rounded-full bg-amber-500 text-stone-950 font-black text-[10px]">
                      VIP Gold
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-black flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mobile & Stripe 3DS</span>
            </span>
          </div>

          {/* Balance Numbers */}
          <div>
            <span className="text-xs text-stone-400 font-medium">Solde Total Disponible</span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {currentUser.walletBalance.toLocaleString()}
              </h1>
              <span className="text-lg sm:text-xl font-bold text-amber-400">
                {currentUser.currency}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              ≈ {(currentUser.walletBalance / 655.957).toFixed(2)} EUR • {(currentUser.walletBalance / 600).toFixed(2)} USD
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              id="wallet-deposit-btn"
              onClick={onOpenDeposit}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 cursor-pointer hover:scale-102 active:scale-98 transition-all"
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
              <span>Recharger Compte</span>
            </button>

            <button
              id="wallet-payout-btn"
              onClick={() => setShowPayoutModal(true)}
              className="py-3.5 px-4 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer hover:border-amber-500/40 transition-all"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>Retirer mes Gains</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* DUAL VIP SUBSCRIPTION BANNER (FLUTTERWAVE MOMO & STRIPE) */}
      <div className="rounded-3xl p-5 bg-gradient-to-r from-orange-500/20 via-stone-900 to-[#635BFF]/20 border border-orange-500/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FB702B] to-[#FF9F43] flex items-center justify-center text-white font-black text-xs shadow-md">
              VIP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black text-white">Abonnement VIP Or AfriChat</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  {currentUser.isVIP ? 'VIP Actif ⭐' : 'Dès 5,000 FCFA'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                Paiement direct Mobile Money (Flutterwave Sandbox) ou Carte Bancaire (Stripe)
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed">
          Supprimez 100% des publicités, activez le badge vérifié Gold, profitez des salons et lives créateurs en qualité HD et des transferts rapides.
        </p>

        {/* Dual Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Flutterwave Mobile Money VIP Button */}
          <button
            type="button"
            id="wallet-open-flutterwave-vip-btn"
            onClick={() => onOpenFlutterwaveVip && onOpenFlutterwaveVip('vip_quarterly')}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FB702B] via-[#F55E1D] to-[#E24A12] hover:brightness-110 active:scale-[0.99] text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>S’abonner VIP via Flutterwave Mobile Money ⚡️</span>
          </button>

          {/* Stripe Card Button */}
          <button
            type="button"
            id="wallet-open-stripe-vip-btn"
            onClick={() => onOpenStripePayment && onOpenStripePayment('vip_quarterly')}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#635BFF] to-[#8075FF] hover:brightness-110 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-[#635BFF]/30 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-stone-200" />
            <span>Payer par Carte Stripe (Pay / GPay)</span>
          </button>
        </div>
      </div>

      {/* Operators Banner */}
      <div className="rounded-2xl bg-stone-900/80 border border-stone-800 p-4 space-y-2.5">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
          Réseaux Mobile Money Partenaires
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {MOBILE_MONEY_OPERATORS.slice(0, 4).map((op, idx) => (
            <div key={`op-${op.id}_${idx}`} className="p-2.5 rounded-xl bg-stone-800/60 border border-stone-800 flex items-center space-x-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px]"
                style={{
                  backgroundColor: op.id === 'orange' ? '#FF7900' : op.id === 'wave' ? '#1EA0E6' : op.id === 'mtn' ? '#FFCC00' : '#005BAA',
                  color: op.id === 'mtn' ? '#000000' : '#FFFFFF'
                }}
              >
                {op.logoText}
              </div>
              <div className="truncate">
                <p className="font-bold text-stone-200 truncate">{op.name.split(' ')[0]}</p>
                <p className="text-[10px] text-emerald-400">100% Opérationnel</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions History Header & Filters */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-stone-100 flex items-center space-x-2">
            <History className="w-4 h-4 text-amber-400" />
            <span>Historique des Transactions</span>
          </h3>

          <div className="flex items-center space-x-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterType('earnings')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterType === 'earnings' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
              }`}
            >
              Gains
            </button>
            <button
              onClick={() => setFilterType('payouts')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterType === 'payouts' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
              }`}
            >
              Retraits
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          {filteredTransactions.map((tx, idx) => {
            const isNegative = tx.type === 'payout';

            return (
              <div
                key={`tx-${tx.id || idx}_${idx}`}
                id={`transaction-card-${tx.id}`}
                onClick={() => onOpenReceipt && onOpenReceipt(tx)}
                className="p-4 rounded-2xl bg-stone-900 border border-stone-800/80 flex items-center justify-between hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.gateway === 'Stripe' || tx.provider === 'stripe' || tx.provider === 'card' || tx.provider === 'apple_pay' || tx.provider === 'google_pay'
                      ? 'bg-[#635BFF]/20 text-[#A29BFE]'
                      : isNegative 
                      ? 'bg-rose-500/20 text-rose-400' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {tx.gateway === 'Stripe' || tx.type === 'vip_membership' ? (
                      <Crown className="w-5 h-5 text-amber-400" />
                    ) : isNegative ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <Coins className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-100 group-hover:text-amber-400 transition-colors">
                      {tx.description}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-stone-400 mt-0.5">
                      <span className="font-mono">{tx.receiptNumber || tx.reference}</span>
                      <span>•</span>
                      <span>{tx.timestamp}</span>
                      {tx.sslSecured && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 flex items-center space-x-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>SSL</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-black text-sm sm:text-base ${
                    isNegative ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {isNegative ? '-' : '+'}{Math.abs(tx.amount).toLocaleString()} {tx.currency}
                  </div>
                  <div className="flex items-center justify-end space-x-1 mt-0.5">
                    <span className="text-[10px] uppercase font-bold text-amber-400/90">
                      {tx.gateway || tx.provider}
                    </span>
                    <FileText className="w-3 h-3 text-stone-500 group-hover:text-amber-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payout Cashout Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-stone-900 border border-amber-500/40 rounded-3xl p-6 space-y-5 text-stone-100 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center space-x-2">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base">Retrait de gains Mobile Money</h3>
                </div>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="text-stone-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePayoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Montant à retirer (FCFA)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    max={currentUser.walletBalance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-800 border border-stone-700 text-stone-100 text-sm font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Réseau de retrait</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MOBILE_MONEY_OPERATORS.map((op, idx) => (
                      <button
                        type="button"
                        key={`modal-op-${op.id}_${idx}`}
                        onClick={() => setPayoutProvider(op.id)}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
                          payoutProvider === op.id
                            ? 'border-amber-500 bg-amber-500/20 text-white'
                            : 'border-stone-800 bg-stone-800/60 text-stone-400'
                        }`}
                      >
                        <span>{op.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">Numéro bénéficiaire</label>
                  <input
                    type="tel"
                    required
                    value={payoutPhone}
                    onChange={(e) => setPayoutPhone(e.target.value)}
                    placeholder="07 00 00 00"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-sm shadow-lg shadow-orange-500/20 hover:scale-101 active:scale-99 transition-all cursor-pointer"
                >
                  Confirmer le Retrait Immédiat
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
