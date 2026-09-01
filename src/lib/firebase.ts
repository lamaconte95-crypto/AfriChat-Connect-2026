import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  getDocFromServer,
  Unsubscribe,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  increment,
} from 'firebase/firestore';
import { User, Message, ChatConversation, Follow } from '../types';
import { COUNTRIES } from '../data/mockData';

// Official Firebase Config for AfriChat Connect
export const firebaseConfig = {
  apiKey: "AIzaSyCLl9uWB6acyVDptk-2J79OVEAzNut4m5s",
  authDomain: "africhat-connect.firebaseapp.com",
  projectId: "africhat-connect",
  storageBucket: "africhat-connect.firebasestorage.app",
  messagingSenderId: "1019647791780",
  appId: "1:1019647791780:web:5a4b18f6e54504aad5cc31"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Default avatars presets for quick selection
export const AVATAR_PRESETS: string[] = [];

/**
 * Validate connection to Cloud Firestore on boot
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline cache mode.');
    }
    return false;
  }
}

/**
 * Fetch a User profile document from Firestore /users/{uid}
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (error) {
    console.warn('Could not fetch user profile from Firestore:', error);
    return null;
  }
}

/**
 * Real-time listener for a User profile in Firestore
 */
export function subscribeToUserProfile(
  uid: string,
  onUpdate: (user: User | null) => void
): Unsubscribe {
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as User);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Error subscribing to user profile:', error);
    }
  );
}

/**
 * Create or save a User document in Firestore /users/{uid}
 */
export async function saveUserProfile(user: User): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(
      userDocRef,
      {
        ...user,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not save user profile to Firestore:', error);
  }
}

/**
 * Update partial fields of a User document in Firestore
 */
export async function updateUserProfileDoc(
  uid: string,
  partial: Partial<User>
): Promise<void> {
  try {
    if (!uid) return;
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        ...partial,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not update user profile in Firestore:', error);
  }
}

/**
 * Fetch all registered users from Firestore /users
 */
export async function getAllRegisteredUsersFromFirestore(): Promise<User[]> {
  try {
    const usersColRef = collection(db, 'users');
    const q = query(usersColRef, limit(100));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as User);
    }
    return [];
  } catch (error) {
    console.warn('Could not fetch registered users from Firestore:', error);
    return [];
  }
}

/**
 * Real-time subscription to all registered users
 */
export function subscribeToAllRegisteredUsers(
  onUpdate: (users: User[]) => void
): Unsubscribe {
  const usersColRef = collection(db, 'users');
  const q = query(usersColRef, limit(100));
  return onSnapshot(
    q,
    (snap) => {
      if (!snap.empty) {
        const users = snap.docs.map((d) => d.data() as User);
        onUpdate(users);
      }
    },
    (err) => {
      console.warn('Subscription to registered users error:', err);
    }
  );
}

/**
 * Save or remove friend relationship in Firestore for a user
 */
export async function saveUserFriendInFirestore(
  userId: string,
  friendId: string,
  isFriend: boolean
): Promise<void> {
  try {
    if (!userId || !friendId) return;
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      friendIds: isFriend ? arrayUnion(friendId) : arrayRemove(friendId),
      updatedAt: serverTimestamp(),
    }).catch(async () => {
      await setDoc(
        userDocRef,
        {
          friendIds: isFriend ? [friendId] : [],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    // Also persist in subcollection for granular query/rules
    const friendDocRef = doc(db, 'users', userId, 'friends', friendId);
    if (isFriend) {
      await setDoc(friendDocRef, {
        friendId,
        isFriend: true,
        updatedAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(friendDocRef).catch(() => {});
    }
  } catch (error) {
    console.warn('Could not save friend relation in Firestore:', error);
  }
}

/**
 * Real-time listener for current user's friend IDs from Firestore
 */
export function subscribeToUserFriends(
  userId: string,
  onUpdate: (friendIds: string[]) => void
): Unsubscribe {
  if (!userId) {
    return () => {};
  }
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const friendIds: string[] = Array.isArray(data?.friendIds) ? data.friendIds : [];
        onUpdate(friendIds);
      }
    },
    (err) => {
      console.warn('Subscription to user friends error:', err);
    }
  );
}

/**
 * Fetch friend IDs for a user from Firestore
 */
export async function getUserFriendsFromFirestore(userId: string): Promise<string[]> {
  try {
    if (!userId) return [];
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return Array.isArray(data?.friendIds) ? data.friendIds : [];
    }
    return [];
  } catch (error) {
    console.warn('Could not fetch friends from Firestore:', error);
    return [];
  }
}

