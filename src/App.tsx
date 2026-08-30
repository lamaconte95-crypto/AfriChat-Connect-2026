/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { 
  CURRENT_USER, 
  INITIAL_POSTS, 
  INITIAL_REELS, 
  INITIAL_STORIES, 
  INITIAL_CONVERSATIONS, 
  INITIAL_TRANSACTIONS,
  INITIAL_CONTACTS,
  INITIAL_ADS,
  INITIAL_AD_SETTINGS,
  INITIAL_GLOBAL_ADMINS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_WEBTV_CHANNELS,
  INITIAL_WEBTV_BOOST_PLANS,
  DEFAULT_FOUNDER_INFO,
  INITIAL_VIRTUAL_GIFTS,
  INITIAL_OFFICIAL_PAGES,
  INITIAL_LIVE_STREAMS
} from './data/mockData';
import { 
  User, 
  Post, 
  Story, 
  ChatConversation, 
  Message,
  Transaction, 
  PaymentProvider,
  Contact,
  ReportTicket,
  AdItem,
  AdSettings,
  GlobalAdminUser,
  AdminAuditLog,
  SystemSettings,
  WebTvChannel,
  WebTvBoostPlan,
  OfficialPage,
  PageCategory,
  LiveStreamSession,
  VirtualGift,
  FounderInfo
} from './types';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { StoriesBar, StoryViewerModal } from './components/StoriesBar';
import { FeedView } from './components/FeedView';
import { ReelsView } from './components/ReelsView';
import { WebTvView } from './components/WebTvView';
import { MessagesView } from './components/MessagesView';
import { WalletView } from './components/WalletView';
import { ProfileView } from './components/ProfileView';
import { PagesView } from './components/PagesView';
import { CreatePageModal } from './components/CreatePageModal';
import { LiveStudioModal } from './components/LiveStudioModal';
import { SendGiftModal } from './components/SendGiftModal';
import { FounderModal } from './components/FounderModal';
import { MobileMoneyModal } from './components/MobileMoneyModal';
import { CreatePostModal } from './components/CreatePostModal';
import { CreateStoryModal } from './components/CreateStoryModal';
import { CallModal } from './components/CallModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { SettingsModal, AppTheme } from './components/SettingsModal';
import { ContactsModal } from './components/ContactsModal';
import { ContactProfileModal } from './components/ContactProfileModal';
import { ReportModal } from './components/ReportModal';
import { AdBanner } from './components/AdBanner';
import { AdDetailModal } from './components/AdDetailModal';
import { GroupRoleManagerModal } from './components/GroupRoleManagerModal';
import { SuperAdminModal } from './components/SuperAdminModal';
import { AdminPortal } from './components/AdminPortal';
import { StripePaymentModal } from './components/StripePaymentModal';
import { FlutterwaveVipModal } from './components/FlutterwaveVipModal';
import { ReceiptDetailModal } from './components/ReceiptDetailModal';
import { AuthModal } from './components/AuthModal';
import { WebTvBoostModal } from './components/WebTvBoostModal';
import { VipStarAccessModal } from './components/VipStarAccessModal';
import { ShareAppModal } from './components/ShareAppModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { FriendsManagerModal } from './components/FriendsManagerModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { ApiConfigModal } from './components/ApiConfigModal';
import { AdminAiReleaseModal } from './components/AdminAiReleaseModal';
import { TicTacToeGameModal } from './components/TicTacToeGameModal';
import { StripeVipPlan, GameChallengeData } from './types';
import { 
  auth, 
  getUserProfile, 
  saveUserProfile, 
  updateUserProfileDoc, 
  buildDefaultUser,
  saveMessageToFirestore,
  saveConversationToFirestore,
  subscribeToConversationMessages,
  syncInitialConversationsToFirestore,
  testFirestoreConnection,
  subscribeToUserProfile,
  getAllRegisteredUsersFromFirestore,
  subscribeToAllRegisteredUsers,
  saveUserFriendInFirestore,
  subscribeToUserFriends,
  getUserFriendsFromFirestore
} from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  supabaseFetchAllProfiles, 
  supabaseSubscribeProfiles, 
  supabaseSearchUsers, 
  isSupabaseConfigured,
  supabaseBlockUser,
  supabaseUnblockUser,
  supabaseFetchBlockedUserIds,
  supabaseRecordReport,
  supabaseUnlockUser,
  supabaseCreatePost,
  supabaseFetchLiveStreams,
  supabaseSubscribeLiveStreams,
  supabaseUploadAvatar,
  supabaseFetchPosts,
  supabaseSubscribePosts,
  supabaseUpdateProfile,
  syncMessageToSupabase,
  supabaseFetchMessages,
  supabaseSubscribeMessages,
  supabaseFetchStories,
  supabaseSubscribeStories,
  supabaseCreateStory,
  supabaseFetchUserProfile,
  supabaseSaveFriendship,
  supabaseFetchFriendships,
  supabaseSubscribeFriendships
} from './services/supabaseService';
import { dispatchSocialWebhook, getWebhookConfig } from './services/webhookService';

