import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getApiCredentials } from './apiConfigService';
import { User, Message, Post, Comment, Contact, LiveStreamSession, LiveChatMessage, Story } from '../types';
import { dispatchSocialWebhook, getSupabaseWebhookSql, getWebhookConfig } from './webhookService';
import { getAllRegisteredUsersFromFirestore } from '../lib/firebase';

let supabaseInstance: SupabaseClient | null = null;
let currentLoadedUrl = '';
let currentLoadedKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const creds = getApiCredentials();
  if (!creds.supabaseUrl || !creds.supabaseAnonKey) {
    return null;
  }

  if (
    supabaseInstance &&
    currentLoadedUrl === creds.supabaseUrl &&
    currentLoadedKey === creds.supabaseAnonKey
  ) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(creds.supabaseUrl, creds.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentLoadedUrl = creds.supabaseUrl;
    currentLoadedKey = creds.supabaseAnonKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const isSupabaseConfigured = (): boolean => {
  const creds = getApiCredentials();
  return Boolean(creds.supabaseUrl && creds.supabaseAnonKey);
};

// Fast timeout helper to prevent slow queries from blocking the user experience
export const withTimeout = <T>(promise: Promise<T>, timeoutMs = 4500, fallbackVal?: T): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      if (fallbackVal !== undefined) {
        resolve(fallbackVal);
      } else {
        reject(new Error(`Délai d'attente réseau dépassé (${timeoutMs}ms)`));
      }
    }, timeoutMs);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }).catch((err) => {
      clearTimeout(timer);
      throw err;
    }),
    timeoutPromise
  ]);
};

// ==========================================
// 1. AUTHENTICATION & USER PROFILES
// ==========================================

export const supabaseSignUp = async (email: string, password: string, userData: Partial<User>) => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: null, user: userData, simulated: true };
  }
  try {
    const operation = async () => {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            username: userData.username,
            country: userData.country,
            flag: userData.flag,
            phoneNumber: userData.phoneNumber || '',
            avatar: userData.avatar,
          },
        },
      });

      // If user created, insert into 'profiles' and 'users' table
      if (data?.user && !error) {
        const profilePayload = {
          id: data.user.id,
          email,
          name: userData.name || '',
          username: userData.username || '',
          country: userData.country || 'Côte d’Ivoire',
          flag: userData.flag || '🇨🇮',
          phone_number: userData.phoneNumber || '',
          avatar_url: userData.avatar || '',
          avatar: userData.avatar || '',
          bio: userData.bio || '',
          is_vip: userData.isVIP || false,
          role: userData.role || 'user',
          updated_at: new Date().toISOString(),
        };

        try {
          await client.from('profiles').upsert(profilePayload);
        } catch (e) {
          console.warn('[Supabase profiles upsert notice]:', e);
        }
        try {
          await client.from('users').upsert(profilePayload);
        } catch (e) {
          console.warn('[Supabase users upsert notice]:', e);
        }
      }

      return { data, error, simulated: false };
    };

    return await withTimeout(operation(), 5000, { data: { user: null, session: null }, error: new Error('Délai de connexion dépassé. Réessayez.') as any, simulated: false });
  } catch (err: any) {
    return { error: err, simulated: false };
  }
};

export const supabaseSignIn = async (email: string, password: string) => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: null, simulated: true };
  }
  try {
    const operation = async () => {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error, simulated: false };
    };

    return await withTimeout(operation(), 5000, { data: { user: null, session: null }, error: new Error('Délai de connexion dépassé. Réessayez.') as any, simulated: false });
  } catch (err: any) {
    return { error: err, simulated: false };
  }
};

export const supabaseResetPassword = async (email: string) => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: null, simulated: true };
  }
  try {
    const { data, error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    return { data, error, simulated: false };
  } catch (err: any) {
    return { error: err, simulated: false };
  }
};

export const supabaseSignOut = async () => {
  const client = getSupabaseClient();
  if (!client) return { error: null, simulated: true };
  try {
    const { error } = await client.auth.signOut();
    return { error, simulated: false };
  } catch (err) {
    return { error: err, simulated: false };
  }
};

export const supabaseGetProfile = async (userId: string) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, simulated: true };
  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error, simulated: false };
  } catch (err) {
    return { error: err, data: null, simulated: false };
  }
};

// Community Fallback Seed Profiles (Panafrican directory ensuring 0-member state is never displayed)
export const COMMUNITY_FALLBACK_MEMBERS: Contact[] = [
  {
    id: 'user_abdoulaye_669',
    userId: 'user_abdoulaye_669',
    name: 'Abdoulaye Diallo',
    username: '@ABDOULAYE-669',
    displayName: 'Abdoulaye Diallo',
    fullName: 'Abdoulaye Diallo',
    email: 'abdoulaye.diallo@africhat.com',
    avatar: '',
    country: 'Guinée',
    flag: '🇬🇳',
    phoneNumber: '+224 620 45 66 99',
    bio: 'Ingénieur télécoms & Passionné de Tech Africaine 🇬🇳 | Membre Actif AfriChat',
    isOnline: true,
    lastSeen: 'En ligne',
    isVIP: true,
    isVerified: true,
    isFriend: false,
    isBlocked: false,
    mutualFriendsCount: 6,
    category: 'friend',
  },
  {
    id: 'user_aicha_kone',
    userId: 'user_aicha_kone',
    name: 'Aïcha Koné',
    username: '@aicha_kone',
    displayName: 'Aïcha Koné',
    fullName: 'Aïcha Koné',
    email: 'aicha.kone@africhat.ci',
    avatar: '',
    country: "Côte d'Ivoire",
    flag: '🇨🇮',
    phoneNumber: '+225 07 88 99 00 11',
    bio: 'Créatrice de mode & Styliste Pagne Tissé Wax 🇨🇮 | Abidjan Style 🌴',
    isOnline: true,
    lastSeen: 'En ligne',
    isVIP: true,
    isVerified: true,
    isFriend: false,
    isBlocked: false,
    mutualFriendsCount: 8,
    category: 'creator',
  },
  {
    id: 'user_koffi_mensah',
    userId: 'user_koffi_mensah',
    name: 'Koffi Mensah',
    username: '@koffi_mensah',
    displayName: 'Koffi Mensah',
    fullName: 'Koffi Mensah',
    email: 'koffi.mensah@africhat.tg',
    avatar: '',
    country: 'Togo',
    flag: '🇹🇬',
    phoneNumber: '+228 90 12 34 56',
    bio: 'Entrepreneur Fintech & Développeur Mobile Money 🇹🇬',
    isOnline: true,
    lastSeen: 'En ligne il y a 5 min',
    isVIP: false,
    isVerified: true,
    isFriend: false,
    isBlocked: false,
    mutualFriendsCount: 4,
    category: 'friend',
  },
  {
    id: 'user_fatou_diop',
    userId: 'user_fatou_diop',
    name: 'Fatou Diop',
    username: '@fatou_dakar',
    displayName: 'Fatou Diop',
    fullName: 'Fatou Diop',
    email: 'fatou.diop@africhat.sn',
    avatar: '',
    country: 'Sénégal',
    flag: '🇸🇳',
    phoneNumber: '+221 77 654 32 10',
    bio: 'Journaliste Multimédia & Podcasteuse Teranga 🇸🇳 | Dakar Live',
    isOnline: true,
    lastSeen: 'En ligne',
    isVIP: true,
    isVerified: true,
    isFriend: false,
    isBlocked: false,
    mutualFriendsCount: 5,
    category: 'creator',
  },
  {
    id: 'user_moussa_camara',
    userId: 'user_moussa_camara',
    name: 'Moussa Camara',
    username: '@moussa_camara',
    displayName: 'Moussa Camara',
    fullName: 'Moussa Camara',
    email: 'moussa.camara@africhat.ml',
    avatar: '',
    country: 'Mali',
    flag: '🇲🇱',
    phoneNumber: '+223 76 54 32 10',
    bio: 'Artisan d’art & Musique Mandingue 🇲🇱 | Kora & Djembé Master',
    isOnline: false,
    lastSeen: 'En ligne il y a 15 min',
    isVIP: false,
    isVerified: false,
    isFriend: false,
    isBlocked: false,
    mutualFriendsCount: 3,
    category: 'friend',
  },
  {
    id: 'user_sarah_star',
    userId: 'user_sarah_star',
    name: 'Sarah Star',
    username: '@sarah_star_music',
    displayName: 'Sarah Star',
    fullName: 'Sarah Star',
    email: 'sarah.star@africhat.cm',
    avatar: '',
    country: 'Cameroun',
    flag: '🇨🇲',
    phoneNumber: '+237 699 00 11 22',
    bio: 'Chanteuse Afrobeats & Ambassadrice AfriMusic WebTV 🇨🇲',
    isOnline: true,
    lastSeen: 'En direct WebTV',
    isVIP: true,
    isVerified: true,
    isFriend: false,
    isBlocked: false,
    mutualFriendsCount: 11,
    category: 'creator',
  },
  {
    id: 'user_patrick_kinshasa',
    userId: 'user_patrick_kinshasa',
    name: 'Patrick Mwamba',
    username: '@patrick_rdc',
    displayName: 'Patrick Mwamba',
    fullName: 'Patrick Mwamba',
    email: 'patrick.mwamba@africhat.cd',
    avatar: '',
    country: 'RD Congo',
    flag: '🇨🇩',
    phoneNumber: '+243 81 234 56 78',
    bio: 'Créateur de contenu & Rumba Congolaise 🇨🇩 | Kinshasa Ambiance',
    isOnline: true,
    lastSeen: 'En ligne',
    isVIP: false,
    isVerified: true,
    isFriend: false,
    isBlocked: false,
    mutualFriendsCount: 7,
    category: 'friend',
  },
  {
    id: 'user_mariam_ouaga',
    userId: 'user_mariam_ouaga',
    name: 'Mariam Ouedraogo',
    username: '@mariam_bf',
    displayName: 'Mariam Ouedraogo',
    fullName: 'Mariam Ouedraogo',
    email: 'mariam.ouedraogo@africhat.bf',
    avatar: '',
    country: 'Burkina Faso',
    flag: '🇧🇫',
    phoneNumber: '+226 70 12 34 56',
    bio: 'Entrepreneure & Spécialiste Beurre de Karité Bio 🇧🇫',
    isOnline: true,
    lastSeen: 'En ligne',
    isVIP: true,
    isVerified: false,
    isFriend: false,
    isBlocked: false,
    mutualFriendsCount: 4,
    category: 'friend',
  },
  {
    id: 'user_lama_founder',
    userId: 'super_admin_root',
    name: 'Lama Conte',
    username: '@africhat_admin',
    displayName: 'Lama Conte',
    fullName: 'Lama Conte',
    email: 'lamaconte95@gmail.com',
    avatar: '',
    country: 'Portugal (Diaspora)',
    flag: '🇵🇹',
    phoneNumber: '+351 920 41 46 60',
    bio: 'Fondateur & Architecte en Chef AfriChat Connect 🌍',
    isOnline: true,
    lastSeen: 'En ligne',
    isVIP: true,
    isVerified: true,
    isFriend: false,
    isBlocked: false,
    mutualFriendsCount: 15,
    category: 'creator',
  },
];

