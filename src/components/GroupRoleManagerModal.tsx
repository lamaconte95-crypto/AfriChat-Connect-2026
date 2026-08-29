import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  Crown, 
  UserCheck, 
  UserPlus, 
  UserMinus, 
  Settings, 
  Trash2, 
  Pin, 
  Sparkles, 
  Users, 
  Search, 
  Check, 
  Sliders, 
  ShieldAlert, 
  Image as ImageIcon,
  MessageSquare,
  DollarSign,
  Radio,
  Lock,
  Edit3,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  ChatConversation, 
  User, 
  Contact, 
  GroupMember, 
  GroupRole, 
  GroupPermissions, 
  RolePermissionConfig 
} from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../data/mockData';

interface GroupRoleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ChatConversation | null;
  currentUser: User;
  contacts: Contact[];
  onUpdateConversation: (conversationId: string, updatedFields: Partial<ChatConversation>) => void;
}

export const GroupRoleManagerModal: React.FC<GroupRoleManagerModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  contacts,
  onUpdateConversation,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'permissions' | 'settings'>('members');
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<GroupRole>('admin');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [isPromoteSubModalOpen, setIsPromoteSubModalOpen] = useState(false);
  const [selectedMemberToPromote, setSelectedMemberToPromote] = useState<string | null>(null);
  const [newAdminRole, setNewAdminRole] = useState<GroupRole>('admin');
  const [newAdminTitle, setNewAdminTitle] = useState('');
  const [editingTitleMemberId, setEditingTitleMemberId] = useState<string | null>(null);
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !conversation) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Group members array fallback
  const members: GroupMember[] = conversation.members || [
    {
      id: 'gm_me',
      userId: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      flag: currentUser.flag,
      role: (conversation.founderId === currentUser.id || conversation.hostName === currentUser.name) ? 'founder' : 'admin',
      customTitle: 'Créateur du salon',
      joinedAt: 'Janvier 2026',
      isOnline: true,
    }
  ];

  const rolePermissions: RolePermissionConfig = conversation.rolePermissions || { ...DEFAULT_ROLE_PERMISSIONS };

  // Current user's role in this group
  const currentUserMember = members.find((m) => m.userId === currentUser.id);
  const isCurrentUserFounder = currentUserMember?.role === 'founder' || conversation.founderId === currentUser.id;
  const isCurrentUserAdmin = isCurrentUserFounder || currentUserMember?.role === 'admin';

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    if (!searchMemberQuery) return true;
    const q = searchMemberQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      (m.customTitle && m.customTitle.toLowerCase().includes(q))
    );
  });

  // Eligible members to promote to Admin (those who are currently members or moderators)
  const eligibleCandidates = members.filter((m) => m.role !== 'founder');

  // Handle Promoting / Changing a member's role
  const handleAssignRole = (memberId: string, targetRole: GroupRole, title?: string) => {
    const updatedMembers = members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          role: targetRole,
          customTitle: title !== undefined ? title : m.customTitle || (targetRole === 'admin' ? 'Administrateur' : targetRole === 'moderator' ? 'Modérateur' : 'Membre'),
        };
      }
      return m;
    });

    onUpdateConversation(conversation.id, {
      members: updatedMembers,
      memberCount: updatedMembers.length,
    });

    const targetMember = members.find((m) => m.id === memberId);
    showToast(`Rôle de ${targetMember?.name || 'Membre'} mis à jour : ${targetRole.toUpperCase()} 🛡️`);
    setIsPromoteSubModalOpen(false);
    setSelectedMemberToPromote(null);
    setNewAdminTitle('');
  };

  // Handle updating custom title for a member
  const handleSaveCustomTitle = (memberId: string) => {
    const updatedMembers = members.map((m) => {
      if (m.id === memberId) {
        return { ...m, customTitle: customTitleInput.trim() || undefined };
      }
      return m;
    });

    onUpdateConversation(conversation.id, { members: updatedMembers });
    setEditingTitleMemberId(null);
    setCustomTitleInput('');
    showToast('Titre personnalisé mis à jour avec succès !');
  };

  // Handle removing a member
  const handleRemoveMember = (memberId: string) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (targetMember?.role === 'founder') {
      showToast('Impossible de retirer le fondateur du groupe.');
      return;
    }

    const updatedMembers = members.filter((m) => m.id !== memberId);
    onUpdateConversation(conversation.id, {
      members: updatedMembers,
      memberCount: updatedMembers.length,
    });
    showToast(`${targetMember?.name || 'Le membre'} a été retiré du groupe.`);
  };

  // Handle toggling permission for a role
  const handleTogglePermission = (role: GroupRole, permKey: keyof GroupPermissions) => {
    if (role === 'founder') {
      showToast('Les permissions du Fondateur sont toujours complètes et verrouillées.');
      return;
    }

    const updatedPermissions = {
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        [permKey]: !rolePermissions[role][permKey],
      },
    };

    onUpdateConversation(conversation.id, {
      rolePermissions: updatedPermissions,
    });

    showToast(`Permission "${permKey}" modifiée pour le rôle ${role.toUpperCase()}.`);
  };

  // Reset permissions to defaults
  const handleResetPermissions = () => {
    onUpdateConversation(conversation.id, {
      rolePermissions: { ...DEFAULT_ROLE_PERMISSIONS },
    });
    showToast('Permissions réinitialisées aux valeurs standard AfriChat !');
  };

  const getRoleBadge = (role: GroupRole) => {
    switch (role) {
      case 'founder':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>Fondateur</span>
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-orange-400" />
            <span>Administrateur</span>
          </span>
        );
      case 'moderator':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
            <UserCheck className="w-3 h-3 text-emerald-400" />
            <span>Modérateur</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-800 text-stone-400 border border-stone-700">
            Membre
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="group-role-manager-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-2xl rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden text-stone-100 my-6 flex flex-col max-h-[90vh]"
        >
          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-amber-500 text-stone-950 font-black text-xs shadow-xl flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Header */}
          <div className="p-5 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-amber-500/60"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  {conversation.isVIPRoom ? <Crown className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-black text-base text-white truncate">{conversation.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                    {members.length} membres
                  </span>
                </div>
                <p className="text-xs text-stone-400 truncate flex items-center space-x-1">
                  <span>{conversation.category || 'Groupe de discussion'}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">Gestion des Administrateurs & Permissions</span>
                </p>
              </div>
            </div>

            <button
              id="group-roles-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-stone-800 bg-stone-950/30 px-4">
            <button
              id="tab-group-members"
              onClick={() => setActiveTab('members')}
              className={`py-3 px-4 text-xs font-black flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'members'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Admins & Membres ({members.length})</span>
            </button>

            <button
              id="tab-group-permissions"
              onClick={() => setActiveTab('permissions')}
              className={`py-3 px-4 text-xs font-black flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'permissions'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Gestion des Rôles & Permissions</span>
            </button>

            <button
              id="tab-group-settings"
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-4 text-xs font-black flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Infos & Salon</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* TAB 1: MEMBERS & ADMINISTRATORS */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Actions & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      id="search-group-members-input"
                      type="text"
                      placeholder="Rechercher un membre, admin ou modérateur..."
                      value={searchMemberQuery}
                      onChange={(e) => setSearchMemberQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-800/90 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Primary "Ajouter un administrateur" Button */}
                  <button
                    id="btn-add-administrator"
                    onClick={() => setIsPromoteSubModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-xs shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>Ajouter un administrateur</span>
                  </button>
                </div>

                {/* Sub-view: Promote Member to Admin Selector Modal / Inline Box */}
                <AnimatePresence>
                  {isPromoteSubModalOpen && (
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
                            Nommer un nouvel Administrateur
                          </h4>
                        </div>
                        <button
                          onClick={() => setIsPromoteSubModalOpen(false)}
                          className="text-stone-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-stone-300">
                        Sélectionnez un membre du groupe pour lui attribuer les droits d'administration et configurer son rôle.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Member Selection */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-300 mb-1">
                            Membre à promouvoir :
                          </label>
                          <select
                            id="select-member-to-promote"
                            value={selectedMemberToPromote || ''}
                            onChange={(e) => setSelectedMemberToPromote(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                          >
                            <option value="">-- Choisir un membre ({eligibleCandidates.length}) --</option>
                            {eligibleCandidates.map((cand) => (
                              <option key={cand.id} value={cand.id}>
                                {cand.name} ({cand.username}) - Actuel : {cand.role}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Target Role */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-300 mb-1">
                            Rôle attribué :
                          </label>
                          <select
                            id="select-target-role"
                            value={newAdminRole}
                            onChange={(e) => setNewAdminRole(e.target.value as GroupRole)}
                            className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                          >
                            <option value="admin">🛡️ Administrateur (Gestion complète)</option>
                            <option value="moderator">⚡ Modérateur (Suppression messages, pin)</option>
                            <option value="member">👤 Membre simple</option>
                          </select>
                        </div>
                      </div>

                      {/* Custom Title */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">
                          Titre personnalisé (optionnel) :
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Co-Gérant, Modérateur Principal, Responsable Partenariats..."
                          value={newAdminTitle}
                          onChange={(e) => setNewAdminTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsPromoteSubModalOpen(false)}
                          className="px-3 py-1.5 rounded-xl bg-stone-800 text-stone-300 hover:text-white text-xs font-bold"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          id="confirm-promote-admin-btn"
                          disabled={!selectedMemberToPromote}
                          onClick={() => {
                            if (selectedMemberToPromote) {
                              handleAssignRole(selectedMemberToPromote, newAdminRole, newAdminTitle.trim() || undefined);
                            }
                          }}
                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-black shadow transition-all cursor-pointer"
                        >
                          Valider la promotion 🛡️
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Members List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 px-1">
                    <span>LISTE DES MEMBRES ET STATUTS</span>
                    <span>{filteredMembers.length} affichés</span>
                  </div>

                  <div className="space-y-1.5 divide-y divide-stone-800/40">
                    {filteredMembers.map((member) => {
                      const isMe = member.userId === currentUser.id;
                      const isFounder = member.role === 'founder';

                      return (
                        <div
                          key={member.id}
                          className="pt-2.5 pb-2 px-3 rounded-2xl bg-stone-800/40 border border-stone-800 hover:bg-stone-800/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                        >
                          {/* Member Info */}
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-10 h-10 rounded-xl object-cover border border-stone-700"
                              />
                              {member.isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-stone-900" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-black text-xs text-white truncate">{member.name}</span>
                                <span>{member.flag}</span>
                                {isMe && (
                                  <span className="text-[10px] font-bold px-1.5 rounded bg-amber-500/20 text-amber-300">
                                    Vous
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-[10px] text-stone-400 font-mono">{member.username}</span>
                                {member.customTitle && (
                                  <span className="text-[10px] font-medium text-amber-400/90 italic">
                                    « {member.customTitle} »
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Member Role & Quick Actions */}
                          <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                            {getRoleBadge(member.role)}

                            {/* Actions if current user is admin/founder and target is not founder */}
                            {isCurrentUserAdmin && !isFounder && (
                              <div className="flex items-center space-x-1">
                                {member.role === 'admin' ? (
                                  <button
                                    onClick={() => handleAssignRole(member.id, 'member')}
                                    className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 text-[10px] font-bold transition-colors"
                                    title="Rétrograder en membre simple"
                                  >
                                    Rétrograder
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAssignRole(member.id, 'admin')}
                                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition-colors border border-amber-500/30"
                                    title="Promouvoir comme administrateur"
                                  >
                                    + Admin
                                  </button>
                                )}

                                {/* Custom Title Edit Toggle */}
                                {editingTitleMemberId === member.id ? (
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="text"
                                      placeholder="Titre"
                                      value={customTitleInput}
                                      onChange={(e) => setCustomTitleInput(e.target.value)}
                                      className="w-24 px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-[10px] text-white"
                                    />
                                    <button
                                      onClick={() => handleSaveCustomTitle(member.id)}
                                      className="p-1 rounded bg-emerald-500 text-stone-950 font-bold"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingTitleMemberId(member.id);
                                      setCustomTitleInput(member.customTitle || '');
                                    }}
                                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-[10px]"
                                    title="Modifier le titre personnalisé"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Remove from group */}
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 text-[10px]"
                                  title="Retirer du groupe"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ROLE PERMISSION MATRIX */}
            {activeTab === 'permissions' && (
              <div className="space-y-4">
                {/* Role Switcher */}
                <div className="p-1 rounded-2xl bg-stone-950 border border-stone-800 grid grid-cols-4 gap-1">
                  {(['founder', 'admin', 'moderator', 'member'] as GroupRole[]).map((r) => {
                    const isSelected = selectedRoleForMatrix === r;
                    const labels: Record<GroupRole, string> = {
                      founder: '👑 Fondateur',
                      admin: '🛡️ Admin',
                      moderator: '⚡ Modérateur',
                      member: '👤 Membre',
                    };

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRoleForMatrix(r)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center truncate ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950 font-black shadow'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {labels[r]}
                      </button>
                    );
                  })}
                </div>

                {/* Role Description Banner */}
                <div className="p-3.5 rounded-2xl bg-stone-800/60 border border-stone-700/80 flex items-start space-x-3 text-xs">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">
                      Configuration des permissions pour : <span className="text-amber-400 uppercase">{selectedRoleForMatrix}</span>
                    </h4>
                    <p className="text-stone-300 text-[11px] mt-0.5">
                      {selectedRoleForMatrix === 'founder' && 'Le Fondateur possède un accès souverain et irrévocable à l’ensemble des fonctionnalités.'}
                      {selectedRoleForMatrix === 'admin' && 'Les Administrateurs gèrent la communauté au quotidien, modèrent les contenus et peuvent inviter des participants.'}
                      {selectedRoleForMatrix === 'moderator' && 'Les Modérateurs veillent à la sérénité des échanges, peuvent épingler des messages et supprimer les abus.'}
                      {selectedRoleForMatrix === 'member' && 'Les Membres participent aux discussions et découvrent les publications selon les règles établies.'}
                    </p>
                  </div>
                </div>

                {/* Interactive Permissions Checklist */}
                <div className="space-y-2">
                  {[
                    {
                      key: 'canDeleteMessages' as keyof GroupPermissions,
                      title: 'Suppression des messages d’autrui',
                      desc: 'Permet de supprimer les messages indésirables ou frauduleux envoyés par d’autres membres.',
                      icon: <Trash2 className="w-4 h-4 text-rose-400" />,
                    },
                    {
                      key: 'canAddMembers' as keyof GroupPermissions,
                      title: 'Ajout & Invitation de nouveaux membres',
                      desc: 'Autorise l’envoi de liens d’invitation et l’ajout direct de contacts dans le groupe.',
                      icon: <UserPlus className="w-4 h-4 text-emerald-400" />,
                    },
                    {
                      key: 'canEditGroupInfo' as keyof GroupPermissions,
                      title: 'Modification des informations du groupe',
                      desc: 'Changer le nom, la description, la thématique et la photo de couverture du groupe.',
                      icon: <Edit3 className="w-4 h-4 text-sky-400" />,
                    },
                    {
                      key: 'canPinMessages' as keyof GroupPermissions,
                      title: 'Épingler des messages prioritaires',
                      desc: 'Mettre en avant les annonces importantes en haut du fil de discussion pour tous.',
                      icon: <Pin className="w-4 h-4 text-amber-400" />,
                    },
                    {
                      key: 'canManageAdmins' as keyof GroupPermissions,
                      title: 'Nommer & Gérer d’autres administrateurs',
                      desc: 'Possibilité d’attribuer le rôle d’administrateur ou de modérateur à des membres.',
                      icon: <Crown className="w-4 h-4 text-yellow-400" />,
                    },
                    {
                      key: 'canManageVIPPricing' as keyof GroupPermissions,
                      title: 'Gérer les tarifs & abonnements VIP',
                      desc: 'Ajuster le prix d’accès Mobile Money (Orange Money, Wave, MTN MoMo) pour les salons VIP.',
                      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
                    },
                    {
                      key: 'canSendMedia' as keyof GroupPermissions,
                      title: 'Envoi de fichiers médias (Photos, audios, vidéos)',
                      desc: 'Autoriser l’envoi de notes vocales, captures d’écran et documents dans le canal.',
                      icon: <ImageIcon className="w-4 h-4 text-purple-400" />,
                    },
                    {
                      key: 'canSendMessages' as keyof GroupPermissions,
                      title: 'Droit d’envoi de messages (Mode Diffusion / Écriture)',
                      desc: 'Si désactivé, le groupe passe en mode lecture seule (canal de diffusion d’annonces).',
                      icon: <MessageSquare className="w-4 h-4 text-teal-400" />,
                    },
                  ].map((perm) => {
                    const isEnabled = rolePermissions[selectedRoleForMatrix]?.[perm.key] ?? false;
                    const isLocked = selectedRoleForMatrix === 'founder';

                    return (
                      <div
                        key={perm.key}
                        className="p-3.5 rounded-2xl bg-stone-800/40 border border-stone-800 flex items-center justify-between gap-3 hover:bg-stone-800/70 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-xl bg-stone-800 text-stone-300 shrink-0 mt-0.5">
                            {perm.icon}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-white flex items-center space-x-1.5">
                              <span>{perm.title}</span>
                              {isLocked && <Lock className="w-3 h-3 text-stone-500" />}
                            </h5>
                            <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
                              {perm.desc}
                            </p>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleTogglePermission(selectedRoleForMatrix, perm.key)}
                          className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                            isEnabled ? 'bg-amber-500' : 'bg-stone-700'
                          } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
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

                {/* Reset Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetPermissions}
                    className="text-xs text-stone-400 hover:text-amber-400 underline font-medium"
                  >
                    Réinitialiser les permissions par défaut
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      showToast('Configuration des rôles enregistrée avec succès !');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-black text-xs shadow hover:bg-amber-400 transition-colors"
                  >
                    Enregistrer la Matrice 💾
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: GROUP SETTINGS & VIP MONETIZATION */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-stone-800/40 border border-stone-800 space-y-3">
                  <h4 className="font-black text-xs text-white uppercase tracking-wider">
                    Paramètres du Groupe & Canal
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Nom du Groupe / Salon :
                    </label>
                    <input
                      type="text"
                      defaultValue={conversation.name}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          onUpdateConversation(conversation.id, { name: e.target.value.trim() });
                          showToast('Nom du groupe mis à jour !');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Description & Règles :
                    </label>
                    <textarea
                      rows={3}
                      defaultValue={conversation.roomDescription || ''}
                      onBlur={(e) => {
                        onUpdateConversation(conversation.id, { roomDescription: e.target.value.trim() });
                        showToast('Description mise à jour !');
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* VIP Salon Pricing if VIP */}
                  {conversation.isVIPRoom && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">Prix d'accès VIP Mobile Money :</span>
                        <span className="text-xs font-mono font-black text-amber-400">
                          {conversation.vipPrice?.toLocaleString()} FCFA / mois
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[1000, 2500, 5000, 10000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => {
                              onUpdateConversation(conversation.id, { vipPrice: amt });
                              showToast(`Tarif VIP ajusté à ${amt.toLocaleString()} FCFA`);
                            }}
                            className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              conversation.vipPrice === amt
                                ? 'bg-amber-500 text-stone-950 border-amber-500 font-black'
                                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                            }`}
                          >
                            {amt.toLocaleString()} F
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shareable Invite Link */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-300 mb-1">
                      Lien d'invitation sécurisé AfriChat :
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={`https://africhat.app/g/${conversation.id}`}
                        className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://africhat.app/g/${conversation.id}`);
                          showToast('Lien d’invitation copié dans le presse-papier !');
                        }}
                        className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold cursor-pointer"
                      >
                        Copier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-stone-800 bg-stone-950/60 flex items-center justify-between text-xs">
            <span className="text-stone-400 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Modération sécurisée AfriChat Guard 2026</span>
            </span>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