// Safe storage helpers for sandboxed iframes
const safeGetItem = (key: string, fallback: string = ''): string => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('Storage write skipped:', e);
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = safeGetItem('africhat_user_profile', '');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return CURRENT_USER;
  });

  // Auth State: Show Login/Signup modal on app startup if not authenticated
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => {
    const hasAuth = safeGetItem('africhat_has_authenticated', '');
    return !hasAuth;
  });
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  // Share Application & PWA Installation Modal States
  const [isShareAppModalOpen, setIsShareAppModalOpen] = useState<boolean>(false);
  const [isPwaInstallModalOpen, setIsPwaInstallModalOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Friends Management Modal State
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState<boolean>(false);
  const [friendsInitialTab, setFriendsInitialTab] = useState<'online' | 'add' | 'requests' | 'all'>('online');

  // AI & API Gateways Modal States
  const [isAiAssistantModalOpen, setIsAiAssistantModalOpen] = useState<boolean>(false);
  const [isApiConfigModalOpen, setIsApiConfigModalOpen] = useState<boolean>(false);
  const [isAdminAiReleaseModalOpen, setIsAdminAiReleaseModalOpen] = useState<boolean>(false);
  const [globalAnnouncement, setGlobalAnnouncement] = useState<{
    title: string;
    body: string;
    version: string;
    markdown: string;
  } | null>(null);

  // Real-time Tic-Tac-Toe Game State
  const [isGameModalOpen, setIsGameModalOpen] = useState<boolean>(false);
  const [gameOpponent, setGameOpponent] = useState<Contact | User | null>(null);
  const [activeGameId, setActiveGameId] = useState<string | undefined>(undefined);
  const [gameStake, setGameStake] = useState<number>(0);

  const handleOpenFriends = (tab: 'online' | 'add' | 'requests' | 'all' = 'online') => {
    setFriendsInitialTab(tab);
    setIsFriendsModalOpen(true);
  };

  // Capture PWA Install Prompt Event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Firebase Auth State Observer and real-time current user profile sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid);
          if (profile) {
            setCurrentUser(profile);
            safeSetItem('africhat_user_profile', JSON.stringify(profile));
            safeSetItem('africhat_has_authenticated', 'true');
            setIsAuthModalOpen(false);
          } else {
            const newProfile = buildDefaultUser(
              fbUser.uid,
              fbUser.displayName || 'Utilisateur AfriChat',
              fbUser.email || undefined,
              undefined,
              'CI',
              fbUser.photoURL || undefined
            );
            await saveUserProfile(newProfile);
            setCurrentUser(newProfile);
            safeSetItem('africhat_user_profile', JSON.stringify(newProfile));
            safeSetItem('africhat_has_authenticated', 'true');
            setIsAuthModalOpen(false);
          }
        } catch (err) {
          console.warn('Firebase user sync error:', err);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time listener for current user profile changes from Firestore across devices (phone & PC)
  useEffect(() => {
    if (!currentUser.id) return;
    const unsubscribeProfile = subscribeToUserProfile(currentUser.id, (updatedProfile) => {
      if (updatedProfile) {
        setCurrentUser((prev) => {
          const merged = { ...prev, ...updatedProfile };
          safeSetItem('africhat_user_profile', JSON.stringify(merged));
          return merged;
        });
      }
    });

    return () => {
      unsubscribeProfile();
    };
  }, [currentUser.id]);

  // Synchronize current user profile and avatar from Supabase across all devices (phones & computers)
  useEffect(() => {
    if (!currentUser.id) return;
    supabaseFetchUserProfile(currentUser.id).then((res) => {
      if (res.data) {
        setCurrentUser((prev) => {
          const updated = {
            ...prev,
            ...res.data,
            avatar: res.data.avatar || prev.avatar,
            name: res.data.name || prev.name,
            username: res.data.username || prev.username,
          };
          safeSetItem('africhat_user_profile', JSON.stringify(updated));
          return updated;
        });
      }
    });
  }, [currentUser.id]);

  // Synchronize current user's friend list from Firestore & Supabase across all devices (phones & computers)
  useEffect(() => {
    if (!currentUser.id) return;

    // 1. Realtime listener from Firestore
    const unsubscribeFirestoreFriends = subscribeToUserFriends(currentUser.id, (friendIds) => {
      if (friendIds) {
        setContacts((prev) =>
          prev.map((c) => ({
            ...c,
            isFriend: friendIds.includes(c.id) || (c.userId ? friendIds.includes(c.userId) : false),
          }))
        );
      }
    });

    // 2. Realtime listener from Supabase
    const unsubscribeSupabaseFriends = supabaseSubscribeFriendships(currentUser.id, (friendIds) => {
      if (friendIds) {
        setContacts((prev) =>
          prev.map((c) => ({
            ...c,
            isFriend: friendIds.includes(c.id) || (c.userId ? friendIds.includes(c.userId) : false),
          }))
        );
      }
    });

    // Initial fetch from Supabase & Firestore
    Promise.allSettled([
      supabaseFetchFriendships(currentUser.id),
      getUserFriendsFromFirestore(currentUser.id),
    ]).then(([supaRes, fbRes]) => {
      const supaIds = supaRes.status === 'fulfilled' ? supaRes.value || [] : [];
      const fbIds = fbRes.status === 'fulfilled' ? fbRes.value || [] : [];
      const allFriendIds = Array.from(new Set([...supaIds, ...fbIds]));
      if (allFriendIds.length > 0) {
        setContacts((prev) =>
          prev.map((c) => ({
            ...c,
            isFriend: allFriendIds.includes(c.id) || (c.userId ? allFriendIds.includes(c.userId) : false),
          }))
        );
      }
    });

    return () => {
      unsubscribeFirestoreFriends();
      unsubscribeSupabaseFriends();
    };
  }, [currentUser.id]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    safeSetItem('africhat_user_profile', JSON.stringify(user));
    safeSetItem('africhat_has_authenticated', 'true');
    setIsAuthModalOpen(false);

    // Sync posts by current user to display new personalized identity
    setPosts((prev) =>
      prev.map((p) => {
        if (p.userId === 'user_me' || p.userId === user.id) {
          return {
            ...p,
            userId: user.id,
            author: {
              ...p.author,
              id: user.id,
              name: user.name,
              username: user.username,
              avatar: user.avatar,
              country: user.country,
              flag: user.flag,
              isVIPCreator: user.isVIP,
            },
          };
        }
        return p;
      })
    );

    triggerSecurityToast(`🎉 Bienvenue ${user.name} sur votre espace AfriChat Connect !`, 'success');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    safeSetItem('africhat_has_authenticated', '');
    setAuthMode('signin');
    setIsAuthModalOpen(true);
    triggerSecurityToast('Vous avez été déconnecté avec succès. À bientôt ! 👋', 'info');
  };

  const handleUpdateUserProfile = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    safeSetItem('africhat_user_profile', JSON.stringify(updatedUser));
    
    // Save to Firestore
    await updateUserProfileDoc(updatedUser.id, updatedUser);

    // Save to Supabase (so all Supabase Realtime subscribers get the update instantly)
    try {
      await supabaseUpdateProfile(updatedUser.id, updatedUser);
    } catch (e) {
      console.warn('Supabase profile sync warning:', e);
    }

    setPosts((prev) =>
      prev.map((p) => {
        if (p.userId === updatedUser.id || p.userId === 'user_me') {
          return {
            ...p,
            author: {
              ...p.author,
              name: updatedUser.name,
              username: updatedUser.username,
              avatar: updatedUser.avatar,
              country: updatedUser.country,
              flag: updatedUser.flag,
              isVIPCreator: updatedUser.isVIP,
            },
          };
        }
        return p;
      })
    );
  };

  const handleUpdateAvatar = async (avatarDataOrUrl: string) => {
    try {
      triggerSecurityToast('📸 Téléchargement et synchronisation de votre photo de profil...', 'info');
      const uploadRes = await supabaseUploadAvatar(currentUser.id, avatarDataOrUrl, `avatar_${Date.now()}.png`);
      const finalAvatarUrl = uploadRes.url || avatarDataOrUrl;
      
      const updatedUser: User = {
        ...currentUser,
        avatar: finalAvatarUrl,
      };

      await handleUpdateUserProfile(updatedUser);
      triggerSecurityToast('✅ Photo de profil sauvegardée définitivement dans Supabase & Firestore !', 'success');
    } catch (err) {
      console.warn('Avatar upload warning:', err);
      const updatedUser: User = {
        ...currentUser,
        avatar: avatarDataOrUrl,
      };
      await handleUpdateUserProfile(updatedUser);
    }
  };

  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [reels, setReels] = useState<Post[]>(INITIAL_REELS);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<NavTab>('feed');
  const [tabHistory, setTabHistory] = useState<NavTab[]>(['feed']);

  const handleSelectTab = (tab: NavTab) => {
    if (tab !== activeTab) {
      setTabHistory((prev) => [...prev, tab]);
      setActiveTab(tab);
    }
  };

  const handleGoBack = () => {
    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop();
      const previousTab = newHistory[newHistory.length - 1] || 'feed';
      setTabHistory(newHistory);
      setActiveTab(previousTab);
    } else {
      setActiveTab('feed');
      setTabHistory(['feed']);
    }
  };

  // Official Pages State
  const [officialPages, setOfficialPages] = useState<OfficialPage[]>(() => {
    const saved = safeGetItem('africhat_official_pages', '');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_OFFICIAL_PAGES;
  });
  const [isCreatePageOpen, setIsCreatePageOpen] = useState<boolean>(false);

  // Live Video Streaming State
  const [liveStreams, setLiveStreams] = useState<LiveStreamSession[]>(INITIAL_LIVE_STREAMS);
  const [isLiveStudioOpen, setIsLiveStudioOpen] = useState<boolean>(false);
  const [selectedLiveSession, setSelectedLiveSession] = useState<LiveStreamSession | null>(null);
  const [liveStudioMode, setLiveStudioMode] = useState<'broadcaster' | 'viewer'>('broadcaster');

  // Founder Information & Support State
  const [founderInfo, setFounderInfo] = useState<FounderInfo>(() => {
    const saved = safeGetItem('africhat_founder_info', '');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_FOUNDER_INFO,
          ...parsed,
          location: parsed.location && parsed.location.includes('Portugal') ? parsed.location : DEFAULT_FOUNDER_INFO.location,
          whatsappNumber: parsed.whatsappNumber && parsed.whatsappNumber.includes('351') ? parsed.whatsappNumber : DEFAULT_FOUNDER_INFO.whatsappNumber,
          phoneNumber: parsed.phoneNumber && parsed.phoneNumber.includes('351') ? parsed.phoneNumber : DEFAULT_FOUNDER_INFO.phoneNumber,
        };
      } catch (e) {}
    }
    return DEFAULT_FOUNDER_INFO;
  });
  const [isFounderModalOpen, setIsFounderModalOpen] = useState<boolean>(false);

  // Contacts & Friends Directory State
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isContactProfileOpen, setIsContactProfileOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [reportTickets, setReportTickets] = useState<ReportTicket[]>([]);

  // Test Cloud Firestore connection and synchronize initial conversations to Cloud
  useEffect(() => {
    const initCloudDatabase = async () => {
      try {
        await testFirestoreConnection();
        await syncInitialConversationsToFirestore(INITIAL_CONVERSATIONS);
      } catch (e) {
        console.warn('Cloud Firestore initialization check:', e);
      }
    };
    initCloudDatabase();
  }, []);

  // Real-time Firestore & Supabase listener for active conversation messages
  const currentActiveChatId = selectedChatId || (conversations.length > 0 ? conversations[0].id : null);
  useEffect(() => {
    if (!currentActiveChatId) return;

    // 1. Fetch initial messages from Supabase
    supabaseFetchMessages(currentActiveChatId).then((res) => {
      if (res.data && res.data.length > 0) {
        const mappedMessages: Message[] = res.data.map((row: any) => ({
          id: row.id,
          senderId: row.sender_id,
          senderName: row.sender_name || 'Membre AfriChat',
          senderAvatar: row.sender_avatar || '',
          text: row.text,
          mediaUrl: row.media_url,
          mediaType: row.media_type,
          timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        }));

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === currentActiveChatId) {
              const existingMsgMap = new Map<string, Message>();
              conv.messages.forEach((m) => existingMsgMap.set(m.id, m));
              mappedMessages.forEach((m) => existingMsgMap.set(m.id, m));
              const merged = Array.from(existingMsgMap.values());
              return {
                ...conv,
                messages: merged,
                lastMessage: merged[merged.length - 1]?.text || conv.lastMessage,
                lastMessageTime: merged[merged.length - 1]?.timestamp || conv.lastMessageTime,
              };
            }
            return conv;
          })
        );
      }
    });

    // 2. Realtime listener from Supabase
    const unsubscribeSupabase = supabaseSubscribeMessages(currentActiveChatId, (newRow) => {
      if (newRow) {
        const receivedMsg: Message = {
          id: newRow.id,
          senderId: newRow.sender_id,
          senderName: newRow.sender_name || 'Membre AfriChat',
          senderAvatar: newRow.sender_avatar || '',
          text: newRow.text,
          mediaUrl: newRow.media_url,
          mediaType: newRow.media_type,
          timestamp: new Date(newRow.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent',
        };

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === currentActiveChatId) {
              if (conv.messages.some((m) => m.id === receivedMsg.id)) return conv;
              const nextMsgs = [...conv.messages, receivedMsg];
              return {
                ...conv,
                messages: nextMsgs,
                lastMessage: receivedMsg.text || conv.lastMessage,
                lastMessageTime: receivedMsg.timestamp,
              };
            }
            return conv;
          })
        );
      }
    });

    // 3. Realtime listener from Firestore
    const unsubscribeFirestore = subscribeToConversationMessages(currentActiveChatId, (cloudMessages) => {
      if (cloudMessages && cloudMessages.length > 0) {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === currentActiveChatId) {
              const existingMsgMap = new Map<string, Message>();
              conv.messages.forEach((m) => existingMsgMap.set(m.id, m));
              cloudMessages.forEach((cm) => existingMsgMap.set(cm.id, cm));
              const mergedMessages = Array.from(existingMsgMap.values());

              return {
                ...conv,
                messages: mergedMessages,
                lastMessage: mergedMessages[mergedMessages.length - 1]?.text || conv.lastMessage,
                lastMessageTime: mergedMessages[mergedMessages.length - 1]?.timestamp || conv.lastMessageTime,
              };
            }
            return conv;
          })
        );
      }
    });

    return () => {
      unsubscribeSupabase();
      unsubscribeFirestore();
    };
  }, [currentActiveChatId]);

  // Security Toast Notification
  const [securityToast, setSecurityToast] = useState<{
    show: boolean;
    type: 'success' | 'danger' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  const triggerSecurityToast = (message: string, type: 'success' | 'danger' | 'info' = 'info') => {
    setSecurityToast({ show: true, type, message });
    setTimeout(() => {
      setSecurityToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Synchronization of Community Users & Realtime Profile updates (Supabase + Firestore)
  const [isRefreshingUsers, setIsRefreshingUsers] = useState<boolean>(false);
  const [supabaseUsersCount, setSupabaseUsersCount] = useState<number>(0);

  const fetchSupabaseUsers = async (showToast: boolean = false) => {
    try {
      setIsRefreshingUsers(true);
      const [supaRes, firestoreUsers] = await Promise.allSettled([
        supabaseFetchAllProfiles(),
        getAllRegisteredUsersFromFirestore(),
      ]);

      const supaProfiles = supaRes.status === 'fulfilled' ? supaRes.value.data || [] : [];
      const fbUsers = firestoreUsers.status === 'fulfilled' ? firestoreUsers.value || [] : [];

      const contactMap = new Map<string, Contact>();

      // 1. Merge Supabase profiles
      supaProfiles.forEach((supaContact) => {
        if (supaContact.id !== currentUser.id && supaContact.username.toLowerCase() !== currentUser.username.toLowerCase()) {
          contactMap.set(supaContact.id || supaContact.username.toLowerCase(), supaContact);
        }
      });

      // 2. Merge Firestore users
      fbUsers.forEach((fbUser) => {
        if (fbUser.id !== currentUser.id && fbUser.username.toLowerCase() !== currentUser.username.toLowerCase()) {
          const key = fbUser.id || fbUser.username.toLowerCase();
          const existing = contactMap.get(key);
          const fbContact: Contact = {
            id: fbUser.id,
            userId: fbUser.id,
            name: fbUser.name,
            username: fbUser.username,
            avatar: fbUser.avatar,
            country: fbUser.country,
            flag: fbUser.flag,
            phoneNumber: fbUser.phoneNumber || '',
            bio: fbUser.bio || 'Membre vérifié sur AfriChat 🌍',
            isOnline: true,
            lastSeen: 'En ligne',
            isVIP: fbUser.isVIP,
            isVerified: fbUser.isVerified,
            isFriend: existing ? existing.isFriend : false,
            isBlocked: existing ? existing.isBlocked : false,
            reportsCount: 0,
            mutualFriendsCount: existing ? existing.mutualFriendsCount : 3,
            category: fbUser.isVIP ? 'creator' : 'friend',
          };
          contactMap.set(key, { ...(existing || {}), ...fbContact });
        }
      });

      const mergedList = Array.from(contactMap.values());
      setSupabaseUsersCount(mergedList.length);

      setContacts((prevContacts) => {
        if (mergedList.length === 0) {
          return prevContacts.filter((c) => !c.id.startsWith('mock_'));
        }
        return mergedList.map((m) => {
          const prev = prevContacts.find((c) => c.id === m.id || c.username.toLowerCase() === m.username.toLowerCase());
          if (prev) {
            return {
              ...m,
              isFriend: prev.isFriend,
              isBlocked: prev.isBlocked,
            };
          }
          return m;
        });
      });

      if (showToast) {
        triggerSecurityToast(`👥 ${mergedList.length} membres et nouveaux inscrits synchronisés en temps réel !`, 'success');
      }
    } catch (err) {
      console.warn('Error fetching users:', err);
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  // Initial fetch and Realtime subscription to new user registrations from both Supabase & Firestore
  useEffect(() => {
    fetchSupabaseUsers();

    // Helper to propagate profile changes (photo/name/VIP) across conversations, posts & reels
    const propagateUserUpdateToUI = (
      userId: string,
      name: string,
      username?: string,
      avatar?: string,
      country?: string,
      flag?: string,
      isVIP?: boolean
    ) => {
      if (!userId && !username) return;

      // Update conversations and message avatars
      setConversations((prev) =>
        prev.map((conv) => {
          let updatedConv = conv;
          const isDirectMatch =
            conv.type === 'direct' &&
            (conv.participantIds.includes(userId) ||
              (name && conv.name.toLowerCase() === name.toLowerCase()));

          if (isDirectMatch) {
            updatedConv = {
              ...updatedConv,
              name: name || conv.name,
              avatar: avatar || conv.avatar,
            };
          }

          const updatedMessages = updatedConv.messages.map((m) => {
            if (
              m.senderId === userId ||
              (name && m.senderName && m.senderName.toLowerCase() === name.toLowerCase())
            ) {
              return {
                ...m,
                senderName: name || m.senderName,
                senderAvatar: avatar || m.senderAvatar,
              };
            }
            return m;
          });

          return { ...updatedConv, messages: updatedMessages };
        })
      );

      // Update posts authored by this user
      setPosts((prev) =>
        prev.map((p) => {
          if (
            p.userId === userId ||
            p.author.id === userId ||
            (username && p.author.username?.toLowerCase() === username.toLowerCase())
          ) {
            return {
              ...p,
              author: {
                ...p.author,
                name: name || p.author.name,
                username: username || p.author.username,
                avatar: avatar || p.author.avatar,
                country: country || p.author.country,
                flag: flag || p.author.flag,
                isVIPCreator: isVIP !== undefined ? isVIP : p.author.isVIPCreator,
              },
            };
          }
          return p;
        })
      );

      // Update reels authored by this user
      setReels((prev) =>
        prev.map((r) => {
          if (
            r.userId === userId ||
            r.author.id === userId ||
            (username && r.author.username?.toLowerCase() === username.toLowerCase())
          ) {
            return {
              ...r,
              author: {
                ...r.author,
                name: name || r.author.name,
                username: username || r.author.username,
                avatar: avatar || r.author.avatar,
                country: country || r.author.country,
                flag: flag || r.author.flag,
                isVIPCreator: isVIP !== undefined ? isVIP : r.author.isVIPCreator,
              },
            };
          }
          return r;
        })
      );
    };

    // 1. Setup Supabase Realtime channel for instant profile broadcasts
    const unsubscribeSupabase = supabaseSubscribeProfiles((newContact, eventType) => {
      // If current user modified profile on another device, sync local currentUser state
      if (newContact.id === currentUser.id || newContact.userId === currentUser.id) {
        setCurrentUser((prev) => ({
          ...prev,
          name: newContact.name || prev.name,
          username: newContact.username || prev.username,
          avatar: newContact.avatar || prev.avatar,
          country: newContact.country || prev.country,
          flag: newContact.flag || prev.flag,
          bio: newContact.bio !== undefined ? newContact.bio : prev.bio,
          isVIP: newContact.isVIP !== undefined ? newContact.isVIP : prev.isVIP,
        }));
        propagateUserUpdateToUI(
          newContact.id,
          newContact.name,
          newContact.username,
          newContact.avatar,
          newContact.country,
          newContact.flag,
          newContact.isVIP
        );
        return;
      }

      if (eventType === 'INSERT') {
        setContacts((prev) => {
          const exists = prev.some(
            (c) =>
              c.id === newContact.id ||
              c.username.toLowerCase() === newContact.username.toLowerCase()
          );
          if (!exists) {
            triggerSecurityToast(
              `🎉 Nouveau membre inscrit sur AfriChat : ${newContact.name} (${newContact.flag}) !`,
              'info'
            );
            return [newContact, ...prev];
          }
          return prev;
        });
      } else if (eventType === 'UPDATE') {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === newContact.id ||
            c.username.toLowerCase() === newContact.username.toLowerCase()
              ? { ...c, ...newContact }
              : c
          )
        );
      }

      propagateUserUpdateToUI(
        newContact.id,
        newContact.name,
        newContact.username,
        newContact.avatar,
        newContact.country,
        newContact.flag,
        newContact.isVIP
      );
    });

    // 2. Setup Firestore Realtime listener for registered users
    const unsubscribeFirestoreUsers = subscribeToAllRegisteredUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        // Sync current user if changed from another device
        const matchedCurrent = cloudUsers.find(
          (u) =>
            u.id === currentUser.id ||
            (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
        );
        if (matchedCurrent) {
          setCurrentUser((prev) => ({
            ...prev,
            name: matchedCurrent.name || prev.name,
            username: matchedCurrent.username || prev.username,
            avatar: matchedCurrent.avatar || prev.avatar,
            country: matchedCurrent.country || prev.country,
            flag: matchedCurrent.flag || prev.flag,
            bio: matchedCurrent.bio !== undefined ? matchedCurrent.bio : prev.bio,
            isVIP: matchedCurrent.isVIP !== undefined ? matchedCurrent.isVIP : prev.isVIP,
          }));
          propagateUserUpdateToUI(
            matchedCurrent.id,
            matchedCurrent.name,
            matchedCurrent.username,
            matchedCurrent.avatar,
            matchedCurrent.country,
            matchedCurrent.flag,
            matchedCurrent.isVIP
          );
        }

        setContacts((prevContacts) => {
          const map = new Map<string, Contact>();
          prevContacts.forEach((c) => map.set(c.id, c));

          cloudUsers.forEach((fbUser) => {
            if (
              fbUser.id !== currentUser.id &&
              fbUser.username.toLowerCase() !== currentUser.username.toLowerCase()
            ) {
              const existing = map.get(fbUser.id);
              map.set(fbUser.id, {
                id: fbUser.id,
                userId: fbUser.id,
                name: fbUser.name,
                username: fbUser.username,
                avatar: fbUser.avatar,
                country: fbUser.country,
                flag: fbUser.flag,
                phoneNumber: fbUser.phoneNumber || '',
                bio: fbUser.bio || 'Membre vérifié sur AfriChat 🌍',
                isOnline: true,
                lastSeen: 'En ligne',
                isVIP: fbUser.isVIP,
                isVerified: fbUser.isVerified,
                isFriend: existing ? existing.isFriend : false,
                isBlocked: existing ? existing.isBlocked : false,
                reportsCount: 0,
                mutualFriendsCount: existing ? existing.mutualFriendsCount : 4,
                category: fbUser.isVIP ? 'creator' : 'friend',
              });

              propagateUserUpdateToUI(
                fbUser.id,
                fbUser.name,
                fbUser.username,
                fbUser.avatar,
                fbUser.country,
                fbUser.flag,
                fbUser.isVIP
              );
            }
          });

          return Array.from(map.values());
        });
      }
    });

    // Auto-refresh polling every 20 seconds to guarantee fresh updates
    const interval = setInterval(() => {
      fetchSupabaseUsers(false);
    }, 20000);

    // Fetch list of blocked users for the current account from Supabase
    if (currentUser.id) {
      supabaseFetchBlockedUserIds(currentUser.id).then((blockedIds) => {
        if (blockedIds && blockedIds.length > 0) {
          setCurrentUser((prev) => ({
            ...prev,
            blockedUserIds: Array.from(new Set([...(prev.blockedUserIds || []), ...blockedIds])),
          }));
          setContacts((prev) =>
            prev.map((c) => ({
              ...c,
              isBlocked: blockedIds.includes(c.id) || blockedIds.includes(c.userId) || c.isBlocked,
            }))
          );
        }
      });
    }

    return () => {
      unsubscribeSupabase();
      unsubscribeFirestoreUsers();
      clearInterval(interval);
    };
  }, [currentUser.id, currentUser.username]);

  // Real-time synchronization of active Live Streams from Supabase
  useEffect(() => {
    supabaseFetchLiveStreams().then((res) => {
      if (res && res.data) {
        setLiveStreams(res.data);
      }
    });

    const unsubscribe = supabaseSubscribeLiveStreams((streams) => {
      setLiveStreams(streams);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch real posts from Supabase on startup and subscribe in realtime
  useEffect(() => {
    supabaseFetchPosts(50).then((res) => {
      if (res.data && res.data.length > 0) {
        setPosts((prev) => {
          const map = new Map<string, Post>();
          res.data.forEach((p) => map.set(p.id, p));
          // Keep any locally created posts if any
          prev.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          return Array.from(map.values());
        });

        const videoPosts = res.data.filter((p) => p.mediaType === 'video');
        if (videoPosts.length > 0) {
          setReels(videoPosts);
        }
      }
    });

    const unsubscribePosts = supabaseSubscribePosts((post, eventType) => {
      if (eventType === 'INSERT') {
        setPosts((prev) => {
          if (prev.some((p) => p.id === post.id)) return prev;
          return [post, ...prev];
        });
        if (post.mediaType === 'video') {
          setReels((prev) => {
            if (prev.some((r) => r.id === post.id)) return prev;
            return [post, ...prev];
          });
        }
      } else if (eventType === 'UPDATE') {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...post } : p)));
        setReels((prev) => prev.map((r) => (r.id === post.id ? { ...r, ...post } : r)));
      } else if (eventType === 'DELETE') {
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        setReels((prev) => prev.filter((r) => r.id !== post.id));
      }
    });

    return () => {
      unsubscribePosts();
    };
  }, []);

  // Fetch real 24h stories from Supabase on startup and subscribe in realtime
  useEffect(() => {
    supabaseFetchStories().then((res) => {
      if (res.data && res.data.length > 0) {
        setStories((prev) => {
          const map = new Map<string, Story>();
          res.data.forEach((s) => map.set(s.id, s));
          prev.forEach((s) => {
            if (!map.has(s.id)) map.set(s.id, s);
          });
          return Array.from(map.values());
        });
      }
    });

    const unsubscribeStories = supabaseSubscribeStories((story, eventType) => {
      if (eventType === 'INSERT') {
        setStories((prev) => {
          if (prev.some((s) => s.id === story.id)) return prev;
          return [story, ...prev];
        });
      } else if (eventType === 'DELETE') {
        setStories((prev) => prev.filter((s) => s.id !== story.id));
      }
    });

    return () => {
      unsubscribeStories();
    };
  }, []);

  // Stripe VIP Modal & Receipt Detail State
  const [isStripePaymentOpen, setIsStripePaymentOpen] = useState(false);
  const [stripeInitialPlanId, setStripeInitialPlanId] = useState<string>('vip_quarterly');
  const [selectedReceiptTransaction, setSelectedReceiptTransaction] = useState<Transaction | null>(null);

  // Flutterwave Mobile Money VIP Modal State
  const [isFlutterwaveVipOpen, setIsFlutterwaveVipOpen] = useState(false);
  const [flutterwaveInitialPlanId, setFlutterwaveInitialPlanId] = useState<string>('vip_quarterly');

  const handleOpenFlutterwaveVip = (planId?: string) => {
    if (planId) setFlutterwaveInitialPlanId(planId);
    setIsFlutterwaveVipOpen(true);
  };

  const handleFlutterwaveVipSuccess = (transaction: Transaction, activatedPlan: StripeVipPlan) => {
    setCurrentUser((prev) => ({ ...prev, isVIP: true }));
    setTransactions((prev) => [transaction, ...prev]);
    setAdSettings((prev) => ({ ...prev, isVipAdFree: true }));

    // Update posts authored by current user to show VIP Gold badge
    setPosts((prev) =>
      prev.map((p) => {
        if (p.userId === currentUser.id) {
          return {
            ...p,
            author: {
              ...p.author,
              isVIPCreator: true,
            },
          };
        }
        return p;
      })
    );

    triggerSecurityToast(
      `⭐ Félicitations ! Votre abonnement ${activatedPlan.name} est activé avec succès via Flutterwave Mobile Money.`,
      'success'
    );
  };

  // Theme State: 'dark' or 'light'
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    const saved = safeGetItem('africhat_theme', 'dark');
    return (saved === 'light' || saved === 'dark') ? (saved as AppTheme) : 'dark';
  });

  // Settings Modal & Active Tab
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'appearance' | 'notifications' | 'ads'>('profile');

  // Ads & Monetization Module State
  const [ads, setAds] = useState<AdItem[]>(INITIAL_ADS);
  const [adSettings, setAdSettings] = useState<AdSettings>(() => {
    try {
      const saved = safeGetItem('africhat_ad_settings', '');
      return saved ? JSON.parse(saved) : INITIAL_AD_SETTINGS;
    } catch {
      return INITIAL_AD_SETTINGS;
    }
  });
  const [selectedAdForDetail, setSelectedAdForDetail] = useState<AdItem | null>(null);

  const handleOpenStripePayment = (planId?: string) => {
    if (planId) setStripeInitialPlanId(planId);
    setIsStripePaymentOpen(true);
  };

  const handleStripePaymentSuccess = (transaction: Transaction, activatedPlan: StripeVipPlan) => {
    setCurrentUser((prev) => ({ ...prev, isVIP: true }));
    setTransactions((prev) => [transaction, ...prev]);
    setAdSettings((prev) => ({ ...prev, isVipAdFree: true }));
    
    // Update posts authored by current user to show VIP Gold badge
    setPosts((prev) =>
      prev.map((p) => {
        if (p.userId === currentUser.id) {
          return {
            ...p,
            author: {
              ...p.author,
              isVIPCreator: true,
            },
          };
        }
        return p;
      })
    );

    triggerSecurityToast(
      `⭐ Félicitations ! Votre abonnement ${activatedPlan.name} est activé avec succès via Stripe (Carte/Apple Pay/Google Pay).`,
      'success'
    );
  };


  const handleUpdateAdSettings = (newSettings: AdSettings) => {
    setAdSettings(newSettings);
    try {
      localStorage.setItem('africhat_ad_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdDetail = (ad: AdItem) => {
    setSelectedAdForDetail(ad);
  };

  const handleOpenAdSettings = () => {
    setSettingsInitialTab('ads');
    setIsSettingsOpen(true);
  };

  const handleDismissAdBanner = (adId: string) => {
    // Dismiss ad for session or rotate
  };

  // Group & Super Admin State
  const [selectedGroupForRoles, setSelectedGroupForRoles] = useState<ChatConversation | null>(null);
  const [isGroupRolesOpen, setIsGroupRolesOpen] = useState(false);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(() => {
    try {
      return (
        window.location.pathname.startsWith('/admin') ||
        window.location.hash.includes('admin') ||
        window.location.search.includes('admin')
      );
    } catch {
      return false;
    }
  });
  const [globalAdmins, setGlobalAdmins] = useState<GlobalAdminUser[]>(INITIAL_GLOBAL_ADMINS);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);

  // Synchronize /admin URL path with browser history
  useEffect(() => {
    const handleUrlCheck = () => {
      const isPathAdmin = window.location.pathname.startsWith('/admin') || window.location.hash.includes('admin');
      if (isPathAdmin && !isAdminPortalOpen) {
        setIsAdminPortalOpen(true);
      }
    };

    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('hashchange', handleUrlCheck);
    return () => {
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('hashchange', handleUrlCheck);
    };
  }, [isAdminPortalOpen]);

  const handleOpenAdminPortal = () => {
    try {
      window.history.pushState(null, '', '/admin');
    } catch {
      // ignore
    }
    setIsAdminPortalOpen(true);
  };

  const handleCloseAdminPortal = () => {
    try {
      window.history.pushState(null, '', '/');
    } catch {
      // ignore
    }
    setIsAdminPortalOpen(false);
  };

  const handleOpenGroupRoles = (conversation: ChatConversation) => {
    setSelectedGroupForRoles(conversation);
    setIsGroupRolesOpen(true);
  };

  const handleUpdateConversation = (conversationId: string, updatedFields: Partial<ChatConversation>) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, ...updatedFields } : c))
    );
    if (selectedGroupForRoles && selectedGroupForRoles.id === conversationId) {
      setSelectedGroupForRoles((prev) => (prev ? { ...prev, ...updatedFields } : null));
    }
  };

  const handleOpenSuperAdmin = () => {
    setIsSuperAdminOpen(true);
  };

  const handleUpdateGlobalAdmins = (updatedAdmins: GlobalAdminUser[]) => {
    setGlobalAdmins(updatedAdmins);
  };

  const handleUpdateSystemSettings = (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
  };

  // Synchronize document theme class
  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(currentTheme === 'light' ? 'theme-light' : 'theme-dark');
    localStorage.setItem('africhat_theme', currentTheme);
  }, [currentTheme]);

  const handleToggleTheme = (theme: AppTheme) => {
    setCurrentTheme(theme);
  };

  // Web TV State & Visibility Boost
  const [webTvChannels, setWebTvChannels] = useState<WebTvChannel[]>(INITIAL_WEBTV_CHANNELS);
  const [isWebTvBoostModalOpen, setIsWebTvBoostModalOpen] = useState(false);
  const [selectedWebTvBoostChannel, setSelectedWebTvBoostChannel] = useState<WebTvChannel | null>(null);

  const handleOpenWebTvBoost = (channel?: WebTvChannel) => {
    setSelectedWebTvBoostChannel(channel || webTvChannels[0] || null);
    setIsWebTvBoostModalOpen(true);
  };

  const handleWebTvBoostSuccess = (channelId: string, plan: WebTvBoostPlan, transaction: Transaction) => {
    setWebTvChannels((prev) =>
      prev.map((c) => {
        if (c.id === channelId) {
          return {
            ...c,
            isBoosted: true,
            boostTier: plan.id,
            viewersCount: c.viewersCount + Math.floor(Math.random() * 500 + 200),
          };
        }
        return c;
      })
    );
    setTransactions((prev) => [transaction, ...prev]);
    triggerSecurityToast(`🚀 Boost Web TV ${plan.name} activé avec succès pour votre chaîne !`, 'success');
  };

  // Accès VIP Star Modal State (2 € DM / 3 € Call)
  const [isVipStarModalOpen, setIsVipStarModalOpen] = useState(false);
  const [selectedVipStar, setSelectedVipStar] = useState<any>(null);
  const [vipStarServiceType, setVipStarServiceType] = useState<'direct_message' | 'call_reservation'>('direct_message');

  const handleOpenStarVip = (star: any, serviceType: 'direct_message' | 'call_reservation' = 'direct_message') => {
    setSelectedVipStar(star);
    setVipStarServiceType(serviceType);
    setIsVipStarModalOpen(true);
  };

  const handleStarVipSuccess = (bookingType: 'direct_message' | 'call_reservation', transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev]);

    if (bookingType === 'direct_message') {
      // Find or create direct VIP conversation with the star
      const starName = selectedVipStar?.name || 'Star VIP';
      const existingConv = conversations.find(c => c.name.toLowerCase().includes(starName.toLowerCase()));
      if (existingConv) {
        setSelectedChatId(existingConv.id);
        setActiveTab('messages');
      } else {
        const newConvId = `vip_dm_${Date.now()}`;
        const newConv: ChatConversation = {
          id: newConvId,
          type: 'direct',
          name: `${starName} 👑 (VIP DM)`,
          avatar: selectedVipStar?.avatar || '',
          participantIds: ['user_me', selectedVipStar?.id || 'star_user'],
          unreadCount: 0,
          lastMessage: '🎉 Accès Message Direct VIP Débloqué ! Envoyez votre message.',
          lastMessageTime: 'À l’instant',
          messages: [
            {
              id: `m_welcome_${Date.now()}`,
              senderId: selectedVipStar?.id || 'star_user',
              senderName: starName,
              senderAvatar: selectedVipStar?.avatar,
              text: `Bonjour ! Bienvenue sur ma ligne VIP directe prioritaire. Comment puis-je vous aider ? ✨`,
              timestamp: 'À l’instant',
              status: 'read',
              isVipMessage: true,
            }
          ]
        };
        setConversations(prev => [newConv, ...prev]);
        setSelectedChatId(newConvId);
        setActiveTab('messages');
      }
      triggerSecurityToast(`👑 Accès Message Direct VIP avec ${starName} débloqué avec succès (2 €) !`, 'success');
    } else {
      triggerSecurityToast(`📞 Réservation d'appel VIP 1-à-1 confirmée avec ${selectedVipStar?.name || 'la star'} (3 €) !`, 'success');
    }
  };

  // Story Viewer & Story Creator Modal
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState<boolean>(false);

  // Create Post Modal
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Create Group / VIP Salon Modal
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Audio / Video Call Modal State
  const [callState, setCallState] = useState<{
    isOpen: boolean;
    callType: 'audio' | 'video';
    conversation: ChatConversation | null;
  }>({
    isOpen: false,
    callType: 'audio',
    conversation: null,
  });

  // Mobile Money Checkout Modal State
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    amount: number;
    currency?: string;
    itemType: 'vip_post' | 'vip_reel' | 'vip_salon' | 'tip' | 'deposit';
    targetId?: string;
    creatorName?: string;
    creatorAvatar?: string;
  }>({
    isOpen: false,
    title: '',
    amount: 1000,
    itemType: 'vip_post',
  });

  // Calculate unread messages
  const totalUnreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Handle Like Post
  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1,
          };
        }
        return p;
      })
    );
  };

  // Handle Like Reel
  const handleLikeReel = (reelId: string) => {
    setReels((prev) =>
      prev.map((r) => {
        if (r.id === reelId) {
          const isLiked = !r.isLiked;
          return {
            ...r,
            isLiked,
            likesCount: isLiked ? r.likesCount + 1 : r.likesCount - 1,
          };
        }
        return r;
      })
    );
  };

  // Handle Add Comment
  const handleAddComment = (postId: string, text: string) => {
    const newComment = {
      id: `c_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userFlag: currentUser.flag,
      content: text,
      timestamp: 'À l’instant',
      likes: 0,
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...(p.comments || []), newComment],
          };
        }
        return p;
      })
    );

    setReels((prev) =>
      prev.map((r) => {
        if (r.id === postId) {
          return {
            ...r,
            commentsCount: r.commentsCount + 1,
            comments: [...(r.comments || []), newComment],
          };
        }
        return r;
      })
    );
  };

  // Handle Send Message (Direct chat, VIP Salon, or Game Challenge)
  const handleSendMessage = (
    conversationId: string, 
    text?: string, 
    audioDuration?: string,
    gameChallenge?: GameChallengeData
  ) => {
    const targetChat = conversations.find((c) => c.id === conversationId);
    
    // Check if recipient is blocked
    if (targetChat && targetChat.type === 'direct') {
      const isBlocked = contacts.some(
        (c) =>
          (targetChat.participantIds.includes(c.userId) ||
            c.name.toLowerCase() === targetChat.name.toLowerCase()) &&
          c.isBlocked
      );
      if (isBlocked) {
        triggerSecurityToast(
          `🚫 Impossible d'envoyer un message : ce contact est actuellement bloqué. Débloquez-le d'abord.`,
          'danger'
        );
        return;
      }
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: text || (gameChallenge ? `🎮 Défi Morpion lancé par ${currentUser.name} !` : ''),
      audioDuration: audioDuration,
      mediaType: audioDuration ? ('audio' as const) : undefined,
      timestamp: 'À l’instant',
      status: 'sent' as const,
      isVipMessage: currentUser.isVIP,
      gameChallenge: gameChallenge,
    };

    // 1. Immediately persist message to Cloud Firestore & Supabase database
    saveMessageToFirestore(conversationId, newMsg);
    syncMessageToSupabase(conversationId, newMsg).catch((e) => {
      console.warn('Supabase message sync notice:', e);
    });

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: text || (gameChallenge ? '🎮 Défi Morpion lancé' : `🎙️ Note vocale (${audioDuration})`),
            lastMessageTime: 'À l’instant',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );
  };

  // Launch or Join a Morpion (Tic-Tac-Toe) Challenge
  const handleOpenGameChallenge = (opponent?: Contact | User | null, existingGameId?: string, stakeFcfa: number = 0) => {
    const targetOpponent = opponent || null;
    const gameId = existingGameId || `tictactoe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    setGameOpponent(targetOpponent);
    setActiveGameId(gameId);
    setGameStake(stakeFcfa);
    setIsGameModalOpen(true);

    // If opponent exists and this is a brand new challenge (not joining an existing gameId), send a challenge card into chat
    if (targetOpponent && !existingGameId) {
      const oppUserId = (targetOpponent as Contact).userId || targetOpponent.id;
      let targetConv = conversations.find((c) => 
        c.participantIds?.includes(oppUserId) || 
        c.name.toLowerCase() === targetOpponent.name.toLowerCase()
      );

      const challengeData: GameChallengeData = {
        gameId,
        gameType: 'tictactoe',
        challengerId: currentUser.id,
        challengerName: currentUser.name,
        challengerAvatar: currentUser.avatar,
        opponentId: oppUserId,
        opponentName: targetOpponent.name,
        stakeFcfa,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      if (targetConv) {
        handleSendMessage(targetConv.id, '', undefined, challengeData);
      } else {
        const initMsg: Message = {
          id: `msg_game_${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          text: `🎮 Défi Morpion lancé par ${currentUser.name} !`,
          timestamp: 'À l’instant',
          status: 'sent',
          gameChallenge: challengeData,
        };

        const newConv: ChatConversation = {
          id: `conv_${Date.now()}`,
          type: 'direct',
          name: targetOpponent.name,
          avatar: targetOpponent.avatar,
          lastMessage: '🎮 Défi Morpion lancé',
          lastMessageTime: 'À l’instant',
          unreadCount: 0,
          participantIds: [currentUser.id, oppUserId],
          messages: [initMsg],
          isOnline: (targetOpponent as Contact).isOnline || false,
        };

        saveConversationToFirestore(newConv);
        saveMessageToFirestore(newConv.id, initMsg);
        setConversations((prev) => [newConv, ...prev]);
      }

      triggerSecurityToast(`⚔️ Défi Morpion envoyé à ${targetOpponent.name} ! Préparez-vous à jouer ! 🎮`, 'success');
    }
  };

  // Contacts Handlers
  const handleToggleFriend = async (contactId: string) => {
    const targetContact = contacts.find((c) => c.id === contactId || c.userId === contactId);
    const targetId = targetContact?.userId || targetContact?.id || contactId;
    const currentIsFriend = targetContact ? targetContact.isFriend : false;
    const newStatus = !currentIsFriend;

    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === contactId || c.userId === contactId) {
          return { ...c, isFriend: newStatus };
        }
        return c;
      })
    );

    if (selectedContact && (selectedContact.id === contactId || selectedContact.userId === contactId)) {
      setSelectedContact((prev) => (prev ? { ...prev, isFriend: newStatus } : null));
    }

    triggerSecurityToast(
      newStatus
        ? `${targetContact?.name || 'Le contact'} a été ajouté(e) à vos amis ! 👥`
        : `${targetContact?.name || 'Le contact'} a été retiré(e) de vos amis.`,
      'info'
    );

    // Save to Cloud Firestore & Supabase database
    await saveUserFriendInFirestore(currentUser.id, targetId, newStatus);
    await supabaseSaveFriendship(currentUser.id, targetId, newStatus);
  };

  const handleToggleBlock = async (contactIdOrUserId: string) => {
    const targetContact = contacts.find(
      (c) => c.id === contactIdOrUserId || c.userId === contactIdOrUserId || c.username.toLowerCase() === contactIdOrUserId.toLowerCase()
    );
    const targetId = targetContact?.userId || targetContact?.id || contactIdOrUserId;
    const currentIsBlocked = targetContact ? targetContact.isBlocked : (currentUser.blockedUserIds || []).includes(targetId);
    const newBlocked = !currentIsBlocked;

    if (newBlocked) {
      await supabaseBlockUser(currentUser.id, targetId);
      triggerSecurityToast(
        `🛡️ ${targetContact?.name || 'L\'utilisateur'} a été bloqué(e). Ses messages et publications sont désormais instantanément masqués pour vous.`,
        'danger'
      );
    } else {
      await supabaseUnblockUser(currentUser.id, targetId);
      triggerSecurityToast(
        `🔓 ${targetContact?.name || 'L\'utilisateur'} a été débloqué(e). Ses messages et publications sont à nouveau visibles.`,
        'success'
      );
    }

    setCurrentUser((prev) => {
      const existing = new Set(prev.blockedUserIds || []);
      if (newBlocked) {
        existing.add(targetId);
        if (targetContact?.id) existing.add(targetContact.id);
        if (targetContact?.userId) existing.add(targetContact.userId);
      } else {
        existing.delete(targetId);
        if (targetContact?.id) existing.delete(targetContact.id);
        if (targetContact?.userId) existing.delete(targetContact.userId);
      }
      return { ...prev, blockedUserIds: Array.from(existing) };
    });

    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === contactIdOrUserId || c.userId === contactIdOrUserId || c.id === targetId || c.userId === targetId) {
          return { ...c, isBlocked: newBlocked };
        }
        return c;
      })
    );

    if (selectedContact && (selectedContact.id === contactIdOrUserId || selectedContact.userId === contactIdOrUserId || selectedContact.id === targetId || selectedContact.userId === targetId)) {
      setSelectedContact((prev) => (prev ? { ...prev, isBlocked: newBlocked } : null));
    }
  };

  const handleAddContact = (contactData: Partial<Contact>) => {
    const newContact: Contact = {
      id: `c_${Date.now()}`,
      userId: `user_${Date.now()}`,
      name: contactData.name || 'Nouveau Contact',
      username: contactData.username || `@user${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: contactData.avatar || '',
      phoneNumber: contactData.phoneNumber || '+225 00 00 00 00',
      country: contactData.country || 'Côte d’Ivoire',
      flag: contactData.flag || '🇨🇮',
      bio: contactData.bio || 'Utilisateur passionné sur AfriChat Connect.',
      isVIP: false,
      isVerified: false,
      isOnline: true,
      isBlocked: false,
      isFriend: true,
    };

    setContacts((prev) => [newContact, ...prev]);
    triggerSecurityToast(`Nouveau contact ${newContact.name} ajouté avec succès ! 🎉`, 'success');
  };

  const handleOpenAuthorProfile = (author: { id: string; name: string; username: string; avatar: string; country?: string; flag?: string }) => {
    let existingContact = contacts.find(
      (c) => c.userId === author.id || c.name.toLowerCase() === author.name.toLowerCase()
    );
    if (!existingContact) {
      existingContact = {
        id: `c_author_${author.id || Date.now()}`,
        userId: author.id || `user_${Date.now()}`,
        name: author.name,
        username: author.username,
        avatar: author.avatar,
        phoneNumber: '+225 07 •• •• ••',
        country: author.country || 'Côte d’Ivoire',
        flag: author.flag || '🇨🇮',
        bio: 'Créateur actif sur AfriChat Connect.',
        isVIP: true,
        isVerified: true,
        isOnline: true,
        isBlocked: false,
        isFriend: false,
      };
      setContacts((prev) => [existingContact!, ...prev]);
    }
    handleOpenContactProfile(existingContact);
  };

  const handleOpenContactProfile = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactProfileOpen(true);
  };

  const handleOpenReportModal = (contact: Contact | { id: string; name: string; username: string; avatar: string; country?: string; flag?: string }) => {
    let target = contacts.find((c) => c.id === contact.id || c.userId === (contact as any).userId);
    if (!target) {
      target = {
        id: contact.id || `c_${Date.now()}`,
        userId: (contact as any).userId || contact.id,
        name: contact.name,
        username: contact.username,
        avatar: contact.avatar,
        phoneNumber: '+225 00 00 00 00',
        country: contact.country || 'Côte d’Ivoire',
        flag: contact.flag || '🇨🇮',
        bio: 'Utilisateur de la communauté AfriChat.',
        isVIP: false,
        isVerified: false,
        isOnline: true,
        isBlocked: false,
        isFriend: false,
      };
      setContacts((prev) => [target!, ...prev]);
    }
    setSelectedContact(target);
    setIsReportModalOpen(true);
  };

  const handleConfirmReport = async (ticket: ReportTicket, shouldBlock: boolean) => {
    setReportTickets((prev) => [ticket, ...prev]);
    setIsReportModalOpen(false);

    const targetId = selectedContact?.userId || selectedContact?.id || ticket.targetId;
    const reporterId = currentUser.id;

    // 1. Record report in Supabase database & check auto-suspension (3 reports from distinct users)
    const res = await supabaseRecordReport({
      reporterId: reporterId,
      reporterName: currentUser.name,
      targetId: targetId,
      targetName: ticket.targetName,
      reason: ticket.reason,
      details: ticket.details,
    });

    if (res.autoSuspended) {
      // 3+ reports reached: Auto-suspend account and lock permissions
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id === targetId || c.userId === targetId || c.name.toLowerCase() === ticket.targetName.toLowerCase()) {
            return { ...c, isSuspended: true, reportsCount: res.distinctReportersCount };
          }
          return c;
        })
      );

      if (selectedContact) {
        setSelectedContact((prev) => (prev ? { ...prev, isSuspended: true, reportsCount: res.distinctReportersCount } : null));
      }

      triggerSecurityToast(
        `🚨 ALERTE MODÉRATION : Le compte de ${ticket.targetName} a reçu 3 signalements distincts. Il est désormais AUTOMATIQUEMENT SUSPENDU et ses accès sont bloqués jusqu'à vérification ! 🛡️`,
        'danger'
      );
    } else {
      triggerSecurityToast(
        `🛡️ Signalement n°${ticket.id.slice(-6)} consigné dans Supabase (${res.distinctReportersCount || 1}/3 avant suspension automatique).`,
        'success'
      );
    }

    if (shouldBlock && targetId) {
      handleToggleBlock(targetId);
    }
  };

  const handleOpenChatWithContact = (contact: Contact) => {
    // Check if conversation exists
    let existingConv = conversations.find(
      (c) =>
        c.participantIds.includes(contact.userId) ||
        c.name.toLowerCase() === contact.name.toLowerCase()
    );

    if (!existingConv) {
      const initMsg: Message = {
        id: `msg_init_${Date.now()}`,
        senderId: contact.userId,
        senderName: contact.name,
        senderAvatar: contact.avatar,
        text: `Bonjour ${currentUser.name} ! Ravi d'échanger avec toi sur AfriChat Connect 🇨🇮 ✨`,
        timestamp: 'À l’instant',
        status: 'read',
      };

      const newConv: ChatConversation = {
        id: `conv_${Date.now()}`,
        type: 'direct',
        name: contact.name,
        avatar: contact.avatar,
        lastMessage: initMsg.text,
        lastMessageTime: 'À l’instant',
        unreadCount: 0,
        participantIds: [currentUser.id, contact.userId],
        messages: [initMsg],
      };

      // Persist conversation and initial greeting to Cloud Firestore
      saveConversationToFirestore(newConv);
      saveMessageToFirestore(newConv.id, initMsg);

      setConversations((prev) => [newConv, ...prev]);
      existingConv = newConv;
    }

    setSelectedChatId(existingConv.id);
    setActiveTab('messages');
  };

  // Handle Audio / Video Call
  const handleStartCall = (target: ChatConversation | Contact, type: 'audio' | 'video') => {
    // Check if target contact is blocked
    const isTargetBlocked = 'messages' in target
      ? contacts.some(
          (c) =>
            (target.participantIds?.includes(c.userId) ||
              c.name.toLowerCase() === target.name.toLowerCase()) &&
            c.isBlocked
        )
      : (target as Contact).isBlocked;

    if (isTargetBlocked) {
      triggerSecurityToast(
        `🚫 Appel impossible : ce contact est bloqué. Débloquez-le pour lancer un appel.`,
        'danger'
      );
      return;
    }

    let conv: ChatConversation;
    if ('messages' in target) {
      conv = target as ChatConversation;
    } else {
      const contact = target as Contact;
      let existingConv = conversations.find(
        (c) =>
          c.participantIds.includes(contact.userId) ||
          c.name.toLowerCase() === contact.name.toLowerCase()
      );
      if (!existingConv) {
        existingConv = {
          id: `conv_call_${Date.now()}`,
          type: 'direct',
          name: contact.name,
          avatar: contact.avatar,
          lastMessage: `Appel ${type} en cours...`,
          lastMessageTime: 'À l’instant',
          unreadCount: 0,
          participantIds: [currentUser.id, contact.userId],
          messages: [],
        };
        setConversations((prev) => [existingConv!, ...prev]);
      }
      conv = existingConv;
    }

    setCallState({
      isOpen: true,
      callType: type,
      conversation: conv,
    });
  };

  const handleEndCall = () => {
    setCallState((prev) => ({ ...prev, isOpen: false }));
  };

  // Handle Create Group / Salon VIP
  const handleCreateGroup = (groupData: Partial<ChatConversation>) => {
    const newConv = groupData as ChatConversation;
    
    // Persist group conversation and its initial messages to Cloud Firestore
    saveConversationToFirestore(newConv);
    if (newConv.messages && newConv.messages.length > 0) {
      newConv.messages.forEach((msg) => {
        saveMessageToFirestore(newConv.id, msg);
      });
    }

    setConversations((prev) => [newConv, ...prev]);
    setSelectedChatId(newConv.id);
    setActiveTab('messages');
  };

  // Open Payment Modal for VIP Post
  const handleUnlockVIPPost = (post: Post) => {
    setPaymentModalState({
      isOpen: true,
      title: `Déblocage : ${post.content.slice(0, 45)}...`,
      subtitle: `Par ${post.author.name}`,
      amount: post.vipPrice || 1000,
      currency: 'FCFA',
      itemType: 'vip_post',
      targetId: post.id,
      creatorName: post.author.name,
      creatorAvatar: post.author.avatar,
    });
  };

  // Open Payment Modal for VIP Reel
  const handleUnlockVIPReel = (reel: Post) => {
    setPaymentModalState({
      isOpen: true,
      title: `Reel Exclusif : ${reel.author.name}`,
      subtitle: 'Accès vidéo complet en haute définition',
      amount: reel.vipPrice || 1500,
      currency: 'FCFA',
      itemType: 'vip_reel',
      targetId: reel.id,
      creatorName: reel.author.name,
      creatorAvatar: reel.author.avatar,
    });
  };

  // Open Payment Modal for VIP Salon
  const handleUnlockVIPSalon = (salon: ChatConversation) => {
    setPaymentModalState({
      isOpen: true,
      title: salon.name,
      subtitle: `Abonnement mensuel au Salon VIP (${salon.memberCount} membres)`,
      amount: salon.vipPrice || 2500,
      currency: 'FCFA',
      itemType: 'vip_salon',
      targetId: salon.id,
      creatorName: salon.hostName || salon.name,
      creatorAvatar: salon.avatar,
    });
  };

  // Open Payment Modal for Creator Tip
  const handleTipCreator = (post: Post) => {
    setPaymentModalState({
      isOpen: true,
      title: `Pourboire pour ${post.author.name}`,
      subtitle: 'Soutenez directement les créateurs de contenu africains',
      amount: 1000,
      currency: 'FCFA',
      itemType: 'tip',
      targetId: post.id,
      creatorName: post.author.name,
      creatorAvatar: post.author.avatar,
    });
  };

  // Open Payment Modal for Wallet Deposit
  const handleOpenDeposit = () => {
    setPaymentModalState({
      isOpen: true,
      title: 'Recharge Portefeuille AfriChat Pay',
      subtitle: 'Créditez votre compte via Orange Money, Wave ou MTN MoMo',
      amount: 10000,
      currency: 'FCFA',
      itemType: 'deposit',
    });
  };

  // Handle Payment Success
  const handlePaymentSuccess = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);

    if (paymentModalState.itemType === 'vip_post' && paymentModalState.targetId) {
      setPosts((prev) =>
        prev.map((p) => (p.id === paymentModalState.targetId ? { ...p, isUnlocked: true } : p))
      );
    } else if (paymentModalState.itemType === 'vip_reel' && paymentModalState.targetId) {
      setReels((prev) =>
        prev.map((r) => (r.id === paymentModalState.targetId ? { ...r, isUnlocked: true } : r))
      );
    } else if (paymentModalState.itemType === 'vip_salon' && paymentModalState.targetId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === paymentModalState.targetId ? { ...c, isUnlocked: true } : c))
      );
    } else if (paymentModalState.itemType === 'deposit') {
      setCurrentUser((prev) => ({
        ...prev,
        walletBalance: prev.walletBalance + newTx.amount,
      }));
    }

    setPaymentModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Handle Payout Cashout
  const handleOpenPayout = (amount: number, provider: PaymentProvider, phone: string) => {
    const newTx: Transaction = {
      id: `TX-OUT-${Date.now()}`,
      type: 'payout',
      amount: -amount,
      currency: 'FCFA',
      provider: provider,
      phoneNumber: phone,
      description: `Retrait vers ${provider.toUpperCase()}`,
      timestamp: 'À l’instant',
      status: 'success',
      reference: `PAYOUT-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setCurrentUser((prev) => ({
      ...prev,
      walletBalance: Math.max(0, prev.walletBalance - amount),
    }));
  };

  // Handle Create Post
  const handleSubmitNewPost = (postData: Partial<Post>) => {
    const newPost: Post = {
      id: `post_${Date.now()}`,
      userId: currentUser.id,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        flag: currentUser.flag,
        country: currentUser.country,
        isVerified: currentUser.isVerified,
        isVIPCreator: currentUser.isVIP,
      },
      content: postData.content || '',
      mediaType: postData.mediaType || 'image',
      mediaUrl: postData.mediaUrl,
      timestamp: 'À l’instant',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isVIPOnly: !!postData.isVIPOnly,
      vipPrice: postData.vipPrice,
      isUnlocked: true,
      comments: [],
      location: postData.location,
      tags: postData.tags,
    };

    if (postData.mediaType === 'video') {
      setReels((prev) => [newPost, ...prev]);
    }
    setPosts((prev) => [newPost, ...prev]);
    setIsCreatePostOpen(false);

    // Sync to Supabase & Trigger Social Webhook (Facebook & TikTok auto-publishing)
    supabaseCreatePost(newPost).catch((err) => {
      console.warn('Supabase post sync notice:', err);
    });

    const webhookCfg = getWebhookConfig();
    if (webhookCfg.enabled && !newPost.isVIPOnly) {
      triggerSecurityToast(
        postData.mediaType === 'video'
          ? '🎬 Vidéo courte publiée & transmise au Webhook (Facebook & TikTok) !'
          : '✨ Publication partagée & transmise au Webhook (Facebook & TikTok) !',
        'success'
      );
    } else {
      triggerSecurityToast('✨ Publication partagée avec succès sur le fil d\'actu !', 'success');
    }
  };

  // Handle Publish Real User Story (24h Status)
  const handlePublishStory = (newStory: Story) => {
    setStories((prev) => [newStory, ...prev]);
    setIsCreateStoryOpen(false);

    // Persist directly to Supabase stories table
    supabaseCreateStory(newStory).catch((err) => {
      console.warn('Supabase story sync notice:', err);
    });

    triggerSecurityToast('✨ Votre statut / Story a été publié avec succès pour 24h !', 'success');
  };

  // Handle Toggle Follow Official Page
  const handleToggleFollowPage = (pageId: string) => {
    setOfficialPages((prev) => {
      const updated = prev.map((p) => {
        if (p.id === pageId) {
          const isFollowing = !p.isFollowing;
          triggerSecurityToast(
            isFollowing ? `✨ Vous êtes désormais abonné à la page ${p.name} !` : `Vous vous êtes désabonné de la page ${p.name}.`,
            'info'
          );
          return {
            ...p,
            isFollowing,
            followersCount: isFollowing ? p.followersCount + 1 : p.followersCount - 1,
          };
        }
        return p;
      });
      safeSetItem('africhat_official_pages', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle Create Official Page
  const handleCreatePage = (pageData: Omit<OfficialPage, 'id' | 'createdAt'> | Partial<OfficialPage>) => {
    const newPage: OfficialPage = {
      id: `page_${Date.now()}`,
      name: pageData.name || 'Nouvelle Page',
      handle: pageData.handle || `@page_${Date.now().toString().slice(-4)}`,
      category: (pageData.category as PageCategory) || 'business',
      categoryLabel: pageData.categoryLabel || 'Entreprise & Marque',
      description: pageData.description || '',
      avatar: pageData.avatar || '',
      coverImage: pageData.coverImage || '',
      followersCount: 1,
      isVerified: true,
      country: pageData.country || currentUser.country,
      countryFlag: pageData.countryFlag || currentUser.flag,
      flag: pageData.flag || currentUser.flag,
      website: pageData.website,
      whatsapp: pageData.whatsapp,
      isFollowing: true,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      ownerId: currentUser.id,
      postsCount: 0,
      createdAt: 'À l’instant',
    };

    setOfficialPages((prev) => {
      const updated = [newPage, ...prev];
      safeSetItem('africhat_official_pages', JSON.stringify(updated));
      return updated;
    });

    triggerSecurityToast(`🎉 Page officielle "${newPage.name}" créée avec succès !`, 'success');
  };

  // Handle Live Streaming Actions
  const handleOpenLiveSession = (session: LiveStreamSession) => {
    setSelectedLiveSession(session);
    setLiveStudioMode('viewer');
    setIsLiveStudioOpen(true);
  };

  const handleOpenBroadcastLive = () => {
    setSelectedLiveSession(null);
    setLiveStudioMode('broadcaster');
    setIsLiveStudioOpen(true);
  };

  // Handle Virtual Gift in Live Stream / Feed
  const handleSendLiveGift = (gift: VirtualGift, session?: LiveStreamSession | string) => {
    const giftPrice = gift.priceFcfa || gift.price || 500;
    if (currentUser.walletBalance < giftPrice) {
      triggerSecurityToast(`Solde insuffisant (${currentUser.walletBalance} FCFA). Veuillez recharger votre portefeuille Mobile Money pour offrir ce cadeau.`, 'danger');
      handleOpenDeposit();
      return;
    }

    // Deduct from sender wallet
    setCurrentUser((prev) => ({
      ...prev,
      walletBalance: Math.max(0, prev.walletBalance - giftPrice),
    }));

    const recipientName = typeof session === 'string' ? session : (session?.hostName || 'le créateur');

    // Record transaction
    const newTx: Transaction = {
      id: `GIFT-${Date.now()}`,
      type: 'tip',
      amount: -giftPrice,
      currency: 'FCFA',
      description: `Cadeau ${gift.name} ${gift.icon} envoyé à ${recipientName}`,
      timestamp: 'À l’instant',
      status: 'success',
      reference: `GIFT-${Math.floor(100000 + Math.random() * 900000)}`,
      provider: 'wallet' as any,
    };
    setTransactions((prev) => [newTx, ...prev]);

    triggerSecurityToast(`🎁 ${gift.icon} ${gift.name} (${giftPrice} FCFA) envoyé avec succès !`, 'success');
  };

  // Handle Update Founder Info
  const handleUpdateFounderInfo = (updatedInfo: FounderInfo) => {
    setFounderInfo(updatedInfo);
    safeSetItem('africhat_founder_info', JSON.stringify(updatedInfo));
    triggerSecurityToast('✅ Coordonnées officielles du Fondateur & Support mises à jour !', 'success');
  };

  return (
    <div 
      id="africhat-app-root" 
      className={`min-h-screen flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black transition-colors duration-200 ${
        currentTheme === 'light' ? 'bg-stone-100 text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* Top Main Navigation Header */}
      <Header
        currentUser={currentUser}
        onOpenWallet={() => handleSelectTab('wallet')}
        onOpenCreatePost={() => setIsCreatePostOpen(true)}
        unreadMessagesCount={totalUnreadMessages}
        activeTab={activeTab}
        onGoBack={handleGoBack}
        onOpenAiAssistant={() => setIsAiAssistantModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSuperAdmin={handleOpenSuperAdmin}
        onOpenAdminPortal={handleOpenAdminPortal}
        onOpenAuth={() => {
          setAuthMode('signin');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenShareApp={() => setIsShareAppModalOpen(true)}
        onOpenInstallPwa={() => setIsPwaInstallModalOpen(true)}
        onOpenFriends={() => handleOpenFriends('online')}
        onTriggerToast={triggerSecurityToast}
        currentTheme={currentTheme}
        onToggleTheme={handleToggleTheme}
        onSelectTab={(tab) => handleSelectTab(tab)}
      />

      {/* Global AI Release Announcement Push Toast / Banner */}
      {globalAnnouncement && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-3 px-4 shadow-lg flex items-center justify-between z-30 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-3 text-xs">
            <div className="p-1.5 rounded-lg bg-white/20">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <p className="font-bold">{globalAnnouncement.title}</p>
              <p className="text-amber-100 text-[11px]">{globalAnnouncement.body}</p>
            </div>
          </div>
          <button
            onClick={() => setGlobalAnnouncement(null)}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Floating Assistant IA Quick Trigger Button */}
      <button
        id="floating-ai-assistant-btn"
        onClick={() => setIsAiAssistantModalOpen(true)}
        className="fixed bottom-18 right-4 z-40 p-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-white/20 flex items-center space-x-2 group"
        title="Ouvrir l'Assistant IA AfriChat"
      >
        <Sparkles className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline font-bold text-xs pr-1">Assistant IA</span>
      </button>

      {/* Automatic Smart PWA Mobile Installation Banner */}
      <PwaInstallBanner
        deferredPrompt={deferredPrompt}
        onOpenInstallModal={() => setIsPwaInstallModalOpen(true)}
        onInstallSuccess={() => {
          triggerSecurityToast('🎉 Application AfriChat installée avec succès sur votre appareil !', 'success');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto py-2">
        {/* Stories Bar (Always visible at top of Feed) */}
        {activeTab === 'feed' && (
          <StoriesBar
            stories={stories}
            currentUser={currentUser}
            onOpenStory={(s) => setActiveStory(s)}
            onAddStory={() => setIsCreateStoryOpen(true)}
            onUnlockVIP={(s) => {
              setActiveStory(null);
              setPaymentModalState({
                isOpen: true,
                title: `Statut VIP de ${s.userName}`,
                subtitle: 'Accès exclusif 24h aux stories VIP',
                amount: 500,
                currency: 'FCFA',
                itemType: 'vip_post',
                creatorName: s.userName,
                creatorAvatar: s.userAvatar,
              });
            }}
          />
        )}

        {/* Tab Views */}
        <div className="pt-2">
          {activeTab === 'feed' && (
            <FeedView
              posts={posts}
              currentUser={currentUser}
              contacts={contacts}
              onLikePost={handleLikePost}
              onUnlockVIPPost={handleUnlockVIPPost}
              onTipCreator={handleTipCreator}
              onAddComment={handleAddComment}
              onOpenCreatePost={() => setIsCreatePostOpen(true)}
              onOpenCreateStory={() => setIsCreateStoryOpen(true)}
              onOpenUserProfile={handleOpenAuthorProfile}
              onOpenStarVip={handleOpenStarVip}
              onOpenShareApp={() => setIsShareAppModalOpen(true)}
              onOpenInstallPwa={() => setIsPwaInstallModalOpen(true)}
              onToggleBlockUser={handleToggleBlock}
              onOpenReportUser={handleOpenReportModal}
              ads={ads}
              adSettings={adSettings}
              onOpenAdDetail={handleOpenAdDetail}
              onOpenAdSettings={handleOpenAdSettings}
              liveStreams={liveStreams}
              onOpenLiveSession={handleOpenLiveSession}
              onOpenBroadcastLive={handleOpenBroadcastLive}
              officialPages={officialPages}
              onSelectTab={(tab) => handleSelectTab(tab)}
              onOpenDeposit={handleOpenDeposit}
            />
          )}

          {activeTab === 'reels' && (
            <ReelsView
              reels={reels}
              currentUser={currentUser}
              contacts={contacts}
              onGoBack={handleGoBack}
              onLikeReel={handleLikeReel}
              onUnlockVIPReel={handleUnlockVIPReel}
              onTipCreator={handleTipCreator}
              onAddComment={handleAddComment}
            />
          )}

          {activeTab === 'webtv' && (
            <WebTvView
              channels={webTvChannels}
              currentUser={currentUser}
              onGoBack={handleGoBack}
              onOpenBoostModal={handleOpenWebTvBoost}
              onOpenStarVipModal={(star) => handleOpenStarVip(star, 'direct_message')}
              onSendTip={(hostName, channelTitle) => {
                setPaymentModalState({
                  isOpen: true,
                  title: `Pourboire en direct pour ${hostName}`,
                  subtitle: `Soutien à la diffusion : ${channelTitle}`,
                  amount: 1000,
                  currency: 'FCFA',
                  itemType: 'tip',
                  creatorName: hostName,
                });
              }}
            />
          )}

          {activeTab === 'pages' && (
            <PagesView
              pages={officialPages}
              posts={posts}
              currentUser={currentUser}
              onGoBack={handleGoBack}
              onToggleFollowPage={handleToggleFollowPage}
              onCreatePage={handleCreatePage}
              onOpenCreatePost={() => setIsCreatePostOpen(true)}
              onOpenDeposit={handleOpenDeposit}
              onLikePost={handleLikePost}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesView
              conversations={conversations}
              contacts={contacts}
              currentUser={currentUser}
              onGoBack={handleGoBack}
              selectedChatId={selectedChatId}
              onSelectChatId={setSelectedChatId}
              onSendMessage={handleSendMessage}
              onUnlockVIPSalon={handleUnlockVIPSalon}
              onSendMobileMoneyTip={(recipient) => {
                setPaymentModalState({
                  isOpen: true,
                  title: `Transfert Mobile Money à ${recipient}`,
                  subtitle: 'Envoi instantané de fonds via AfriPay Mobile Money',
                  amount: 2000,
                  currency: 'FCFA',
                  itemType: 'tip',
                  creatorName: recipient,
                });
              }}
              onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
              onStartCall={(target, type) => handleStartCall(target, type)}
              onOpenContactsModal={() => setIsContactsModalOpen(true)}
              onOpenContactProfile={handleOpenContactProfile}
              onOpenReportContact={handleOpenReportModal}
              onToggleBlockContact={handleToggleBlock}
              onToggleFriend={handleToggleFriend}
              onOpenGroupRoles={handleOpenGroupRoles}
              onOpenFriendsModal={() => handleOpenFriends('online')}
              onOpenGameChallenge={(contact, gameId, stake) => handleOpenGameChallenge(contact, gameId, stake)}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletView
              currentUser={currentUser}
              transactions={transactions}
              onGoBack={handleGoBack}
              onOpenDeposit={handleOpenDeposit}
              onOpenPayout={handleOpenPayout}
              onOpenStripePayment={handleOpenStripePayment}
              onOpenFlutterwaveVip={handleOpenFlutterwaveVip}
              onOpenReceipt={(tx) => setSelectedReceiptTransaction(tx)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              userPosts={posts.filter((p) => p.userId === currentUser.id)}
              unlockedPostsCount={posts.filter((p) => p.isVIPOnly && p.isUnlocked).length}
              officialPages={officialPages}
              onGoBack={handleGoBack}
              onOpenDeposit={handleOpenDeposit}
              onOpenCreatePost={() => setIsCreatePostOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenContacts={() => setIsContactsModalOpen(true)}
              onOpenFriends={() => handleOpenFriends('online')}
              onOpenStripeVIP={() => handleOpenStripePayment('vip_quarterly')}
              onOpenFlutterwaveVIP={() => handleOpenFlutterwaveVip('vip_quarterly')}
              onOpenAuth={() => {
                setAuthMode('signin');
                setIsAuthModalOpen(true);
              }}
              onLogout={handleLogout}
              onOpenShareApp={() => setIsShareAppModalOpen(true)}
              onOpenInstallPwa={() => setIsPwaInstallModalOpen(true)}
              onOpenFounderInfo={() => setIsFounderModalOpen(true)}
              onUpdateAvatar={handleUpdateAvatar}
            />
          )}
        </div>
      </main>

      {/* Persistent Bottom Mobile Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => handleSelectTab(tab)}
        unreadMessagesCount={totalUnreadMessages}
      />

      {/* Security & Action Toast Alert */}
      <AnimatePresence>
        {securityToast.show && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center space-x-2 border backdrop-blur-md ${
              securityToast.type === 'danger'
                ? 'bg-rose-950/90 text-rose-200 border-rose-700/80 shadow-rose-900/40'
                : securityToast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/80 shadow-emerald-900/40'
                : 'bg-stone-900/90 text-amber-300 border-amber-500/50 shadow-amber-900/30'
            }`}
          >
            <span>{securityToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer Modal */}
      <StoryViewerModal
        story={activeStory}
        onClose={() => setActiveStory(null)}
        onUnlockVIP={(s) => {
          setActiveStory(null);
          setPaymentModalState({
            isOpen: true,
            title: `Statut VIP : ${s.userName}`,
            subtitle: 'Déblocage story studio exclusive',
            amount: 500,
            currency: 'FCFA',
            itemType: 'vip_post',
            creatorName: s.userName,
            creatorAvatar: s.userAvatar,
          });
        }}
        onReply={(story, text) => {
          // Direct response to story in chat
          const targetConv = conversations.find((c) => c.name.includes(story.userName.split(' ')[0]));
          if (targetConv) {
            handleSendMessage(targetConv.id, `Replying to your story: "${text}"`);
            setActiveTab('messages');
          }
        }}
      />

      {/* Create Post / Reel Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        currentUser={currentUser}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmitPost={handleSubmitNewPost}
      />

      {/* Create Real User Story (24h Status) Modal */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        currentUser={currentUser}
        onClose={() => setIsCreateStoryOpen(false)}
        onSubmitStory={handlePublishStory}
      />

      {/* Universal Mobile Money Checkout / USSD Payment Modal */}
      <MobileMoneyModal
        isOpen={paymentModalState.isOpen}
        onClose={() => setPaymentModalState((prev) => ({ ...prev, isOpen: false }))}
        title={paymentModalState.title}
        subtitle={paymentModalState.subtitle}
        amount={paymentModalState.amount}
        currency={paymentModalState.currency || 'FCFA'}
        itemType={paymentModalState.itemType}
        creatorName={paymentModalState.creatorName}
        creatorAvatar={paymentModalState.creatorAvatar}
        onSuccess={handlePaymentSuccess}
      />

      {/* Audio / Video Call Modal */}
      <CallModal
        isOpen={callState.isOpen}
        callType={callState.callType}
        conversation={callState.conversation}
        currentUser={currentUser}
        contacts={contacts}
        onEndCall={handleEndCall}
        onTriggerToast={triggerSecurityToast}
        onSendTip={(recipient) => {
          setPaymentModalState({
            isOpen: true,
            title: `Transfert Mobile Money en direct à ${recipient}`,
            subtitle: 'Envoi instantané pendant l\'appel audio/vidéo',
            amount: 2000,
            currency: 'FCFA',
            itemType: 'tip',
            creatorName: recipient,
          });
        }}
      />

      {/* Create Group / VIP Salon Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
        currentUser={currentUser}
      />

      {/* Settings & Profile Customization Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUserProfile}
        currentTheme={currentTheme}
        onToggleTheme={handleToggleTheme}
        adSettings={adSettings}
        onUpdateAdSettings={handleUpdateAdSettings}
        ads={ads}
        onTestAd={handleOpenAdDetail}
        contacts={contacts}
        onToggleBlock={handleToggleBlock}
        onOpenContactProfile={handleOpenContactProfile}
        initialTab={settingsInitialTab}
        onOpenStripePayment={handleOpenStripePayment}
        onOpenFlutterwaveVip={handleOpenFlutterwaveVip}
        onOpenAdminPortal={handleOpenAdminPortal}
        onLogout={handleLogout}
        onOpenAuth={() => {
          setAuthMode('signin');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Authentication & User Registration (Login / Sign Up) Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

      {/* Stripe Elements VIP Checkout Modal */}
      <StripePaymentModal
        isOpen={isStripePaymentOpen}
        onClose={() => setIsStripePaymentOpen(false)}
        currentUser={currentUser}
        initialPlanId={stripeInitialPlanId}
        onSuccess={handleStripePaymentSuccess}
        onOpenReceipt={(tx) => setSelectedReceiptTransaction(tx)}
      />

      {/* Flutterwave Mobile Money VIP Checkout Modal (Sandbox / Demo) */}
      <FlutterwaveVipModal
        isOpen={isFlutterwaveVipOpen}
        onClose={() => setIsFlutterwaveVipOpen(false)}
        currentUser={currentUser}
        initialPlanId={flutterwaveInitialPlanId}
        onSuccess={handleFlutterwaveVipSuccess}
        onOpenReceipt={(tx) => setSelectedReceiptTransaction(tx)}
      />

      {/* Tax & Cryptographic Detailed Receipt Modal */}
      <ReceiptDetailModal
        isOpen={!!selectedReceiptTransaction}
        transaction={selectedReceiptTransaction}
        onClose={() => setSelectedReceiptTransaction(null)}
      />

      {/* Floating Bottom Advertisement Banner */}
      <AdBanner
        ads={ads}
        adSettings={adSettings}
        onOpenAdDetail={handleOpenAdDetail}
        onOpenAdSettings={handleOpenAdSettings}
        onActivateAdFreeVip={() => handleOpenStripePayment('vip_quarterly')}
      />

      {/* Sponsored Ad Detail & Promo Claim Modal */}
      <AdDetailModal
        ad={selectedAdForDetail}
        isOpen={!!selectedAdForDetail}
        onClose={() => setSelectedAdForDetail(null)}
        onOpenAdSettings={handleOpenAdSettings}
      />

      {/* Contacts & Friends Directory Manager Modal */}
      <ContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        contacts={contacts}
        currentUser={currentUser}
        onToggleFriend={handleToggleFriend}
        onToggleBlock={handleToggleBlock}
        onOpenContactProfile={handleOpenContactProfile}
        onRefreshUsers={() => fetchSupabaseUsers(true)}
        isRefreshingUsers={isRefreshingUsers}
        onOpenChatWithContact={(contact) => {
          setIsContactsModalOpen(false);
          handleOpenChatWithContact(contact);
        }}
        onStartCallWithContact={(contact, type) => {
          setIsContactsModalOpen(false);
          handleStartCall(contact, type);
        }}
        onSendTipToContact={(contact) => {
          setIsContactsModalOpen(false);
          setPaymentModalState({
            isOpen: true,
            title: `Envoi Mobile Money à ${contact.name}`,
            subtitle: `Transfert instantané vers ${contact.phoneNumber || 'le compte'}`,
            amount: 2000,
            currency: 'FCFA',
            itemType: 'tip',
            creatorName: contact.name,
            creatorAvatar: contact.avatar,
          });
        }}
        onOpenGameChallenge={(contact) => {
          setIsContactsModalOpen(false);
          handleOpenGameChallenge(contact);
        }}
        onAddContact={handleAddContact}
      />

      {/* Friends Manager Modal (Amis connectés, Ajouter des amis, Demandes d'amitié) */}
      <FriendsManagerModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        contacts={contacts}
        currentUser={currentUser}
        initialTab={friendsInitialTab}
        onToggleFriend={handleToggleFriend}
        onToggleBlock={handleToggleBlock}
        onAddContact={handleAddContact}
        onOpenContactProfile={handleOpenContactProfile}
        onTriggerToast={triggerSecurityToast}
        onRefreshUsers={() => fetchSupabaseUsers(true)}
        isRefreshingUsers={isRefreshingUsers}
        supabaseUsersCount={supabaseUsersCount}
        onOpenChatWithContact={(contact) => {
          setIsFriendsModalOpen(false);
          handleOpenChatWithContact(contact);
        }}
        onStartCallWithContact={(contact, type) => {
          setIsFriendsModalOpen(false);
          handleStartCall(contact, type);
        }}
        onSendTipToContact={(contact) => {
          setIsFriendsModalOpen(false);
          setPaymentModalState({
            isOpen: true,
            title: `Envoi Mobile Money à ${contact.name}`,
            subtitle: `Transfert instantané vers ${contact.phoneNumber || 'le compte'}`,
            amount: 2000,
            currency: 'FCFA',
            itemType: 'tip',
            creatorName: contact.name,
            creatorAvatar: contact.avatar,
          });
        }}
        onOpenGameChallenge={(contact) => {
          setIsFriendsModalOpen(false);
          handleOpenGameChallenge(contact);
        }}
      />

      {/* Contact Profile & Quick Action Modal */}
      <ContactProfileModal
        isOpen={isContactProfileOpen}
        contact={selectedContact}
        currentUser={currentUser}
        onClose={() => setIsContactProfileOpen(false)}
        onToggleFriend={handleToggleFriend}
        onToggleBlock={handleToggleBlock}
        onOpenReport={handleOpenReportModal}
        onOpenChat={(contact) => {
          setIsContactProfileOpen(false);
          handleOpenChatWithContact(contact);
        }}
        onStartCall={(contact, type) => {
          setIsContactProfileOpen(false);
          handleStartCall(contact, type);
        }}
        onSendMobileMoneyTip={(contact) => {
          setPaymentModalState({
            isOpen: true,
            title: `Envoi Mobile Money à ${contact.name}`,
            subtitle: `Transfert instantané vers ${contact.phoneNumber || 'le compte'}`,
            amount: 2000,
            currency: 'FCFA',
            itemType: 'tip',
            creatorName: contact.name,
            creatorAvatar: contact.avatar,
          });
        }}
        onOpenStarVip={(contact, serviceType) => {
          setIsContactProfileOpen(false);
          handleOpenStarVip(contact, serviceType);
        }}
        onOpenGameChallenge={(contact) => {
          setIsContactProfileOpen(false);
          handleOpenGameChallenge(contact);
        }}
      />

      {/* Web TV Visibility Boost Modal */}
      <WebTvBoostModal
        isOpen={isWebTvBoostModalOpen}
        onClose={() => setIsWebTvBoostModalOpen(false)}
        channels={webTvChannels}
        selectedChannel={selectedWebTvBoostChannel}
        currentUser={currentUser}
        onBoostSuccess={handleWebTvBoostSuccess}
      />

      {/* VIP Star Exclusive Access Modal (2 € DM / 3 € Call) */}
      <VipStarAccessModal
        isOpen={isVipStarModalOpen}
        onClose={() => setIsVipStarModalOpen(false)}
        currentUser={currentUser}
        star={selectedVipStar || contacts[0]}
        initialService={vipStarServiceType}
        onSuccess={handleStarVipSuccess}
      />

      {/* Security Report / Signalement Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        targetContact={selectedContact}
        onClose={() => setIsReportModalOpen(false)}
        onConfirmReport={handleConfirmReport}
      />

      {/* Group & Salon Role / Permission Manager Modal */}
      <GroupRoleManagerModal
        isOpen={isGroupRolesOpen}
        onClose={() => setIsGroupRolesOpen(false)}
        conversation={selectedGroupForRoles}
        currentUser={currentUser}
        contacts={contacts}
        onUpdateConversation={handleUpdateConversation}
      />

      {/* Global Application Super Admin Modal */}
      <SuperAdminModal
        isOpen={isSuperAdminOpen}
        onClose={() => setIsSuperAdminOpen(false)}
        currentUser={currentUser}
        contacts={contacts}
        globalAdmins={globalAdmins}
        onUpdateGlobalAdmins={handleUpdateGlobalAdmins}
        systemSettings={systemSettings}
        onUpdateSystemSettings={handleUpdateSystemSettings}
        auditLogs={auditLogs}
        onAddAuditLog={(log) => setAuditLogs((prev) => [log, ...prev])}
        onOpenApiConfig={() => setIsApiConfigModalOpen(true)}
        onOpenAdminAiRelease={() => setIsAdminAiReleaseModalOpen(true)}
      />

      {/* Share Application Modal (QR Code, WhatsApp, SMS) */}
      <ShareAppModal
        isOpen={isShareAppModalOpen}
        onClose={() => setIsShareAppModalOpen(false)}
        currentUser={currentUser}
      />

      {/* PWA Mobile Installation Modal */}
      <PwaInstallModal
        isOpen={isPwaInstallModalOpen}
        onClose={() => setIsPwaInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => {
          triggerSecurityToast('🎉 Application installée avec succès sur votre appareil !', 'success');
        }}
      />

      {/* Comprehensive Administration Portal (/admin) */}
      <AdminPortal
        isOpen={isAdminPortalOpen}
        onClose={handleCloseAdminPortal}
        currentUser={currentUser}
        contacts={contacts}
        conversations={conversations}
        transactions={transactions}
        systemSettings={systemSettings}
        auditLogs={auditLogs}
        onUpdateContacts={(updated) => setContacts(updated)}
        onUpdateConversations={(updated) => setConversations(updated)}
        onUpdateTransactions={(updated) => setTransactions(updated)}
        onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
        onAddAuditLog={(log) => setAuditLogs((prev) => [log, ...prev])}
        onUpdateSystemSettings={(updated) => setSystemSettings(updated)}
      />

      {/* Create Official Page Modal */}
      <CreatePageModal
        isOpen={isCreatePageOpen}
        onClose={() => setIsCreatePageOpen(false)}
        onCreatePage={handleCreatePage}
        currentUser={currentUser}
      />

      {/* Live Video Studio & Broadcaster / Viewer Interactive Modal */}
      <LiveStudioModal
        isOpen={isLiveStudioOpen}
        onClose={() => {
          setIsLiveStudioOpen(false);
          setSelectedLiveSession(null);
        }}
        currentUser={currentUser}
        activeLiveSession={selectedLiveSession}
        contacts={contacts}
        onOpenDeposit={handleOpenDeposit}
        onGiftSentToHost={(gift, hostName) => handleSendLiveGift(gift, hostName)}
        onLiveStarted={(newSession) => {
          setLiveStreams((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
        }}
        onLiveEnded={(sessionId) => {
          setLiveStreams((prev) => prev.filter((s) => s.id !== sessionId));
        }}
        onTriggerToast={triggerSecurityToast}
      />

      {/* Founder & Official Administration Support Contact Modal */}
      <FounderModal
        isOpen={isFounderModalOpen}
        onClose={() => setIsFounderModalOpen(false)}
        founderInfo={founderInfo}
        currentUser={currentUser}
        onUpdateFounderInfo={handleUpdateFounderInfo}
        onTriggerToast={triggerSecurityToast}
        onOpenAiAssistant={() => setIsAiAssistantModalOpen(true)}
        onOpenApiConfig={() => setIsApiConfigModalOpen(true)}
        onOpenAdminAiRelease={() => setIsAdminAiReleaseModalOpen(true)}
      />

      {/* Assistant IA AfriChat Modal */}
      <AiAssistantModal
        isOpen={isAiAssistantModalOpen}
        onClose={() => setIsAiAssistantModalOpen(false)}
        currentUser={currentUser}
        onOpenDeposit={handleOpenDeposit}
        onOpenPayout={() => setActiveTab('wallet')}
        onOpenLiveStudio={() => setIsLiveStudioOpen(true)}
      />

      {/* API Key Management Modal (Supabase, Agora, Gemini, OpenAI) */}
      <ApiConfigModal
        isOpen={isApiConfigModalOpen}
        onClose={() => setIsApiConfigModalOpen(false)}
        onCredentialsUpdated={() => {
          triggerSecurityToast('✅ Clés API mises à jour et synchronisées !', 'success');
        }}
      />

      {/* Admin AI Release Notes Generator & Push Broadcast Modal */}
      <AdminAiReleaseModal
        isOpen={isAdminAiReleaseModalOpen}
        onClose={() => setIsAdminAiReleaseModalOpen(false)}
        currentUser={currentUser}
        onBroadcastNotification={(announcement) => {
          setGlobalAnnouncement(announcement);
          triggerSecurityToast(`🚀 Notification push "${announcement.title}" diffusée !`, 'success');
        }}
        onAddAuditLog={(log) => setAuditLogs((prev) => [log, ...prev])}
      />

      {/* Mini-Jeu Morpion (Tic-Tac-Toe) Multijoueur Supabase & IA */}
      <TicTacToeGameModal
        isOpen={isGameModalOpen}
        onClose={() => {
          setIsGameModalOpen(false);
          setGameOpponent(null);
          setActiveGameId(undefined);
        }}
        currentUser={currentUser}
        opponent={gameOpponent}
        gameId={activeGameId}
        stakeFcfa={gameStake}
        onTriggerToast={triggerSecurityToast}
      />
    </div>
  );
}