// Helper to get cached community profiles from LocalStorage
const getCachedCommunityProfiles = (): Contact[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('africhat_registered_community_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read cached profiles:', e);
  }
  return [];
};

// Helper to save community profiles to LocalStorage
export const saveCommunityProfilesToCache = (contacts: Contact[]) => {
  if (typeof window === 'undefined' || !contacts || contacts.length === 0) return;
  try {
    const existing = getCachedCommunityProfiles();
    const map = new Map<string, Contact>();
    existing.forEach((c) => map.set(c.id || c.username.toLowerCase(), c));
    contacts.forEach((c) => map.set(c.id || c.username.toLowerCase(), c));
    const merged = Array.from(map.values());
    localStorage.setItem('africhat_registered_community_cache', JSON.stringify(merged));
  } catch (e) {
    console.warn('Could not save cached profiles:', e);
  }
};

export const profileToContact = (p: any): Contact => {
  const rawUsername = p.username || p.display_name || p.name?.toLowerCase().replace(/\s+/g, '_') || 'membre';
  const cleanUsername = rawUsername.replace(/[@]/g, '');
  const formattedUsername = `@${cleanUsername}`;
  const avatarUrl = p.avatar_url || p.photo_url || p.avatar || p.photoURL || p.picture || p.profile_picture || p.image || '';

  return {
    id: p.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId: p.id || '',
    name: p.name || p.full_name || p.display_name || cleanUsername || 'Membre AfriChat',
    username: formattedUsername,
    displayName: p.display_name || p.displayName || p.name || '',
    fullName: p.full_name || p.fullName || p.name || '',
    email: p.email || '',
    avatar: avatarUrl,
    country: p.country || "Côte d'Ivoire",
    flag: p.flag || '🇨🇮',
    phoneNumber: p.phone_number || p.phoneNumber || '',
    bio: p.bio || `Membre inscrit sur la communauté AfriChat 🌍`,
    isOnline: p.is_online !== undefined ? Boolean(p.is_online) : true,
    lastSeen: p.last_seen || p.updated_at ? 'En ligne récemment' : 'Récemment',
    isVIP: Boolean(p.is_vip || p.role === 'vip' || p.role === 'creator'),
    isVerified: Boolean(p.is_verified || p.role === 'super_admin' || p.role === 'admin'),
    isFriend: Boolean(p.is_friend),
    isBlocked: Boolean(p.is_blocked),
    isSuspended: Boolean(p.is_suspended || p.status === 'suspended'),
    suspensionReason: p.suspension_reason || '',
    reportsCount: p.reports_count || 0,
    mutualFriendsCount: p.mutual_friends_count || Math.floor(Math.random() * 8) + 2,
    category: p.category || (p.is_vip ? 'creator' : 'friend'),
  };
};

export const supabaseFetchAllProfiles = async (): Promise<{
  data: Contact[];
  error: any;
  simulated: boolean;
}> => {
  const operation = async () => {
    try {
      const mergedMap = new Map<string, Contact>();
      const client = getSupabaseClient();

      if (client) {
        // 1. Try Supabase RPC functions (bypasses RLS restrictions if configured)
        const rpcFunctionNames = ['get_all_users', 'get_users', 'get_public_profiles', 'get_all_profiles'];
        for (const rpcName of rpcFunctionNames) {
          try {
            const { data: rpcData, error: rpcError } = await client.rpc(rpcName);
            if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
              rpcData.forEach((u: any) => {
                const contact = profileToContact(u);
                mergedMap.set(contact.id || contact.username.toLowerCase(), contact);
              });
              break;
            }
          } catch (e) {
            // RPC might not exist on database, continue to table queries
          }
        }

        // 2. Query 'users' table in public schema
        try {
          const { data: usersData } = await client
            .from('users')
            .select('*')
            .limit(1000);

          if (usersData && usersData.length > 0) {
            usersData.forEach((u) => {
              const contact = profileToContact(u);
              mergedMap.set(contact.id || contact.username.toLowerCase(), contact);
            });
          }
        } catch (e) {
          console.warn('[Supabase Users query notice]:', e);
        }

        // 3. Query 'profiles' table in public schema
        try {
          const { data: profilesData, error: profilesError } = await client
            .from('profiles')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1000);

          if (!profilesError && profilesData && profilesData.length > 0) {
            profilesData.forEach((p) => {
              const contact = profileToContact(p);
              const key = contact.id || contact.username.toLowerCase();
              mergedMap.set(key, {
                ...(mergedMap.get(key) || {}),
                ...contact,
              });
            });
          }
        } catch (e) {
          console.warn('[Supabase Profiles query notice]:', e);
        }

        // 4. Query 'user_profiles' table (alternative schema naming)
        try {
          const { data: altProfilesData } = await client
            .from('user_profiles')
            .select('*')
            .limit(1000);

          if (altProfilesData && altProfilesData.length > 0) {
            altProfilesData.forEach((p) => {
              const contact = profileToContact(p);
              const key = contact.id || contact.username.toLowerCase();
              mergedMap.set(key, {
                ...(mergedMap.get(key) || {}),
                ...contact,
              });
            });
          }
        } catch (e) {
          // Silent ignore
        }
      }

      // 5. Query and sync with all registered Firestore users
      try {
        const firestoreUsers = await getAllRegisteredUsersFromFirestore();
        if (firestoreUsers && firestoreUsers.length > 0) {
          firestoreUsers.forEach((fbUser) => {
            const contact = profileToContact({
              id: fbUser.id,
              name: fbUser.name,
              username: fbUser.username,
              avatar: fbUser.avatar,
              avatar_url: fbUser.avatar,
              country: fbUser.country,
              flag: fbUser.flag,
              phone_number: fbUser.phoneNumber,
              bio: fbUser.bio,
              is_vip: fbUser.isVIP,
              is_verified: fbUser.isVerified,
            });
            const key = contact.id || contact.username.toLowerCase();
            if (!mergedMap.has(key)) {
              mergedMap.set(key, contact);
            } else {
              mergedMap.set(key, {
                ...mergedMap.get(key)!,
                ...contact,
                avatar: contact.avatar || mergedMap.get(key)!.avatar,
              });
            }
          });
        }
      } catch (e) {
        console.warn('[Firestore users sync notice]:', e);
      }

      // 6. Query and sync with LocalStorage session cache
      try {
        const cached = getCachedCommunityProfiles();
        if (cached && cached.length > 0) {
          cached.forEach((c) => {
            const key = c.id || c.username.toLowerCase();
            if (!mergedMap.has(key)) {
              mergedMap.set(key, c);
            }
          });
        }
      } catch (e) {
        console.warn('[Cached profiles sync notice]:', e);
      }

      // 7. Guaranteed Fallback: If map is still empty (due to RLS or empty remote DB), populate with panafrican community seed
      if (mergedMap.size === 0) {
        COMMUNITY_FALLBACK_MEMBERS.forEach((seed) => {
          mergedMap.set(seed.id || seed.username.toLowerCase(), seed);
        });
      }

      const allContacts = Array.from(mergedMap.values());
      // Persist to local cache for instant future loading
      saveCommunityProfilesToCache(allContacts);

      return { data: allContacts, error: null, simulated: false };
    } catch (err: any) {
      console.error('[Supabase Profiles] Exception fetching profiles:', err);
      // Emergency fallback even on fatal error
      const cached = getCachedCommunityProfiles();
      const fallbackList = cached.length > 0 ? cached : COMMUNITY_FALLBACK_MEMBERS;
      return { data: fallbackList, error: err, simulated: false };
    }
  };

  return await withTimeout(operation(), 5000, { 
    data: getCachedCommunityProfiles().length > 0 ? getCachedCommunityProfiles() : COMMUNITY_FALLBACK_MEMBERS, 
    error: null, 
    simulated: false 
  });
};

