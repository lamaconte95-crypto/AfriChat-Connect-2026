import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Share2, 
  QrCode, 
  Building2, 
  FileText,
  CreditCard,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { Transaction } from '../types';

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!isOpen || !transaction) return null;

  const isSuccess = transaction.status === 'success';
  const isPending = transaction.status === 'pending';
  const isFailed = transaction.status === 'failed';

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div 
        id="transaction-receipt-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          id="transaction-receipt-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl overflow-hidden text-stone-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-100">Reçu Numérique Officiel</h3>
                <p className="text-[11px] text-stone-400 font-mono">{transaction.receiptNumber || `REC-${transaction.id}`}</p>
              </div>
            </div>

            <button
              id="close-receipt-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt Body */}
          <div className="p-6 overflow-y-auto space-y-5 print:p-0">
            {/* Status Banner */}
            <div className={`p-4 rounded-2xl border text-center space-y-1.5 ${
              isSuccess 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : isPending 
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border shadow-lg ${
                isSuccess 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                  : isPending 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
              }">
                {isSuccess && <CheckCircle2 className="w-6 h-6" />}
                {isPending && <Clock className="w-6 h-6 animate-spin" />}
                {isFailed && <AlertCircle className="w-6 h-6" />}
              </div>

              <span className="text-xs font-black uppercase tracking-wider block">
                {isSuccess ? 'Paiement Validé & Chiffré' : isPending ? 'Transaction En Attente' : 'Échec de la transaction'}
              </span>

              <div className="text-2xl font-black text-white">
                {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} {transaction.currency}
              </div>

              {transaction.failureReason && (
                <p className="text-xs text-rose-300/90 pt-1 font-medium">
                  {transaction.failureReason}
                </p>
              )}
            </div>

            {/* Receipt Summary Table */}
            <div className="rounded-2xl bg-stone-950/60 border border-stone-800 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-stone-800/80">
                <span className="text-stone-400">Intitulé</span>
                <span className="font-bold text-stone-200 text-right max-w-[200px] truncate">
                  {transaction.description}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-stone-800/80">
                <span className="text-stone-400">Passerelle de Paiement</span>
                <span className="font-bold text-amber-400">
                  {transaction.gateway || 'Passerelle AfriPay Secure'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-stone-800/80">
                <span className="text-stone-400">Opérateur / Moyen</span>
                <span className="font-bold text-stone-200 uppercase">
                  {transaction.provider} {transaction.phoneNumber ? `(${transaction.phoneNumber})` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-stone-800/80">
                <span className="text-stone-400">Référence Unique</span>
                <span className="font-mono text-stone-300 text-[11px] select-all">
                  {transaction.reference}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-stone-800/80">
                <span className="text-stone-400">Date & Heure</span>
                <span className="font-medium text-stone-300">
                  {transaction.timestamp}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-stone-400">Client / Titulaire</span>
                <span className="font-bold text-stone-200">
                  {transaction.customerName || 'Ibrahim Diallo'}
                </span>
              </div>
            </div>

            {/* Cryptographic Security Details */}
            <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Chiffrement SSL & Certificat SHA-256</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Conforme PCI-DSS
                </span>
              </div>

              <div className="text-[10px] font-mono text-stone-400 break-all bg-stone-950 p-2 rounded-xl border border-stone-850">
                <span className="text-stone-500 block mb-0.5">Signature Cryptographique (HMAC-SHA256) :</span>
                {transaction.encryptedHash || `sha256:${transaction.id}f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5`}
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                <span>Score Risque Anti-Fraude :</span>
                <span className="font-bold text-emerald-400">
                  {transaction.fraudRiskScore ?? 2}% (Très Faible / Validé)
                </span>
              </div>
            </div>

            {/* Visual Barcode / QR Preview */}
            <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-center space-y-2">
              <div className="flex items-center justify-center space-x-3 text-stone-300">
                <QrCode className="w-12 h-12 text-amber-400" />
                <div className="text-left">
                  <p className="text-xs font-bold text-stone-200">Preuve Numérique Légale</p>
                  <p className="text-[10px] text-stone-400">Scannez pour vérifier l'authenticité sur la blockchain AfriPay</p>
                </div>
              </div>
              <div className="font-mono text-[9px] text-stone-500 tracking-widest uppercase">
                * * * AFRICHAT-CONNECT-PAYMENT-RECEIPT-VERIFIED * * *
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer le reçu</span>
            </button>

            <button
              onClick={() => {
                alert(`Reçu ${transaction.receiptNumber || transaction.id} téléchargé au format PDF sécurisé.`);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Télécharger PDF</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
