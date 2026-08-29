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
} from 'firebase/firestore';
import { User, Message, ChatConversation } from '../types';
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
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...partial,
      updatedAt: serverTimestamp(),
    });
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
    walletBalance: 15000, // Welcome gift of 15,000 FCFA for demo testing
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
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà associée à un compte existant.';
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
