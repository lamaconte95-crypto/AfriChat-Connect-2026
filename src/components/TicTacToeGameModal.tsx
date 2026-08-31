import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';
import { User, Contact, TicTacToeCell, TicTacToeGameState, GamePlayerInfo } from '../types';
import {
  calculateWinner,
  getBestAiMove,
  playGameSound,
  triggerHaptic,
  createInitialGameState,
  subscribeToGameChannel,
  broadcastGameMove,
  broadcastGameRematch,
  broadcastGameReaction,
  broadcastGameJoin,
  broadcastGameStateSync,
} from '../services/gameService';
import {
  X,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Share2,
  Bot,
  Copy,
  Check,
  Zap,
  Swords,
  Radio,
  Smartphone,
  Flame,
  ArrowRight,
  Wifi,
} from 'lucide-react';

interface TicTacToeGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  opponent?: Contact | User | null;
  initialGameId?: string;
  gameId?: string;
  initialStake?: number;
  stakeFcfa?: number;
  initialMode?: 'online' | 'ai' | 'local';
  onTriggerToast?: (message: string, type?: 'info' | 'success' | 'danger') => void;
}

const QUICK_REACTIONS = [
  { emoji: '👏', text: 'Bravo !' },
  { emoji: '🔥', text: 'Chaud !' },
  { emoji: '⚡', text: 'À moi !' },
  { emoji: '🏆', text: 'Champion !' },
  { emoji: '😂', text: 'Bien tenté !' },
  { emoji: '🔄', text: 'Revanche ?' },
  { emoji: '🇨🇮', text: 'Abidjan' },
  { emoji: '🇸🇳', text: 'Dakar' },
  { emoji: '🇨🇲', text: 'Yaoundé' },
];

