import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  Phone, 
  Mail, 
  Globe, 
  Edit3, 
  Save, 
  Check, 
  MapPin, 
  Clock, 
  Sparkles, 
  MessageCircle, 
  ExternalLink,
  Crown,
  Building,
  UserCheck,
  Share2,
  Youtube,
  Facebook,
  Video
} from 'lucide-react';
import { FounderInfo, User } from '../types';
import { openSocialDeepLink, OFFICIAL_SOCIAL_LINKS } from '../utils/socialDeepLinks';
import { UserAvatar } from './UserAvatar';

interface FounderModalProps {
  isOpen: boolean;
  onClose: () => void;
  founderInfo: FounderInfo;
  currentUser: User;
  onUpdateFounderInfo: (updated: FounderInfo) => void;
  onTriggerToast?: (msg: string, type?: 'success' | 'danger' | 'info') => void;
  onOpenAiAssistant?: () => void;
  onOpenApiConfig?: () => void;
  onOpenAdminAiRelease?: () => void;
}

export const FounderModal: React.FC<FounderModalProps> = ({
  isOpen,
  onClose,
  founderInfo,
  currentUser,
  onUpdateFounderInfo,
  onTriggerToast,
  onOpenAiAssistant,
  onOpenApiConfig,
  onOpenAdminAiRelease,
}) => {
  const isAdmin = currentUser.role === 'admin' || currentUser.isGlobalAdmin || currentUser.isSuperAdmin || currentUser.id === 'user_1';
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FounderInfo>(founderInfo);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFounderInfo(formData);
    setIsEditing(false);
    if (onTriggerToast) {
      onTriggerToast('Coordonnées du Fondateur mises à jour avec succès !', 'success');
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="founder-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl text-stone-100 flex flex-col my-4 max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white flex items-center space-x-1.5">
                  <span>Coordonnées Officielles du Fondateur</span>
                  <span className="text-xs text-amber-400">👑</span>
                </h3>
                <p className="text-[11px] text-stone-400">Direction & Support Officiel AfriChat Connect</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {isAdmin && !isEditing && (
                <button
                  id="edit-founder-info-btn"
                  onClick={() => setIsEditing(true)}
                  className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {isEditing ? (
              /* Admin Edit Form */
              <form onSubmit={handleSave} className="space-y-4">
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Vous êtes en mode édition administrateur de la fiche officielle.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">Nom Complet</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">Rôle & Titre</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">Email de Contact</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">WhatsApp Support</label>
                    <input
                      type="text"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">Numéro Téléphone</label>
                    <input
                      type="text"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">Localisation & Drapeau</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">Biographie du Fondateur</label>
                  <textarea
                    rows={2}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">Vision & Mission</label>
                  <textarea
                    rows={2}
                    value={formData.missionStatement}
                    onChange={(e) => setFormData({ ...formData, missionStatement: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les Modifications</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(founderInfo);
                      setIsEditing(false);
                    }}
                    className="px-4 py-3 rounded-2xl bg-stone-800 text-stone-300 hover:text-white font-bold text-xs cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              /* Public Display Card */
              <div className="space-y-4">
                {/* Profile Card */}
                <div className="p-4 rounded-3xl bg-stone-950/80 border border-stone-800 flex items-start space-x-4">
                  <UserAvatar
                    name={founderInfo.name}
                    avatar={founderInfo.avatar}
                    flag={founderInfo.countryFlag}
                    size="xl"
                    className="w-16 h-16 rounded-2xl border-2 border-amber-500 shadow-xl shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-black text-base text-white truncate">{founderInfo.name}</h4>
                      <span>{founderInfo.countryFlag}</span>
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    </div>
                    <p className="text-xs font-bold text-amber-400">{founderInfo.role}</p>
                    <div className="flex items-center space-x-1 text-[11px] text-stone-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{founderInfo.location}</span>
                    </div>
                  </div>
                </div>

                {/* Bio & Mission */}
                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800/80 space-y-2">
                  <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                    À Propos & Vision
                  </h5>
                  <p className="text-xs text-stone-300 leading-relaxed">{founderInfo.bio}</p>
                  <p className="text-xs text-stone-400 italic pt-1 border-t border-stone-800">
                    "{founderInfo.missionStatement}"
                  </p>
                </div>

                {/* Direct Contacts Grid */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-black text-stone-300 uppercase tracking-wider">
                    Canaux de Communication Directs
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/${founderInfo.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block font-medium">WhatsApp Support</span>
                          <span className="text-xs font-bold text-emerald-300">{founderInfo.whatsappNumber}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-emerald-400" />
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:${founderInfo.email}`}
                      className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800 hover:border-amber-500/40 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block font-medium">Email Officiel</span>
                          <span className="text-xs font-bold text-stone-200 truncate max-w-[120px] block">{founderInfo.email}</span>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400" />
                    </a>
                  </div>
                </div>

                {/* Support Hours */}
                <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{founderInfo.supportHours}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">Réponse sous 24h</span>
                </div>

                {/* Social Networks & Deep Links (Facebook, TikTok, YouTube) */}
                <div className="p-4 rounded-2xl bg-stone-950/90 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Réseaux Sociaux & Abonnement 1-Clic</span>
                    </h5>
                    <span className="text-[10px] text-stone-400 font-mono">App Mobile & Deep Links</span>
                  </div>

                  <p className="text-xs text-stone-400">
                    Rejoignez les chaînes officielles pour suivre l'actualité d'AfriChat Connect et débloquer les lives exclusifs.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {/* Facebook Button */}
                    <button
                      type="button"
                      onClick={() => openSocialDeepLink('facebook')}
                      className="p-2.5 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-[#1877F2] hover:text-white transition-all flex flex-col items-center justify-center text-center space-y-1 cursor-pointer group shadow"
                      title="Ouvrir l'application Facebook et suivre la page officielle"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shadow">
                        <Facebook className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-white">Facebook</span>
                      <span className="text-[10px] text-[#1877F2] group-hover:text-blue-300 font-bold">Suivre 1-Clic →</span>
                    </button>

                    {/* TikTok Button */}
                    <button
                      type="button"
                      onClick={() => openSocialDeepLink('tiktok')}
                      className="p-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-800 border border-cyan-500/40 text-cyan-400 hover:text-white transition-all flex flex-col items-center justify-center text-center space-y-1 cursor-pointer group shadow"
                      title="Ouvrir l'application TikTok et s'abonner au compte officiel"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-cyan-400 text-black flex items-center justify-center font-black text-xs shadow">
                        <Video className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-black text-white">TikTok</span>
                      <span className="text-[10px] text-cyan-400 group-hover:text-cyan-300 font-bold">S'abonner →</span>
                    </button>

                    {/* YouTube Button */}
                    <button
                      type="button"
                      onClick={() => openSocialDeepLink('youtube')}
                      className="p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/40 text-rose-400 hover:text-white transition-all flex flex-col items-center justify-center text-center space-y-1 cursor-pointer group shadow"
                      title="Ouvrir l'application YouTube et s'abonner en 1 clic"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow">
                        <Youtube className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-white">YouTube</span>
                      <span className="text-[10px] text-rose-400 group-hover:text-rose-300 font-bold">S'abonner 1-Clic →</span>
                    </button>
                  </div>
                </div>

                {/* Intelligent Tools & Gateways Quick Actions */}
                <div className="pt-2 border-t border-stone-800 space-y-2">
                  <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                    Outils Intelligents & Infrastructure
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {onOpenAiAssistant && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenAiAssistant();
                        }}
                        className="p-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Assistant IA</span>
                      </button>
                    )}
                    {isAdmin && onOpenAdminAiRelease && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenAdminAiRelease();
                        }}
                        className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>IA Release</span>
                      </button>
                    )}
                    {isAdmin && onOpenApiConfig && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenApiConfig();
                        }}
                        className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                      >
                        <span>🔑 Clés API</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
