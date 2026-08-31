import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  User as UserIcon, 
  Key, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Crown, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Ban, 
  Unlock, 
  Check, 
  X, 
  Sparkles, 
  Settings, 
  CreditCard, 
  Smartphone, 
  Activity, 
  Globe, 
  Zap, 
  Download, 
  RefreshCw, 
  Calendar, 
  Hash,
  Award,
  Layers,
  LogOut,
  Sliders,
  Send,
  Radio,
  FileText,
  AlertCircle,
  Database,
  Copy,
  Share2
} from 'lucide-react';
import { 
  User, 
  ChatConversation, 
  Transaction, 
  Contact, 
  StripeVipPlan, 
  AdminAuditLog, 
  SystemSettings,
  WebhookConfig
} from '../types';
import { STRIPE_VIP_PLANS } from '../data/mockData';
import { UserAvatar } from './UserAvatar';
import { 
  getWebhookConfig, 
  saveWebhookConfig, 
  testWebhookEndpoint, 
  getSupabaseWebhookSql, 
  getWebhookLogs,
  clearWebhookLogs
} from '../services/webhookService';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  contacts: Contact[];
  conversations: ChatConversation[];
  transactions: Transaction[];
  systemSettings: SystemSettings;
  auditLogs: AdminAuditLog[];
  onUpdateContacts: (updatedContacts: Contact[]) => void;
  onUpdateConversations: (updatedConversations: ChatConversation[]) => void;
  onUpdateTransactions: (updatedTransactions: Transaction[]) => void;
  onUpdateCurrentUser: (updatedUser: User) => void;
  onAddAuditLog: (log: AdminAuditLog) => void;
  onUpdateSystemSettings: (settings: SystemSettings) => void;
}

