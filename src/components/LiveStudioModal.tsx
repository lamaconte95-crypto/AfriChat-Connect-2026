import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { 
  Radio, 
  X, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Users, 
  Heart, 
  Flame, 
  Sparkles, 
  Gift, 
  Send, 
  RotateCw, 
  Crown, 
  CheckCircle,
  AlertCircle,
  Play,
  Share2,
  StopCircle,
  UserPlus
} from 'lucide-react';
import { User, LiveStreamSession, LiveChatMessage, VirtualGift, Contact } from '../types';
import { SendGiftModal } from './SendGiftModal';
import { InviteParticipantsModal } from './InviteParticipantsModal';
import { isAgoraConfigured } from '../services/agoraService';
import { 
  supabaseCreateLiveStream, 
  supabaseEndLiveStream, 
  supabaseFetchLiveMessages, 
  supabaseSendLiveMessage, 
  supabaseSubscribeLiveMessages 
} from '../services/supabaseService';

interface LiveStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  activeLiveSession?: LiveStreamSession | null;
  contacts?: Contact[];
  onOpenDeposit: () => void;
  onGiftSentToHost?: (gift: VirtualGift, hostName: string) => void;
  onLiveStarted?: (session: LiveStreamSession) => void;
  onLiveEnded?: (sessionId: string) => void;
  onTriggerToast?: (msg: string, type?: 'success' | 'danger' | 'info') => void;
}