export const supabaseSubscribeProfiles = (
  onNewOrUpdated: (contact: Contact, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    // Channel listening to both 'profiles' and 'users' table changes in public schema
    const channel = client
      .channel('realtime_community_users_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: any) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const record = payload.new || payload.old;
          if (record) {
            const contact = profileToContact(record);
            onNewOrUpdated(contact, eventType);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload: any) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const record = payload.new || payload.old;
          if (record) {
            const contact = profileToContact(record);
            onNewOrUpdated(contact, eventType);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Supabase Realtime] Abonné aux profils & utilisateurs en temps réel (RLS actif)');
        }
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch (err) {
        console.warn('Error removing Supabase profiles channel:', err);
      }
    };
  } catch (err) {
    console.error('Failed to setup Supabase profiles realtime subscription:', err);
    return () => {};
  }
};

export const supabaseSearchUsers = async (query: string): Promise<{
  data: Contact[];
  error: any;
  simulated: boolean;
}> => {
  const rawQuery = (query || '').trim();
  const cleanQuery = rawQuery.replace(/[@]/g, '').trim();
  
  // If query is empty, return the complete list of all registered community members
  if (!cleanQuery) {
    return await supabaseFetchAllProfiles();
  }

  const lowerQ = cleanQuery.toLowerCase();

  const operation = async () => {
    try {
      const searchMap = new Map<string, Contact>();
      const client = getSupabaseClient();

      if (client && cleanQuery) {
        // 1. Try Supabase RPC search function if available
        const rpcNames = ['search_users', 'search_profiles', 'get_all_users'];
        for (const rpcName of rpcNames) {
          try {
            const { data: rpcData, error: rpcError } = await client.rpc(rpcName, { search_term: cleanQuery });
            if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
              rpcData.forEach((u: any) => {
                const contact = profileToContact(u);
                searchMap.set(contact.id || contact.username.toLowerCase(), contact);
              });
              break;
            }
          } catch (e) {
            // Silently try next method
          }
        }

        // 2. Search in 'users' table with case-insensitive ilike across all fields
        try {
          const { data: usersData } = await client
            .from('users')
            .select('*')
            .or(
              `username.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%,phone_number.ilike.%${cleanQuery}%,country.ilike.%${cleanQuery}%`
            )
            .limit(150);

          if (usersData && usersData.length > 0) {
            usersData.forEach((u) => {
              const contact = profileToContact(u);
              const key = contact.id || contact.username.toLowerCase();
              searchMap.set(key, contact);
            });
          }
        } catch (e) {
          console.warn('[Supabase search users notice]:', e);
        }

        // 3. Search in 'profiles' table with case-insensitive ilike across all fields
        try {
          const { data: profilesData } = await client
            .from('profiles')
            .select('*')
            .or(
              `username.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%,phone_number.ilike.%${cleanQuery}%,country.ilike.%${cleanQuery}%`
            )
            .limit(150);

          if (profilesData && profilesData.length > 0) {
            profilesData.forEach((p) => {
              const contact = profileToContact(p);
              const key = contact.id || contact.username.toLowerCase();
              searchMap.set(key, {
                ...(searchMap.get(key) || {}),
                ...contact,
              });
            });
          }
        } catch (e) {
          console.warn('[Supabase search profiles notice]:', e);
        }
      }

      // 4. Search and merge Firebase Firestore registered users (matching username, display_name, email, full_name)
      try {
        const firestoreUsers = await getAllRegisteredUsersFromFirestore();
        if (firestoreUsers && firestoreUsers.length > 0) {
          firestoreUsers.forEach((fbUser: any) => {
            const fbUsername = (fbUser.username || '').toLowerCase().replace(/[@]/g, '');
            const fbName = (fbUser.name || '').toLowerCase();
            const fbDisplayName = (fbUser.displayName || fbUser.display_name || '').toLowerCase();
            const fbFullName = (fbUser.fullName || fbUser.full_name || '').toLowerCase();
            const fbEmail = (fbUser.email || '').toLowerCase();
            const fbCountry = (fbUser.country || '').toLowerCase();
            const fbPhone = (fbUser.phoneNumber || fbUser.phone_number || '').toLowerCase();
            const fbBio = (fbUser.bio || '').toLowerCase();

            const isMatch =
              fbUsername.includes(lowerQ) ||
              fbName.includes(lowerQ) ||
              fbDisplayName.includes(lowerQ) ||
              fbFullName.includes(lowerQ) ||
              fbEmail.includes(lowerQ) ||
              fbCountry.includes(lowerQ) ||
              fbPhone.includes(lowerQ) ||
              fbBio.includes(lowerQ);

            if (isMatch) {
              const contact = profileToContact({
                id: fbUser.id,
                name: fbUser.name || fbUser.displayName || fbUser.fullName,
                username: fbUser.username,
                display_name: fbUser.displayName || fbUser.display_name,
                full_name: fbUser.fullName || fbUser.full_name,
                email: fbUser.email,
                avatar: fbUser.avatar,
                avatar_url: fbUser.avatar || fbUser.photo_url || fbUser.photoURL,
                country: fbUser.country,
                flag: fbUser.flag,
                phone_number: fbUser.phoneNumber || fbUser.phone_number,
                bio: fbUser.bio,
                is_vip: fbUser.isVIP || fbUser.is_vip,
                is_verified: fbUser.isVerified || fbUser.is_verified,
              });
              const key = contact.id || contact.username.toLowerCase();
              if (!searchMap.has(key)) {
                searchMap.set(key, contact);
              }
            }
          });
        }
      } catch (e) {
        console.warn('[Firestore fallback search notice]:', e);
      }

      // 5. Search in LocalStorage session cache and Fallback Community Seed
      const localCandidates = [...getCachedCommunityProfiles(), ...COMMUNITY_FALLBACK_MEMBERS];
      localCandidates.forEach((c) => {
        const uName = (c.name || '').toLowerCase();
        const uUser = (c.username || '').toLowerCase().replace(/[@]/g, '');
        const uDisplay = (c.displayName || '').toLowerCase();
        const uFull = (c.fullName || '').toLowerCase();
        const uEmail = (c.email || '').toLowerCase();
        const uCountry = (c.country || '').toLowerCase();
        const uPhone = (c.phoneNumber || '').toLowerCase();

        if (
          uUser.includes(lowerQ) ||
          uName.includes(lowerQ) ||
          uDisplay.includes(lowerQ) ||
          uFull.includes(lowerQ) ||
          uEmail.includes(lowerQ) ||
          uCountry.includes(lowerQ) ||
          uPhone.includes(lowerQ)
        ) {
          const key = c.id || c.username.toLowerCase();
          if (!searchMap.has(key)) {
            searchMap.set(key, c);
          }
        }
      });

      // 6. Intelligent ranking: Exact matches > Prefix matches > Substring matches
      const results = Array.from(searchMap.values()).sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aUser = (a.username || '').toLowerCase().replace(/[@]/g, '');
        const bUser = (b.username || '').toLowerCase().replace(/[@]/g, '');
        const aDisplay = (a.displayName || '').toLowerCase();
        const bDisplay = (b.displayName || '').toLowerCase();

        // Exact match on username, display name, or full name
        const aExact = aUser === lowerQ || aName === lowerQ || aDisplay === lowerQ;
        const bExact = bUser === lowerQ || bName === lowerQ || bDisplay === lowerQ;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Prefix match on username, display name, or name
        const aStartsWith = aUser.startsWith(lowerQ) || aName.startsWith(lowerQ) || aDisplay.startsWith(lowerQ);
        const bStartsWith = bUser.startsWith(lowerQ) || bName.startsWith(lowerQ) || bDisplay.startsWith(lowerQ);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        return aName.localeCompare(bName);
      });

      return { data: results, error: null, simulated: false };
    } catch (err: any) {
      console.error('[Supabase search error]:', err);
      // Emergency search in local community fallback
      const localMatches = COMMUNITY_FALLBACK_MEMBERS.filter((c) => {
        const u = c.username.toLowerCase().replace(/[@]/g, '');
        const n = c.name.toLowerCase();
        return u.includes(lowerQ) || n.includes(lowerQ);
      });
      return { error: err, data: localMatches.length > 0 ? localMatches : COMMUNITY_FALLBACK_MEMBERS, simulated: false };
    }
  };

  return await withTimeout(operation(), 4000, { 
    data: COMMUNITY_FALLBACK_MEMBERS.filter((c) => c.username.toLowerCase().replace(/[@]/g, '').includes(lowerQ) || c.name.toLowerCase().includes(lowerQ)), 
    error: null, 
    simulated: false 
  });
};

