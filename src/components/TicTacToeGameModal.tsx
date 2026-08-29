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
  const effectiveGameId = gameId || initialGameId;
  const effectiveStake = stakeFcfa !== undefined ? stakeFcfa : initialStake;

  // Game mode
  const [gameMode, setGameMode] = useState<'online' | 'ai' | 'local'>(initialMode);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeReaction, setActiveReaction] = useState<{ emoji: string; text?: string; senderName: string } | null>(null);

  // Local user's role in this session
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
          id: opponent.id,
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

      const host: GamePlayerInfo = {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        flag: currentUser.flag,
        role: 'X',
        isOnline: true,
      };

      let guest: GamePlayerInfo | undefined = undefined;
      if (opponent) {
        guest = {
          id: opponent.id,
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

      setMyRole('X');
      setGameState(
        createInitialGameState({
          id: effectiveGameId,
          host,
          guest,
          stakeFcfa: effectiveStake,
          isAiOpponent: mode === 'ai',
          aiDifficulty,
        })
      );
    }
  }, [isOpen, opponent, effectiveGameId, effectiveStake, initialMode, currentUser.id, currentUser.name, currentUser.username, currentUser.avatar, currentUser.flag, aiDifficulty]);

  // Handle incoming moves from Supabase Realtime
  const handleRemoteMove = useCallback(
    (data: { index: number; player: 'X' | 'O'; nextTurn: 'X' | 'O' }) => {
      setGameState((prev) => {
        if (prev.board[data.index] !== null || prev.status === 'won' || prev.status === 'draw') {
          return prev;
        }

        const newBoard = [...prev.board];
        newBoard[data.index] = data.player;

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

        let newStatus: TicTacToeGameState['status'] = 'in_progress';
        const newScores = { ...prev.scores };

        if (winner) {
          newStatus = 'won';
          if (winner === 'X') newScores.playerX += 1;
          if (winner === 'O') newScores.playerO += 1;
        } else if (isDraw) {
          newStatus = 'draw';
          newScores.draws += 1;
        }

        return {
          ...prev,
          board: newBoard,
          currentTurn: data.nextTurn,
          status: newStatus,
          winner: winner || (isDraw ? 'draw' : null),
          winningLine: line,
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
    setGameState((prev) => ({
      ...prev,
      guest: {
        ...guest,
        role: 'O',
        isOnline: true,
      },
      status: 'in_progress',
      updatedAt: Date.now(),
    }));
  }, []);

  // Supabase Realtime Subscription
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

    // Broadcast move to Supabase in online mode
    if (gameMode === 'online' && !isAiTriggered) {
      broadcastGameMove(gameState.id, {
        index,
        player: currentTurn,
        nextTurn,
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
      broadcastGameRematch(gameState.id);
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
        id: opponent.id,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-lg bg-stone-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-stone-100 flex flex-col my-auto relative"
      >
        {/* Reaction Floating Popover */}
        <AnimatePresence>
          {activeReaction && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black shadow-2xl flex items-center space-x-2 border-2 border-stone-950"
            >
              <span className="text-2xl">{activeReaction.emoji}</span>
              <div className="text-left leading-tight">
                <span className="text-xs block font-bold text-stone-900/80">{activeReaction.senderName}</span>
                <span className="text-sm">{activeReaction.text || activeReaction.emoji}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Top Bar */}
        <div className="p-4 border-b border-stone-800 bg-stone-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-stone-950 flex items-center justify-center font-black shadow-md">
              <Swords className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base text-stone-100 tracking-tight flex items-center space-x-1.5">
                  <span>Morpion Panafricain</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    3x3 Live
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-stone-400 flex items-center space-x-1.5">
                {gameMode === 'online' ? (
                  <span className="text-emerald-400 flex items-center space-x-1 font-bold">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Supabase Realtime Sync</span>
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
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
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
        <div className="px-4 pt-3 pb-1 bg-stone-950/40 border-b border-stone-800 flex items-center justify-between gap-1 overflow-x-auto">
          <div className="flex items-center space-x-1 bg-stone-900 p-1 rounded-2xl border border-stone-800 text-xs">
            <button
              onClick={() => handleSwitchMode('online')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                gameMode === 'online'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>En ligne (Ami)</span>
            </button>

            <button
              onClick={() => handleSwitchMode('ai')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                gameMode === 'ai'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Vs AfriBot IA</span>
            </button>

            <button
              onClick={() => handleSwitchMode('local')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                gameMode === 'local'
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Passe & Joue</span>
            </button>
          </div>

          {gameMode === 'ai' && (
            <div className="flex items-center space-x-1 text-[11px]">
              {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setAiDifficulty(lvl);
                    handleRestart();
                  }}
                  className={`px-2 py-1 rounded-lg font-bold capitalize transition-colors ${
                    aiDifficulty === lvl
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {lvl === 'hard' ? 'Champion' : lvl === 'medium' ? 'Normal' : 'Facile'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Players & Scoreboard Header */}
        <div className="p-4 bg-stone-950/60 border-b border-stone-800">
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Player X (Left) */}
            <div
              className={`p-3 rounded-2xl border transition-all flex items-center space-x-2.5 ${
                gameState.currentTurn === 'X' && gameState.status === 'in_progress'
                  ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'bg-stone-900/80 border-stone-800'
              }`}
            >
              <div className="relative">
                <UserAvatar
                  name={playerXName}
                  avatar={gameState.host.avatar}
                  size="md"
                  className="border-2 border-amber-500"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-black text-[11px] flex items-center justify-center shadow">
                  X
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-amber-400 truncate flex items-center space-x-1">
                  <span>{playerXName}</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  {myRole === 'X' ? 'Vous (Hôte)' : 'Hôte'}
                </div>
                <div className="text-base font-black text-amber-300 mt-0.5">
                  {gameState.scores.playerX} <span className="text-[10px] text-stone-500 font-normal">pts</span>
                </div>
              </div>
            </div>

            {/* VS / Match Center Info */}
            <div className="text-center flex flex-col items-center justify-center space-y-1">
              <div className="px-2.5 py-1 rounded-full bg-stone-800/80 border border-stone-700/80 text-[10px] font-bold text-stone-300 flex items-center space-x-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Nuls : {gameState.scores.draws}</span>
              </div>

              {gameState.stakeFcfa && gameState.stakeFcfa > 0 ? (
                <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px] border border-emerald-500/30">
                  💰 {gameState.stakeFcfa.toLocaleString()} FCFA
                </div>
              ) : (
                <div className="text-[10px] text-stone-400 font-mono">
                  Room: {gameState.roomCode}
                </div>
              )}

              {/* Turn indicator badge */}
              <div className="pt-0.5">
                {gameState.status === 'in_progress' ? (
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black animate-pulse ${
                      isMyTurn
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-md'
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
                  <span className="text-[10px] text-amber-400 animate-pulse">En attente de l'adversaire...</span>
                )}
              </div>
            </div>

            {/* Player O (Right) */}
            <div
              className={`p-3 rounded-2xl border transition-all flex items-center space-x-2.5 justify-end text-right ${
                gameState.currentTurn === 'O' && gameState.status === 'in_progress'
                  ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-stone-900/80 border-stone-800'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-emerald-400 truncate flex items-center justify-end space-x-1">
                  <span>{playerOName}</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  {gameMode === 'ai' ? 'IA Bot' : myRole === 'O' ? 'Vous' : 'Adversaire'}
                </div>
                <div className="text-base font-black text-emerald-300 mt-0.5">
                  {gameState.scores.playerO} <span className="text-[10px] text-stone-500 font-normal">pts</span>
                </div>
              </div>

              <div className="relative">
                <UserAvatar
                  name={playerOName}
                  avatar={gameState.guest?.avatar}
                  size="md"
                  className="border-2 border-emerald-500"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-stone-950 font-black text-[11px] flex items-center justify-center shadow">
                  O
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Arena 3x3 Grid */}
        <div className="p-5 flex flex-col items-center justify-center bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 relative">
          <div className="w-full max-w-[320px] sm:max-w-[340px] aspect-square grid grid-cols-3 gap-2.5 p-3 rounded-3xl bg-stone-950/80 border border-stone-800 shadow-2xl relative">
            {gameState.board.map((cell, index) => {
              const isWinningCell = gameState.winningLine?.includes(index);
              const isCellDisabled = cell !== null || (gameMode === 'online' && !isMyTurn) || gameState.status === 'won' || gameState.status === 'draw';

              return (
                <button
                  key={index}
                  id={`tictactoe-cell-${index}`}
                  disabled={isCellDisabled}
                  onClick={() => handleCellClick(index)}
                  className={`relative rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer select-none ${
                    isWinningCell
                      ? cell === 'X'
                        ? 'bg-amber-500 text-stone-950 shadow-xl shadow-amber-500/30 scale-105 border-2 border-white'
                        : 'bg-emerald-500 text-stone-950 shadow-xl shadow-emerald-500/30 scale-105 border-2 border-white'
                      : cell === 'X'
                      ? 'bg-stone-900/90 border border-amber-500/50 text-amber-400 shadow-md shadow-amber-500/10'
                      : cell === 'O'
                      ? 'bg-stone-900/90 border border-emerald-500/50 text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'bg-stone-900/50 border border-stone-800/80 hover:bg-stone-800 hover:border-amber-500/40 active:scale-95'
                  } ${isCellDisabled && !isWinningCell ? 'cursor-default' : ''}`}
                >
                  <AnimatePresence mode="wait">
                    {cell === 'X' ? (
                      <motion.span
                        key="x"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                        className="text-4xl sm:text-5xl font-black drop-shadow-md"
                      >
                        ✕
                      </motion.span>
                    ) : cell === 'O' ? (
                      <motion.span
                        key="o"
                        initial={{ scale: 0, rotate: 45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                        className="text-4xl sm:text-5xl font-black drop-shadow-md"
                      >
                        ◯
                      </motion.span>
                    ) : (
                      <span className="text-xs text-stone-700 opacity-0 group-hover:opacity-100 font-mono">
                        {index + 1}
                      </span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          {/* Quick African Reactions Bar */}
          <div className="w-full mt-4 flex items-center justify-center space-x-1.5 overflow-x-auto py-1">
            <span className="text-[10px] text-stone-500 font-bold mr-1 shrink-0">Réactions:</span>
            {QUICK_REACTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendReaction(item)}
                className="p-1.5 px-2 rounded-xl bg-stone-800/80 hover:bg-amber-500/20 text-stone-300 hover:text-amber-300 border border-stone-700/60 hover:border-amber-500/40 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center space-x-1"
                title={item.text}
              >
                <span>{item.emoji}</span>
                <span className="text-[10px] hidden sm:inline">{item.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions & Rematch Controls */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Rematch / Nouvelle Manche Button */}
            <button
              id="game-rematch-btn"
              onClick={handleRestart}
              className="flex-1 sm:flex-initial py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
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
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copié !' : 'Lien'}</span>
            </button>
          </div>

          {/* Share on WhatsApp / Social */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              id="game-share-whatsapp-btn"
              onClick={handleShareWhatsApp}
              className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-black flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
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
