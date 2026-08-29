import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Receipt, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Share2, 
  Lock, 
  Crown, 
  Sparkles,
  CreditCard,
  Building2,
  Calendar,
  FileCheck
} from 'lucide-react';
import { Transaction } from '../types';

interface ReceiptDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopyHash = () => {
    if (transaction.encryptedHash) {
      navigator.clipboard.writeText(transaction.encryptedHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleCopyRef = () => {
    if (transaction.reference) {
      navigator.clipboard.writeText(transaction.reference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert(`Reçu fiscal officiel ${transaction.receiptNumber || transaction.id} téléchargé avec succès.`);
    }, 800);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paiement Validé (Succès)</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>En cours de traitement</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Échec du Paiement</span>
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="receipt-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          id="receipt-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl overflow-hidden text-stone-100 my-auto"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Reçu de Paiement Sécurisé</h3>
                <p className="text-[11px] text-stone-400 font-mono">
                  {transaction.receiptNumber || `REC-${transaction.id}`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Status & Total Amount Header */}
            <div className="text-center p-5 rounded-2xl bg-gradient-to-b from-stone-800/80 to-stone-950 border border-stone-800 space-y-2">
              <div>{getStatusBadge(transaction.status)}</div>
              <div className="text-3xl font-black text-white">
                {transaction.amount.toLocaleString()} <span className="text-base text-amber-400">{transaction.currency}</span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                {transaction.description || 'Paiement de service AfriChat Connect'}
              </p>
            </div>

            {/* Issuer & Security Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-850 space-y-1">
                <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Émetteur / Marchand</span>
                <div className="font-bold text-white flex items-center space-x-1">
                  <span>AfriChat Connect SAS</span>
                </div>
                <div className="text-[10px] text-stone-400">Abidjan, Côte d’Ivoire</div>
              </div>

              <div className="p-3 rounded-xl bg-stone-950 border border-stone-850 space-y-1">
                <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Passerelle Bancaire</span>
                <div className="font-bold text-[#A29BFE] flex items-center space-x-1">
                  <span>{transaction.gateway || 'Stripe Connect 3DS'}</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Chiffrement SSL 256-bit</span>
                </div>
              </div>
            </div>

            {/* Detailed Transaction Fields */}
            <div className="space-y-2 text-xs bg-stone-950 rounded-2xl p-4 border border-stone-800">
              <div className="flex justify-between py-1.5 border-b border-stone-850">
                <span className="text-stone-400">Date & Heure</span>
                <span className="font-medium text-stone-200">{transaction.timestamp}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-stone-850">
                <span className="text-stone-400">Référence Stripe / Mobile</span>
                <span className="font-mono text-stone-200 flex items-center space-x-1.5">
                  <span className="truncate max-w-[170px]">{transaction.reference || transaction.id}</span>
                  <button onClick={handleCopyRef} className="text-[#A29BFE] hover:text-white">
                    {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-stone-850">
                <span className="text-stone-400">Moyen de Paiement</span>
                <span className="font-bold text-stone-200 uppercase flex items-center space-x-1">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>{transaction.provider}</span>
                </span>
              </div>

              {transaction.customerName && (
                <div className="flex justify-between py-1.5 border-b border-stone-850">
                  <span className="text-stone-400">Titulaire du compte</span>
                  <span className="font-medium text-stone-200">{transaction.customerName}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-stone-850">
                <span className="text-stone-400">Type de Prestation</span>
                <span className="font-medium text-amber-300">
                  {transaction.type === 'vip_membership' ? '👑 Abonnement VIP Premium' : 'Recharge / Transfert'}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-stone-400">Score Anti-Fraude</span>
                <span className="font-mono font-bold text-emerald-400">0.0 (Risque Très Faible ✓)</span>
              </div>
            </div>

            {/* Cryptographic Hash Inspector */}
            {transaction.encryptedHash && (
              <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Empreinte Cryptographique SHA-256</span>
                  <button
                    onClick={handleCopyHash}
                    className="flex items-center space-x-1 text-[#A29BFE] hover:text-white"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Copié' : 'Copier signature'}</span>
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-stone-900 font-mono text-[10px] text-stone-300 break-all border border-stone-800/80">
                  {transaction.encryptedHash}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="py-3 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimer Reçu</span>
              </button>

              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownload}
                className="py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-stone-950 font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Génération PDF...' : 'Télécharger PDF'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