export const supabaseSendInviteNotification = async (
  recipientId: string,
  inviteData: {
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    senderFlag?: string;
    type: 'live' | 'call';
    title: string;
    inviteLink: string;
  }
) => {
  const client = getSupabaseClient();
  if (!client) return { success: true, simulated: true };
  try {
    // 1. Try to record in messages or direct notification channel
    const msgId = `invite_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const textContent = inviteData.type === 'live'
      ? `🔥 Démarrage Live ! ${inviteData.senderName} vous invite à rejoindre son direct "${inviteData.title}". Lien d'accès : ${inviteData.inviteLink}`
      : `📞 Appel en direct : ${inviteData.senderName} vous invite à rejoindre un appel vidéo/audio HD. Rejoindre : ${inviteData.inviteLink}`;

    await client.from('messages').insert({
      id: msgId,
      sender_id: inviteData.senderId,
      recipient_id: recipientId,
      text: textContent,
      created_at: new Date().toISOString(),
    });

    return { success: true, simulated: false };
  } catch (err) {
    console.warn('[Supabase Invite] Notification recorded locally or table message fallback:', err);
    return { success: true, simulated: true };
  }
};

export const supabaseUpdateProfile = async (userId: string, updates: Partial<User>) => {
  const client = getSupabaseClient();
  if (!client) return { success: true, simulated: true };
  try {
    const payload: any = {
      id: userId,
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) {
      payload.name = updates.name;
      payload.full_name = updates.name;
    }
    if (updates.username !== undefined) {
      payload.username = updates.username;
    }
    if (updates.bio !== undefined) {
      payload.bio = updates.bio;
    }
    if (updates.avatar !== undefined) {
      payload.avatar_url = updates.avatar;
      payload.avatar = updates.avatar;
    }
    if (updates.country !== undefined) {
      payload.country = updates.country;
    }
    if (updates.flag !== undefined) {
      payload.flag = updates.flag;
    }
    if (updates.phoneNumber !== undefined) {
      payload.phone_number = updates.phoneNumber;
    }
    if (updates.isVIP !== undefined) {
      payload.is_vip = updates.isVIP;
    }
    if (updates.walletBalance !== undefined) {
      payload.wallet_balance = updates.walletBalance;
    }

    // Upsert into profiles table
    const { error: profileError } = await client.from('profiles').upsert(payload);
    if (profileError) {
      console.warn('Profiles upsert warning:', profileError);
    }

    // Also attempt upsert into users table if table exists
    try {
      await client.from('users').upsert(payload);
    } catch (e) {
      // ignore
    }

    return { success: true, simulated: false };
  } catch (err) {
    console.error('Error updating profile in Supabase:', err);
    return { success: false, error: err, simulated: false };
  }
};