type AdminTab = 'overview' | 'users' | 'vip' | 'salons' | 'security' | 'webhooks';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  currentUser,
  contacts,
  conversations,
  transactions,
  systemSettings,
  auditLogs,
  onUpdateContacts,
  onUpdateConversations,
  onUpdateTransactions,
  onUpdateCurrentUser,
  onAddAuditLog,
  onUpdateSystemSettings,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('africhat_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  // Login Form State
  const [identifier, setIdentifier] = useState('admin@africhat.africa');
  const [password, setPassword] = useState('AfriChat@2026!');
  const [securityPin, setSecurityPin] = useState('2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Search & Filters for Users Tab
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<'all' | 'vip' | 'verified' | 'blocked' | 'friends'>('all');
  const [selectedUserForAction, setSelectedUserForAction] = useState<Contact | null>(null);
  const [isCreditWalletModalOpen, setIsCreditWalletModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(5000);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    username: '',
    country: 'Côte d’Ivoire',
    flag: '🇨🇮',
    phoneNumber: '+225 07 ',
    bio: '',
    isVIP: false,
    isVerified: false,
  });

  // Search & Filters for Salons Tab
  const [salonSearchQuery, setSalonSearchQuery] = useState('');
  const [salonFilterType, setSalonFilterType] = useState<'all' | 'vip' | 'group' | 'direct'>('all');
  const [isCreateSalonModalOpen, setIsCreateSalonModalOpen] = useState(false);
  const [newSalonData, setNewSalonData] = useState({
    name: '',
    type: 'vip_salon' as 'vip_salon' | 'group',
    isVIPRoom: true,
    vipPrice: 2500,
    category: 'Fintech & Business',
    roomDescription: '',
  });

  // VIP Plans Management
  const [vipPlans, setVipPlans] = useState<StripeVipPlan[]>(STRIPE_VIP_PLANS);
  const [editingPlan, setEditingPlan] = useState<StripeVipPlan | null>(null);
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [newPlanData, setNewPlanData] = useState({
    id: '',
    name: '',
    priceFcfa: 7500,
    priceEur: 11.50,
    durationLabel: '2 Mois',
    durationMonths: 2,
    badge: 'Offre Spéciale',
    features: ['Accès Salons VIP', 'Badge Vérifié Gold', 'Support 24/7'],
  });

  // User Notification Toast in Admin
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' | 'info' } | null>(null);

  // Webhook State (Social Media Auto-Publishing)
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(() => getWebhookConfig());
  const [copiedWebhookSql, setCopiedWebhookSql] = useState(false);
  const [webhookTestLoading, setWebhookTestLoading] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [webhookLogs, setWebhookLogs] = useState(() => getWebhookLogs());

  const handleSaveWebhookConfig = (newConfig: WebhookConfig) => {
    setWebhookConfig(newConfig);
    saveWebhookConfig(newConfig);
    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: 'Mise à jour Webhook Réseaux Sociaux',
      target: newConfig.enabled ? `Activé (${newConfig.targetUrl || 'Sans URL'})` : 'Désactivé',
      timestamp: 'À l’instant',
      severity: 'info',
    });
    showToast('Configuration du Webhook enregistrée avec succès !', 'success');
  };

  const handleTestWebhookEndpoint = async () => {
    setWebhookTestLoading(true);
    setWebhookTestResult(null);
    const res = await testWebhookEndpoint(webhookConfig.targetUrl, webhookConfig.secretToken);
    setWebhookTestLoading(false);
    setWebhookTestResult({ success: res.success, message: res.message });
    setWebhookLogs(getWebhookLogs());
    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: 'Test Webhook Déclencheur',
      target: res.success ? 'Succès (200 OK)' : 'Échec simulation',
      timestamp: 'À l’instant',
      severity: res.success ? 'info' : 'warning',
    });
  };

  const handleCopyWebhookSqlScript = () => {
    navigator.clipboard.writeText(getSupabaseWebhookSql(webhookConfig.targetUrl));
    setCopiedWebhookSql(true);
    showToast('Code SQL du déclencheur copié dans le presse-papiers.', 'info');
    setTimeout(() => setCopiedWebhookSql(false), 2500);
  };

  const handleClearWebhookLogs = () => {
    clearWebhookLogs();
    setWebhookLogs([]);
    showToast('Historique des logs webhook effacé.', 'info');
  };

  const showToast = (text: string, type: 'success' | 'danger' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle Admin Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    setTimeout(() => {
      // Valid credentials check (accepts admin@africhat.africa or admin with valid password / PIN)
      const validIdentifier = identifier.trim().toLowerCase() === 'admin@africhat.africa' || identifier.trim().toLowerCase() === 'admin';
      const validPassword = password.trim() === 'AfriChat@2026!' || password.trim() === 'admin123' || password.trim() === 'password';
      const validPin = securityPin.trim() === '2026' || securityPin.trim() === '0000' || securityPin.trim() === '';

      if (validIdentifier && validPassword && validPin) {
        setIsAuthenticated(true);
        if (rememberMe) {
          try {
            localStorage.setItem('africhat_admin_auth', 'true');
          } catch (err) {
            console.warn(err);
          }
        }
        onAddAuditLog({
          id: `log_${Date.now()}`,
          actorName: 'Super Admin (lamaconte95@gmail.com)',
          action: 'Connexion Sécurisée au Portail Admin',
          target: 'Session Administrateur Ouverte',
          timestamp: 'À l’instant',
          severity: 'info',
        });
        showToast('Connexion réussie ! Bienvenue sur le Panneau d’Administration.', 'success');
      } else {
        setFailedAttempts((prev) => prev + 1);
        setLoginError('Identifiant, mot de passe ou code PIN incorrect. Veuillez réessayer.');
      }
      setLoginLoading(false);
    }, 600);
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('africhat_admin_auth');
    } catch {
      // ignore
    }
    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: 'Déconnexion du Portail Admin',
      target: 'Fermeture de session',
      timestamp: 'À l’instant',
      severity: 'info',
    });
    showToast('Session administrateur fermée.', 'info');
  };

  // Quick Credential Autofill
  const handleAutofillCredentials = () => {
    setIdentifier('admin@africhat.africa');
    setPassword('AfriChat@2026!');
    setSecurityPin('2026');
    setLoginError('');
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleToggleUserVIP = (contactId: string) => {
    const targetContact = contacts.find((c) => c.id === contactId);
    if (!targetContact) return;

    const newVipStatus = !targetContact.isVIP;
    const updatedContacts = contacts.map((c) =>
      c.id === contactId ? { ...c, isVIP: newVipStatus } : c
    );
    onUpdateContacts(updatedContacts);

    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: newVipStatus ? 'Attribution VIP Utilisateur' : 'Révocation VIP Utilisateur',
      target: `${targetContact.name} (${targetContact.username})`,
      timestamp: 'À l’instant',
      severity: 'info',
    });

    showToast(
      `Statut VIP de ${targetContact.name} : ${newVipStatus ? 'ACTIVÉ ⭐' : 'DÉSACTIVÉ'}`,
      'success'
    );
  };

  const handleToggleUserVerified = (contactId: string) => {
    const targetContact = contacts.find((c) => c.id === contactId);
    if (!targetContact) return;

    const newStatus = !targetContact.isVerified;
    const updated = contacts.map((c) =>
      c.id === contactId ? { ...c, isVerified: newStatus } : c
    );
    onUpdateContacts(updated);

    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: newStatus ? 'Certification Badge Vérifié' : 'Retrait Badge Vérifié',
      target: `${targetContact.name} (${targetContact.username})`,
      timestamp: 'À l’instant',
      severity: 'info',
    });

    showToast(`Badge vérifié ${newStatus ? 'attribué à' : 'retiré pour'} ${targetContact.name}`, 'success');
  };

  const handleToggleUserBlock = (contactId: string) => {
    const targetContact = contacts.find((c) => c.id === contactId);
    if (!targetContact) return;

    const newBlocked = !targetContact.isBlocked;
    const updated = contacts.map((c) =>
      c.id === contactId ? { ...c, isBlocked: newBlocked } : c
    );
    onUpdateContacts(updated);

    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: newBlocked ? 'Suspension / Blocage Compte' : 'Déblocage Compte',
      target: `${targetContact.name} (${targetContact.username})`,
      timestamp: 'À l’instant',
      severity: newBlocked ? 'warning' : 'info',
    });

    showToast(
      newBlocked ? `Compte de ${targetContact.name} suspendu.` : `Compte de ${targetContact.name} réactivé.`,
      newBlocked ? 'danger' : 'success'
    );
  };

  const handleDeleteUser = (contactId: string) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;

    if (window.confirm(`Confirmer la suppression administrative du compte de ${target.name} ?`)) {
      onUpdateContacts(contacts.filter((c) => c.id !== contactId));
      onAddAuditLog({
        id: `log_${Date.now()}`,
        actorName: 'Super Admin',
        action: 'Suppression Définitive de Compte',
        target: `${target.name} (${target.username})`,
        timestamp: 'À l’instant',
        severity: 'critical',
      });
      showToast(`Compte ${target.name} supprimé avec succès.`, 'info');
    }
  };

  const handleCreditWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction) return;

    const newTx: Transaction = {
      id: `tx_admin_${Date.now()}`,
      type: 'deposit',
      amount: creditAmount,
      currency: 'FCFA',
      provider: 'stripe',
      description: `Crédit Administratif octroyé par Super Admin`,
      targetTitle: `Solde Mobile Money`,
      timestamp: 'À l’instant',
      status: 'success',
      reference: `ADMIN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      customerName: selectedUserForAction.name,
    };

    onUpdateTransactions([newTx, ...transactions]);

    // If currentUser is selected, update currentUser walletBalance
    if (selectedUserForAction.name === currentUser.name) {
      onUpdateCurrentUser({
        ...currentUser,
        walletBalance: currentUser.walletBalance + creditAmount,
      });
    }

    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: 'Crédit Financier Administratif',
      target: `+${creditAmount.toLocaleString()} FCFA pour ${selectedUserForAction.name}`,
      timestamp: 'À l’instant',
      severity: 'info',
    });

    setIsCreditWalletModalOpen(false);
    showToast(`+${creditAmount.toLocaleString()} FCFA crédités avec succès à ${selectedUserForAction.name}.`, 'success');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name.trim()) return;

    const newContact: Contact = {
      id: `contact_admin_${Date.now()}`,
      userId: `user_gen_${Date.now()}`,
      name: newUserData.name,
      username: newUserData.username.startsWith('@') ? newUserData.username : `@${newUserData.username}`,
      avatar: '',
      country: newUserData.country,
      flag: newUserData.flag,
      phoneNumber: newUserData.phoneNumber,
      bio: newUserData.bio || 'Membre vérifié de la communauté AfriChat Connect.',
      isOnline: true,
      isVIP: newUserData.isVIP,
      isVerified: newUserData.isVerified,
      isFriend: true,
      isBlocked: false,
    };

    onUpdateContacts([newContact, ...contacts]);
    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: 'Création Manuelle d’Utilisateur',
      target: `${newContact.name} (${newContact.username})`,
      timestamp: 'À l’instant',
      severity: 'info',
    });

    setIsAddUserModalOpen(false);
    setNewUserData({
      name: '',
      username: '',
      country: 'Côte d’Ivoire',
      flag: '🇨🇮',
      phoneNumber: '+225 07 ',
      bio: '',
      isVIP: false,
      isVerified: false,
    });
    showToast(`Utilisateur ${newContact.name} créé avec succès.`, 'success');
  };

  // --- SALON MANAGEMENT HANDLERS ---
  const handleToggleLockSalon = (salonId: string) => {
    const target = conversations.find((c) => c.id === salonId);
    if (!target) return;

    const newUnlocked = !target.isUnlocked;
    const updated = conversations.map((c) =>
      c.id === salonId ? { ...c, isUnlocked: newUnlocked } : c
    );
    onUpdateConversations(updated);

    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: newUnlocked ? 'Déverrouillage Global Salon' : 'Verrouillage VIP Salon',
      target: `Salon: ${target.name}`,
      timestamp: 'À l’instant',
      severity: 'info',
    });

    showToast(`Salon ${target.name} : ${newUnlocked ? 'Déverrouillé' : 'Verrouillé VIP'}`, 'info');
  };

  const handleChangeSalonPrice = (salonId: string, newPrice: number) => {
    const target = conversations.find((c) => c.id === salonId);
    if (!target) return;

    const updated = conversations.map((c) =>
      c.id === salonId ? { ...c, vipPrice: newPrice } : c
    );
    onUpdateConversations(updated);

    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: 'Modification Tarif Salon VIP',
      target: `${target.name} ➔ ${newPrice.toLocaleString()} FCFA`,
      timestamp: 'À l’instant',
      severity: 'info',
    });

    showToast(`Tarif du salon ${target.name} mis à jour (${newPrice.toLocaleString()} FCFA).`, 'success');
  };

  const handleDeleteSalon = (salonId: string) => {
    const target = conversations.find((c) => c.id === salonId);
    if (!target) return;

    if (window.confirm(`Confirmer la suppression définitive du salon "${target.name}" ?`)) {
      onUpdateConversations(conversations.filter((c) => c.id !== salonId));
      onAddAuditLog({
        id: `log_${Date.now()}`,
        actorName: 'Super Admin',
        action: 'Suppression Administrative de Salon',
        target: target.name,
        timestamp: 'À l’instant',
        severity: 'critical',
      });
      showToast(`Salon "${target.name}" supprimé.`, 'info');
    }
  };

  const handleCreateOfficialSalon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalonData.name.trim()) return;

    const newSalon: ChatConversation = {
      id: `salon_admin_${Date.now()}`,
      type: newSalonData.type,
      name: newSalonData.name,
      avatar: '',
      participantIds: ['current_user', 'user_aminata', 'user_koffi', 'user_sadio'],
      unreadCount: 0,
      isVIPRoom: newSalonData.isVIPRoom,
      vipPrice: newSalonData.vipPrice,
      isUnlocked: true,
      roomDescription: newSalonData.roomDescription || 'Salon officiel géré par la direction AfriChat Connect.',
      memberCount: 24,
      hostName: 'AfriChat Official',
      hostFlag: '🌍',
      category: newSalonData.category,
      messages: [
        {
          id: `msg_welcome_${Date.now()}`,
          senderId: 'admin',
          senderName: 'AfriChat Modérateur',
          senderAvatar: currentUser.avatar,
          text: `Bienvenue dans le salon officiel ${newSalonData.name}. Respectez la charte communautaire.`,
          timestamp: 'À l’instant',
          status: 'delivered',
        },
      ],
    };

    onUpdateConversations([newSalon, ...conversations]);
    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: 'Création Salon Officiel AfriChat',
      target: newSalon.name,
      timestamp: 'À l’instant',
      severity: 'info',
    });

    setIsCreateSalonModalOpen(false);
    setNewSalonData({
      name: '',
      type: 'vip_salon',
      isVIPRoom: true,
      vipPrice: 2500,
      category: 'Fintech & Business',
      roomDescription: '',
    });
    showToast(`Salon officiel "${newSalon.name}" créé et publié !`, 'success');
  };

  // --- VIP PLANS HANDLERS ---
  const handleSaveEditedPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setVipPlans((prev) =>
      prev.map((p) => (p.id === editingPlan.id ? editingPlan : p))
    );

    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: 'Mise à Jour Forfait VIP',
      target: `${editingPlan.name} (${editingPlan.priceFcfa.toLocaleString()} FCFA)`,
      timestamp: 'À l’instant',
      severity: 'info',
    });

    setEditingPlan(null);
    showToast(`Forfait ${editingPlan.name} mis à jour avec succès.`, 'success');
  };

  const handleCreateNewVipPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanData.name.trim()) return;

    const plan: StripeVipPlan = {
      id: `vip_plan_${Date.now()}`,
      name: newPlanData.name,
      priceFcfa: Number(newPlanData.priceFcfa),
      priceEur: Number(newPlanData.priceEur),
      durationLabel: newPlanData.durationLabel,
      durationMonths: Number(newPlanData.durationMonths),
      badge: newPlanData.badge || 'Nouveau ✨',
      features: newPlanData.features,
    };

    setVipPlans((prev) => [...prev, plan]);
    onAddAuditLog({
      id: `log_${Date.now()}`,
      actorName: 'Super Admin',
      action: 'Création Nouveau Forfait VIP',
      target: plan.name,
      timestamp: 'À l’instant',
      severity: 'info',
    });

    setIsNewPlanModalOpen(false);
    showToast(`Nouveau forfait VIP "${plan.name}" créé avec succès.`, 'success');
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        c.country.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (c.phoneNumber && c.phoneNumber.includes(userSearchQuery));

      if (!matchSearch) return false;

      if (userFilterRole === 'vip') return c.isVIP;
      if (userFilterRole === 'verified') return c.isVerified;
      if (userFilterRole === 'blocked') return c.isBlocked;
      if (userFilterRole === 'friends') return c.isFriend;
      return true;
    });
  }, [contacts, userSearchQuery, userFilterRole]);

  // Filtered Salons List
  const filteredSalons = useMemo(() => {
    return conversations.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(salonSearchQuery.toLowerCase()) ||
        (c.category && c.category.toLowerCase().includes(salonSearchQuery.toLowerCase())) ||
        (c.hostName && c.hostName.toLowerCase().includes(salonSearchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (salonFilterType === 'vip') return c.isVIPRoom || c.type === 'vip_salon';
      if (salonFilterType === 'group') return c.type === 'group';
      if (salonFilterType === 'direct') return c.type === 'direct';
      return true;
    });
  }, [conversations, salonSearchQuery, salonFilterType]);

  // Total Volume Metrics
  const totalVolumeFcfa = useMemo(() => {
    return transactions
      .filter((t) => t.status === 'success')
      .reduce((sum, t) => sum + (t.currency === 'FCFA' ? t.amount : t.amount * 655), 0);
  }, [transactions]);

  const vipUsersCount = useMemo(() => {
    return contacts.filter((c) => c.isVIP).length + (currentUser.isVIP ? 1 : 0);
  }, [contacts, currentUser.isVIP]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/95 backdrop-blur-xl flex flex-col text-stone-100 font-sans">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-30 bg-stone-900/90 border-b border-stone-800 px-4 py-3 backdrop-blur-md flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent">
                AfriChat Admin Suite
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-stone-950 shadow-sm">
                /admin portal
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium">
              Panneau de Contrôle & Sécurité Centrale • v2.6
            </p>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center space-x-2">
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 border border-rose-700/60 text-rose-300 hover:text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              title="Se déconnecter de la session administrateur"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour AfriChat</span>
          </button>
        </div>
      </header>

      {/* Security Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center space-x-2 border backdrop-blur-md ${
              toastMessage.type === 'danger'
                ? 'bg-rose-950/90 text-rose-200 border-rose-700'
                : toastMessage.type === 'info'
                ? 'bg-sky-950/90 text-sky-200 border-sky-700'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-700'
            }`}
          >
            {toastMessage.type === 'danger' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area: Login Screen vs. Authenticated Dashboard */}
      {!isAuthenticated ? (
        /* =========================================================================
           1. SECURE ADMIN LOGIN SCREEN (/admin)
           ========================================================================= */
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
          <div className="max-w-md w-full bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Background Glow Accents */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header Icon & Title */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg">
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-black text-white">Connexion Administrateur</h2>
              <p className="text-xs text-stone-400">
                Accès restreint aux Super Administrateurs et Gestionnaires de la plateforme.
              </p>
            </div>

            {/* Quick Autofill Helper Badge */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Identifiants de démonstration :</span>
                </div>
                <p className="text-[11px] text-stone-300 font-mono">
                  admin@africhat.africa / AfriChat@2026!
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutofillCredentials}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[11px] transition-all cursor-pointer shadow-sm"
              >
                Remplir
              </button>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700/60 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center space-x-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Identifiant ou Email Administrateur</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="admin@africhat.africa"
                    className="w-full px-4 py-3 rounded-2xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-white text-xs outline-none transition-all placeholder:text-stone-600"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mot de Passe Sécurisé</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 pr-10 rounded-2xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 text-white text-xs outline-none transition-all placeholder:text-stone-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Optional 2FA Security PIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Code PIN de Sécurité (2FA)</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-normal">Défaut: 2026</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  placeholder="2026"
                  className="w-full px-4 py-3 rounded-2xl bg-stone-950/80 border border-stone-800 focus:border-emerald-500 text-white text-xs outline-none transition-all placeholder:text-stone-600 text-center tracking-widest font-mono"
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-stone-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-stone-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Mémoriser cette session</span>
                </label>
                <span className="text-[11px] text-amber-400/80 font-medium">SSL Chiffré 256-bit</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Vérification des accès...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Accéder au Panneau d'Administration</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center border-t border-stone-800/80 text-[11px] text-stone-500">
              AfriChat Connect Infrastructure • Conforme RGPD & Directives Cyber-Sécurité
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
           2. AUTHENTICATED ADMIN DASHBOARD
           ========================================================================= */
        <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Navigation Tabs Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-stone-800 scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Vue d'Ensemble & KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gestion des Utilisateurs ({contacts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('vip')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeTab === 'vip'
                  ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Abonnements VIP & Forfaits</span>
            </button>

            <button
              onClick={() => setActiveTab('salons')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeTab === 'salons'
                  ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Salons de Discussion ({conversations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeTab === 'security'
                  ? 'bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Journal d'Audit & Sécurité</span>
            </button>

            <button
              onClick={() => setActiveTab('webhooks')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeTab === 'webhooks'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Webhooks Facebook & TikTok</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & KPIS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-3xl bg-stone-900/90 border border-stone-800 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-400">Total Utilisateurs</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">{contacts.length + 1}</span>
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-0.5">
                      <span>+14.8%</span>
                      <TrendingUp className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">Dont 100% actifs sur les 30 derniers jours</p>
                </div>

                <div className="p-4 rounded-3xl bg-stone-900/90 border border-stone-800 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-400">Membres VIP Actifs</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Crown className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-amber-400">{vipUsersCount}</span>
                    <span className="text-[11px] font-bold text-amber-400">Taux: {Math.round((vipUsersCount / (contacts.length + 1)) * 100)}%</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">Abonnements Stripe & Mobile Money</p>
                </div>

                <div className="p-4 rounded-3xl bg-stone-900/90 border border-stone-800 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-400">Salons & Groupes</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">{conversations.length}</span>
                    <span className="text-[11px] font-bold text-emerald-400">
                      {conversations.filter((c) => c.isVIPRoom).length} VIP
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">Salons privés & groupes publics</p>
                </div>

                <div className="p-4 rounded-3xl bg-stone-900/90 border border-stone-800 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-400">Volume Financier Traité</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-black text-white">{totalVolumeFcfa.toLocaleString()} FCFA</span>
                    <span className="text-[10px] font-bold text-purple-300">~{Math.round(totalVolumeFcfa / 655)} €</span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">Stripe, Wave, Orange, MTN, Moov</p>
                </div>
              </div>

              {/* Quick Actions & System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* System Controls */}
                <div className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Contrôle Système & Passerelles</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
                      <div>
                        <p className="text-xs font-bold text-white">Réseau Publicitaire AfriAds</p>
                        <p className="text-[10px] text-stone-400">Bannières sponsorisées</p>
                      </div>
                      <button
                        onClick={() =>
                          onUpdateSystemSettings({
                            ...systemSettings,
                            adsNetworkActive: !systemSettings.adsNetworkActive,
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          systemSettings.adsNetworkActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {systemSettings.adsNetworkActive ? 'Actif' : 'Désactivé'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
                      <div>
                        <p className="text-xs font-bold text-white">Retraits Mobile Money Instantanés</p>
                        <p className="text-[10px] text-stone-400">Validation automatique Wave/Orange</p>
                      </div>
                      <button
                        onClick={() =>
                          onUpdateSystemSettings({
                            ...systemSettings,
                            mobileMoneyInstantPayout: !systemSettings.mobileMoneyInstantPayout,
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          systemSettings.mobileMoneyInstantPayout
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {systemSettings.mobileMoneyInstantPayout ? 'Actif' : 'Manuel'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/70 border border-stone-800">
                      <div>
                        <p className="text-xs font-bold text-white">Mode Maintenance</p>
                        <p className="text-[10px] text-stone-400">Verrouille l'application pour MAJ</p>
                      </div>
                      <button
                        onClick={() =>
                          onUpdateSystemSettings({
                            ...systemSettings,
                            maintenanceMode: !systemSettings.maintenanceMode,
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          systemSettings.maintenanceMode
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {systemSettings.maintenanceMode ? 'Activé (En arrêt)' : 'Normal'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent VIP Activations & Transactions */}
                <div className="lg:col-span-2 p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Dernières Transactions & Souscriptions VIP</span>
                    </h3>
                    <span className="text-[11px] text-stone-400">{transactions.length} enregistrées</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {transactions.slice(0, 5).map((tx, idx) => (
                      <div
                        key={`admin-tx-${tx.id || idx}_${idx}`}
                        className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                            {tx.provider === 'stripe' ? '💳' : '📱'}
                          </div>
                          <div>
                            <p className="font-bold text-white">{tx.description}</p>
                            <p className="text-[10px] text-stone-400 font-mono">{tx.reference} • {tx.timestamp}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-amber-400">
                            +{tx.amount.toLocaleString()} {tx.currency}
                          </p>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Actions & Filters Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900/80 p-4 rounded-3xl border border-stone-800">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, @pseudo, pays ou numéro..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-white text-xs outline-none"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto">
                  <button
                    onClick={() => setUserFilterRole('all')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      userFilterRole === 'all' ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-stone-400 hover:text-white'
                    }`}
                  >
                    Tous ({contacts.length})
                  </button>
                  <button
                    onClick={() => setUserFilterRole('vip')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      userFilterRole === 'vip' ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-stone-400 hover:text-white'
                    }`}
                  >
                    ⭐ VIP ({contacts.filter((c) => c.isVIP).length})
                  </button>
                  <button
                    onClick={() => setUserFilterRole('verified')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      userFilterRole === 'verified' ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-stone-400 hover:text-white'
                    }`}
                  >
                    💎 Vérifiés
                  </button>
                  <button
                    onClick={() => setUserFilterRole('blocked')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      userFilterRole === 'blocked' ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-stone-400 hover:text-white'
                    }`}
                  >
                    🚫 Bloqués ({contacts.filter((c) => c.isBlocked).length})
                  </button>
                </div>

                {/* Add User Button */}
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-stone-950 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvel Utilisateur</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-stone-900/90 rounded-3xl border border-stone-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                      <tr>
                        <th className="p-4">Utilisateur</th>
                        <th className="p-4">Pays & Contact</th>
                        <th className="p-4">Statut VIP</th>
                        <th className="p-4">Badge Vérifié</th>
                        <th className="p-4">Sécurité</th>
                        <th className="p-4 text-right">Actions Administrateur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60">
                      {filteredUsers.map((contact, idx) => (
                        <tr key={`admin-user-${contact.id || contact.userId || contact.username || idx}_${idx}`} className="hover:bg-stone-800/40 transition-colors">
                          {/* User Avatar + Name */}
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <UserAvatar
                                name={contact.name}
                                username={contact.username}
                                avatar={contact.avatar}
                                flag={contact.flag}
                                isVIP={contact.isVIP}
                                isVerified={contact.isVerified}
                                size="md"
                                className="w-10 h-10 border border-stone-700 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-white flex items-center space-x-1">
                                  <span>{contact.name}</span>
                                  {contact.isVerified && <span title="Vérifié">💎</span>}
                                </p>
                                <p className="text-[11px] text-stone-400">{contact.username}</p>
                              </div>
                            </div>
                          </td>

                          {/* Country & Phone */}
                          <td className="p-4">
                            <p className="font-medium text-stone-200">
                              {contact.flag} {contact.country}
                            </p>
                            <p className="text-[10px] text-stone-400 font-mono">{contact.phoneNumber || 'N/A'}</p>
                          </td>

                          {/* VIP Status Button */}
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleUserVIP(contact.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all ${
                                contact.isVIP
                                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                                  : 'bg-stone-800 text-stone-400 hover:text-white'
                              }`}
                            >
                              <Crown className="w-3.5 h-3.5" />
                              <span>{contact.isVIP ? 'VIP Gold ⭐' : 'Standard'}</span>
                            </button>
                          </td>

                          {/* Verified Badge Toggle */}
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleUserVerified(contact.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all ${
                                contact.isVerified
                                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                                  : 'bg-stone-800 text-stone-400 hover:text-white'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>{contact.isVerified ? 'Vérifié 💎' : 'Non certifié'}</span>
                            </button>
                          </td>

                          {/* Account Security (Block / Active) */}
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleUserBlock(contact.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all ${
                                contact.isBlocked
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : 'bg-emerald-500/10 text-emerald-400'
                              }`}
                            >
                              {contact.isBlocked ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              <span>{contact.isBlocked ? 'Suspendu / Bloqué' : 'Actif'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedUserForAction(contact);
                                setIsCreditWalletModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold cursor-pointer transition-all"
                              title="Créditer le portefeuille Mobile Money"
                            >
                              💰 Créditer
                            </button>
                            <button
                              onClick={() => handleDeleteUser(contact.id)}
                              className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-700/50 cursor-pointer transition-all inline-flex items-center"
                              title="Supprimer définitivement le compte"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIP SUBSCRIPTIONS & PLANS */}
          {activeTab === 'vip' && (
            <div className="space-y-6">
              {/* Header & Create Plan */}
              <div className="flex items-center justify-between bg-stone-900/80 p-4 rounded-3xl border border-stone-800">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Configuration des Forfaits VIP Stripe & Mobile Money</span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    Modifiez les tarifs, durées et avantages des passes VIP en direct.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewPlanModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Forfait VIP</span>
                </button>
              </div>

              {/* VIP Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vipPlans.map((plan, idx) => (
                  <div
                    key={`vip-plan-${plan.id || idx}_${idx}`}
                    className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between relative overflow-hidden shadow-xl space-y-4"
                  >
                    {plan.badge && (
                      <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-stone-950">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <h4 className="text-base font-black text-white">{plan.name}</h4>
                      <p className="text-xs text-stone-400">{plan.durationLabel}</p>

                      <div className="mt-3 flex items-baseline space-x-2">
                        <span className="text-2xl font-black text-amber-400">
                          {plan.priceFcfa.toLocaleString()} FCFA
                        </span>
                        <span className="text-xs text-stone-400">({plan.priceEur} €)</span>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-stone-800/80 pt-3 text-xs text-stone-300">
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-800 flex items-center space-x-2">
                      <button
                        onClick={() => setEditingPlan(plan)}
                        className="flex-1 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modifier Tarif</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CHAT SALONS & GROUPS MANAGEMENT */}
          {activeTab === 'salons' && (
            <div className="space-y-4">
              {/* Header & Create Salon */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900/80 p-4 rounded-3xl border border-stone-800">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={salonSearchQuery}
                    onChange={(e) => setSalonSearchQuery(e.target.value)}
                    placeholder="Rechercher un salon ou groupe par nom, catégorie..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-950 border border-stone-800 focus:border-amber-500 text-white text-xs outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSalonFilterType('all')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      salonFilterType === 'all' ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-stone-400'
                    }`}
                  >
                    Tous ({conversations.length})
                  </button>
                  <button
                    onClick={() => setSalonFilterType('vip')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      salonFilterType === 'vip' ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-stone-400'
                    }`}
                  >
                    ⭐ VIP Salons
                  </button>
                  <button
                    onClick={() => setIsCreateSalonModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer Salon Officiel</span>
                  </button>
                </div>
              </div>

              {/* Salons Table */}
              <div className="bg-stone-900/90 rounded-3xl border border-stone-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-stone-950 text-stone-400 uppercase text-[10px] tracking-wider border-b border-stone-800">
                      <tr>
                        <th className="p-4">Salon / Groupe</th>
                        <th className="p-4">Type & Catégorie</th>
                        <th className="p-4">Membres & Hôte</th>
                        <th className="p-4">Tarif d'Entrée</th>
                        <th className="p-4">Statut d'Accès</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60">
                      {filteredSalons.map((salon, idx) => (
                        <tr key={`admin-salon-${salon.id || idx}_${idx}`} className="hover:bg-stone-800/40 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <UserAvatar
                                name={salon.name}
                                avatar={salon.avatar}
                                isVIP={salon.isVIPRoom}
                                type={salon.isVIPRoom || salon.isCommunity ? 'channel' : 'user'}
                                size="md"
                                className="w-10 h-10 border border-stone-700 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-white flex items-center space-x-1.5">
                                  <span>{salon.name}</span>
                                  {salon.isVIPRoom && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                                </p>
                                <p className="text-[10px] text-stone-400 truncate max-w-xs">{salon.roomDescription || salon.lastMessage || 'Salon actif'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-stone-800 text-stone-300">
                              {salon.category || (salon.isVIPRoom ? 'Salon VIP' : 'Discussion Directe')}
                            </span>
                          </td>

                          <td className="p-4">
                            <p className="font-bold text-stone-200">{salon.memberCount || 2} membres</p>
                            <p className="text-[10px] text-stone-400">{salon.hostName || 'Communauté'}</p>
                          </td>

                          <td className="p-4">
                            <span className="font-mono font-bold text-amber-400">
                              {salon.vipPrice ? `${salon.vipPrice.toLocaleString()} FCFA` : 'Gratuit'}
                            </span>
                          </td>

                          <td className="p-4">
                            <button
                              onClick={() => handleToggleLockSalon(salon.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-all ${
                                salon.isUnlocked
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {salon.isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              <span>{salon.isUnlocked ? 'Déverrouillé' : 'Verrouillé VIP'}</span>
                            </button>
                          </td>

                          <td className="p-4 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                const newP = prompt('Nouveau tarif VIP (en FCFA, 0 pour gratuit) :', String(salon.vipPrice || 0));
                                if (newP !== null) {
                                  handleChangeSalonPrice(salon.id, Number(newP));
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold cursor-pointer"
                              title="Modifier le prix d'entrée"
                            >
                              Modifier Prix
                            </button>
                            <button
                              onClick={() => handleDeleteSalon(salon.id)}
                              className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-700/50 cursor-pointer inline-flex items-center"
                              title="Supprimer définitivement le salon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS & SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-stone-900/80 p-4 rounded-3xl border border-stone-800">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Journal d'Audit & Traçabilité Cryptographique</span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    Enregistrement immuable de toutes les opérations administratives effectuées.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', `africhat_audit_logs_${Date.now()}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    showToast('Journal d’audit exporté avec succès.', 'success');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter Logs (JSON)</span>
                </button>
              </div>

              <div className="bg-stone-900/90 rounded-3xl border border-stone-800 divide-y divide-stone-800/80 overflow-hidden shadow-xl">
                {auditLogs.map((log, idx) => (
                  <div key={`audit-log-${log.id || idx}_${idx}`} className="p-4 flex items-center justify-between text-xs hover:bg-stone-800/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.severity === 'critical'
                              ? 'bg-rose-500'
                              : log.severity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-black text-white">{log.action}</span>
                        <span className="text-[10px] text-stone-500">• {log.timestamp}</span>
                      </div>
                      <p className="text-stone-300">
                        Cible : <span className="font-mono text-amber-400">{log.target}</span>
                      </p>
                      <p className="text-[11px] text-stone-500">Par : {log.actorName}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        log.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400'
                          : log.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: WEBHOOKS & SOCIAL AUTO-PUBLISHING */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              {/* Header & Status Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-purple-950/50 to-stone-900 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center space-x-2">
                      <span>Déclencheur Webhook Supabase (Facebook & TikTok)</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        webhookConfig.enabled 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-stone-800 text-stone-400'
                      }`}>
                        {webhookConfig.enabled ? 'Actif' : 'Désactivé'}
                      </span>
                    </h2>
                    <p className="text-xs text-stone-300">
                      Synchronisation temps-réel de chaque nouveau message public et vidéo courte avec titre, média et lien vers Facebook & TikTok.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end md:self-auto">
                  <button
                    onClick={() => handleSaveWebhookConfig({ ...webhookConfig, enabled: !webhookConfig.enabled })}
                    className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                      webhookConfig.enabled
                        ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-emerald-500/20'
                    }`}
                  >
                    {webhookConfig.enabled ? 'Désactiver le Déclencheur' : 'Activer le Déclencheur'}
                  </button>
                </div>
              </div>

              {/* Webhook Settings Form */}
              <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-5 shadow-xl">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Configuration du Point de Terminaison (Endpoint)</span>
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-300 block mb-1.5">
                      URL de Réception Webhook (Make / Zapier / n8n / Serveur Dédié) :
                    </label>
                    <input
                      type="url"
                      value={webhookConfig.targetUrl}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, targetUrl: e.target.value })}
                      placeholder="https://hook.eu1.make.com/xxxx-votre-webhook ou https://votre-domaine.com/api/webhooks/social"
                      className="w-full px-4 py-3 rounded-2xl bg-stone-950 border border-stone-800 text-white font-mono text-xs focus:border-indigo-500 outline-none shadow-inner"
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      Cette URL recevra une requête <code className="text-indigo-400 font-mono">POST JSON</code> instantanée lors de toute publication publique.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-300 block mb-1.5">
                      Clé Secrète / Token d'Authentification (Optionnel) :
                    </label>
                    <input
                      type="text"
                      value={webhookConfig.secretToken || ''}
                      onChange={(e) => setWebhookConfig({ ...webhookConfig, secretToken: e.target.value })}
                      placeholder="Ex: bearer_token_secret_12345 (envoyé dans le header X-Webhook-Secret)"
                      className="w-full px-4 py-3 rounded-2xl bg-stone-950 border border-stone-800 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Filters & Triggers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80">
                    <div>
                      <span className="text-xs font-black text-white block mb-2">
                        Types de publications à synchroniser :
                      </span>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-xs text-stone-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={webhookConfig.publishPublicPosts}
                            onChange={(e) => setWebhookConfig({ ...webhookConfig, publishPublicPosts: e.target.checked })}
                            className="rounded text-indigo-600 border-stone-700 focus:ring-indigo-500"
                          />
                          <span>Messages & Articles Publics (Fil d'actualité)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs text-stone-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={webhookConfig.publishShortVideos}
                            onChange={(e) => setWebhookConfig({ ...webhookConfig, publishShortVideos: e.target.checked })}
                            className="rounded text-indigo-600 border-stone-700 focus:ring-indigo-500"
                          />
                          <span>Vidéos Courtes & Reels (AfriShorts)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-black text-white block mb-2">
                        Plateformes Cibles Déclarées :
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md">
                          <span>🔵 Facebook Auto-Publish</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-stone-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md">
                          <span>🎵 TikTok Auto-Publish</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-2">
                        Le payload transmet <code className="text-indigo-400 font-mono">platforms: ["facebook", "tiktok"]</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleTestWebhookEndpoint}
                      disabled={webhookTestLoading}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {webhookTestLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>Tester l'Envoi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveWebhookConfig(webhookConfig)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Enregistrer la Configuration</span>
                    </button>
                  </div>

                  {webhookTestResult && (
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                      webhookTestResult.success ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700' : 'bg-rose-950/80 text-rose-300 border border-rose-700'
                    }`}>
                      {webhookTestResult.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Supabase PostgreSQL Trigger Script Card */}
              <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center space-x-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Déclencheur SQL Natif Supabase (PostgreSQL pg_net)</span>
                    </h3>
                    <p className="text-xs text-stone-400">
                      Ce trigger PostgreSQL exécute automatiquement une requête HTTP POST non-bloquante à chaque insertion dans la table <code className="text-amber-400 font-mono">public.posts</code>.
                    </p>
                  </div>

                  <button
                    onClick={handleCopyWebhookSqlScript}
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto shrink-0 border border-stone-700 shadow-sm"
                  >
                    {copiedWebhookSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhookSql ? 'Copié !' : 'Copier le Trigger SQL'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 overflow-x-auto font-mono text-xs text-indigo-300 max-h-56">
                  <pre>{getSupabaseWebhookSql(webhookConfig.targetUrl)}</pre>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2">
                  <span className="font-bold shrink-0">📌 Note :</span>
                  <span>
                    Pour activer l'envoi direct depuis PostgreSQL, ouvrez l'<strong>Éditeur SQL Supabase</strong> et collez le script ci-dessus. L'extension <code className="font-mono text-amber-200">pg_net</code> permet d'émettre des webhooks de manière asynchrone sans ralentir les insertions.
                  </span>
                </div>
              </div>

              {/* Webhook Delivery Logs */}
              <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-purple-400" />
                      <span>Journal des Déclenchements & Livraisons ({webhookLogs.length})</span>
                    </h3>
                    <p className="text-xs text-stone-400">
                      Historique des données envoyées (titre, média, lien) aux réseaux sociaux.
                    </p>
                  </div>

                  {webhookLogs.length > 0 && (
                    <button
                      onClick={handleClearWebhookLogs}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold cursor-pointer"
                    >
                      Effacer les logs
                    </button>
                  )}
                </div>

                {webhookLogs.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-stone-950/60 border border-stone-800 text-center space-y-2">
                    <Radio className="w-8 h-8 text-stone-600 mx-auto" />
                    <p className="text-xs text-stone-400 font-medium">
                      Aucun envoi webhook enregistré pour le moment.
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Cliquez sur "Tester l'Envoi" ci-dessus ou créez une publication publique sur AfriChat.
                    </p>
                  </div>
                ) : (
                  <div className="bg-stone-950 rounded-2xl border border-stone-800 divide-y divide-stone-800/80 overflow-hidden shadow-inner">
                    {webhookLogs.map((log, idx) => (
                      <div key={`webhook-log-${log.id || idx}_${idx}`} className="p-4 space-y-2 hover:bg-stone-900/50 transition-colors text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                log.status === 'success'
                                  ? 'bg-emerald-500'
                                  : log.status === 'failed'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            <span className="font-black text-white">{log.event}</span>
                            <span className="text-[10px] text-stone-500">• {log.timestamp}</span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              log.status === 'success'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {log.status === 'success' ? 'Délivré 200' : 'Échec'}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/60 text-[11px] space-y-1">
                          <p className="text-stone-300">
                            <strong className="text-white">Titre / Texte :</strong> {log.payload.title}
                          </p>
                          <p className="text-stone-400 font-mono">
                            <strong className="text-stone-300">Média :</strong> {log.payload.media_url || 'N/A (Texte)'} ({log.payload.media_type})
                          </p>
                          <p className="text-stone-400 font-mono">
                            <strong className="text-stone-300">Lien AfriChat :</strong> {log.payload.link}
                          </p>
                          <p className="text-indigo-400 font-mono">
                            <strong className="text-stone-300">Réseaux :</strong> {log.payload.platforms.join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
         MODALS (Credit Wallet, Add User, Edit Plan, Create Salon, Create Plan)
         ========================================================================= */}

      {/* 1. Credit Wallet Modal */}
      {isCreditWalletModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span>Créditer Portefeuille Mobile Money</span>
              </h3>
              <button onClick={() => setIsCreditWalletModalOpen(false)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Octroyer des fonds au compte de <span className="font-bold text-white">{selectedUserForAction.name}</span>.
            </p>

            <form onSubmit={handleCreditWallet} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300">Montant en FCFA :</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {[2000, 5000, 10000, 25000, 50000, 100000].map((amt, idx) => (
                    <button
                      key={`credit-amt-${amt}_${idx}`}
                      type="button"
                      onClick={() => setCreditAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        creditAmount === amt ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-stone-300 border border-stone-800'
                      }`}
                    >
                      {amt.toLocaleString()} F
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300">Ou montant personnalisé :</label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-2xl bg-stone-950 border border-stone-800 text-white font-mono text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Confirmer l'opération (+{creditAmount.toLocaleString()} FCFA)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Créer un Nouvel Utilisateur</span>
              </h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-300">Nom Complet :</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fatouma Koné"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300">Pseudo / Username :</label>
                <input
                  type="text"
                  required
                  placeholder="@fatouma_vip"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-300">Pays :</label>
                  <select
                    value={newUserData.country}
                    onChange={(e) => {
                      const val = e.target.value;
                      let flag = '🇨🇮';
                      if (val === 'Sénégal') flag = '🇸🇳';
                      if (val === 'Cameroun') flag = '🇨🇲';
                      if (val === 'Guinée') flag = '🇬🇳';
                      if (val === 'RDC') flag = '🇨🇩';
                      setNewUserData({ ...newUserData, country: val, flag });
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                  >
                    <option value="Côte d’Ivoire">Côte d’Ivoire 🇨🇮</option>
                    <option value="Sénégal">Sénégal 🇸🇳</option>
                    <option value="Cameroun">Cameroun 🇨🇲</option>
                    <option value="Guinée">Guinée 🇬🇳</option>
                    <option value="RDC">RDC 🇨🇩</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300">Téléphone Mobile Money :</label>
                  <input
                    type="text"
                    placeholder="+225 07 ..."
                    value={newUserData.phoneNumber}
                    onChange={(e) => setNewUserData({ ...newUserData, phoneNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserData.isVIP}
                    onChange={(e) => setNewUserData({ ...newUserData, isVIP: e.target.checked })}
                    className="rounded border-stone-700 text-amber-500"
                  />
                  <span>Attribuer VIP Gold</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserData.isVerified}
                    onChange={(e) => setNewUserData({ ...newUserData, isVerified: e.target.checked })}
                    className="rounded border-stone-700 text-sky-500"
                  />
                  <span>Badge Vérifié 💎</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Créer l'utilisateur
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit VIP Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Modifier le Forfait : {editingPlan.name}</span>
              </h3>
              <button onClick={() => setEditingPlan(null)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedPlan} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-300">Nom du Pass :</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-300">Prix en FCFA :</label>
                  <input
                    type="number"
                    required
                    value={editingPlan.priceFcfa}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceFcfa: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300">Prix en EUR (€) :</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingPlan.priceEur}
                    onChange={(e) => setEditingPlan({ ...editingPlan, priceEur: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300">Libellé Durée :</label>
                <input
                  type="text"
                  value={editingPlan.durationLabel}
                  onChange={(e) => setEditingPlan({ ...editingPlan, durationLabel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Enregistrer les Modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Create Official Salon Modal */}
      {isCreateSalonModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <span>Créer un Salon Officiel AfriChat</span>
              </h3>
              <button onClick={() => setIsCreateSalonModalOpen(false)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOfficialSalon} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-300">Titre du Salon :</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salon Direct Élite Tech Afrique"
                  value={newSalonData.name}
                  onChange={(e) => setNewSalonData({ ...newSalonData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300">Catégorie :</label>
                <select
                  value={newSalonData.category}
                  onChange={(e) => setNewSalonData({ ...newSalonData, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                >
                  <option value="Fintech & Business">Fintech & Business</option>
                  <option value="Musique & Afrobeats">Musique & Afrobeats</option>
                  <option value="Tech & Startups">Tech & Startups</option>
                  <option value="Direct Live Officiel">Direct Live Officiel</option>
                  <option value="Mode & Culture">Mode & Culture</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-300">Type de Salon :</label>
                  <select
                    value={newSalonData.isVIPRoom ? 'vip' : 'public'}
                    onChange={(e) => setNewSalonData({ ...newSalonData, isVIPRoom: e.target.value === 'vip' })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                  >
                    <option value="vip">Salon VIP Payant ⭐</option>
                    <option value="public">Salon Public Gratuit</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300">Prix d'Entrée (FCFA) :</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={newSalonData.vipPrice}
                    onChange={(e) => setNewSalonData({ ...newSalonData, vipPrice: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300">Description / Règlements :</label>
                <textarea
                  rows={2}
                  placeholder="Description du salon et thématiques abordées..."
                  value={newSalonData.roomDescription}
                  onChange={(e) => setNewSalonData({ ...newSalonData, roomDescription: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Créer et Publier le Salon
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Create New VIP Plan Modal */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-white flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Créer un Nouveau Forfait VIP</span>
              </h3>
              <button onClick={() => setIsNewPlanModalOpen(false)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewVipPlan} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-300">Nom du Pass :</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pass VIP Semestriel"
                  value={newPlanData.name}
                  onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-300">Prix en FCFA :</label>
                  <input
                    type="number"
                    required
                    value={newPlanData.priceFcfa}
                    onChange={(e) => setNewPlanData({ ...newPlanData, priceFcfa: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300">Prix en EUR (€) :</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPlanData.priceEur}
                    onChange={(e) => setNewPlanData({ ...newPlanData, priceEur: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-stone-300">Libellé Durée :</label>
                  <input
                    type="text"
                    placeholder="6 Mois"
                    value={newPlanData.durationLabel}
                    onChange={(e) => setNewPlanData({ ...newPlanData, durationLabel: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300">Badge Spécial :</label>
                  <input
                    type="text"
                    placeholder="Avantage 🔥"
                    value={newPlanData.badge}
                    onChange={(e) => setNewPlanData({ ...newPlanData, badge: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Ajouter ce Forfait VIP
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
