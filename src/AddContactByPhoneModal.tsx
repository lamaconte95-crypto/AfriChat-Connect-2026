import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, UserPlus, X, Check, Search, Loader2 } from 'lucide-react';

interface AddContactByPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (phoneNumber: string) => Promise<boolean>;
}

export const AddContactByPhoneModal: React.FC<AddContactByPhoneModalProps> = ({
  isOpen,
  onClose,
  onAddContact,
}) => {
  const [countryCode, setCountryCode] = useState('+351'); // Par défaut Portugal (+351)
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    const fullPhoneNumber = `${countryCode}${phone.replace(/\s+/g, '')}`;
    setLoading(true);
    setError(null);

    try {
      const added = await onAddContact(fullPhoneNumber);
      if (added) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setPhone('');
          onClose();
        }, 1500);
      } else {
        setError("Aucun utilisateur trouvé avec ce numéro.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout du contact.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 text-stone-100 relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">Ajouter par téléphone</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Numéro de téléphone
                </label>
                <div className="flex space-x-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-xs text-stone-200 focus:outline-none focus:border-amber-400 font-mono"
                  >
                    <option value="+351">🇵🇹 +351</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+224">🇬🇳 +224</option>
                    <option value="+225">🇨🇮 +225</option>
                    <option value="+221">🇸🇳 +221</option>
                    <option value="+1">🇺🇸 +1</option>
                  </select>

                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="920 414 660"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 p-2.5 rounded-xl">
                  {error}
                </p>
              )}

              {success && (
                <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl">
                  <Check className="w-4 h-4" />
                  <span>Contact ajouté avec succès !</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-2xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-2xl transition-all shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Rechercher & Ajouter</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