export const TicTacToeGameModal: React.FC<TicTacToeGameModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  opponent,
  initialGameId,
  gameId,
  initialStake = 0,
  stakeFcfa,
  initialMode = opponent ? 'online' : 'ai',
  onTriggerToast,
}) => {
  const effectiveGameId = gameId || initialGameId || `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const effectiveStake = stakeFcfa !== undefined ? stakeFcfa : initialStake;

  // Game mode
  const [gameMode, setGameMode] = useState<'online' | 'ai' | 'local'>(initialMode);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeReaction, setActiveReaction] = useState<{ emoji: string; text?: string; senderName: string } | null>(null);

  // Local user's role in this session ('X' for host / creator, 'O' for guest / invited)
  const [myRole, setMyRole] = useState<'X' | 'O'>('X');

  // Active game state
  const [gameState, setGameState] = useState<TicTacToeGameState>(() => {
    const host: GamePlayerInfo = {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      flag: currentUser.flag,
      role: 'X',
      isOnline: true,
    };

    const guest: GamePlayerInfo | undefined = opponent
      ? {
          id: (opponent as Contact).userId || opponent.id,
          name: opponent.name,
          username: opponent.username,
          avatar: opponent.avatar,
          flag: opponent.flag,
          role: 'O',
          isOnline: true,
        }
      : gameMode === 'ai'
      ? {
          id: 'ai_bot',
          name: 'AfriBot IA',
          username: '@afribot.gaming',
          avatar: '',
          flag: '🌍',
          role: 'O',
          isOnline: true,
        }
      : undefined;

    return createInitialGameState({
      id: effectiveGameId,
      host,
      guest,
      stakeFcfa: effectiveStake,
      isAiOpponent: gameMode === 'ai',
      aiDifficulty,
    });
  });

  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset or reinitialize state when modal opens or opponent changes
  useEffect(() => {
    if (isOpen) {
      const isAi = !opponent && initialMode === 'ai';
      const mode = opponent ? 'online' : isAi ? 'ai' : 'local';
      setGameMode(mode);

      // Check if current user is the guest or host
      const isGuest = Boolean(
        opponent && (opponent as any).isChallenger === true
      );
      const role: 'X' | 'O' = isGuest ? 'O' : 'X';
      setMyRole(role);

      const host: GamePlayerInfo = {
        id: isGuest ? ((opponent as Contact).userId || opponent!.id) : currentUser.id,
        name: isGuest ? opponent!.name : currentUser.name,
        username: isGuest ? opponent!.username : currentUser.username,
        avatar: isGuest ? opponent!.avatar : currentUser.avatar,
        flag: isGuest ? opponent!.flag : currentUser.flag,
        role: 'X',
        isOnline: true,
      };

      let guest: GamePlayerInfo | undefined = undefined;
      if (isGuest) {
        guest = {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
          flag: currentUser.flag,
          role: 'O',
          isOnline: true,
        };
      } else if (opponent) {
        guest = {
          id: (opponent as Contact).userId || opponent.id,
          name: opponent.name,
          username: opponent.username,
          avatar: opponent.avatar,
          flag: opponent.flag,
          role: 'O',
          isOnline: true,
        };
      } else if (mode === 'ai') {
        guest = {
          id: 'ai_bot',
          name: 'AfriBot IA',
          username: '@afribot.gaming',
          avatar: '',
          flag: '🌍',
          role: 'O',
          isOnline: true,
        };
      }

      const initial = createInitialGameState({
        id: effectiveGameId,
        host,
        guest,
        stakeFcfa: effectiveStake,
        isAiOpponent: mode === 'ai',
        aiDifficulty,
      });

      setGameState(initial);

      // If online mode, announce presence to room
      if (mode === 'online' && effectiveGameId) {
        const myInfo: GamePlayerInfo = {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
          flag: currentUser.flag,
          role: role,
          isOnline: true,
        };
        broadcastGameJoin(effectiveGameId, myInfo);
      }
    }
  }, [isOpen, opponent, effectiveGameId, effectiveStake, initialMode, currentUser.id, currentUser.name, currentUser.username, currentUser.avatar, currentUser.flag, aiDifficulty]);

  // Handle incoming moves from Supabase Realtime
  const handleRemoteMove = useCallback(
    (data: {
      index: number;
      player: 'X' | 'O';
      nextTurn: 'X' | 'O';
      board?: TicTacToeCell[];
      scores?: { playerX: number; playerO: number; draws: number };
      status?: TicTacToeGameState['status'];
      winner?: 'X' | 'O' | 'draw' | null;
      winningLine?: [number, number, number] | null;
    }) => {
      setGameState((prev) => {
        // If move already played on that cell
        if (prev.board[data.index] !== null && !data.board) {
          return prev;
        }

        const newBoard = data.board || [...prev.board];
        if (!data.board) {
          newBoard[data.index] = data.player;
        }

        const { winner, line, isDraw } = calculateWinner(newBoard);

        if (soundEnabled) {
          if (winner) {
            playGameSound(winner === myRole ? 'win' : 'lose');
          } else if (isDraw) {
            playGameSound('draw');
          } else {
            playGameSound(data.player === 'X' ? 'move_x' : 'move_o');
          }
        }

        if (hapticEnabled) {
          triggerHaptic(winner ? [50, 50, 100] : 30);
        }

        let newStatus: TicTacToeGameState['status'] = data.status || 'in_progress';
        const newScores = data.scores || { ...prev.scores };

        if (!data.scores) {
          if (winner) {
            newStatus = 'won';
            if (winner === 'X') newScores.playerX += 1;
            if (winner === 'O') newScores.playerO += 1;
          } else if (isDraw) {
            newStatus = 'draw';
            newScores.draws += 1;
          }
        }

        return {
          ...prev,
          board: newBoard,
          currentTurn: data.nextTurn,
          status: newStatus,
          winner: data.winner !== undefined ? data.winner : (winner || (isDraw ? 'draw' : null)),
          winningLine: data.winningLine !== undefined ? data.winningLine : line,
          scores: newScores,
          updatedAt: Date.now(),
        };
      });
    },
    [myRole, soundEnabled, hapticEnabled]
  );

  // Handle remote rematch
  const handleRemoteRematch = useCallback(() => {
    if (soundEnabled) playGameSound('pop');
    setGameState((prev) => ({
      ...prev,
      board: Array(9).fill(null),
      currentTurn: 'X',
      status: 'in_progress',
      winner: null,
      winningLine: null,
      updatedAt: Date.now(),
    }));
  }, [soundEnabled]);

  // Handle remote reaction
  const handleRemoteReaction = useCallback(
    (reaction: { emoji: string; text?: string; senderName: string; senderId: string }) => {
      if (reaction.senderId === currentUser.id) return;
      if (soundEnabled) playGameSound('pop');
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
      setActiveReaction(reaction);
      reactionTimeoutRef.current = setTimeout(() => {
        setActiveReaction(null);
      }, 3200);
    },
    [currentUser.id, soundEnabled]
  );

  // Handle remote player joining
  const handleRemoteJoin = useCallback((guest: GamePlayerInfo) => {
    setGameState((prev) => {
      if (guest.id === currentUser.id) return prev;
      return {
        ...prev,
        guest: {
          ...guest,
          role: 'O',
          isOnline: true,
        },
        status: 'in_progress',
        updatedAt: Date.now(),
      };
    });
  }, [currentUser.id]);

  // Supabase Realtime Subscription across 'game_room' and room channels
  useEffect(() => {
    if (!isOpen || gameMode !== 'online' || !gameState.id) return;

    const unsubscribe = subscribeToGameChannel(gameState.id, {
      onMove: handleRemoteMove,
      onRematch: handleRemoteRematch,
      onReaction: handleRemoteReaction,
      onJoin: handleRemoteJoin,
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, gameMode, gameState.id, handleRemoteMove, handleRemoteRematch, handleRemoteReaction, handleRemoteJoin]);

  // AI Move Engine
  useEffect(() => {
    if (
      gameMode !== 'ai' ||
      gameState.status !== 'in_progress' ||
      gameState.currentTurn !== 'O' ||
      !isOpen
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const aiMove = getBestAiMove(gameState.board, 'O', aiDifficulty);
      if (aiMove !== -1) {
        handleCellClick(aiMove, true);
      }
    }, 450 + Math.random() * 300);

    return () => clearTimeout(timer);
  }, [gameState.currentTurn, gameState.status, gameMode, gameState.board, aiDifficulty, isOpen]);

  // Handle cell click (Local or Human player)
  const handleCellClick = (index: number, isAiTriggered = false) => {
    if (gameState.board[index] !== null) return;
    if (gameState.status !== 'in_progress' && gameState.status !== 'waiting') return;

    // Check turn permission in online multiplayer
    if (gameMode === 'online' && !isAiTriggered) {
      if (gameState.currentTurn !== myRole) {
        if (hapticEnabled) triggerHaptic(20);
        return;
      }
    }

    const currentTurn = gameState.currentTurn;
    const nextTurn: 'X' | 'O' = currentTurn === 'X' ? 'O' : 'X';
    const newBoard = [...gameState.board];
    newBoard[index] = currentTurn;

    const { winner, line, isDraw } = calculateWinner(newBoard);

    if (soundEnabled) {
      if (winner) {
        playGameSound(winner === myRole ? 'win' : 'lose');
      } else if (isDraw) {
        playGameSound('draw');
      } else {
        playGameSound(currentTurn === 'X' ? 'move_x' : 'move_o');
      }
    }

    if (hapticEnabled) {
      triggerHaptic(winner ? [50, 50, 100] : 30);
    }

    let newStatus: TicTacToeGameState['status'] = 'in_progress';
    const newScores = { ...gameState.scores };

    if (winner) {
      newStatus = 'won';
      if (winner === 'X') newScores.playerX += 1;
      if (winner === 'O') newScores.playerO += 1;
    } else if (isDraw) {
      newStatus = 'draw';
      newScores.draws += 1;
    }

    const updatedState: TicTacToeGameState = {
      ...gameState,
      board: newBoard,
      currentTurn: nextTurn,
      status: newStatus,
      winner: winner || (isDraw ? 'draw' : null),
      winningLine: line,
      scores: newScores,
      lastMove: {
        index,
        player: currentTurn,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    };

    setGameState(updatedState);

    // Broadcast move to Supabase Realtime in online mode
    if (gameMode === 'online' && !isAiTriggered) {
      broadcastGameMove(gameState.id, {
        index,
        player: currentTurn,
        nextTurn,
        board: newBoard,
        scores: newScores,
        status: newStatus,
        winner: winner || (isDraw ? 'draw' : null),
        winningLine: line,
        senderId: currentUser.id,
      });
    }
  };

  // Restart / Rematch
  const handleRestart = () => {
    if (soundEnabled) playGameSound('pop');
    if (hapticEnabled) triggerHaptic(25);

    setGameState((prev) => ({
      ...prev,
      board: Array(9).fill(null),
      currentTurn: 'X',
      status: 'in_progress',
      winner: null,
      winningLine: null,
      updatedAt: Date.now(),
    }));

    if (gameMode === 'online') {
      broadcastGameRematch(gameState.id, currentUser.id);
    }
  };

  // Send interactive reaction
  const handleSendReaction = (item: { emoji: string; text?: string }) => {
    if (soundEnabled) playGameSound('pop');
    if (hapticEnabled) triggerHaptic(20);

    const reactionPayload = {
      emoji: item.emoji,
      text: item.text,
      senderName: currentUser.name,
      senderId: currentUser.id,
    };

    setActiveReaction(reactionPayload);
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    reactionTimeoutRef.current = setTimeout(() => {
      setActiveReaction(null);
    }, 3200);

    if (gameMode === 'online') {
      broadcastGameReaction(gameState.id, reactionPayload);
    }
  };

  // Copy share invite link
  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/?game=${gameState.id}&code=${gameState.roomCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    if (soundEnabled) playGameSound('pop');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const inviteLink = `${window.location.origin}/?game=${gameState.id}&code=${gameState.roomCode}`;
    const text = `🎮 Défie-moi au Morpion (Tic-Tac-Toe) sur AfriChat Connect !\nRejoins ma partie maintenant : ${inviteLink}\nCode salon : ${gameState.roomCode}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Switch game mode
  const handleSwitchMode = (mode: 'online' | 'ai' | 'local') => {
    setGameMode(mode);
    let guest: GamePlayerInfo | undefined = undefined;

    if (mode === 'ai') {
      guest = {
        id: 'ai_bot',
        name: 'AfriBot IA',
        username: '@afribot.gaming',
        avatar: '',
        flag: '🌍',
        role: 'O',
        isOnline: true,
      };
    } else if (mode === 'online' && opponent) {
      guest = {
        id: (opponent as Contact).userId || opponent.id,
        name: opponent.name,
        username: opponent.username,
        avatar: opponent.avatar,
        flag: opponent.flag,
        role: 'O',
        isOnline: true,
      };
    }

    setGameState((prev) => ({
      ...prev,
      guest,
      board: Array(9).fill(null),
      currentTurn: 'X',
      status: 'in_progress',
      winner: null,
      winningLine: null,
      isAiOpponent: mode === 'ai',
      scores: { playerX: 0, playerO: 0, draws: 0 },
    }));
  };

  if (!isOpen) return null;

  const playerXName = gameState.host.name;
  const playerOName = gameState.guest?.name || (gameMode === 'ai' ? 'AfriBot IA' : 'Joueur 2 (O)');
  const isMyTurn = gameMode === 'local' ? true : gameState.currentTurn === myRole;

  return (
    <div
      id="tictactoe-game-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-lg bg-stone-900 border-2 border-[#FF9900] rounded-3xl shadow-[0_0_40px_rgba(255,153,0,0.25)] overflow-hidden text-stone-100 flex flex-col my-auto relative max-h-[95vh]"
      >
        {/* Reaction Floating Popover */}
        <AnimatePresence>
          {activeReaction && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#FF9900] via-amber-500 to-[#FF9900] text-stone-950 font-black shadow-2xl flex items-center space-x-2 border-2 border-stone-950"
            >
              <span className="text-2xl">{activeReaction.emoji}</span>
              <div className="text-left leading-tight">
                <span className="text-[11px] block font-bold text-stone-900/80">{activeReaction.senderName}</span>
                <span className="text-sm">{activeReaction.text || activeReaction.emoji}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Top Bar */}
        <div className="px-4 py-3 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF9900] to-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md shadow-[#FF9900]/20">
              <Swords className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base text-stone-100 tracking-tight flex items-center space-x-1.5">
                  <span>Morpion Panafricain</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FF9900]/20 text-[#FF9900] font-black border border-[#FF9900]/40">
                    3x3 Live
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-stone-400 flex items-center space-x-1.5">
                {gameMode === 'online' ? (
                  <span className="text-emerald-400 flex items-center space-x-1 font-bold">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Supabase Realtime (PC ⚡ Mobile)</span>
                  </span>
                ) : gameMode === 'ai' ? (
                  <span className="text-amber-400 flex items-center space-x-1 font-bold">
                    <Bot className="w-3 h-3" />
                    <span>AfriBot IA ({aiDifficulty === 'hard' ? 'Champion' : aiDifficulty === 'medium' ? 'Équilibré' : 'Facile'})</span>
                  </span>
                ) : (
                  <span className="text-stone-300 flex items-center space-x-1">
                    <Smartphone className="w-3 h-3" />
                    <span>Passe & Joue local</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {/* Audio Toggle */}
            <button
              id="game-sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#FF9900]" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            </button>

            {/* Close Button */}
            <button
              id="tictactoe-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-rose-950/60 hover:text-rose-400 text-stone-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-3 py-2 bg-stone-950/50 border-b border-stone-800/80 flex items-center justify-between gap-1 overflow-x-auto shrink-0">
          <div className="flex items-center space-x-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => handleSwitchMode('online')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all flex items-center space-x-1.5 cursor-pointer text-xs ${
                gameMode === 'online'
                  ? 'bg-[#FF9900] text-stone-950 shadow-md shadow-[#FF9900]/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>En ligne (PC/Mobile)</span>
            </button>

            <button
              onClick={() => handleSwitchMode('ai')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all flex items-center space-x-1.5 cursor-pointer text-xs ${
                gameMode === 'ai'
                  ? 'bg-[#FF9900] text-stone-950 shadow-md shadow-[#FF9900]/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Bot className="w-3 h-3" />
              <span>Vs IA</span>
            </button>

            <button
              onClick={() => handleSwitchMode('local')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all flex items-center space-x-1.5 cursor-pointer text-xs ${
                gameMode === 'local'
                  ? 'bg-[#FF9900] text-stone-950 shadow-md shadow-[#FF9900]/30'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>Passe & Joue</span>
            </button>
          </div>

          {gameMode === 'ai' && (
            <div className="flex items-center space-x-1 text-[10px]">
              {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setAiDifficulty(lvl);
                    handleRestart();
                  }}
                  className={`px-2 py-0.5 rounded font-bold capitalize transition-colors ${
                    aiDifficulty === lvl
                      ? 'bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/40'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {lvl === 'hard' ? 'Pro' : lvl === 'medium' ? 'Normal' : 'Facile'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Players & Scoreboard Header */}
        <div className="px-3 py-2.5 bg-stone-950/70 border-b border-stone-800 shrink-0">
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Player X (Left) */}
            <div
              className={`p-2 sm:p-2.5 rounded-2xl border transition-all flex items-center space-x-2 ${
                gameState.currentTurn === 'X' && gameState.status === 'in_progress'
                  ? 'bg-[#FF9900]/15 border-[#FF9900] ring-2 ring-[#FF9900]/40 shadow-lg shadow-[#FF9900]/10'
                  : 'bg-stone-900/80 border-stone-800'
              }`}
            >
              <div className="relative shrink-0">
                <UserAvatar
                  name={playerXName}
                  avatar={gameState.host.avatar}
                  size="sm"
                  className="border-2 border-[#FF9900]"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FF9900] text-stone-950 font-black text-[10px] flex items-center justify-center shadow">
                  X
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-xs text-[#FF9900] truncate">
                  {playerXName}
                </div>
                <div className="text-[9px] text-stone-400">
                  {myRole === 'X' ? 'Vous (Orange)' : 'Hôte (Orange)'}
                </div>
                <div className="text-xs sm:text-sm font-black text-[#FF9900] mt-0.5">
                  {gameState.scores.playerX} <span className="text-[9px] text-stone-500 font-normal">pts</span>
                </div>
              </div>
            </div>

            {/* VS / Match Center Info */}
            <div className="text-center flex flex-col items-center justify-center space-y-1">
              <div className="px-2 py-0.5 rounded-full bg-stone-800/90 border border-stone-700 text-[9px] font-bold text-stone-300">
                Nuls : {gameState.scores.draws}
              </div>

              {gameState.stakeFcfa && gameState.stakeFcfa > 0 ? (
                <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[9px] border border-emerald-500/30">
                  💰 {gameState.stakeFcfa.toLocaleString()} F
                </div>
              ) : (
                <div className="text-[9px] text-stone-400 font-mono">
                  Room: {gameState.roomCode}
                </div>
              )}

              {/* Turn indicator badge */}
              <div className="pt-0.5">
                {gameState.status === 'in_progress' ? (
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      isMyTurn
                        ? 'bg-gradient-to-r from-[#FF9900] to-amber-400 text-stone-950 shadow-md shadow-[#FF9900]/30 animate-pulse'
                        : 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{isMyTurn ? 'À votre tour !' : `Tour de ${gameState.currentTurn === 'X' ? playerXName : playerOName}`}</span>
                  </span>
                ) : gameState.status === 'won' ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-stone-950 shadow">
                    <Trophy className="w-2.5 h-2.5" />
                    <span>Victoire {gameState.winner === 'X' ? playerXName : playerOName} !</span>
                  </span>
                ) : gameState.status === 'draw' ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-stone-700 text-stone-200">
                    <span>Match Nul 🤝</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-[#FF9900] animate-pulse font-bold">En attente de connexion...</span>
                )}
              </div>
            </div>

            {/* Player O (Right) */}
            <div
              className={`p-2 sm:p-2.5 rounded-2xl border transition-all flex items-center space-x-2 justify-end text-right ${
                gameState.currentTurn === 'O' && gameState.status === 'in_progress'
                  ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-stone-900/80 border-stone-800'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-black text-xs text-emerald-400 truncate">
                  {playerOName}
                </div>
                <div className="text-[9px] text-stone-400">
                  {gameMode === 'ai' ? 'IA Bot (Vert)' : myRole === 'O' ? 'Vous (Vert)' : 'Adversaire (Vert)'}
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5">
                  {gameState.scores.playerO} <span className="text-[9px] text-stone-500 font-normal">pts</span>
                </div>
              </div>

              <div className="relative shrink-0">
                <UserAvatar
                  name={playerOName}
                  avatar={gameState.guest?.avatar}
                  size="sm"
                  className="border-2 border-emerald-500"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-stone-950 font-black text-[10px] flex items-center justify-center shadow">
                  O
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Arena 3x3 Grid with Contrast Orange Borders (#FF9900) */}
        <div className="p-3 sm:p-5 flex flex-col items-center justify-center bg-stone-950 relative overflow-hidden">
          {/* Main 3x3 Board with vibrant #FF9900 borders */}
          <div
            id="tictactoe-grid-arena"
            className="w-full max-w-[270px] xs:max-w-[290px] sm:max-w-[320px] aspect-square grid grid-cols-3 gap-2.5 p-3 rounded-3xl bg-stone-900/90 border-4 border-[#FF9900] shadow-[0_0_30px_rgba(255,153,0,0.35)] relative"
          >
            {gameState.board.map((cell, index) => {
              const isWinningCell = gameState.winningLine?.includes(index);
              const isCellDisabled =
                cell !== null ||
                (gameMode === 'online' && !isMyTurn) ||
                gameState.status === 'won' ||
                gameState.status === 'draw';

              return (
                <button
                  key={index}
                  id={`tictactoe-cell-${index}`}
                  disabled={isCellDisabled}
                  onClick={() => handleCellClick(index)}
                  className={`relative rounded-2xl flex items-center justify-center font-black transition-all duration-150 select-none ${
                    isWinningCell
                      ? cell === 'X'
                        ? 'bg-[#FF9900] text-stone-950 shadow-2xl shadow-[#FF9900]/60 scale-105 border-4 border-white'
                        : 'bg-emerald-500 text-stone-950 shadow-2xl shadow-emerald-500/60 scale-105 border-4 border-white'
                      : cell === 'X'
                      ? 'bg-stone-950 border-2 border-[#FF9900] text-[#FF9900] shadow-[0_0_15px_rgba(255,153,0,0.3)]'
                      : cell === 'O'
                      ? 'bg-stone-950 border-2 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                      : 'bg-stone-950/90 border-2 border-[#FF9900]/70 hover:border-[#FF9900] hover:bg-stone-900 hover:shadow-[0_0_12px_rgba(255,153,0,0.35)] active:scale-95 cursor-pointer'
                  } ${isCellDisabled && !isWinningCell ? 'cursor-default' : ''}`}
                >
                  <AnimatePresence mode="wait">
                    {cell === 'X' ? (
                      <motion.span
                        key="x"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="text-5xl sm:text-6xl font-black text-[#FF9900] drop-shadow-[0_0_16px_rgba(255,153,0,0.8)] leading-none select-none"
                      >
                        ✕
                      </motion.span>
                    ) : cell === 'O' ? (
                      <motion.span
                        key="o"
                        initial={{ scale: 0, rotate: 45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="text-5xl sm:text-6xl font-black text-emerald-400 drop-shadow-[0_0_16px_rgba(52,211,153,0.8)] leading-none select-none"
                      >
                        ◯
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          {/* Quick African Reactions Bar */}
          <div className="w-full mt-3 flex items-center justify-center space-x-1 overflow-x-auto py-1">
            <span className="text-[10px] text-stone-400 font-bold mr-1 shrink-0">Réactions:</span>
            {QUICK_REACTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendReaction(item)}
                className="p-1 px-2 rounded-xl bg-stone-900 hover:bg-[#FF9900]/20 text-stone-300 hover:text-[#FF9900] border border-stone-800 hover:border-[#FF9900]/40 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center space-x-1"
                title={item.text}
              >
                <span>{item.emoji}</span>
                <span className="text-[10px] hidden sm:inline">{item.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions & Rematch Controls */}
        <div className="p-3 sm:p-4 border-t border-stone-800 bg-stone-950/90 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Rematch / Nouvelle Manche Button */}
            <button
              id="game-rematch-btn"
              onClick={handleRestart}
              className="flex-1 sm:flex-initial py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF9900] via-amber-500 to-[#FF9900] text-stone-950 font-black text-xs shadow-lg shadow-[#FF9900]/30 flex items-center justify-center space-x-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nouvelle Manche</span>
            </button>

            {/* Copy Room Link Button */}
            <button
              id="game-copy-link-btn"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all"
              title="Copier le lien d'invitation"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#FF9900]" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copié !' : 'Lien'}</span>
            </button>
          </div>

          {/* Share on WhatsApp / Social */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              id="game-share-whatsapp-btn"
              onClick={handleShareWhatsApp}
              className="w-full sm:w-auto py-2.5 px-3.5 rounded-2xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-black flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Inviter sur WhatsApp</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