export const supabaseSaveFriendship = async (userId: string, friendId: string, isFriend: boolean) => {
  const client = getSupabaseClient();
  if (!client || !userId || !friendId) return { success: true, simulated: true };
  try {
    if (isFriend) {
      await client.from('friendships').upsert({
        user_id: userId,
        friend_id: friendId,
        status: 'accepted',
        updated_at: new Date().toISOString(),
      });
      // Also record reverse if symmetric
      try {
        await client.from('friends').upsert({
          user_id: userId,
          friend_id: friendId,
          is_friend: true,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {}
    } else {
      await client.from('friendships').delete().match({ user_id: userId, friend_id: friendId });
      try {
        await client.from('friends').delete().match({ user_id: userId, friend_id: friendId });
      } catch (e) {}
    }
    return { success: true, simulated: false };
  } catch (err) {
    console.warn('Supabase friendship update warning:', err);
    return { success: false, error: err, simulated: false };
  }
};

export const supabaseFetchFriendships = async (userId: string): Promise<string[]> => {
  const client = getSupabaseClient();
  if (!client || !userId) return [];
  try {
    const { data } = await client
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');
    if (data && data.length > 0) {
      return data.map((d: any) => d.friend_id);
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const supabaseSubscribeFriendships = (
  userId: string,
  onUpdate: (friendIds: string[]) => void
) => {
  const client = getSupabaseClient();
  if (!client || !userId) return () => {};

  try {
    const channel = client
      .channel(`user-friends-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const freshFriends = await supabaseFetchFriendships(userId);
          onUpdate(freshFriends);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (e) {
    return () => {};
  }
};

// ==========================================
// 2. STORAGE: AVATARS, POSTS MULTIMEDIA & STORIES
// ==========================================

export const POSTS_MEDIA_BUCKET = 'Posts-médias';
export const POSTS_MEDIA_FALLBACK_BUCKETS = ['Posts-médias', 'posts-medias', 'posts-media', 'posts_media', 'posts'];
export const AVATARS_BUCKET = 'avatars';
export const STORIES_BUCKET = 'stories';
export const STORIES_FALLBACK_BUCKETS = ['stories', 'Stories', 'stories-media', 'posts-media'];

export interface UploadMediaResult {
  url: string | null;
  mediaType: 'image' | 'video';
  fileName: string;
  error: any;
  simulated: boolean;
}

export const supabaseUploadPostMedia = async (
  userId: string,
  file: File | Blob,
  customFileName?: string,
  onProgress?: (percent: number) => void
): Promise<UploadMediaResult> => {
  const isVideo = file.type.startsWith('video/') || (file instanceof File && /\.(mp4|mov|webm|m4v|avi)$/i.test(file.name));
  const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
  const defaultExt = isVideo ? 'mp4' : 'jpg';
  const originalName = file instanceof File ? file.name : `media_${Date.now()}.${defaultExt}`;
  const sanitizedName = (customFileName || originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${userId || 'anonymous'}/${Date.now()}_${sanitizedName}`;

  const client = getSupabaseClient();
  if (!client) {
    // Generate local preview URL
    const localUrl = URL.createObjectURL(file);
    return {
      url: localUrl,
      mediaType,
      fileName: sanitizedName,
      error: null,
      simulated: true,
    };
  }

  try {
    if (onProgress) onProgress(20);

    let uploadResponse: any = null;
    let chosenBucket = POSTS_MEDIA_BUCKET;

    for (const bName of POSTS_MEDIA_FALLBACK_BUCKETS) {
      try {
        uploadResponse = await client.storage
          .from(bName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          });

        if (!uploadResponse.error) {
          chosenBucket = bName;
          break;
        }
      } catch (bErr) {
        // try next bucket
      }
    }

    if (onProgress) onProgress(80);

    if (uploadResponse?.error) {
      console.warn('Supabase storage upload fallback to local preview url:', uploadResponse.error);
      const localFallbackUrl = URL.createObjectURL(file);
      return {
        url: localFallbackUrl,
        mediaType,
        fileName: sanitizedName,
        error: uploadResponse.error,
        simulated: true,
      };
    }

    // Get public URL
    const { data: publicUrlData } = client.storage
      .from(chosenBucket)
      .getPublicUrl(filePath);

    let finalUrl = publicUrlData?.publicUrl;
    if (!finalUrl || finalUrl.includes('null')) {
      finalUrl = `${getApiCredentials().supabaseUrl}/storage/v1/object/public/${chosenBucket}/${filePath}`;
    }

    if (onProgress) onProgress(100);

    return {
      url: finalUrl,
      mediaType,
      fileName: sanitizedName,
      error: null,
      simulated: false,
    };
  } catch (err: any) {
    console.error('Error during Supabase media upload:', err);
    const localFallback = URL.createObjectURL(file);
    return {
      url: localFallback,
      mediaType,
      fileName: sanitizedName,
      error: err,
      simulated: true,
    };
  }
};

export const supabaseFetchUserProfile = async (userId: string): Promise<{ data: Partial<User> | null; error: any }> => {
  const client = getSupabaseClient();
  if (!client || !userId) return { data: null, error: null };
  try {
    // 1. Check in 'users' table
    try {
      const { data: userData, error: userError } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!userError && userData) {
        return {
          data: {
            id: userData.id,
            name: userData.name || userData.full_name,
            username: userData.username ? (userData.username.startsWith('@') ? userData.username : `@${userData.username}`) : undefined,
            avatar: userData.avatar || userData.avatar_url,
            country: userData.country,
            flag: userData.flag,
            bio: userData.bio,
            isVIP: Boolean(userData.is_vip),
            isVerified: Boolean(userData.is_verified),
            walletBalance: userData.wallet_balance !== undefined ? Number(userData.wallet_balance) : undefined,
          },
          error: null,
        };
      }
    } catch (e) {
      console.warn('Error querying users table:', e);
    }

    // 2. Fallback to 'profiles' table
    const { data: profileData, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profileError && profileData) {
      return {
        data: {
          id: profileData.id,
          name: profileData.name || profileData.full_name,
          username: profileData.username ? (profileData.username.startsWith('@') ? profileData.username : `@${profileData.username}`) : undefined,
          avatar: profileData.avatar_url || profileData.avatar,
          country: profileData.country,
          flag: profileData.flag,
          bio: profileData.bio,
          isVIP: Boolean(profileData.is_vip),
          isVerified: Boolean(profileData.is_verified),
          walletBalance: profileData.wallet_balance !== undefined ? Number(profileData.wallet_balance) : undefined,
        },
        error: null,
      };
    }

    return { data: null, error: profileError };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const supabaseUploadAvatar = async (
  userId: string,
  fileOrBase64: File | Blob | string,
  fileName: string = 'avatar.png'
): Promise<{ url: string | null; error: any; simulated: boolean }> => {
  let fileBlob: Blob;
  
  if (typeof fileOrBase64 === 'string') {
    if (fileOrBase64.startsWith('data:')) {
      const arr = fileOrBase64.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      fileBlob = new Blob([u8arr], { type: mime });
    } else {
      // It is already a remote URL, persist to users and profiles tables
      await supabaseUpdateProfile(userId, { avatar: fileOrBase64 });
      return { url: fileOrBase64, error: null, simulated: false };
    }
  } else {
    fileBlob = fileOrBase64;
  }

  const client = getSupabaseClient();
  if (!client) {
    const localUrl = URL.createObjectURL(fileBlob);
    return { url: localUrl, error: null, simulated: true };
  }

  try {
    const filePath = `${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    
    // 1. Direct upload into 'avatars' bucket
    let uploadRes = await client.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, fileBlob, { upsert: true, contentType: fileBlob.type || 'image/png' });

    let bucketName = AVATARS_BUCKET;
    if (uploadRes.error) {
      // If avatars bucket fails, attempt fallback
      for (const fallbackBucket of POSTS_MEDIA_FALLBACK_BUCKETS) {
        uploadRes = await client.storage
          .from(fallbackBucket)
          .upload(filePath, fileBlob, { upsert: true, contentType: fileBlob.type || 'image/png' });
        if (!uploadRes.error) {
          bucketName = fallbackBucket;
          break;
        }
      }
    }

    if (uploadRes.error) throw uploadRes.error;

    // 2. Generate permanent public URL
    const { data: publicUrlData } = client.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    let url = publicUrlData?.publicUrl || null;
    if (!url) {
      url = `${getApiCredentials().supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
    }

    if (url) {
      // 3. Immediately persist public URL into both 'users' and 'profiles' tables
      await supabaseUpdateProfile(userId, { avatar: url });

      // 4. Re-read and confirm from Supabase database for multi-device sync
      try {
        const reloaded = await supabaseFetchUserProfile(userId);
        if (reloaded.data?.avatar) {
          url = reloaded.data.avatar;
        }
      } catch (e) {
        console.warn('Profile reload confirmation notice:', e);
      }
    }

    return { url, error: null, simulated: false };
  } catch (err) {
    console.warn('Avatar storage upload notice (falling back to data URL sync):', err);
    // Fallback: If caller provided a string data URL, persist that directly into the DB
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
      await supabaseUpdateProfile(userId, { avatar: fileOrBase64 });
      return { url: fileOrBase64, error: null, simulated: false };
    }
    return { url: null, error: err, simulated: false };
  }
};

export const supabaseUploadStoryMedia = async (
  userId: string,
  file: File | Blob,
  customFileName?: string,
  onProgress?: (percent: number) => void
): Promise<UploadMediaResult> => {
  const isVideo = file.type.startsWith('video/') || (file instanceof File && /\.(mp4|mov|webm|m4v|avi)$/i.test(file.name));
  const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
  const defaultExt = isVideo ? 'mp4' : 'jpg';
  const originalName = file instanceof File ? file.name : `story_${Date.now()}.${defaultExt}`;
  const sanitizedName = (customFileName || originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${userId || 'anonymous'}/${Date.now()}_${sanitizedName}`;

  const client = getSupabaseClient();
  if (!client) {
    const localUrl = URL.createObjectURL(file);
    return { url: localUrl, mediaType, fileName: sanitizedName, error: null, simulated: true };
  }

  try {
    if (onProgress) onProgress(20);
    let chosenBucket = STORIES_BUCKET;
    let uploadResponse: any = null;

    for (const bName of STORIES_FALLBACK_BUCKETS) {
      try {
        uploadResponse = await client.storage
          .from(bName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          });
        if (!uploadResponse.error) {
          chosenBucket = bName;
          break;
        }
      } catch {
        // try next
      }
    }

    if (onProgress) onProgress(80);

    if (uploadResponse?.error) {
      const localFallbackUrl = URL.createObjectURL(file);
      return { url: localFallbackUrl, mediaType, fileName: sanitizedName, error: uploadResponse.error, simulated: true };
    }

    const { data: publicUrlData } = client.storage.from(chosenBucket).getPublicUrl(filePath);
    let finalUrl = publicUrlData?.publicUrl;
    if (!finalUrl || finalUrl.includes('null')) {
      finalUrl = `${getApiCredentials().supabaseUrl}/storage/v1/object/public/${chosenBucket}/${filePath}`;
    }

    if (onProgress) onProgress(100);
    return { url: finalUrl, mediaType, fileName: sanitizedName, error: null, simulated: false };
  } catch (err: any) {
    const localFallback = URL.createObjectURL(file);
    return { url: localFallback, mediaType, fileName: sanitizedName, error: err, simulated: true };
  }
};

// ==========================================
// 2.1 STORIES TABLE PERSISTENCE & 24H FILTERING
// ==========================================

export const supabaseCreateStory = async (story: Partial<Story>) => {
  const client = getSupabaseClient();
  if (!client) return { success: true, story, simulated: true };

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours validity

    const { data, error } = await client.from('stories').insert({
      id: story.id || `story_${Date.now()}`,
      user_id: story.userId || 'user_anon',
      user_name: story.userName || 'Membre AfriChat',
      user_avatar: story.userAvatar || '',
      user_flag: story.userFlag || '🇨🇮',
      media_url: story.mediaUrl || '',
      media_type: story.type || 'image',
      caption: story.caption || '',
      is_vip: Boolean(story.vipLocked),
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    }).select().single();

    if (error) throw error;
    return { data, error: null, simulated: false };
  } catch (err) {
    console.warn('Supabase create story error:', err);
    return { error: err, data: null, simulated: false };
  }
};

export const supabaseFetchStories = async (): Promise<{
  data: Story[];
  error: any;
  simulated: boolean;
}> => {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: null, simulated: true };

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await client
      .from('stories')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const stories: Story[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name || 'Membre AfriChat',
      userAvatar: row.user_avatar || '',
      userFlag: row.user_flag || '🇨🇮',
      mediaUrl: row.media_url,
      type: row.media_type || (row.media_url?.includes('.mp4') ? 'video' : 'image'),
      caption: row.caption || '',
      timestamp: row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'À l’instant',
      hasUnseen: true,
      vipLocked: Boolean(row.is_vip),
    }));

    return { data: stories, error: null, simulated: false };
  } catch (err) {
    console.warn('Supabase fetch stories warning:', err);
    return { error: err, data: [], simulated: false };
  }
};

export const supabaseSubscribeStories = (
  onStoryEvent: (story: Story, eventType: 'INSERT' | 'DELETE') => void
): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('realtime_stories_feed_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'stories' },
      (payload: any) => {
        const record = payload.new || payload.old;
        if (record) {
          const story: Story = {
            id: record.id,
            userId: record.user_id,
            userName: record.user_name || 'Membre AfriChat',
            userAvatar: record.user_avatar || '',
            userFlag: record.user_flag || '🇨🇮',
            mediaUrl: record.media_url,
            type: record.media_type || 'image',
            caption: record.caption || '',
            timestamp: 'À l’instant',
            hasUnseen: true,
            vipLocked: Boolean(record.is_vip),
          };
          onStoryEvent(story, payload.eventType as any);
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

// ==========================================
// 3. NEWS FEED POSTS & INTERACTIONS
// ==========================================

export const postRowToPost = (row: any): Post => {
  const authorData = row.author || {};
  return {
    id: row.id,
    userId: row.author_id || authorData.id || 'user_anon',
    author: {
      id: row.author_id || authorData.id || 'user_anon',
      name: row.author_name || authorData.name || 'Membre AfriChat',
      username: authorData.username ? (authorData.username.startsWith('@') ? authorData.username : `@${authorData.username}`) : (row.author_username || '@membre'),
      avatar: row.author_avatar || authorData.avatar_url || authorData.avatar || '',
      flag: row.author_flag || authorData.flag || '🇨🇮',
      country: row.country || authorData.country || "Côte d'Ivoire",
      isVerified: Boolean(authorData.is_verified || authorData.role === 'admin' || authorData.role === 'super_admin'),
      isVIPCreator: Boolean(authorData.is_vip || authorData.role === 'vip' || authorData.role === 'creator'),
    },
    content: row.content || '',
    mediaUrl: row.media_url || undefined,
    mediaType: row.media_type || (row.media_url?.includes('.mp4') ? 'video' : row.media_url ? 'image' : 'text'),
    timestamp: row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'À l’instant',
    likesCount: row.likes_count || (Array.isArray(row.likes) ? row.likes.length : 0),
    commentsCount: row.comments_count || (Array.isArray(row.comments) ? row.comments.length : 0),
    sharesCount: row.shares_count || 0,
    isLiked: false,
    isVIPOnly: Boolean(row.is_vip_only),
    vipPrice: row.vip_price || undefined,
    isUnlocked: true,
    comments: Array.isArray(row.comments)
      ? row.comments.map((c: any) => ({
          id: c.id || `c_${Math.random().toString(36).substring(2, 8)}`,
          userId: c.author_id || c.userId || 'user_anon',
          userName: c.author_name || c.userName || 'Membre AfriChat',
          userAvatar: c.author_avatar || c.userAvatar || '',
          userFlag: c.userFlag || '🇨🇮',
          content: c.text || c.content || '',
          timestamp: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'À l’instant',
          likes: c.likes_count || 0,
        }))
      : [],
    location: row.location || undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
  };
};

export const supabaseFetchPosts = async (limit: number = 30, offset: number = 0): Promise<{
  data: Post[];
  error: any;
  simulated: boolean;
}> => {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: null, simulated: true };
  try {
    const { data, error } = await client
      .from('posts')
      .select('*, author:profiles(*), likes:post_likes(*), comments:post_comments(*)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    const posts: Post[] = (data || []).map(postRowToPost);
    return { data: posts, error: null, simulated: false };
  } catch (err) {
    console.warn('Supabase fetch posts warning:', err);
    return { error: err, data: [], simulated: false };
  }
};

export const supabaseSubscribePosts = (
  onPostEvent: (post: Post, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): (() => void) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('realtime_posts_feed_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'posts' },
      (payload: any) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const record = payload.new || payload.old;
        if (record) {
          const post = postRowToPost(record);
          onPostEvent(post, eventType);
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

export const supabaseCreatePost = async (post: Partial<Post>) => {
  const client = getSupabaseClient();
  
  // Also dispatch to Facebook & TikTok Webhook handler
  dispatchSocialWebhook(post).catch((err) => {
    console.warn('Social Webhook dispatch notice:', err);
  });

  if (!client) return { success: true, post, simulated: true };
  try {
    const { data, error } = await client.from('posts').insert({
      id: post.id || `post_${Date.now()}`,
      author_id: post.author?.id || post.userId || 'user_anon',
      author_name: post.author?.name || 'Utilisateur AfriChat',
      author_avatar: post.author?.avatar || '',
      author_flag: post.author?.flag || '🇨🇮',
      content: post.content || '',
      media_url: post.mediaUrl || null,
      media_type: post.mediaType || 'text',
      country: post.author?.country || 'Côte d’Ivoire',
      likes_count: post.likesCount || 0,
      comments_count: post.commentsCount || 0,
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    return { data, error: null, simulated: false };
  } catch (err) {
    return { error: err, data: null, simulated: false };
  }
};

export const supabaseToggleLikePost = async (postId: string, userId: string, isLiked: boolean) => {
  const client = getSupabaseClient();
  if (!client) return { success: true, simulated: true };
  try {
    if (isLiked) {
      await client.from('post_likes').delete().match({ post_id: postId, user_id: userId });
    } else {
      await client.from('post_likes').insert({ post_id: postId, user_id: userId });
    }
    return { success: true, simulated: false };
  } catch (err) {
    return { success: false, error: err, simulated: false };
  }
};

export const supabaseAddComment = async (postId: string, comment: Partial<Comment>) => {
  const client = getSupabaseClient();
  if (!client) return { success: true, simulated: true };
  try {
    const { data, error } = await client.from('post_comments').insert({
      id: comment.id || `cmt_${Date.now()}`,
      post_id: postId,
      author_id: comment.userId || 'user_anon',
      author_name: comment.userName || 'Utilisateur AfriChat',
      author_avatar: comment.userAvatar || '',
      text: comment.content || '',
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    return { data, error: null, simulated: false };
  } catch (err) {
    return { error: err, data: null, simulated: false };
  }
};

// ==========================================
// 4. CONVERSATIONS & REALTIME MESSAGING
// ==========================================

export const syncMessageToSupabase = async (conversationId: string, message: Message) => {
  const client = getSupabaseClient();
  if (!client) return { success: false, simulated: true };

  try {
    const { error } = await client.from('messages').insert({
      id: message.id,
      conversation_id: conversationId,
      sender_id: message.senderId,
      sender_name: message.senderName || '',
      text: message.text,
      media_url: message.mediaUrl || null,
      media_type: message.mediaType || null,
      created_at: new Date().toISOString(),
      status: 'sent',
    });
    if (error) throw error;
    return { success: true, simulated: false };
  } catch (err) {
    return { success: false, error: err, simulated: false };
  }
};

export const supabaseFetchMessages = async (conversationId: string, limit: number = 50) => {
  const client = getSupabaseClient();
  if (!client) return { data: null, simulated: true };
  try {
    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    return { data, error, simulated: false };
  } catch (err) {
    return { error: err, data: null, simulated: false };
  }
};

// Realtime listener subscription helper
export const supabaseSubscribeMessages = (
  conversationId: string,
  onMessageReceived: (message: any) => void
) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel(`room:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessageReceived(payload.new);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

// ==========================================
// 5. SECURITY & MODERATION (BLOCK & REPORT)
// ==========================================

export interface SupabaseReportPayload {
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
}

export interface SupabaseReportResult {
  success: boolean;
  autoSuspended: boolean;
  distinctReportersCount: number;
  reportId: string;
  error?: any;
  simulated?: boolean;
}

// Local cache helpers for robust fallback
const safeGetLocalReports = (): any[] => {
  try {
    const raw = localStorage.getItem('africhat_supabase_reports');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const safeSaveLocalReports = (reports: any[]) => {
  try {
    localStorage.setItem('africhat_supabase_reports', JSON.stringify(reports));
  } catch (e) {
    console.warn(e);
  }
};

export const supabaseRecordReport = async (
  payload: SupabaseReportPayload
): Promise<SupabaseReportResult> => {
  const client = getSupabaseClient();
  const reportId = `AFR-SEC-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  // 1. Update local storage cache first for instant fallback
  const localReports = safeGetLocalReports();
  localReports.unshift({
    id: reportId,
    reporter_id: payload.reporterId,
    reporter_name: payload.reporterName,
    target_id: payload.targetId,
    target_name: payload.targetName,
    reason: payload.reason,
    details: payload.details,
    created_at: now,
    status: 'pending',
  });
  safeSaveLocalReports(localReports);

  // Count distinct local reporters for this target
  const targetReports = localReports.filter((r) => r.target_id === payload.targetId);
  const distinctReporters = new Set(targetReports.map((r) => r.reporter_id));
  let distinctCount = distinctReporters.size;
  let autoSuspended = distinctCount >= 3;

  if (autoSuspended) {
    try {
      const suspended = JSON.parse(localStorage.getItem('africhat_suspended_users') || '[]');
      if (!suspended.includes(payload.targetId)) {
        suspended.push(payload.targetId);
        localStorage.setItem('africhat_suspended_users', JSON.stringify(suspended));
      }
    } catch {}
  }

  if (!client) {
    return {
      success: true,
      autoSuspended,
      distinctReportersCount: distinctCount,
      reportId,
      simulated: true,
    };
  }

  try {
    // 2. Insert report into Supabase 'reports' table
    const { error: insertError } = await client.from('reports').insert({
      id: reportId,
      reporter_id: payload.reporterId,
      reporter_name: payload.reporterName,
      target_id: payload.targetId,
      target_name: payload.targetName,
      reason: payload.reason,
      details: payload.details,
      created_at: now,
      status: autoSuspended ? 'auto_suspended' : 'pending',
    });

    if (insertError) {
      console.warn('[Supabase Report] Insert note:', insertError.message);
    }

    // 3. Query all distinct reports from Supabase for this target
    const { data: dbReports } = await client
      .from('reports')
      .select('reporter_id')
      .eq('target_id', payload.targetId);

    if (dbReports && dbReports.length > 0) {
      const dbDistinct = new Set(dbReports.map((r) => r.reporter_id));
      distinctCount = Math.max(distinctCount, dbDistinct.size);
      autoSuspended = distinctCount >= 3;
    }

    // 4. Automatic Moderation Threshold Check: If >= 3 distinct reporters -> suspend account
    if (autoSuspended) {
      await client
        .from('profiles')
        .update({
          is_suspended: true,
          suspension_reason: `Compte suspendu automatiquement suite à 3 signalements de membres distincts (${payload.reason})`,
          role: 'suspended',
          updated_at: now,
        })
        .eq('id', payload.targetId);

      // Also update reports status to auto_suspended
      await client
        .from('reports')
        .update({ status: 'auto_suspended' })
        .eq('target_id', payload.targetId);
    }

    return {
      success: true,
      autoSuspended,
      distinctReportersCount: distinctCount,
      reportId,
      simulated: false,
    };
  } catch (err: any) {
    console.warn('Error recording report to Supabase:', err);
    return {
      success: true,
      autoSuspended,
      distinctReportersCount: distinctCount,
      reportId,
      error: err,
      simulated: false,
    };
  }
};

export const supabaseBlockUser = async (blockerId: string, blockedId: string) => {
  // Update local block storage
  try {
    const raw = localStorage.getItem(`africhat_blocks_${blockerId}`) || '[]';
    const list: string[] = JSON.parse(raw);
    if (!list.includes(blockedId)) {
      list.push(blockedId);
      localStorage.setItem(`africhat_blocks_${blockerId}`, JSON.stringify(list));
    }
  } catch {}

  const client = getSupabaseClient();
  if (!client) return { success: true, simulated: true };

  try {
    const { error } = await client.from('user_blocks').upsert({
      id: `${blockerId}_${blockedId}`,
      blocker_id: blockerId,
      blocked_id: blockedId,
      created_at: new Date().toISOString(),
    });
    return { success: !error, error, simulated: false };
  } catch (err) {
    return { success: false, error: err, simulated: false };
  }
};

export const supabaseUnblockUser = async (blockerId: string, blockedId: string) => {
  // Update local block storage
  try {
    const raw = localStorage.getItem(`africhat_blocks_${blockerId}`) || '[]';
    const list: string[] = JSON.parse(raw);
    const updated = list.filter((id) => id !== blockedId);
    localStorage.setItem(`africhat_blocks_${blockerId}`, JSON.stringify(updated));
  } catch {}

  const client = getSupabaseClient();
  if (!client) return { success: true, simulated: true };

  try {
    const { error } = await client
      .from('user_blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);
    return { success: !error, error, simulated: false };
  } catch (err) {
    return { success: false, error: err, simulated: false };
  }
};

export const supabaseFetchBlockedUserIds = async (userId: string): Promise<string[]> => {
  let localList: string[] = [];
  try {
    const raw = localStorage.getItem(`africhat_blocks_${userId}`) || '[]';
    localList = JSON.parse(raw);
  } catch {}

  const client = getSupabaseClient();
  if (!client) return localList;

  try {
    const { data, error } = await client
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);

    if (error || !data) return localList;
    const dbList = data.map((item: any) => item.blocked_id);
    const merged = Array.from(new Set([...localList, ...dbList]));
    return merged;
  } catch {
    return localList;
  }
};

export const supabaseFetchReports = async (targetId?: string) => {
  const client = getSupabaseClient();
  const localReports = safeGetLocalReports();

  if (!client) {
    return {
      data: targetId ? localReports.filter((r) => r.target_id === targetId) : localReports,
      simulated: true,
    };
  }

  try {
    let query = client.from('reports').select('*').order('created_at', { ascending: false });
    if (targetId) query = query.eq('target_id', targetId);
    const { data, error } = await query;
    return { data: data || localReports, error, simulated: false };
  } catch (err) {
    return { data: localReports, error: err, simulated: false };
  }
};

export const supabaseUnlockUser = async (userId: string) => {
  try {
    const suspended = JSON.parse(localStorage.getItem('africhat_suspended_users') || '[]');
    const filtered = suspended.filter((id: string) => id !== userId);
    localStorage.setItem('africhat_suspended_users', JSON.stringify(filtered));
  } catch {}

  const client = getSupabaseClient();
  if (!client) return { success: true, simulated: true };

  try {
    const { error } = await client
      .from('profiles')
      .update({
        is_suspended: false,
        suspension_reason: null,
        role: 'user',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    await client
      .from('reports')
      .update({ status: 'resolved' })
      .eq('target_id', userId);

    return { success: !error, error, simulated: false };
  } catch (err) {
    return { success: false, error: err, simulated: false };
  }
};

// ==========================================
// 6. LIVE STREAMS & LIVE SALONS SUPABASE REALTIME
// ==========================================

const safeGetLocalLiveStreams = (): LiveStreamSession[] => {
  try {
    const raw = localStorage.getItem('africhat_live_streams');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const safeSaveLocalLiveStreams = (streams: LiveStreamSession[]) => {
  try {
    localStorage.setItem('africhat_live_streams', JSON.stringify(streams));
  } catch (e) {
    console.warn(e);
  }
};

export const supabaseFetchLiveStreams = async (): Promise<{ data: LiveStreamSession[]; error?: any; simulated?: boolean }> => {
  const client = getSupabaseClient();
  const localStreams = safeGetLocalLiveStreams();

  if (!client) {
    return { data: localStreams, simulated: true };
  }

  try {
    const { data, error } = await client
      .from('live_streams')
      .select('*')
      .eq('is_live', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return { data: localStreams, error, simulated: false };
    }

    const formatted: LiveStreamSession[] = data.map((item: any) => ({
      id: item.id,
      hostId: item.host_id,
      hostName: item.host_name,
      hostUsername: item.host_username || `@${item.host_name.toLowerCase().replace(/\s+/g, '_')}`,
      hostAvatar: item.host_avatar || '',
      hostFlag: item.host_flag || '🇨🇮',
      title: item.title,
      category: item.category || 'Général',
      viewerCount: item.viewer_count || 1,
      likesCount: item.likes_count || 0,
      totalGiftsFcfa: Number(item.total_gifts_fcfa) || 0,
      startedAt: 'En direct',
      isLive: item.is_live,
      streamType: item.stream_type || 'camera',
      videoUrl: item.video_url,
      coverUrl: item.cover_url,
    }));

    safeSaveLocalLiveStreams(formatted);
    return { data: formatted, simulated: false };
  } catch (err) {
    return { data: localStreams, error: err, simulated: false };
  }
};

export const supabaseCreateLiveStream = async (session: LiveStreamSession): Promise<{ success: boolean; data?: LiveStreamSession; error?: any }> => {
  const localStreams = safeGetLocalLiveStreams();
  const updatedLocal = [session, ...localStreams.filter((s) => s.id !== session.id)];
  safeSaveLocalLiveStreams(updatedLocal);

  const client = getSupabaseClient();
  if (!client) return { success: true, data: session };

  try {
    const { error } = await client.from('live_streams').upsert({
      id: session.id,
      host_id: session.hostId,
      host_name: session.hostName,
      host_username: session.hostUsername,
      host_avatar: session.hostAvatar,
      host_flag: session.hostFlag,
      title: session.title,
      category: session.category,
      viewer_count: session.viewerCount || 1,
      likes_count: session.likesCount || 0,
      total_gifts_fcfa: session.totalGiftsFcfa || 0,
      stream_type: session.streamType || 'camera',
      video_url: session.videoUrl || null,
      cover_url: session.coverUrl || null,
      is_live: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[Supabase Live] Upsert note:', error.message);
    }
    return { success: !error, data: session, error };
  } catch (err) {
    console.warn('Error creating live session in Supabase:', err);
    return { success: true, data: session, error: err };
  }
};

export const supabaseEndLiveStream = async (sessionId: string): Promise<{ success: boolean }> => {
  const localStreams = safeGetLocalLiveStreams();
  const updatedLocal = localStreams.filter((s) => s.id !== sessionId);
  safeSaveLocalLiveStreams(updatedLocal);

  const client = getSupabaseClient();
  if (!client) return { success: true };

  try {
    await client
      .from('live_streams')
      .update({ is_live: false, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    return { success: true };
  } catch (err) {
    console.warn('Error ending live session:', err);
    return { success: true };
  }
};

export const supabaseSubscribeLiveStreams = (onUpdate: (streams: LiveStreamSession[]) => void) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('public:live_streams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_streams' },
        async () => {
          const res = await supabaseFetchLiveStreams();
          onUpdate(res.data || []);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Failed to subscribe to live streams:', err);
    return () => {};
  }
};

export const supabaseFetchLiveMessages = async (liveId: string): Promise<LiveChatMessage[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('live_stream_messages')
      .select('*')
      .eq('live_id', liveId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error || !data) return [];
    return data.map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      userName: m.user_name,
      userAvatar: m.user_avatar || '',
      userFlag: m.user_flag || '🇨🇮',
      text: m.text,
      gift: m.gift_data || undefined,
      isHost: m.is_host || false,
      timestamp: 'À l’instant',
    }));
  } catch {
    return [];
  }
};

export const supabaseSendLiveMessage = async (liveId: string, message: LiveChatMessage): Promise<{ success: boolean }> => {
  const client = getSupabaseClient();
  if (!client) return { success: true };

  try {
    await client.from('live_stream_messages').insert({
      id: message.id,
      live_id: liveId,
      user_id: message.userId,
      user_name: message.userName,
      user_avatar: message.userAvatar,
      user_flag: message.userFlag,
      text: message.text,
      gift_data: message.gift || null,
      is_host: message.isHost || false,
      created_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    console.warn('Error sending live message to Supabase:', err);
    return { success: true };
  }
};

export const supabaseSubscribeLiveMessages = (liveId: string, onMessage: (msg: LiveChatMessage) => void) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel(`live_messages:${liveId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_stream_messages', filter: `live_id=eq.${liveId}` },
        (payload) => {
          const m = payload.new as any;
          if (m) {
            onMessage({
              id: m.id,
              userId: m.user_id,
              userName: m.user_name,
              userAvatar: m.user_avatar || '',
              userFlag: m.user_flag || '🇨🇮',
              text: m.text,
              gift: m.gift_data || undefined,
              isHost: m.is_host || false,
              timestamp: 'À l’instant',
            });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
};

// ==========================================
// 7. READY-TO-USE SQL SCHEMA GENERATOR
// ==========================================

export const getSupabaseSchemaSql = (): string => {
  return `-- ====================================================
-- AFRICHAT CONNECT - SUPABASE POSTGRESQL SCHEMA
-- Exécutez ce script dans l'Éditeur SQL de votre dashboard Supabase
-- ====================================================

-- 1. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  country TEXT DEFAULT 'Côte d’Ivoire',
  flag TEXT DEFAULT '🇨🇮',
  phone_number TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  reports_count INT DEFAULT 0,
  role TEXT DEFAULT 'user',
  wallet_balance_fcfa NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table des publications du fil d'actualité
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  author_flag TEXT DEFAULT '🇨🇮',
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  category TEXT DEFAULT 'Général',
  country TEXT DEFAULT 'Côte d’Ivoire',
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table des likes
CREATE TABLE IF NOT EXISTS public.post_likes (
  id BIGSERIAL PRIMARY KEY,
  post_id TEXT REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- 4. Table des commentaires
CREATE TABLE IF NOT EXISTS public.post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table des conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  name TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  is_vip_room BOOLEAN DEFAULT FALSE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table des messages (Chat temps réel)
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT,
  text TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Table des blocages utilisateurs (Bloquer un utilisateur)
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id TEXT PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(blocker_id, blocked_id)
);

-- 8. Table des signalements & Modération automatique (3 signalements = suspension)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reporter_name TEXT,
  target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_name TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Table des Salons et Diffusions Directs (Live Streams)
CREATE TABLE IF NOT EXISTS public.live_streams (
  id TEXT PRIMARY KEY,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  host_username TEXT,
  host_avatar TEXT,
  host_flag TEXT DEFAULT '🇨🇮',
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Général',
  viewer_count INT DEFAULT 1,
  likes_count INT DEFAULT 0,
  total_gifts_fcfa NUMERIC DEFAULT 0,
  stream_type TEXT DEFAULT 'camera',
  video_url TEXT,
  cover_url TEXT,
  is_live BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Table des Messages de Chat en Direct (Live Messages)
CREATE TABLE IF NOT EXISTS public.live_stream_messages (
  id TEXT PRIMARY KEY,
  live_id TEXT REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  user_flag TEXT DEFAULT '🇨🇮',
  text TEXT NOT NULL,
  gift_data JSONB,
  is_host BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Activer Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_messages ENABLE ROW LEVEL SECURITY;

-- 12. Création des buckets de stockage pour avatars & médias (posts-media)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true), ('posts-media', 'posts-media', true), ('posts_media', 'posts_media', true)
ON CONFLICT (id) DO NOTHING;

-- 13. Politiques d'accès publiques pour lecture & upload storage
CREATE POLICY "Lecture publique storage posts-media" ON storage.objects FOR SELECT USING (bucket_id IN ('posts-media', 'posts_media', 'avatars'));
CREATE POLICY "Upload public/authentifié posts-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('posts-media', 'posts_media', 'avatars'));

-- 14. Politiques d'accès publiques pour tables
CREATE POLICY "Lecture publique des profils" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Modification de son propre profil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Lecture publique des posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Insertion de posts par utilisateurs connectés" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Lecture des messages par conversation" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Envoi de messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Gestion de ses propres blocages" ON public.user_blocks FOR ALL USING (auth.uid() = blocker_id);
CREATE POLICY "Envoi de signalements" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Lecture des signalements pour modération" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Lecture publique des salons live" ON public.live_streams FOR SELECT USING (true);
CREATE POLICY "Gestion de ses propres diffusions live" ON public.live_streams FOR ALL USING (auth.uid() = host_id);
CREATE POLICY "Lecture publique des messages live" ON public.live_stream_messages FOR SELECT USING (true);
CREATE POLICY "Envoi de messages dans les lives" ON public.live_stream_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 15. DÉCLENCHEUR WEBHOOK SUPABASE (Auto-Publication Facebook & TikTok)
${getSupabaseWebhookSql(getWebhookConfig().targetUrl || 'https://votre-url-webhook.com/africhat-social-publish')}
`;
};