export const LiveStudioModal: React.FC<LiveStudioModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeLiveSession,
  contacts = [],
  onOpenDeposit,
  onGiftSentToHost,
  onLiveStarted,
  onLiveEnded,
  onTriggerToast,
}) => {
  const isBroadcaster = !activeLiveSession;
  const [liveTitle, setLiveTitle] = useState('🔥 Direct Live AfriChat • Échange avec la communauté');
  const [liveCategory, setLiveCategory] = useState('Culture & Lifestyle');
  const [isStarted, setIsStarted] = useState(!isBroadcaster);
  const [currentSessionId, setCurrentSessionId] = useState<string>(activeLiveSession ? activeLiveSession.id : '');
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  
  const [viewersCount, setViewersCount] = useState(activeLiveSession ? activeLiveSession.viewerCount : 1);
  const [likesCount, setLikesCount] = useState(activeLiveSession ? activeLiveSession.likesCount : 0);
  const [totalEarningsFcfa, setTotalEarningsFcfa] = useState(activeLiveSession ? activeLiveSession.totalGiftsFcfa : 0);
  
  // Real messages strictly from real participants
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; icon: string; x: number }[]>([]);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<VirtualGift | null>(null);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [liveDurationSeconds, setLiveDurationSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  // Permission & Quota Safety States
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'checking' | 'granted' | 'denied' | 'error' | 'unavailable'>('checking');
  const [permissionErrorMessage, setPermissionErrorMessage] = useState<string | null>(null);
  const [hasWarned55Min, setHasWarned55Min] = useState(false);

  const MAX_LIVE_DURATION_SECONDS = 3600; // 60 minutes max quota safety
  const remainingSeconds = Math.max(0, MAX_LIVE_DURATION_SECONDS - liveDurationSeconds);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Synchronize activeLiveSession prop
  useEffect(() => {
    if (activeLiveSession) {
      setCurrentSessionId(activeLiveSession.id);
      setIsStarted(true);
      setViewersCount(activeLiveSession.viewerCount);
      setLikesCount(activeLiveSession.likesCount);
      setTotalEarningsFcfa(activeLiveSession.totalGiftsFcfa);
    } else {
      setIsStarted(false);
      setCurrentSessionId('');
    }
  }, [activeLiveSession]);

  // Load and subscribe to real chat messages for the current live session
  useEffect(() => {
    if (!isOpen || !currentSessionId) return;

    // 1. Initial fetch from Supabase
    supabaseFetchLiveMessages(currentSessionId).then((fetched) => {
      if (fetched && fetched.length > 0) {
        setMessages(fetched);
      } else {
        setMessages([]);
      }
    });

    // 2. Realtime listener for incoming messages from other real users
    const unsubscribe = supabaseSubscribeLiveMessages(currentSessionId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, currentSessionId]);

  // Initialize Media Stream (Camera / Mic) with explicit permission handling
  const requestCameraAccess = async () => {
    setCameraPermissionStatus('checking');
    setPermissionErrorMessage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermissionStatus('unavailable');
      setPermissionErrorMessage("Votre navigateur ou appareil ne prend pas en charge l'accès à la caméra.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacingMode },
        audio: isAudioOn,
      });

      streamRef.current = stream;
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
      }
      setCameraPermissionStatus('granted');
      setPermissionErrorMessage(null);
    } catch (err: any) {
      console.warn('Camera / Microphone permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermissionStatus('denied');
        setPermissionErrorMessage("Accès à la caméra ou au microphone refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur (icône cadenas 🔒 dans la barre d'adresse).");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraPermissionStatus('unavailable');
        setPermissionErrorMessage("Aucune caméra ou microphone détecté sur cet appareil.");
      } else {
        setCameraPermissionStatus('error');
        setPermissionErrorMessage(`Erreur d'accès à la caméra : ${err.message || 'Périphérique indisponible'}`);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    if (isBroadcaster && isVideoOn) {
      requestCameraAccess();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, isBroadcaster, isVideoOn, cameraFacingMode, isAudioOn]);

  // Live Timer & Quota Safety (60 minutes maximum)
  useEffect(() => {
    if (!isOpen || !isStarted) return;

    const timer = setInterval(() => {
      setLiveDurationSeconds((prev) => {
        const next = prev + 1;

        // Warning at 55 minutes (3300 seconds)
        if (next >= 3300 && next < 3600 && !hasWarned55Min) {
          setHasWarned55Min(true);
          onTriggerToast?.(
            "⚠️ Attention : Fin automatique du Live dans 5 minutes (limite 60 min max pour préserver les quotas Agora RTC).",
            'danger'
          );
        }

        // Automatic end at 60 minutes (3600 seconds)
        if (next >= 3600) {
          clearInterval(timer);
          onTriggerToast?.(
            "⏱️ Limite maximale de 60 minutes atteinte. Le direct a été clôturé pour préserver les quotas Agora RTC.",
            'info'
          );
          handleEndLiveStream();
          return 3600;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isStarted, hasWarned55Min]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start broadcasting live session
  const handleStartBroadcast = async () => {
    const sessionId = `live_${currentUser.id}_${Date.now()}`;
    const newSession: LiveStreamSession = {
      id: sessionId,
      hostId: currentUser.id,
      hostName: currentUser.name,
      hostUsername: currentUser.username,
      hostAvatar: currentUser.avatar,
      hostFlag: currentUser.flag,
      title: liveTitle.trim() || `🔥 Direct Live • ${currentUser.name}`,
      category: liveCategory,
      viewerCount: 1,
      likesCount: 0,
      totalGiftsFcfa: 0,
      startedAt: 'À l’instant',
      isLive: true,
      streamType: 'camera',
    };

    setCurrentSessionId(sessionId);
    setIsStarted(true);
    setViewersCount(1);
    setLikesCount(0);
    setTotalEarningsFcfa(0);

    // Persist and broadcast via Supabase
    await supabaseCreateLiveStream(newSession);
    onLiveStarted?.(newSession);
  };

  // End or close live session
  const handleEndLiveStream = async () => {
    if (isBroadcaster && currentSessionId) {
      setIsEnding(true);
      await supabaseEndLiveStream(currentSessionId);
      onLiveEnded?.(currentSessionId);
      setIsEnding(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    onClose();
  };

  const triggerReaction = (icon: string) => {
    setLikesCount((prev) => prev + 1);
    const newHeart = {
      id: Date.now() + Math.random(),
      icon: icon,
      x: Math.floor(Math.random() * 80) + 10,
    };
    setFloatingHearts((prev) => [...prev.slice(-15), newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: LiveChatMessage = {
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userFlag: currentUser.flag,
      text: chatInput.trim(),
      timestamp: 'À l’instant',
      isHost: isBroadcaster,
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    if (currentSessionId) {
      await supabaseSendLiveMessage(currentSessionId, newMsg);
    }
  };

  const handleReceiveGift = async (gift: VirtualGift, note?: string) => {
    setTotalEarningsFcfa((prev) => prev + gift.priceFcfa);
    setActiveGiftAnimation(gift);

    const giftMsg: LiveChatMessage = {
      id: `gift_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userFlag: currentUser.flag,
      text: note ? `A offert un ${gift.name} : "${note}"` : `A offert un ${gift.name} 🎁`,
      gift: gift,
      timestamp: 'À l’instant',
    };

    setMessages((prev) => [...prev, giftMsg]);
    if (onGiftSentToHost) {
      onGiftSentToHost(gift, activeLiveSession?.hostName || 'Streamer');
    }

    if (currentSessionId) {
      await supabaseSendLiveMessage(currentSessionId, giftMsg);
    }

    setTimeout(() => {
      setActiveGiftAnimation(null);
    }, 3000);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="live-studio-modal-overlay" 
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg h-full sm:h-[92vh] bg-stone-950 border border-stone-800 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col text-stone-100"
        >
          {/* Broadcaster Pre-Live Setup Screen */}
          {isBroadcaster && !isStarted ? (
            <div className="flex-1 flex flex-col justify-between p-6 space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">Studio de Diffusion Live</h3>
                    <p className="text-xs text-stone-400">Lancez votre direct auprès des membres AfriChat</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-stone-900 border border-stone-800 text-stone-300 flex items-center justify-center hover:bg-stone-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Camera Preview Box */}
              <div className="relative w-full h-56 rounded-3xl bg-stone-900 border border-stone-800 overflow-hidden flex items-center justify-center">
                {isVideoOn && cameraPermissionStatus === 'granted' ? (
                  <video
                    ref={videoElementRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : cameraPermissionStatus === 'checking' ? (
                  <div className="flex flex-col items-center space-y-2 text-stone-400 p-4 text-center">
                    <span className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <span className="text-xs font-bold">Vérification de l'accès caméra & micro...</span>
                  </div>
                ) : cameraPermissionStatus === 'denied' || cameraPermissionStatus === 'error' || cameraPermissionStatus === 'unavailable' ? (
                  <div className="flex flex-col items-center space-y-2.5 p-4 text-center max-w-sm">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-rose-300 font-bold leading-relaxed">
                      {permissionErrorMessage || "Accès à la caméra refusé. Veuillez autoriser l'accès."}
                    </p>
                    <button
                      type="button"
                      onClick={requestCameraAccess}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-black hover:bg-amber-400 transition-colors cursor-pointer shadow-md"
                    >
                      Réessayer l'autorisation
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2 text-stone-500">
                    <VideoOff className="w-8 h-8" />
                    <span className="text-xs">Caméra désactivée</span>
                  </div>
                )}

                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsVideoOn((prev) => !prev)}
                      className={`p-2 rounded-xl backdrop-blur-md border ${
                        isVideoOn ? 'bg-black/60 border-stone-700 text-white' : 'bg-rose-500/80 border-rose-400 text-white'
                      }`}
                    >
                      {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAudioOn((prev) => !prev)}
                      className={`p-2 rounded-xl backdrop-blur-md border ${
                        isAudioOn ? 'bg-black/60 border-stone-700 text-white' : 'bg-rose-500/80 border-rose-400 text-white'
                      }`}
                    >
                      {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCameraFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                    className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-stone-700 text-white hover:text-amber-400"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Category Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Titre du direct
                  </label>
                  <input
                    type="text"
                    value={liveTitle}
                    onChange={(e) => setLiveTitle(e.target.value)}
                    placeholder="Ex: Échange en direct avec la communauté..."
                    className="w-full px-4 py-3 rounded-2xl bg-stone-900 border border-stone-800 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Catégorie
                  </label>
                  <select
                    value={liveCategory}
                    onChange={(e) => setLiveCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-900 border border-stone-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Culture & Lifestyle">Culture & Lifestyle</option>
                    <option value="Musique & Show">Musique & Show</option>
                    <option value="Fintech & Business">Fintech & Business</option>
                    <option value="Mode & Création">Mode & Création</option>
                    <option value="Débat & Actualités">Débat & Actualités</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-2.5">
                  <span className="text-base">✨</span>
                  <div className="text-xs text-amber-200">
                    <span className="font-bold">Diffusion en direct réelle :</span> Votre salon sera visible par tous les membres connectés dans le menu Live.
                  </div>
                </div>
              </div>

              {/* Start Live CTA */}
              <button
                id="start-live-broadcast-btn"
                onClick={handleStartBroadcast}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-orange-500 text-stone-950 font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Radio className="w-5 h-5 animate-pulse" />
                <span>Démarrer le Direct Live</span>
              </button>
            </div>
          ) : (
            /* Active Live Canvas & Controls */
            <>
              <div className="relative flex-1 bg-stone-950 overflow-hidden flex items-center justify-center">
                {isBroadcaster ? (
                  isVideoOn ? (
                    <video
                      ref={videoElementRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400">
                        <VideoOff className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-sm">Caméra Désactivée</h4>
                      <p className="text-xs text-stone-400">Votre micro reste actif pour le direct audio</p>
                    </div>
                  )
                ) : (
                  activeLiveSession?.videoUrl ? (
                    <video
                      src={activeLiveSession.videoUrl}
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    activeLiveSession?.coverUrl ? (
                      <img
                        src={activeLiveSession.coverUrl}
                        alt="Live Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 flex flex-col items-center justify-center text-amber-400">
                        <Radio className="w-16 h-16 animate-pulse mb-3 opacity-60" />
                        <span className="text-sm font-bold text-stone-300">Live Studio AfriChat</span>
                      </div>
                    )
                  )
                )}

                {/* Dark gradient overlay for UI readibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />

                {/* Top Bar Stats & Controls */}
                <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-20">
                  {/* Host Info & Live Pill */}
                  <div className="flex items-center space-x-2">
                    <UserAvatar
                      name={activeLiveSession ? activeLiveSession.hostName : currentUser.name}
                      avatar={activeLiveSession ? activeLiveSession.hostAvatar : currentUser.avatar}
                      size="md"
                    />
                    <div className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-stone-800">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-white truncate max-w-[120px]">
                          {activeLiveSession ? activeLiveSession.hostName : currentUser.name}
                        </span>
                        <span>{activeLiveSession ? activeLiveSession.hostFlag : currentUser.flag}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-amber-300">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{viewersCount.toLocaleString()}</span>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {formatDuration(liveDurationSeconds)}
                        </span>
                        <span>•</span>
                        {/* 60-Minute Quota Safety Countdown Badge */}
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded-md text-[9px] flex items-center space-x-1 ${
                            remainingSeconds <= 300
                              ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                          title="Chronomètre de sécurité Agora (limite 60 min)"
                        >
                          <span>⏳</span>
                          <span>{formatDuration(remainingSeconds)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Close / End Button */}
                  <div className="flex items-center space-x-2">
                    {/* Invite / Ajouter des personnes Button */}
                    <button
                      id="live-invite-participants-btn"
                      onClick={() => setIsInviteModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
                      title="Inviter / Ajouter des personnes"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Inviter</span>
                    </button>

                    {isAgoraConfigured() && (
                      <span className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                        <span>Agora RTC • 1080p 60fps</span>
                      </span>
                    )}

                    <div className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-xs flex items-center space-x-1 shadow-lg shadow-rose-600/40 animate-pulse">
                      <Radio className="w-3.5 h-3.5" />
                      <span>DIRECT</span>
                    </div>

                    {isBroadcaster ? (
                      <button
                        onClick={handleEndLiveStream}
                        disabled={isEnding}
                        className="py-1.5 px-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1 shadow-lg cursor-pointer"
                        title="Terminer le direct"
                      >
                        <StopCircle className="w-4 h-4" />
                        <span>Terminer</span>
                      </button>
                    ) : (
                      <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-black/60 backdrop-blur border border-stone-700 text-white flex items-center justify-center hover:bg-stone-800 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Total Earnings Badge */}
                <div className="absolute top-16 right-4 z-20">
                  <div className="px-3 py-1.5 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1.5 shadow-lg">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>{totalEarningsFcfa.toLocaleString()} FCFA récoltés</span>
                  </div>
                </div>

                {/* Big Center Gift Animation Popup */}
                <AnimatePresence>
                  {activeGiftAnimation && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, y: 50 }}
                      animate={{ scale: [0, 1.3, 1], opacity: 1, y: 0 }}
                      exit={{ scale: 0.8, opacity: 0, y: -50 }}
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none p-4"
                    >
                      <div className="p-6 rounded-3xl bg-black/80 backdrop-blur-xl border-2 border-amber-400 text-center space-y-2 shadow-2xl shadow-amber-500/50">
                        <span className="text-6xl block drop-shadow-2xl animate-bounce">
                          {activeGiftAnimation.icon}
                        </span>
                        <h3 className="text-xl font-black text-amber-300">
                          {activeGiftAnimation.name} !
                        </h3>
                        <p className="text-xs text-white font-bold">
                          +{activeGiftAnimation.priceFcfa.toLocaleString()} FCFA pour le créateur !
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating Hearts Stream */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  {floatingHearts.map((h) => (
                    <motion.span
                      key={h.id}
                      initial={{ opacity: 1, y: 0, scale: 0.8 }}
                      animate={{ opacity: 0, y: -300, scale: 1.5 }}
                      transition={{ duration: 1.8, ease: 'easeOut' }}
                      style={{ left: `${h.x}%` }}
                      className="absolute bottom-20 text-3xl select-none drop-shadow-lg"
                    >
                      {h.icon}
                    </motion.span>
                  ))}
                </div>

                {/* Live Chat Stream Overlay */}
                <div className="absolute bottom-20 inset-x-0 p-4 max-h-56 overflow-y-auto space-y-2 z-20 scrollbar-none">
                  {messages.length === 0 ? (
                    <div className="text-[11px] text-stone-400 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl inline-block">
                      💬 Bienvenue dans le direct. Envoyez vos messages et offrez des cadeaux en direct !
                    </div>
                  ) : (
                    messages.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-2xl backdrop-blur-md text-xs max-w-[88%] ${
                          m.gift
                            ? 'bg-amber-500/30 border border-amber-500 text-amber-200 font-bold'
                            : m.isHost
                            ? 'bg-amber-950/70 border border-amber-500/50 text-white font-bold'
                            : 'bg-black/50 border border-stone-800 text-stone-100'
                        }`}
                      >
                        <UserAvatar
                          name={m.userName}
                          avatar={m.userAvatar}
                          size="xs"
                        />
                        <div className="truncate">
                          <span className="font-bold text-amber-300 mr-1.5">
                            {m.userName} {m.userFlag}
                          </span>
                          <span className="text-stone-200">{m.text}</span>
                        </div>
                        {m.gift && <span className="text-base shrink-0">{m.gift.icon}</span>}
                      </motion.div>
                    ))
                  )}
                  <div ref={chatBottomRef} />
                </div>
              </div>

              {/* Bottom Live Controls Bar */}
              <div className="p-3.5 bg-stone-950 border-t border-stone-800 flex items-center justify-between gap-2 z-30">
                {isBroadcaster ? (
                  /* Broadcaster Controls */
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsVideoOn((prev) => !prev)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isVideoOn
                            ? 'bg-stone-800 border-stone-700 text-stone-200'
                            : 'bg-rose-500/20 border-rose-500 text-rose-300'
                        }`}
                        title="Activer/Désactiver la vidéo"
                      >
                        {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAudioOn((prev) => !prev)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isAudioOn
                            ? 'bg-stone-800 border-stone-700 text-stone-200'
                            : 'bg-rose-500/20 border-rose-500 text-rose-300'
                        }`}
                        title="Activer/Désactiver le micro"
                      >
                        {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCameraFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
                        }
                        className="p-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 hover:text-amber-400 cursor-pointer"
                        title="Changer de caméra"
                      >
                        <RotateCw className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Broadcast Chat Input */}
                    <form onSubmit={handleSendMessage} className="flex-1 max-w-[200px] flex items-center bg-stone-900 border border-stone-800 rounded-xl px-2.5">
                      <input
                        type="text"
                        placeholder="Répondre..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="w-full py-2 bg-transparent text-xs text-white focus:outline-none placeholder:text-stone-500"
                      />
                      <button type="submit" className="text-amber-400 cursor-pointer">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={() => triggerReaction('🔥')}
                      className="p-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs flex items-center space-x-1 cursor-pointer hover:scale-105 shadow"
                    >
                      <Flame className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Viewer Controls (Gift, Reactions, Chat) */
                  <div className="flex items-center space-x-2 w-full">
                    {/* Chat Form */}
                    <form onSubmit={handleSendMessage} className="flex-1 flex items-center bg-stone-900 border border-stone-800 rounded-2xl px-3 py-1">
                      <input
                        type="text"
                        placeholder="Commenter en direct..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="w-full py-2 bg-transparent text-xs text-white focus:outline-none placeholder:text-stone-500"
                      />
                      <button type="submit" className="text-amber-400 hover:text-amber-300 p-1 cursor-pointer">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Gift Button */}
                    <button
                      type="button"
                      onClick={() => setIsGiftModalOpen(true)}
                      className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-xs flex items-center space-x-1.5 shadow-lg shadow-orange-500/20 hover:scale-105 cursor-pointer shrink-0"
                    >
                      <Gift className="w-4 h-4" />
                      <span className="hidden sm:inline">Offrir Cadeau</span>
                    </button>

                    {/* Quick Reaction Buttons */}
                    <button
                      type="button"
                      onClick={() => triggerReaction('❤️')}
                      className="p-2.5 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Heart className="w-5 h-5 fill-rose-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerReaction('🔥')}
                      className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Flame className="w-5 h-5 fill-amber-400" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Send Gift Modal Sub-window */}
      {isGiftModalOpen && (
        <SendGiftModal
          isOpen={isGiftModalOpen}
          onClose={() => setIsGiftModalOpen(false)}
          currentUser={currentUser}
          recipientName={activeLiveSession ? activeLiveSession.hostName : 'Créateur Live'}
          recipientAvatar={activeLiveSession ? activeLiveSession.hostAvatar : currentUser.avatar}
          recipientFlag={activeLiveSession ? activeLiveSession.hostFlag : '🇨🇮'}
          onSendGift={handleReceiveGift}
          onOpenDeposit={onOpenDeposit}
        />
      )}

      {/* Invite / Ajouter des personnes Modal Sub-window */}
      {isInviteModalOpen && (
        <InviteParticipantsModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          currentUser={currentUser}
          contacts={contacts}
          inviteTarget={{
            type: 'live',
            title: activeLiveSession ? activeLiveSession.title : liveTitle,
            sessionId: currentSessionId || activeLiveSession?.id,
          }}
          onTriggerToast={onTriggerToast}
        />
      )}
    </AnimatePresence>
  );
};
