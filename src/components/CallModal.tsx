import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  SwitchCamera, 
  Crown, 
  Sparkles, 
  Coins, 
  Smile, 
  MessageSquare, 
  Maximize2, 
  Minimize2, 
  Heart, 
  Flame, 
  ThumbsUp, 
  UserPlus,
  ShieldCheck,
  Radio,
  Wifi
} from 'lucide-react';
import { ChatConversation, User, Contact } from '../types';
import { getAgoraAppId, isAgoraConfigured, initializeAgoraCallSession } from '../services/agoraService';
import { InviteParticipantsModal } from './InviteParticipantsModal';
import { UserAvatar } from './UserAvatar';

interface CallModalProps {
  isOpen: boolean;
  callType: 'audio' | 'video';
  conversation: ChatConversation | null;
  currentUser: User;
  contacts?: Contact[];
  onEndCall: () => void;
  onSendTip?: (name: string) => void;
  onTriggerToast?: (msg: string, type?: 'success' | 'danger' | 'info') => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  callType,
  conversation,
  currentUser,
  contacts = [],
  onEndCall,
  onSendTip,
  onTriggerToast,
}) => {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'HD 1080p' | 'HD 720p' | 'HQ Audio'>('HD 1080p');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const agoraSessionRef = useRef<any>(null);

  // Synthesize ringing / beep tone with Web Audio API safely
  const playTone = (type: 'ring' | 'end') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'ring') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Initialize camera for video calls or when video is toggled on
  useEffect(() => {
    if (isOpen && isVideoEnabled) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera permission denied or not available, fallback gracefully
          setLocalStream(null);
        });
    } else if (!isVideoEnabled && localStream) {
      localStream.getVideoTracks().forEach((track) => track.stop());
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, isVideoEnabled]);

  // Handle call lifecycle: ringing -> connected and Agora initialization
  useEffect(() => {
    if (!isOpen || !conversation) {
      setCallStatus('ringing');
      setCallDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Initialize Agora session metadata
    agoraSessionRef.current = initializeAgoraCallSession(
      currentUser.id,
      conversation.id,
      callType
    );

    setCallStatus('ringing');
    playTone('ring');

    const ringInterval = setInterval(() => {
      playTone('ring');
    }, 2000);

    // Simulate remote contact answering after 1.8 seconds
    const answerTimeout = setTimeout(() => {
      clearInterval(ringInterval);
      setCallStatus('connected');
      if (agoraSessionRef.current) {
        agoraSessionRef.current.status = 'connected';
      }
    }, 1800);

    return () => {
      clearInterval(ringInterval);
      clearTimeout(answerTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, conversation?.id]);

  // Run call duration timer when connected
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Method leave() - Agora RTC & Local stream disconnection
  const leave = () => {
    playTone('end');
    setCallStatus('ended');

    // Terminate Agora Call Session
    if (agoraSessionRef.current) {
      agoraSessionRef.current.status = 'ended';
      agoraSessionRef.current = null;
    }

    // Stop all local media tracks (Audio & Video)
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setTimeout(() => {
      onEndCall();
    }, 350);
  };

  // Toggle Microphone Track
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    if (onTriggerToast) {
      onTriggerToast(nextMuted ? '🔇 Microphone coupé (Mute)' : '🎙️ Microphone activé', 'info');
    }
  };

  // Toggle Camera Track
  const toggleVideo = () => {
    const nextVideo = !isVideoEnabled;
    setIsVideoEnabled(nextVideo);
    if (onTriggerToast) {
      onTriggerToast(nextVideo ? '📹 Caméra activée' : '🚫 Caméra désactivée', 'info');
    }
  };

  const triggerReaction = (emoji: string) => {
    const newId = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id: newId, emoji, x: Math.random() * 60 + 20 }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newId));
    }, 2000);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !conversation) return null;

  const isVideo = isVideoEnabled || callType === 'video';

  return (
    <AnimatePresence>
      <div 
        id="africhat-call-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-2xl overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className={`relative w-full h-full sm:h-[720px] sm:max-w-md sm:rounded-[36px] overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-black sm:border sm:border-stone-800 shadow-2xl flex flex-col justify-between text-stone-100 ${
            isVideo ? 'bg-black' : ''
          }`}
        >
          {/* TOP BAR: Agora RTC Engine, Encryption, and Invite Action */}
          <div className="relative z-30 p-4 pt-6 sm:pt-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>AfriConnect HD {isVideo ? 'Vidéo' : 'Audio'}</span>
              </span>
              {isAgoraConfigured() && (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  <span>Agora RTC</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="call-invite-top-btn"
                onClick={() => setIsInviteModalOpen(true)}
                className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1.5 hover:bg-amber-500/30 transition-all cursor-pointer shadow-md"
                title="Inviter / Ajouter des personnes"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline text-[11px]">Inviter</span>
              </button>

              <div className="flex items-center space-x-1.5 text-[10px] text-stone-300 bg-stone-900/80 px-2.5 py-1 rounded-full border border-stone-800 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Chiffré Agora 🔒</span>
              </div>
            </div>
          </div>

          {/* FLOATING REACTIONS OVERLAY */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {floatingReactions.map((r, idx) => (
              <motion.div
                key={`call-reaction-${r.id || idx}_${idx}`}
                initial={{ opacity: 1, y: 520, x: `${r.x}%`, scale: 0.5 }}
                animate={{ opacity: 0, y: 80, scale: 2 }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
                className="absolute text-4xl"
              >
                {r.emoji}
              </motion.div>
            ))}
          </div>

          {/* MAIN CALL STAGE: AUDIO vs VIDEO */}
          <div className="relative flex-1 w-full h-full flex flex-col justify-center items-center overflow-hidden pb-32 sm:pb-28">
            {isVideo ? (
              /* VIDEO CALL VIEW */
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Remote Video Stream Simulation */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-stone-950">
                  <UserAvatar
                    name={conversation.name}
                    avatar={conversation.avatar}
                    size="huge"
                    className="w-full h-full rounded-none filter brightness-[0.78] contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                </div>

                {/* Status Header overlay */}
                <div className="relative z-10 text-center space-y-1.5 mt-8">
                  <h3 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg flex items-center justify-center space-x-2">
                    <span>{conversation.name}</span>
                    {conversation.isVIPRoom && <Crown className="w-5 h-5 text-amber-400" />}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-amber-300 drop-shadow">
                    {callStatus === 'ringing' ? (
                      <span className="inline-flex items-center space-x-1 animate-pulse">
                        <span>Sonnerie en cours...</span>
                        <Radio className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Agora HD 1080p • {formatDuration(callDuration)}</span>
                      </span>
                    )}
                  </p>
                </div>

                {/* Self View (Picture-in-Picture) */}
                <div className="absolute top-4 right-4 z-20 w-28 h-40 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-2xl bg-stone-900">
                  {localStream && isVideoEnabled ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 p-2 text-center">
                      <UserAvatar
                        name={currentUser.name}
                        username={currentUser.username}
                        avatar={currentUser.avatar}
                        flag={currentUser.flag}
                        size="md"
                        className="w-12 h-12 border border-amber-400 mb-1"
                      />
                      <span className="text-[10px] text-stone-300 font-bold">{currentUser.name.split(' ')[0]} (Moi)</span>
                      {!isVideoEnabled && (
                        <span className="text-[9px] text-rose-400 font-semibold">Caméra OFF</span>
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-stone-200">
                    Moi
                  </div>
                </div>
              </div>
            ) : (
              /* AUDIO CALL VIEW */
              <div className="relative w-full flex flex-col items-center justify-center px-6 text-center space-y-5 my-auto">
                {/* Avatar with Pulsing Soundwaves */}
                <div className="relative">
                  {callStatus === 'connected' && !isMuted && (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 rounded-full bg-amber-500/30 blur-md -m-4"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                        className="absolute inset-0 rounded-full bg-orange-500/20 blur-lg -m-8"
                      />
                    </>
                  )}

                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 shadow-2xl flex items-center justify-center">
                    <UserAvatar
                      name={conversation.name}
                      avatar={conversation.avatar}
                      isVIP={conversation.isVIPRoom}
                      type={conversation.isVIPRoom || conversation.isCommunity ? 'channel' : 'user'}
                      size="huge"
                      className="w-full h-full border-4 border-stone-950"
                    />
                    {conversation.isVIPRoom && (
                      <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center font-black shadow-lg">
                        <Crown className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info & Timer */}
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {conversation.name}
                  </h3>
                  <p className="text-xs text-stone-400 font-medium">
                    {conversation.isVIPRoom ? 'Salon Audio VIP AfriChat' : 'Appel Réseau Mobile Money'}
                  </p>
                  <div className="pt-2">
                    {callStatus === 'ringing' ? (
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-800/90 border border-stone-700 text-amber-400 text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Sonnerie en cours...</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-mono font-black shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{formatDuration(callDuration)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Animated Waveform Visualizer */}
                {callStatus === 'connected' && (
                  <div className="flex items-center justify-center space-x-1.5 h-10 py-2">
                    {[40, 75, 90, 60, 100, 45, 80, 65, 95, 50, 70, 85].map((height, i) => (
                      <motion.div
                        key={`call-wave-${i}`}
                        animate={isMuted ? { height: '4px' } : { height: [`${Math.max(8, height * 0.2)}px`, `${height * 0.35}px`, `${Math.max(8, height * 0.2)}px`] }}
                        transition={{ duration: 0.6 + (i % 3) * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1 rounded-full bg-gradient-to-t from-amber-500 to-orange-400"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FLOATING QUICK REACTIONS TRAY */}
          {callStatus === 'connected' && (
            <div className="absolute bottom-24 sm:bottom-22 left-0 right-0 z-40 px-4 py-1 flex items-center justify-center space-x-2.5">
              {['❤️', '🔥', '👏', '🇨🇮', '🇸🇳', '🎉'].map((emoji, idx) => (
                <button
                  key={`call-emoji-${emoji}_${idx}`}
                  onClick={() => triggerReaction(emoji)}
                  className="w-9 h-9 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-700/80 flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-90 shadow-md cursor-pointer backdrop-blur-md"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* PERMANENT FIXED BOTTOM CONTROLS BAR (Z-50) */}
          <div 
            id="africhat-call-controls-bar"
            className="absolute bottom-0 left-0 right-0 z-50 w-full p-4 sm:p-5 pb-7 sm:pb-5 bg-stone-950/95 border-t border-stone-800/90 rounded-none sm:rounded-b-[36px] backdrop-blur-2xl shadow-[0_-10px_35px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-center justify-around max-w-sm mx-auto">
              {/* 1. MUTE MICRO BUTTON */}
              <button
                id="call-toggle-mic-btn"
                onClick={toggleMute}
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isMuted 
                    ? 'bg-rose-600 hover:bg-rose-750 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400' 
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                }`}
                title={isMuted ? 'Activer micro' : 'Couper micro (Mute)'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
                <span className="text-[9px] font-bold mt-0.5">{isMuted ? 'Muet' : 'Micro'}</span>
              </button>

              {/* 2. CAMERA ON / OFF BUTTON */}
              <button
                id="call-toggle-video-btn"
                onClick={toggleVideo}
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                  !isVideoEnabled 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400' 
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                }`}
                title={isVideoEnabled ? 'Désactiver caméra' : 'Activer caméra'}
              >
                {isVideoEnabled ? <Video className="w-5 h-5 text-amber-400" /> : <VideoOff className="w-5 h-5" />}
                <span className="text-[9px] font-bold mt-0.5">{isVideoEnabled ? 'Cam ON' : 'Cam OFF'}</span>
              </button>

              {/* 3. SWITCH CAMERA OR SPEAKERPHONE */}
              {isVideo ? (
                <button
                  id="call-flip-camera-btn"
                  onClick={() => setIsFrontCamera(!isFrontCamera)}
                  className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex flex-col items-center justify-center transition-all cursor-pointer"
                  title="Tourner la caméra"
                >
                  <SwitchCamera className="w-5 h-5 text-stone-300" />
                  <span className="text-[9px] font-bold mt-0.5">Tourner</span>
                </button>
              ) : (
                <button
                  id="call-toggle-speaker-btn"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSpeakerOn 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
                      : 'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}
                  title={isSpeakerOn ? 'Haut-parleur actif' : 'Écouteur standard'}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  <span className="text-[9px] font-bold mt-0.5">HP</span>
                </button>
              )}

              {/* 4. INVITE PARTICIPANTS */}
              <button
                id="call-invite-bottom-btn"
                onClick={() => setIsInviteModalOpen(true)}
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 flex flex-col items-center justify-center transition-all cursor-pointer"
                title="Inviter d'autres personnes"
              >
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span className="text-[9px] font-bold mt-0.5">Inviter</span>
              </button>

              {/* 5. QUICK MOBILE MONEY TIP (if enabled) */}
              {onSendTip && !conversation.isVIPRoom && (
                <button
                  id="call-quick-tip-btn"
                  onClick={() => onSendTip(conversation.name)}
                  className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 flex flex-col items-center justify-center transition-all cursor-pointer"
                  title="Envoyer Mobile Money en direct"
                >
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span className="text-[9px] font-bold mt-0.5">Pay</span>
                </button>
              )}

              {/* 6. PROMINENT RED HANGUP BUTTON - leave() */}
              <button
                id="call-end-call-btn"
                onClick={leave}
                className="w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-600/40 ring-4 ring-red-500/20 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Raccrocher et quitter l'appel (leave)"
              >
                <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
                <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">Quitter</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Invite Participants Modal */}
      {isInviteModalOpen && (
        <InviteParticipantsModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          currentUser={currentUser}
          contacts={contacts}
          inviteTarget={{
            type: 'call',
            title: `Appel ${isVideo ? 'Vidéo' : 'Audio'} avec ${conversation.name}`,
            channelId: conversation.id,
            conversationName: conversation.name,
            callType: callType,
          }}
          onTriggerToast={onTriggerToast}
        />
      )}
    </AnimatePresence>
  );
};
