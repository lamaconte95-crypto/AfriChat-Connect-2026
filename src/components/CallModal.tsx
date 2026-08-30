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
  UserPlus
} from 'lucide-react';
import { ChatConversation, User, Contact } from '../types';
import { getAgoraAppId, isAgoraConfigured } from '../services/agoraService';
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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Initialize camera for video calls if available
  useEffect(() => {
    if (isOpen && callType === 'video' && isVideoEnabled) {
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
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, callType, isVideoEnabled]);

  // Handle call lifecycle: ringing -> connected
  useEffect(() => {
    if (!isOpen) {
      setCallStatus('ringing');
      setCallDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setCallStatus('ringing');
    playTone('ring');

    const ringInterval = setInterval(() => {
      playTone('ring');
    }, 2000);

    // Simulate contact answering after 2 seconds
    const answerTimeout = setTimeout(() => {
      clearInterval(ringInterval);
      setCallStatus('connected');
    }, 2200);

    return () => {
      clearInterval(ringInterval);
      clearTimeout(answerTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

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

  const handleEndCallInternal = () => {
    playTone('end');
    setCallStatus('ended');
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setTimeout(() => {
      onEndCall();
    }, 400);
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

  const isVideo = callType === 'video';

  return (
    <AnimatePresence>
      <div 
        id="africhat-call-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-2xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className={`relative w-full h-full sm:h-[680px] sm:max-w-md rounded-none sm:rounded-[36px] overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-black border border-stone-800 shadow-2xl flex flex-col justify-between text-stone-100 ${
            isVideo ? 'bg-black' : ''
          }`}
        >
          {/* Top Bar: Call status, Agora RTC Engine and End-to-End Encryption */}
          <div className="relative z-20 p-5 pt-8 sm:pt-5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>AfriConnect HD {isVideo ? 'Vidéo' : 'Audio'}</span>
              </span>
              {isAgoraConfigured() && (
                <span className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  <span>Agora RTC • {getAgoraAppId().slice(0, 8)}...</span>
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
                <span>Inviter</span>
              </button>

              <div className="flex items-center space-x-1.5 text-[11px] text-stone-400 bg-stone-900/80 px-3 py-1 rounded-full border border-stone-800 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Chiffré Agora 🔒</span>
              </div>
            </div>
          </div>

          {/* Floating Reactions Overlay */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {floatingReactions.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 1, y: 500, x: `${r.x}%`, scale: 0.5 }}
                animate={{ opacity: 0, y: 100, scale: 1.8 }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
                className="absolute text-4xl"
              >
                {r.emoji}
              </motion.div>
            ))}
          </div>

          {/* MAIN CALL STAGE: AUDIO vs VIDEO */}
          {isVideo ? (
            /* VIDEO CALL VIEW */
            <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
              {/* Simulated Remote Video Feed (HD contact visual with high aesthetic filter) */}
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-stone-950">
                <UserAvatar
                  name={conversation.name}
                  avatar={conversation.avatar}
                  size="huge"
                  className="w-full h-full rounded-none filter brightness-[0.75] contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/60" />
              </div>

              {/* Status Header overlay */}
              <div className="relative z-10 text-center space-y-1 mb-32">
                <h3 className="text-2xl font-black text-white drop-shadow-md flex items-center justify-center space-x-2">
                  <span>{conversation.name}</span>
                  {conversation.isVIPRoom && <Crown className="w-5 h-5 text-amber-400" />}
                </h3>
                <p className="text-sm font-semibold text-amber-300 drop-shadow">
                  {callStatus === 'ringing' ? (
                    <span className="animate-pulse">Appel vidéo en cours... 📲</span>
                  ) : (
                    <span>Connecté HD • {formatDuration(callDuration)}</span>
                  )}
                </p>
              </div>

              {/* Self View (Picture-in-Picture) */}
              <div className="absolute top-16 right-4 z-20 w-28 h-40 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-2xl bg-stone-900">
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
                      <span className="text-[9px] text-stone-400">Caméra désactivée</span>
                    )}
                  </div>
                )}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-stone-200">
                  HD 1080p
                </div>
              </div>
            </div>
          ) : (
            /* AUDIO CALL VIEW */
            <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
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

                <div className="relative w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 shadow-2xl flex items-center justify-center">
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
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {conversation.name}
                </h3>
                <p className="text-xs text-stone-400 font-medium">
                  {conversation.isVIPRoom ? 'Salon Audio VIP AfriChat' : 'Appel Réseau Mobile Money'}
                </p>
                <div className="pt-2">
                  {callStatus === 'ringing' ? (
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-800/80 text-amber-400 text-xs font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Sonnerie en cours...</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-mono font-black">
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
                      key={i}
                      animate={isMuted ? { height: '4px' } : { height: [`${Math.max(8, height * 0.2)}px`, `${height * 0.35}px`, `${Math.max(8, height * 0.2)}px`] }}
                      transition={{ duration: 0.6 + (i % 3) * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-1 rounded-full bg-gradient-to-t from-amber-500 to-orange-400"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Floating Reactions Tray */}
          {callStatus === 'connected' && (
            <div className="relative z-20 px-6 py-2 flex items-center justify-center space-x-3">
              {['❤️', '🔥', '👏', '🇨🇮', '🇸🇳', '🎉'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => triggerReaction(emoji)}
                  className="w-9 h-9 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-800 flex items-center justify-center text-lg hover:scale-125 transition-transform active:scale-95 shadow-md cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Controls Bar */}
          <div className="relative z-20 p-6 bg-stone-950/95 border-t border-stone-800/80 rounded-b-[36px] backdrop-blur-xl">
            <div className="flex items-center justify-around max-w-sm mx-auto">
              {/* Mic Mute Button */}
              <button
                id="call-toggle-mic-btn"
                onClick={() => setIsMuted(!isMuted)}
                className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isMuted 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                    : 'bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700'
                }`}
                title={isMuted ? 'Activer micro' : 'Couper micro'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span className="text-[9px] font-bold mt-0.5">{isMuted ? 'Muet' : 'Micro'}</span>
              </button>

              {/* Video toggle / Switch Camera (for video calls) */}
              {isVideo ? (
                <>
                  <button
                    id="call-toggle-video-btn"
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                    className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                      !isVideoEnabled 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700'
                    }`}
                  >
                    {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    <span className="text-[9px] font-bold mt-0.5">{isVideoEnabled ? 'Cam ON' : 'Cam OFF'}</span>
                  </button>

                  <button
                    id="call-flip-camera-btn"
                    onClick={() => setIsFrontCamera(!isFrontCamera)}
                    className="w-13 h-13 rounded-full bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 flex flex-col items-center justify-center transition-all cursor-pointer"
                  >
                    <SwitchCamera className="w-5 h-5" />
                    <span className="text-[9px] font-bold mt-0.5">Tourner</span>
                  </button>
                </>
              ) : (
                /* Speakerphone toggle for audio calls */
                <button
                  id="call-toggle-speaker-btn"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`w-13 h-13 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSpeakerOn 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
                      : 'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  <span className="text-[9px] font-bold mt-0.5">HP</span>
                </button>
              )}

              {/* Invite / Ajouter des personnes Button */}
              <button
                id="call-invite-bottom-btn"
                onClick={() => setIsInviteModalOpen(true)}
                className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 flex flex-col items-center justify-center transition-all cursor-pointer"
                title="Inviter des personnes"
              >
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span className="text-[9px] font-bold mt-0.5">Inviter</span>
              </button>

              {/* Quick Mobile Money Transfer in Call */}
              {onSendTip && !conversation.isVIPRoom && (
                <button
                  id="call-quick-tip-btn"
                  onClick={() => onSendTip(conversation.name)}
                  className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 flex flex-col items-center justify-center transition-all cursor-pointer"
                  title="Envoyer Mobile Money"
                >
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span className="text-[9px] font-bold mt-0.5">Pay</span>
                </button>
              )}

              {/* End Call Button */}
              <button
                id="call-end-call-btn"
                onClick={handleEndCallInternal}
                className="w-15 h-15 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-xl shadow-red-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Raccrocher"
              >
                <PhoneOff className="w-7 h-7" />
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
