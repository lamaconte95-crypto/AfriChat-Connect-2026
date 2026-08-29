import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Crown, 
  UserPlus, 
  UserMinus, 
  Sliders, 
  Activity, 
  AlertTriangle, 
  Lock, 
  Check, 
  Sparkles, 
  Users, 
  DollarSign, 
  Zap, 
  Search, 
  Key, 
  RefreshCw, 
  Eye, 
  Smartphone,
  CheckCircle,
  Radio,
  FileText
} from 'lucide-react';
import { 
  User, 
  Contact, 
  GlobalAdminUser, 
  GlobalAdminRole, 
  AdminAuditLog, 
  SystemSettings 
} from '../types';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  contacts: Contact[];
  globalAdmins: GlobalAdminUser[];
  onUpdateGlobalAdmins: (admins: GlobalAdminUser[]) => void;
  auditLogs: AdminAuditLog[];
  onAddAuditLog: (log: AdminAuditLog) => void;
  systemSettings: SystemSettings;
  onUpdateSystemSettings: (settings: SystemSettings) => void;
  onOpenApiConfig?: () => void;
  onOpenAdminAiRelease?: () => void;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  contacts,
  globalAdmins,
  onUpdateGlobalAdmins,
  auditLogs,
  onAddAuditLog,
  systemSettings,
  onUpdateSystemSettings,
  onOpenApiConfig,
  onOpenAdminAiRelease,
}) => {
  const [activeTab, setActiveTab] = useState<'admins' | 'system' | 'audit' | 'roles_info'>('admins');
  const [searchAdminQuery, setSearchAdminQuery] = useState('');
  const [isNominateSubModalOpen, setIsNominateSubModalOpen] = useState(false);
  const [selectedCandidateUserId, setSelectedCandidateUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<GlobalAdminRole>('global_moderator');
  const [customAdminNotes, setCustomAdminNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter global admins
  const filteredAdmins = globalAdmins.filter((adm) => {
    if (!searchAdminQuery) return true;
    const q = searchAdminQuery.toLowerCase();
    return (
      adm.name.toLowerCase().includes(q) ||
      adm.username.toLowerCase().includes(q) ||
      adm.role.toLowerCase().includes(q)
    );
  });

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditSeverityFilter === 'all') return true;
    return log.severity === auditSeverityFilter;
  });

  // Available candidates from contacts who are not already global admins
  const existingAdminUserIds = new Set(globalAdmins.map((a) => a.userId));
  const availableCandidates = contacts.filter((c) => !existingAdminUserIds.has(c.userId));

  // Handle adding a new global admin
  const handleNominateGlobalAdmin = () => {
    if (!selectedCandidateUserId) return;
    const candidate = contacts.find((c) => c.userId === selectedCandidateUserId);
    if (!candidate) return;

    const newAdmin: GlobalAdminUser = {
      id: `gadmin_${Date.now()}`,
      userId: candidate.userId,
      name: candidate.name,
      username: candidate.username,
      avatar: candidate.avatar,
      flag: candidate.flag,
      role: selectedRole,
      assignedAt: 'À l’instant',
      assignedBy: currentUser.name,
      status: 'active',
      permissions: getPermissionsForRole(selectedRole),
    };

    const updated = [...globalAdmins, newAdmin];
    onUpdateGlobalAdmins(updated);

    // Record audit log
    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: `${currentUser.name} (Super Admin)`,
      action: 'Nomination Administrateur Général',
      target: `${candidate.name} (${candidate.username}) ➔ ${getRoleLabel(selectedRole)}`,
      timestamp: 'À l’instant',
      severity: 'info',
    });

    showToast(`👑 ${candidate.name} a été nommé ${getRoleLabel(selectedRole)} avec succès !`);
    setIsNominateSubModalOpen(false);
    setSelectedCandidateUserId(null);
  };

  // Handle revoking / removing a global admin
  const handleRevokeGlobalAdmin = (adminId: string) => {
    const target = globalAdmins.find((a) => a.id === adminId);
    if (target?.userId === currentUser.id) {
      showToast('Action impossible : Vous ne pouvez pas révoquer votre propre statut Super Admin.');
      return;
    }

    const updated = globalAdmins.filter((a) => a.id !== adminId);
    onUpdateGlobalAdmins(updated);

    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: `${currentUser.name} (Super Admin)`,
      action: 'Révocation Administrateur Général',
      target: `${target?.name || 'Admin'} (${target?.username}) a perdu ses privilèges globaux.`,
      timestamp: 'À l’instant',
      severity: 'warning',
    });

    showToast(`Privilèges d'administration révoqués pour ${target?.name}.`);
  };

  // Handle toggling status (active/suspended)
  const handleToggleAdminStatus = (adminId: string) => {
    const target = globalAdmins.find((a) => a.id === adminId);
    if (target?.userId === currentUser.id) {
      showToast('Impossible de suspendre le Super Admin principal.');
      return;
    }

    const updated = globalAdmins.map((a) => {
      if (a.id === adminId) {
        const nextStatus = a.status === 'active' ? ('suspended' as const) : ('active' as const);
        return { ...a, status: nextStatus };
      }
      return a;
    });

    onUpdateGlobalAdmins(updated);
    showToast(`Statut de ${target?.name} mis à jour.`);
  };

  // Handle toggling system settings
  const handleToggleSystemSetting = (key: keyof SystemSettings) => {
    const nextVal = !systemSettings[key];
    const updated = {
      ...systemSettings,
      [key]: nextVal,
    };
    onUpdateSystemSettings(updated);

    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: `${currentUser.name} (Super Admin)`,
      action: 'Modification Paramètre Système',
      target: `${key} ➔ ${nextVal ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`,
      timestamp: 'À l’instant',
      severity: key === 'maintenanceMode' ? 'critical' : 'info',
    });

    showToast(`Paramètre système [${key}] : ${nextVal ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
  };

  function getRoleLabel(role: GlobalAdminRole): string {
    switch (role) {
      case 'super_admin': return 'Super Admin Racine';
      case 'security_auditor': return 'Auditeur Sécurité & KYC';
      case 'financial_officer': return 'Contrôleur Financier & MoMo';
      case 'global_moderator': return 'Modérateur Global';
      default: return 'Admin';
    }
  }

  function getPermissionsForRole(role: GlobalAdminRole): string[] {
    switch (role) {
      case 'super_admin':
        return ['all_permissions', 'manage_admins', 'system_config', 'financial_audit', 'global_moderation', 'ban_users'];
      case 'security_auditor':
        return ['security_audit', 'anti_spam_rules', 'ip_whitelist', 'kyc_verification'];
      case 'financial_officer':
        return ['financial_audit', 'payout_verification', 'dispute_resolution', 'revenue_reports'];
      case 'global_moderator':
        return ['global_moderation', 'content_take_down', 'ticket_escalation'];
    }
  }

  return (
    <AnimatePresence>
      <div 
        id="super-admin-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden text-stone-100 my-6 flex flex-col max-h-[92vh]"
        >
          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs shadow-2xl flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Super Admin Top Header */}
          <div className="p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-emerald-500 p-0.5 shadow-lg shadow-orange-500/20">
                <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                    Panneau Super Admin AfriChat
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    Accès Restreint
                  </span>
                </div>
                <p className="text-xs text-stone-400 flex items-center space-x-2 mt-0.5">
                  <span>Opérateur connecté : <strong className="text-amber-400">{currentUser.name}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono text-[11px]">Niveau 0 (Souverain)</span>
                </p>
              </div>
            </div>

            <button
              id="super-admin-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-stone-800 bg-stone-950/40 px-4 overflow-x-auto">
            <div className="flex items-center space-x-1 shrink-0">
              <button
                id="tab-global-admins"
                onClick={() => setActiveTab('admins')}
                className={`py-3 px-3 text-xs font-black flex items-center space-x-2 border-b-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'admins'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>Admins ({globalAdmins.length})</span>
              </button>

              <button
                id="tab-global-system"
                onClick={() => setActiveTab('system')}
                className={`py-3 px-3 text-xs font-black flex items-center space-x-2 border-b-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'system'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Paramètres & Sécurité</span>
              </button>

              <button
                id="tab-global-audit"
                onClick={() => setActiveTab('audit')}
                className={`py-3 px-3 text-xs font-black flex items-center space-x-2 border-b-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'audit'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Audit ({auditLogs.length})</span>
              </button>

              <button
                id="tab-global-roles-info"
                onClick={() => setActiveTab('roles_info')}
                className={`py-3 px-3 text-xs font-black flex items-center space-x-2 border-b-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === 'roles_info'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Privilèges</span>
              </button>
            </div>

            {/* Quick Modals Triggers */}
            <div className="flex items-center space-x-2 py-2 shrink-0">
              {onOpenAdminAiRelease && (
                <button
                  onClick={onOpenAdminAiRelease}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>IA Mises à Jour</span>
                </button>
              )}
              {onOpenApiConfig && (
                <button
                  onClick={onOpenApiConfig}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Clés API</span>
                </button>
              )}
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* TAB 1: GLOBAL ADMINISTRATORS MANAGEMENT */}
            {activeTab === 'admins' && (
              <div className="space-y-4">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      id="search-global-admins-input"
                      type="text"
                      placeholder="Rechercher par nom, rôle ou identifiant..."
                      value={searchAdminQuery}
                      onChange={(e) => setSearchAdminQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Nominate button */}
                  <button
                    id="btn-nominate-global-admin"
                    onClick={() => setIsNominateSubModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>Nommer un Administrateur Général</span>
                  </button>
                </div>

                {/* Sub-form: Nominate new admin */}
                <AnimatePresence>
                  {isNominateSubModalOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <h4 className="font-black text-xs text-amber-300 uppercase tracking-wide">
                            Attribution d'un Rôle Administratif Global
                          </h4>
                        </div>
                        <button
                          onClick={() => setIsNominateSubModalOpen(false)}
                          className="text-stone-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-stone-300">
                        Sélectionnez un profil pour lui confier la gestion d'une division opérationnelle d'AfriChat (Modération, Finance, Sécurité ou Super Admin).
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* User Candidate Selection */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-300 mb-1">
                            Utilisateur à nommer ({availableCandidates.length} éligibles) :
                          </label>
                          <select
                            id="select-global-candidate"
                            value={selectedCandidateUserId || ''}
                            onChange={(e) => setSelectedCandidateUserId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                          >
                            <option value="">-- Sélectionner un contact --</option>
                            {availableCandidates.map((c) => (
                              <option key={c.id} value={c.userId}>
                                {c.name} ({c.username}) {c.flag} - {c.country}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Role selection */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-300 mb-1">
                            Poste & Privilèges Système :
                          </label>
                          <select
                            id="select-global-role"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as GlobalAdminRole)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                          >
                            <option value="global_moderator">⚡ Modérateur Global (Signalements & Contenus)</option>
                            <option value="financial_officer">💰 Contrôleur Financier & MoMo (Audit retraits & flux)</option>
                            <option value="security_auditor">🛡️ Auditeur Sécurité & KYC (Anti-spam & bots)</option>
                            <option value="super_admin">👑 Super Admin Racine (Accès complet illimité)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsNominateSubModalOpen(false)}
                          className="px-3 py-1.5 rounded-xl bg-stone-800 text-stone-300 hover:text-white text-xs font-bold"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          id="btn-confirm-nominate-global-admin"
                          disabled={!selectedCandidateUserId}
                          onClick={handleNominateGlobalAdmin}
                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-black shadow transition-all cursor-pointer"
                        >
                          Confirmer la nomination 🛡️
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Admins Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 px-1">
                    <span>ADMINISTRATEURS EN EXERCICE</span>
                    <span>{filteredAdmins.length} enregistrés</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredAdmins.map((admin) => {
                      const isMe = admin.userId === currentUser.id;
                      const isSuper = admin.role === 'super_admin';

                      return (
                        <div
                          key={admin.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            admin.status === 'suspended'
                              ? 'bg-stone-900/60 border-rose-900/50 opacity-70'
                              : isSuper
                              ? 'bg-amber-500/5 border-amber-500/40 shadow-sm'
                              : 'bg-stone-800/40 border-stone-800'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="relative shrink-0">
                                <img
                                  src={admin.avatar}
                                  alt={admin.name}
                                  className="w-11 h-11 rounded-2xl object-cover border border-stone-700"
                                />
                                <span className="absolute -bottom-1 -right-1 text-sm">
                                  {admin.flag}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <h4 className="font-black text-xs text-white truncate">{admin.name}</h4>
                                  {isMe && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-stone-950">
                                      VOUS
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-stone-400 font-mono">{admin.username}</p>
                              </div>
                            </div>

                            {/* Status badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                admin.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {admin.status === 'active' ? 'ACTIF' : 'SUSPENDU'}
                            </span>
                          </div>

                          {/* Role Tag & Scope */}
                          <div className="mt-3 pt-3 border-t border-stone-800/70 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-amber-300 flex items-center space-x-1">
                                {isSuper && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                                {!isSuper && <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />}
                                <span>{getRoleLabel(admin.role)}</span>
                              </span>
                              <span className="text-[10px] text-stone-500">Depuis: {admin.assignedAt}</span>
                            </div>

                            <p className="text-[10px] text-stone-400">
                              Attribué par: <strong className="text-stone-300">{admin.assignedBy}</strong>
                            </p>

                            {/* Permissions chips */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {admin.permissions.slice(0, 3).map((p) => (
                                <span
                                  key={p}
                                  className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700/80 text-[9px] text-stone-300 font-mono"
                                >
                                  {p}
                                </span>
                              ))}
                              {admin.permissions.length > 3 && (
                                <span className="px-1.5 py-0.5 rounded bg-stone-900 text-[9px] text-stone-400">
                                  +{admin.permissions.length - 3} autres
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          {!isMe && (
                            <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-stone-800/50 text-xs">
                              <button
                                onClick={() => handleToggleAdminStatus(admin.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                  admin.status === 'active'
                                    ? 'bg-stone-800 text-stone-300 hover:text-amber-400'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {admin.status === 'active' ? 'Suspendre' : 'Réactiver'}
                              </button>

                              <button
                                onClick={() => handleRevokeGlobalAdmin(admin.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 text-[10px] font-bold border border-rose-800/40 transition-colors flex items-center space-x-1"
                              >
                                <UserMinus className="w-3 h-3" />
                                <span>Retirer</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SYSTEM CONFIGURATION & GLOBAL SAFETY */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-xs text-amber-300">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">Console de Pilotage Système Globale</h4>
                    <p className="text-stone-300 text-[11px] mt-0.5 leading-relaxed">
                      Les modifications apportées ici impactent instantanément l’ensemble des utilisateurs, canaux de discussion, passerelles Mobile Money et modules publicitaires de la plateforme AfriChat.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      key: 'maintenanceMode' as keyof SystemSettings,
                      title: 'Mode Maintenance d’Urgence',
                      desc: 'Verrouille l’application pour tous les utilisateurs non-administrateurs lors des mises à jour majeures.',
                      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
                      isDanger: true,
                    },
                    {
                      key: 'strictVipVerification' as keyof SystemSettings,
                      title: 'Vérification Renforcée des Salons VIP & MoMo',
                      desc: 'Oblige les créateurs de salons payants à valider leur identité (KYC) avant de recevoir des versements Mobile Money.',
                      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
                    },
                    {
                      key: 'globalAntiSpam' as keyof SystemSettings,
                      title: 'Bouclier Anti-Spam & Détection de Liens',
                      desc: 'Filtre automatiquement les liens frauduleux, les messages dupliqués et les tentatives d’usurpation.',
                      icon: <Zap className="w-4 h-4 text-amber-400" />,
                    },
                    {
                      key: 'mobileMoneyInstantPayout' as keyof SystemSettings,
                      title: 'Retraits Mobile Money Instantanés (Orange / Wave / MTN)',
                      desc: 'Traitement automatisé sans délai d’attente des demandes de retrait des créateurs de contenu.',
                      icon: <DollarSign className="w-4 h-4 text-sky-400" />,
                    },
                    {
                      key: 'adsNetworkActive' as keyof SystemSettings,
                      title: 'Réseau Publicitaire Partenaires AfriChat',
                      desc: 'Active la diffusion des bannières et des publications sponsorisées vérifiées.',
                      icon: <Radio className="w-4 h-4 text-purple-400" />,
                    },
                    {
                      key: 'newRegistrationsOpen' as keyof SystemSettings,
                      title: 'Inscriptions & Nouveaux Utilisateurs Ouverts',
                      desc: 'Autorise la création de nouveaux comptes sans invitation préalable.',
                      icon: <Users className="w-4 h-4 text-teal-400" />,
                    },
                  ].map((setting) => {
                    const isEnabled = systemSettings[setting.key];

                    return (
                      <div
                        key={setting.key}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-colors ${
                          setting.isDanger && isEnabled
                            ? 'bg-rose-950/30 border-rose-700'
                            : 'bg-stone-800/40 border-stone-800 hover:bg-stone-800/70'
                        }`}
                      >
                        <div className="flex items-start space-x-3.5">
                          <div className="p-2 rounded-xl bg-stone-800 text-stone-200 shrink-0 mt-0.5">
                            {setting.icon}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-white flex items-center space-x-2">
                              <span>{setting.title}</span>
                              {setting.isDanger && isEnabled && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-600 text-white">
                                  CRITIQUE
                                </span>
                              )}
                            </h5>
                            <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
                              {setting.desc}
                            </p>
                          </div>
                        </div>

                        {/* Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleSystemSetting(setting.key)}
                          className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                            isEnabled ? (setting.isDanger ? 'bg-rose-500' : 'bg-amber-500') : 'bg-stone-700'
                          }`}
                        >
                          <div
                            className={`w-4.5 h-4.5 rounded-full bg-stone-950 transition-transform ${
                              isEnabled ? 'translate-x-5.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: AUDIT LOGS */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                      Historique des Actions Administratives
                    </h4>
                  </div>

                  {/* Filter pills */}
                  <div className="flex items-center space-x-1 text-[10px]">
                    {(['all', 'info', 'warning', 'critical'] as const).map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setAuditSeverityFilter(sev)}
                        className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                          auditSeverityFilter === sev
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {sev.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredAuditLogs.map((log) => {
                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-stone-800/40 border border-stone-800 flex items-start space-x-3 text-xs"
                      >
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                            log.severity === 'critical'
                              ? 'bg-rose-500 animate-ping'
                              : log.severity === 'warning'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-stone-200 truncate">{log.action}</h5>
                            <span className="text-[10px] text-stone-500 shrink-0 font-mono">{log.timestamp}</span>
                          </div>

                          <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                            {log.target}
                          </p>

                          <p className="text-[10px] text-stone-400 mt-1">
                            Auteur : <strong className="text-stone-300">{log.actorName}</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: ROLES & PRIVILEGES REFERENCE */}
            {activeTab === 'roles_info' && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-stone-800/40 border border-stone-800 space-y-3">
                  <h4 className="font-black text-xs text-white uppercase tracking-wider flex items-center space-x-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Hiérarchie des Rôles & Privilèges Système</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="font-black text-amber-300 flex items-center space-x-1.5">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>1. Super Admin (Niveau 0)</span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-1">
                        Pouvoir de configuration absolu : nomination et révocation de tous les administrateurs, basculement en mode maintenance, gestion des clés d'API et politique générale.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700">
                      <div className="font-bold text-orange-300 flex items-center space-x-1.5">
                        <DollarSign className="w-4 h-4 text-orange-400" />
                        <span>2. Contrôleur Financier & MoMo (Niveau 1)</span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-1">
                        Audit des flux Orange Money, Wave et MTN MoMo. Validation des retraits de créateurs supérieurs aux seuils d'alerte et gestion des litiges d'abonnements VIP.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700">
                      <div className="font-bold text-emerald-300 flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>3. Auditeur Sécurité & Anti-Spam (Niveau 1)</span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-1">
                        Supervision du bouclier anti-spam, gestion des blocages d'adresses IP suspectes et vérification des dossiers KYC des créateurs certifiés.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700">
                      <div className="font-bold text-sky-300 flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-sky-400" />
                        <span>4. Modérateur Global (Niveau 2)</span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-1">
                        Traitement des signalements d'utilisateurs, suspension temporaire de comptes malveillants et suppression de contenus enfreignant la charte communautaire.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-stone-400">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Session Super Admin chiffrée de bout en bout</span>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold transition-colors cursor-pointer"
            >
              Fermer le Panneau
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