/**
 * Save or remove follow relationship in Firestore:
 * - Upserts/deletes in /follows/{followerId_followingId}
 * - Dynamically updates followersCount (+1/-1) on followingId profile
 * - Dynamically updates followingCount (+1/-1) on followerId profile
 */
export async function saveFollowRelationship(
  followerId: string,
  followingId: string,
  isFollow: boolean
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!followerId || !followingId || followerId === followingId) {
      return { success: false, error: 'Invalid user IDs' };
    }

    const followDocId = `${followerId}_${followingId}`;
    const followDocRef = doc(db, 'follows', followDocId);

    const followerUserRef = doc(db, 'users', followerId);
    const followingUserRef = doc(db, 'users', followingId);

    if (isFollow) {
      // 1. Write follow record to /follows collection
      await setDoc(followDocRef, {
        id: followDocId,
        followerId,
        followingId,
        createdAt: serverTimestamp(),
      });

      // 2. Increment followingCount for current user & add to followingIds
      await updateDoc(followerUserRef, {
        followingCount: increment(1),
        followingIds: arrayUnion(followingId),
        friendIds: arrayUnion(followingId),
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        await setDoc(
          followerUserRef,
          {
            followingCount: 1,
            followingIds: [followingId],
            friendIds: [followingId],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      // 3. Increment followersCount for target user & add to followerIds
      await updateDoc(followingUserRef, {
        followersCount: increment(1),
        followerIds: arrayUnion(followerId),
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        await setDoc(
          followingUserRef,
          {
            followersCount: 1,
            followerIds: [followerId],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
    } else {
      // 1. Delete follow record
      await deleteDoc(followDocRef).catch(() => {});

      // 2. Decrement followingCount for current user & remove from followingIds
      const followerSnap = await getDoc(followerUserRef).catch(() => null);
      const currentFollowingCount = followerSnap?.exists() ? (followerSnap.data()?.followingCount || 1) : 1;
      const newFollowingCount = Math.max(0, currentFollowingCount - 1);

      await updateDoc(followerUserRef, {
        followingCount: newFollowingCount,
        followingIds: arrayRemove(followingId),
        friendIds: arrayRemove(followingId),
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        await setDoc(
          followerUserRef,
          {
            followingCount: newFollowingCount,
            followingIds: [],
            friendIds: [],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      // 3. Decrement followersCount for target user & remove from followerIds
      const followingSnap = await getDoc(followingUserRef).catch(() => null);
      const currentFollowersCount = followingSnap?.exists() ? (followingSnap.data()?.followersCount || 1) : 1;
      const newFollowersCount = Math.max(0, currentFollowersCount - 1);

      await updateDoc(followingUserRef, {
        followersCount: newFollowersCount,
        followerIds: arrayRemove(followerId),
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        await setDoc(
          followingUserRef,
          {
            followersCount: newFollowersCount,
            followerIds: [],
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
    }

    return { success: true };
  } catch (error) {
    console.warn('Could not save follow relationship in Firestore:', error);
    return { success: false, error };
  }
}

/**
 * Real-time subscription to follows for a user:
 * Listens to who the user is following and who follows the user
 */
export function subscribeToUserFollows(
  userId: string,
  onUpdate: (data: { followingIds: string[]; followerIds: string[] }) => void
): Unsubscribe {
  if (!userId) {
    return () => {};
  }

  try {
    const followsCol = collection(db, 'follows');
    const followingQuery = query(followsCol, where('followerId', '==', userId));
    const followersQuery = query(followsCol, where('followingId', '==', userId));

    let followingIds: string[] = [];
    let followerIds: string[] = [];

    const unsubFollowing = onSnapshot(
      followingQuery,
      (snap) => {
        followingIds = snap.docs.map((d) => d.data().followingId as string).filter(Boolean);
        onUpdate({ followingIds, followerIds });
      },
      (err) => console.warn('Following subscription warning:', err)
    );

    const unsubFollowers = onSnapshot(
      followersQuery,
      (snap) => {
        followerIds = snap.docs.map((d) => d.data().followerId as string).filter(Boolean);
        onUpdate({ followingIds, followerIds });
      },
      (err) => console.warn('Followers subscription warning:', err)
    );

    return () => {
      unsubFollowing();
      unsubFollowers();
    };
  } catch (e) {
    console.warn('Error setting up follows subscriptions:', e);
    return () => {};
  }
}

/**
 * Fetch follow stats and IDs for a user from Firestore
 */
export async function getUserFollowStats(userId: string): Promise<{
  followingIds: string[];
  followerIds: string[];
  followersCount: number;
  followingCount: number;
}> {
  try {
    if (!userId) {
      return { followingIds: [], followerIds: [], followersCount: 0, followingCount: 0 };
    }

    const followsCol = collection(db, 'follows');
    const followingQ = query(followsCol, where('followerId', '==', userId));
    const followersQ = query(followsCol, where('followingId', '==', userId));

    const [followingSnap, followersSnap] = await Promise.all([
      getDocs(followingQ).catch(() => null),
      getDocs(followersQ).catch(() => null),
    ]);

    const followingIds = followingSnap ? followingSnap.docs.map((d) => d.data().followingId as string).filter(Boolean) : [];
    const followerIds = followersSnap ? followersSnap.docs.map((d) => d.data().followerId as string).filter(Boolean) : [];

    return {
      followingIds,
      followerIds,
      followersCount: followerIds.length,
      followingCount: followingIds.length,
    };
  } catch (e) {
    console.warn('Error fetching follow stats from Firestore:', e);
    return { followingIds: [], followerIds: [], followersCount: 0, followingCount: 0 };
  }
}

/**
 * Save or update a Conversation document in Firestore /conversations/{conversationId}
 */
export async function saveConversationToFirestore(
  conversation: Partial<ChatConversation> & { id: string }
): Promise<void> {
  try {
    const convDocRef = doc(db, 'conversations', conversation.id);
    const { messages, ...meta } = conversation; // store messages in subcollection or keep lastMessage
    await setDoc(
      convDocRef,
      {
        ...meta,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not save conversation to Firestore:', error);
  }
}

/**
 * Save a single Message in Firestore under /conversations/{conversationId}/messages/{messageId}
 */
export async function saveMessageToFirestore(
  conversationId: string,
  message: Message
): Promise<void> {
  try {
    // 1. Write message document to subcollection
    const msgDocRef = doc(db, 'conversations', conversationId, 'messages', message.id);
    await setDoc(
      msgDocRef,
      {
        ...message,
        conversationId,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Update conversation parent document's lastMessage and timestamp
    const convDocRef = doc(db, 'conversations', conversationId);
    await updateDoc(convDocRef, {
      lastMessage: message.text || (message.audioDuration ? `🎙️ Note vocale (${message.audioDuration})` : 'Média'),
      lastMessageTime: message.timestamp || 'À l’instant',
      updatedAt: serverTimestamp(),
    }).catch(async () => {
      // If conversation doc doesn't exist yet, create it with basic info
      await setDoc(
        convDocRef,
        {
          id: conversationId,
          lastMessage: message.text || 'Message',
          lastMessageTime: message.timestamp || 'À l’instant',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (error) {
    console.warn('Could not save message to Firestore:', error);
  }
}

/**
 * Real-time subscription to messages of a specific conversation
 */
export function subscribeToConversationMessages(
  conversationId: string,
  onUpdate: (messages: Message[]) => void
): Unsubscribe {
  const messagesColRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesColRef, orderBy('createdAt', 'asc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const msgs: Message[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: data.id || docSnap.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
            text: data.text,
            mediaType: data.mediaType,
            mediaUrl: data.mediaUrl,
            audioDuration: data.audioDuration,
            timestamp: data.timestamp || 'À l’instant',
            status: data.status || 'sent',
            isVipMessage: data.isVipMessage,
          };
        });
        onUpdate(msgs);
      }
    },
    (error) => {
      console.warn(`Firestore messages subscription error for ${conversationId}:`, error);
    }
  );
}

/**
 * Real-time subscription to all Conversations
 */
export function subscribeToAllConversations(
  onUpdate: (conversations: ChatConversation[]) => void
): Unsubscribe {
  const convsColRef = collection(db, 'conversations');
  return onSnapshot(
    convsColRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const convs: ChatConversation[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: data.id || docSnap.id,
            type: data.type || 'direct',
            name: data.name || 'Discussion',
            avatar: data.avatar,
            participantIds: data.participantIds || [],
            lastMessage: data.lastMessage,
            lastMessageTime: data.lastMessageTime || 'À l’instant',
            unreadCount: data.unreadCount || 0,
            isVIPRoom: data.isVIPRoom || false,
            hostName: data.hostName,
            entryFee: data.entryFee,
            currency: data.currency || 'FCFA',
            isUnlocked: data.isUnlocked || false,
            messages: [], // will be loaded or populated from subcollections
          };
        });
        onUpdate(convs);
      }
    },
    (error) => {
      console.warn('Firestore conversations subscription error:', error);
    }
  );
}

/**
 * Synchronize initial/default conversations to Firestore so that they persist in Cloud
 */
export async function syncInitialConversationsToFirestore(
  conversations: ChatConversation[]
): Promise<void> {
  try {
    for (const conv of conversations) {
      const convDocRef = doc(db, 'conversations', conv.id);
      const snap = await getDoc(convDocRef);
      if (!snap.exists()) {
        const { messages, ...meta } = conv;
        await setDoc(convDocRef, {
          ...meta,
          updatedAt: serverTimestamp(),
        });

        // Also save initial messages to subcollection
        if (messages && messages.length > 0) {
          for (const msg of messages) {
            const msgDocRef = doc(db, 'conversations', conv.id, 'messages', msg.id);
            await setDoc(msgDocRef, {
              ...msg,
              conversationId: conv.id,
              createdAt: serverTimestamp(),
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn('Could not sync initial conversations to Firestore:', error);
  }
}

/**
 * Build a default new User profile object
 */
export function buildDefaultUser(
  uid: string,
  name: string,
  email?: string,
  username?: string,
  countryCode: string = 'CI',
  avatar?: string,
  phoneNumber?: string
): User {
  const countryObj = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  const safeUsername = username
    ? (username.startsWith('@') ? username : `@${username}`)
    : `@${name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}_${Math.floor(100 + Math.random() * 900)}`;

  return {
    id: uid,
    name: name || 'Utilisateur AfriChat',
    username: safeUsername,
    email: email || '',
    phoneNumber: phoneNumber || '',
    avatar:
      avatar ||
      AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)],
    country: countryObj.name,
    countryCode: countryObj.code,
    flag: countryObj.flag,
    bio: 'Nouveau membre sur AfriChat Connect 🌍',
    followersCount: 0,
    followingCount: 1,
    isVIP: false,
    isVerified: false,
    walletBalance: 0,
    currency: 'FCFA',
    createdAt: new Date().toISOString(),
    authProvider: 'firebase',
  };
}

/**
 * Translate common Firebase Auth error codes to user-friendly French messages
 */
export function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  const message = error?.message || '';
  
  if (
    code === 'auth/email-already-in-use' ||
    message.includes('auth/email-already-in-use') ||
    message.toLowerCase().includes('already in use') ||
    message.toLowerCase().includes('already registered') ||
    message.toLowerCase().includes('user_already_exists')
  ) {
    return "Cette adresse e-mail est déjà associée à un compte existant. Veuillez vous rendre sur l'onglet 'Connexion' pour vous identifier ou réinitialiser votre mot de passe.";
  }

  switch (code) {
    case 'auth/invalid-email':
      return 'Veuillez saisir une adresse e-mail valide.';
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    case 'auth/user-not-found':
      return 'Aucun compte associé à cette adresse e-mail.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives échouées. Veuillez patienter un instant avant de réessayer.';
    case 'auth/popup-closed-by-user':
      return 'La fenêtre de connexion Google a été fermée avant la fin.';
    case 'auth/popup-blocked':
      return 'La fenêtre popup a été bloquée par votre navigateur.';
    case 'auth/network-request-failed':
      return 'Erreur de réseau. Veuillez vérifier votre connexion internet.';
    default:
      return error?.message || 'Une erreur est survenue lors de l’authentification.';
  }
}
