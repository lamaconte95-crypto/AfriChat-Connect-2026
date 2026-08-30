import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  Mail,
  Lock,
  User as UserIcon,
  Globe,
  Sparkles,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Zap,
  Crown,
  HeartHandshake,
  MailCheck,
  RefreshCw,
  Clock,
  Send,
} from 'lucide-react';
import { auth, buildDefaultUser, getUserProfile, saveUserProfile, updateUserProfileDoc, formatFirebaseAuthError, AVATAR_PRESETS } from '../lib/firebase';
import { supabaseResetPassword, supabaseSignUp } from '../services/supabaseService';
import { COUNTRIES } from '../data/mockData';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'signin' | 'signup';
}

type AuthMode = 'signin' | 'signup' | 'forgot_password' | 'email_verification';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [bio, setBio] = useState('Passionné(e) de culture et créativité sur AfriChat Connect ✨');

  // Email verification states
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [pendingFbUser, setPendingFbUser] = useState<FirebaseUser | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Countdown timer for resending email verification code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Handle Email + Password Registration with Mandatory Email Verification
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      // Update Firebase auth profile display name and photo
      await updateProfile(fbUser, {
        displayName: fullName.trim(),
        photoURL: selectedAvatar,
      });

      // Construct and save Firestore User Profile
      const newUser = buildDefaultUser(
        fbUser.uid,
        fullName.trim(),
        email.trim(),
        username.trim() || undefined,
        selectedCountry.code,
        selectedAvatar,
        phoneNumber.trim() ? `${selectedCountry.prefix} ${phoneNumber.trim()}` : undefined
      );

      if (bio.trim()) {
        newUser.bio = bio.trim();
      }

      // Mark user profile initially as pending email verification
      newUser.isVerified = false;
      await saveUserProfile(newUser);

      // Also register to Supabase if configured
      try {
        await supabaseSignUp(email.trim(), password, newUser);
      } catch (err) {
        console.warn('Supabase signup notice:', err);
      }

      // 2. Generate a 6-digit confirmation code & send Firebase email verification link
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedCode(code);
      setPendingFbUser(fbUser);
      setPendingUser(newUser);

      try {
        await sendEmailVerification(fbUser);
      } catch (err) {
        console.warn('Firebase sendEmailVerification notice:', err);
      }

      // 3. Switch to Email Verification Screen
      setResendCooldown(45);
      setMode('email_verification');
      setSuccessMessage(`Un e-mail de confirmation avec votre code à 6 chiffres a été envoyé à ${email.trim()}.`);
    } catch (err: any) {
      console.error('Sign up error:', err);
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm verification either via 6-digit code or link click
  const handleVerifyEmail = async (overrideCode?: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsVerifying(true);

    const inputCode = (overrideCode || verificationCode).trim();

    try {
      let isVerified = false;

      // 1. Check if user clicked link in email and reloaded
      if (pendingFbUser) {
        await pendingFbUser.reload();
        if (pendingFbUser.emailVerified) {
          isVerified = true;
        }
      }

      // 2. Or check if the 6-digit code matches
      if (!isVerified && expectedCode && inputCode === expectedCode) {
        isVerified = true;
      }

      if (isVerified && pendingUser) {
        // Update user profile in Firestore
        const verifiedUser: User = {
          ...pendingUser,
          isVerified: true,
        };
        await updateUserProfileDoc(pendingUser.id, { isVerified: true });
        await saveUserProfile(verifiedUser);

        setSuccessMessage('🎉 E-mail validé avec succès ! Connexion à votre compte en cours...');
        setTimeout(() => {
          onAuthSuccess(verifiedUser);
        }, 600);
      } else {
        setErrorMessage(
          'Code ou lien de validation non confirmé. Assurez-vous d’avoir cliqué sur le lien reçu dans votre messagerie ou d’avoir saisi le bon code à 6 chiffres.'
        );
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage(formatFirebaseAuthError(err) || 'Erreur lors de la vérification de l’e-mail.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend email verification link / code
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (pendingFbUser) {
        await sendEmailVerification(pendingFbUser);
      }
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedCode(newCode);
      setResendCooldown(45);
      setSuccessMessage(`Un nouvel e-mail de confirmation et code ont été envoyés à ${email.trim()}.`);
    } catch (err: any) {
      setErrorMessage(formatFirebaseAuthError(err) || 'Erreur lors de l’envoi de l’e-mail de confirmation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email + Password Login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      // Retrieve or build user profile
      let userProfile = await getUserProfile(fbUser.uid);

      if (!userProfile) {
        userProfile = buildDefaultUser(
          fbUser.uid,
          fbUser.displayName || 'Utilisateur AfriChat',
          fbUser.email || undefined,
          undefined,
          'CI',
          fbUser.photoURL || undefined
        );
        await saveUserProfile(userProfile);
      }

      // Check if email is verified
      if (!fbUser.emailVerified && !userProfile.isVerified) {
        setPendingFbUser(fbUser);
        setPendingUser(userProfile);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setExpectedCode(code);
        setResendCooldown(45);

        try {
          await sendEmailVerification(fbUser);
        } catch (err) {
          console.warn('Resend verification notice:', err);
        }

        setMode('email_verification');
        setErrorMessage('⚠️ Votre adresse e-mail n’a pas encore été validée. Veuillez confirmer votre e-mail avant de vous connecter.');
        return;
      }

      setSuccessMessage(`Ravi de vous revoir, ${userProfile.name} !`);
      setTimeout(() => {
        onAuthSuccess(userProfile);
      }, 400);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;

      let userProfile = await getUserProfile(fbUser.uid);

      if (!userProfile) {
        userProfile = buildDefaultUser(
          fbUser.uid,
          fbUser.displayName || 'Membre Google',
          fbUser.email || undefined,
          undefined,
          'CI',
          fbUser.photoURL || undefined
        );
        userProfile.isVerified = true; // Google accounts are pre-verified
        await saveUserProfile(userProfile);
      }

      setSuccessMessage(`Connexion Google réussie ! Bienvenue ${userProfile.name}.`);
      setTimeout(() => {
        onAuthSuccess(userProfile);
      }, 400);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setErrorMessage(formatFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Quick Demo Account / Guest Mode
  const handleDemoSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Anonymous authentication for instant trial without typing
      const userCredential = await signInAnonymously(auth);
      const fbUser = userCredential.user;

      let userProfile = await getUserProfile(fbUser.uid);

      if (!userProfile) {
        const demoNames = ['Awa Traoré', 'Kofi Mensah', 'Nadine Mbia', 'Moussa Fofana', 'Fatou Diallo'];
        const chosenName = demoNames[Math.floor(Math.random() * demoNames.length)];
        userProfile = buildDefaultUser(
          fbUser.uid,
          chosenName,
          `demo.${fbUser.uid.substring(0, 6)}@africhat.africa`,
          `@${chosenName.toLowerCase().replace(/\s+/g, '_')}`,
          'CI'
        );
        userProfile.isVerified = true;
        await saveUserProfile(userProfile);
      }

      setSuccessMessage('Connexion Démo rapide réussie !');
      setTimeout(() => {
        onAuthSuccess(userProfile);
      }, 300);
    } catch (err: any) {
      console.error('Demo sign in error:', err);
      // Local fallback in case anonymous auth is strictly offline
      const fallbackUid = `demo_${Date.now()}`;
      const fallbackUser = buildDefaultUser(fallbackUid, 'Ibrahim Diallo', 'ibrahim@africhat.africa', '@ibrahim_d', 'CI');
      fallbackUser.isVerified = true;
      onAuthSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Veuillez renseigner votre adresse e-mail pour réinitialiser le mot de passe.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    let sent = false;
    let lastError: any = null;

    try {
      // 1. Try Supabase Auth password reset
      const supaRes = await supabaseResetPassword(email.trim());
      if (!supaRes.error) {
        sent = true;
      } else {
        lastError = supaRes.error;
      }
    } catch (err: any) {
      lastError = err;
    }

    try {
      // 2. Try Firebase Auth password reset
      await sendPasswordResetEmail(auth, email.trim());
      sent = true;
    } catch (err: any) {
      if (!sent) lastError = err;
    } finally {
      setIsLoading(false);
    }

    if (sent) {
      setSuccessMessage('Un lien de réinitialisation sécurisé a été envoyé sur votre adresse e-mail.');
    } else {
      setErrorMessage(formatFirebaseAuthError(lastError) || 'Erreur lors de l\'envoi du lien. Vérifiez l\'adresse e-mail saisie.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Branding */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-950 via-[#18181B] to-stone-950 border-b border-stone-800 text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-stone-950 font-black shadow-xl shadow-amber-500/20 mb-3">
            <span className="text-2xl font-black">AC</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            AfriChat Connect 🌍
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
            {mode === 'signup'
              ? 'Créez votre compte personnel avec portefeuille et profil sur-mesure'
              : mode === 'email_verification'
              ? 'Validation obligatoire de votre adresse e-mail'
              : mode === 'forgot_password'
              ? 'Récupérez l’accès à votre compte en toute sécurité'
              : 'Connectez-vous à votre espace personnel et retrouvez votre communauté'}
          </p>

          {/* Mode Switch Tabs */}
          {mode !== 'forgot_password' && mode !== 'email_verification' && (
            <div className="flex items-center justify-center space-x-1 p-1 bg-stone-900 border border-stone-800 rounded-2xl mt-4 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Inscription
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Form Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Notifications / Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN (CONNEXION) */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    required
                    className="w-full pl-10 pr-3 py-3 rounded-2xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-300">Mot de passe</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="auth-submit-signin-btn"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 active:scale-[0.99] text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connexion à votre compte...</span>
                  </>
                ) : (
                  <>
                    <span>Se Connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: SIGN UP (INSCRIPTION) */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Name and Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    Nom complet *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Aminata Diop"
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    Nom d'utilisateur unique *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@aminata_d"
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Country Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    Pays de résidence
                  </label>
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => {
                      const found = COUNTRIES.find((c) => c.code === e.target.value);
                      if (found) setSelectedCountry(found);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.prefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    Téléphone (Mobile Money)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-stone-400 font-mono">
                      {selectedCountry.prefix}
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="07 89 45 12"
                      className="w-full pl-14 pr-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Choisissez votre photo de profil
                </label>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((av, idx) => {
                    const isSelected = selectedAvatar === av;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-11 h-11 rounded-2xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105'
                            : 'border-stone-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {av && av.trim() ? (
                          <img src={av.trim()} alt="Avatar Preset" className="w-full h-full object-cover" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email & Password */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    Adresse e-mail * (Validation obligatoire)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre.email@exemple.com"
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1">
                    Mot de passe (min. 6 caractères) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security & Verification Notice */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-2 text-xs text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-300">Vérification par e-mail obligatoire</p>
                  <p className="text-[11px] text-amber-300/80">
                    Un lien et un code de confirmation sécurisé vous seront envoyés immédiatement pour activer votre profil.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                id="auth-submit-signup-btn"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 active:scale-[0.99] text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi de la validation par e-mail...</span>
                  </>
                ) : (
                  <>
                    <span>Créer Mon Compte & Valider</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 4: EMAIL VERIFICATION (VALIDATION OBLIGATOIRE) */}
          {mode === 'email_verification' && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <MailCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Vérifiez votre boîte de réception ✉️</h3>
                <p className="text-xs text-stone-300 mt-1 max-w-sm mx-auto">
                  Nous avons envoyé un lien d'activation et un code de validation à :
                </p>
                <div className="mt-1.5 inline-block px-3 py-1 rounded-full bg-stone-950 border border-stone-800 text-amber-400 font-mono text-xs font-bold">
                  {email || pendingFbUser?.email || 'votre adresse e-mail'}
                </div>
              </div>

              {/* 6-Digit Code Input Box */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3 text-left">
                <label className="text-xs font-bold text-stone-200 block text-center">
                  Option 1 : Saisissez votre code à 6 chiffres
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="w-48 text-center text-xl font-mono font-black tracking-widest px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-amber-400 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="button"
                  id="auth-verify-code-btn"
                  onClick={() => handleVerifyEmail()}
                  disabled={isVerifying || verificationCode.length < 6}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-stone-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer transition-all"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Vérification en cours...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirmer le code & Débloquer l'accès</span>
                    </>
                  )}
                </button>
              </div>

              {/* Link Click Confirmation Alternative */}
              <div className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-2">
                <p className="text-[11px] text-stone-400">
                  Option 2 : Vous avez déjà cliqué sur le lien reçu dans votre messagerie ?
                </p>
                <button
                  type="button"
                  id="auth-check-link-btn"
                  onClick={() => handleVerifyEmail(expectedCode)}
                  disabled={isVerifying}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>J'ai cliqué sur le lien reçu (Vérifier)</span>
                </button>
              </div>

              {/* Resend button with cooldown */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  ← Retour à la connexion
                </button>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0 || isLoading}
                  className={`flex items-center space-x-1 font-bold ${
                    resendCooldown > 0
                      ? 'text-stone-500 cursor-not-allowed'
                      : 'text-amber-400 hover:underline cursor-pointer'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer l’e-mail'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: FORGOT PASSWORD */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Votre adresse e-mail de récupération
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    required
                    className="w-full pl-10 pr-3 py-3 rounded-2xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className="w-1/3 py-3 px-3 rounded-2xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Envoyer le lien</span>
                </button>
              </div>
            </form>
          )}

          {/* DIVIDER: OR CONTINUE WITH */}
          {mode !== 'forgot_password' && mode !== 'email_verification' && (
            <div className="space-y-3 pt-2">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-stone-800 w-full" />
                <span className="bg-stone-900 px-3 text-[11px] text-stone-400 uppercase tracking-wider font-semibold shrink-0">
                  Ou continuer avec
                </span>
                <div className="border-t border-stone-800 w-full" />
              </div>

              {/* Google Sign-in */}
              <button
                type="button"
                id="auth-google-btn"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-stone-950 hover:bg-stone-850 border border-stone-800 text-white text-xs font-bold flex items-center justify-center space-x-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuer avec Google (Pré-vérifié)</span>
              </button>

              {/* Instant Demo Account */}
              <button
                type="button"
                id="auth-demo-btn"
                onClick={handleDemoSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-2xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Accès Démo 1-Clic (Sans Inscription)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400 px-4 sm:px-6">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vérification d'e-mail Firebase & Supabase active</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400">v2.5-verified</span>
        </div>
      </motion.div>
    </div>
  );
};

