import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Send, 
  Lock, 
  Info,
  Shield,
  Database,
  Users
} from 'lucide-react';
import { Contact, ReportTicket, User } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetContact: Contact | null;
  currentUser?: User;
  onConfirmReport: (ticket: ReportTicket, shouldBlock: boolean) => void;
}

const REPORT_REASONS = [
  {
    id: 'scam_momo',
    label: 'Tentative d’arnaque ou fraude Mobile Money',
    desc: 'Demande suspecte de code secret, faux transfert ou chantage financier.',
    icon: '💸',
  },
  {
    id: 'harassment',
    label: 'Harcèlement, menaces ou insultes',
    desc: 'Messages agressifs, propos haineux ou intimidation répétée.',
    icon: '🤬',
  },
  {
    id: 'inappropriate',
    label: 'Contenu inapproprié ou non sollicité',
    desc: 'Photos ou vidéos choquantes, nudité ou contenu explicite.',
    icon: '🔞',
  },
  {
    id: 'spam_fake',
    label: 'Spam, liens suspects ou faux profil',
    desc: 'Publicités abusives, usurpation d’identité ou faux compte robot.',
    icon: '📢',
  },
  {
    id: 'other',
    label: 'Autre motif de sécurité',
    desc: 'Tout autre comportement enfreignant les règles de la communauté.',
    icon: '⚠️',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetContact,
  currentUser,
  onConfirmReport,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('scam_momo');
  const [details, setDetails] = useState<string>('');
  const [alsoBlock, setAlsoBlock] = useState<boolean>(true);
  const [submittedTicket, setSubmittedTicket] = useState<ReportTicket | null>(null);

  if (!isOpen || !targetContact) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const reasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);
    const ticketId = `AFR-SEC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket: ReportTicket = {
      id: ticketId,
      reporterId: currentUser?.id || 'user_anonymous',
      reporterName: currentUser?.name || 'Membre AfriChat',
      targetId: targetContact.userId || targetContact.id,
      targetName: targetContact.name,
      reason: reasonObj?.label || 'Signalement de sécurité',
      details: details.trim() || 'Aucun détail supplémentaire fourni.',
      timestamp: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'received',
    };

    setSubmittedTicket(newTicket);
    onConfirmReport(newTicket, alsoBlock);
  };

  const handleCloseAll = () => {
    setSubmittedTicket(null);
    setDetails('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        id="report-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden text-stone-100 my-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-950/70">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white flex items-center space-x-1.5">
                  <span>Signaler un Utilisateur</span>
                  <span className="text-xs text-rose-400 font-normal">🛡️ Supabase Modération</span>
                </h3>
                <p className="text-xs text-stone-400">
                  Signalement confidentiel de <span className="text-amber-400 font-bold">{targetContact.name}</span>
                </p>
              </div>
            </div>

            <button
              id="report-modal-close-btn"
              onClick={handleCloseAll}
              className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {submittedTicket ? (
              /* Success Confirmation Screen */
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-black text-lg text-white">Signalement Enregistré dans Supabase !</h4>
                  <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
                    Le motif a été consigné dans la base de sécurité Supabase. Si ce compte atteint 3 signalements de membres distincts, il sera automatiquement suspendu et masqué.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Numéro de ticket :</span>
                    <span className="text-amber-400 font-mono font-bold">{submittedTicket.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Utilisateur concerné :</span>
                    <span className="text-stone-200 font-bold">{submittedTicket.targetName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Motif enregistré :</span>
                    <span className="text-stone-200">{submittedTicket.reason}</span>
                  </div>
                  {alsoBlock && (
                    <div className="pt-2 border-t border-stone-800/80 flex items-center space-x-1.5 text-rose-300 font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Ce contact est maintenant masqué et bloqué sur votre compte.</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    id="report-success-close-btn"
                    onClick={handleCloseAll}
                    className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs cursor-pointer transition-all"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              /* Report Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Contact Preview Bar */}
                <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 flex items-center space-x-3">
                  <img
                    src={targetContact.avatar}
                    alt={targetContact.name}
                    className="w-11 h-11 rounded-xl object-cover border border-stone-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold text-xs text-white truncate">{targetContact.name}</h4>
                      <span>{targetContact.flag}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-mono">{targetContact.username}</p>
                  </div>
                </div>

                {/* Auto-Moderation Alert Banner */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-2.5 text-xs text-amber-200">
                  <Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-300">Règle de blocage automatique (3 membres) :</span>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">
                      Chaque signalement est horodaté et enregistré dans Supabase. Dès qu'un compte cumule <strong>3 signalements de membres distincts</strong>, son compte et ses accès sont automatiquement verrouillés pour tous.
                    </p>
                  </div>
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-2">
                    Sélectionnez le motif du signalement (enregistré dans Supabase) *
                  </label>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((r) => {
                      const isChecked = selectedReason === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedReason(r.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                            isChecked
                              ? 'bg-rose-500/10 border-rose-500/60 ring-1 ring-rose-500/40 text-stone-100'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-300'
                          }`}
                        >
                          <span className="text-lg leading-none mt-0.5">{r.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs text-white">{r.label}</h5>
                            <p className="text-[11px] text-stone-400 leading-snug mt-0.5">{r.desc}</p>
                          </div>
                          <input
                            type="radio"
                            name="report_reason"
                            checked={isChecked}
                            onChange={() => setSelectedReason(r.id)}
                            className="mt-1 accent-rose-500 cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Précisions & Détails complémentaires
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Détaillez la raison du signalement pour les modérateurs..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                {/* Also block toggle */}
                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="text-xs font-bold text-stone-200">Bloquer également cet utilisateur</div>
                      <div className="text-[10px] text-stone-400">Masque instantanément ses messages et publications pour vous</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alsoBlock}
                    onChange={(e) => setAlsoBlock(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                </div>

                {/* Security Note */}
                <div className="flex items-start space-x-2 text-[11px] text-stone-400 bg-stone-950/40 p-2.5 rounded-xl border border-stone-800/80">
                  <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Synchronisation sécurisée avec la table Supabase <code>reports</code> sous chiffrement SSL.
                  </span>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCloseAll}
                    className="py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    id="submit-report-confirm-btn"
                    type="submit"
                    className="py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Signaler & Enregistrer</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
