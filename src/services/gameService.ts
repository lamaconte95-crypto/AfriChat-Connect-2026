import { getSupabaseClient } from './supabaseService';
import { TicTacToeCell, TicTacToeGameState, GamePlayerInfo } from '../types';

export const WINNING_COMBINATIONS: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Calculates whether there is a winner on the 3x3 Tic-Tac-Toe board.
 */
export const calculateWinner = (
  board: TicTacToeCell[]
): { winner: 'X' | 'O' | null; line: [number, number, number] | null; isDraw: boolean } => {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 'X' | 'O', line: combo, isDraw: false };
    }
  }

  const isFull = board.every((cell) => cell !== null);
  return { winner: null, line: null, isDraw: isFull };
};

/**
 * Minimax AI for unbeatable Tic-Tac-Toe on 'hard' mode, with smart heuristic on medium/easy.
 */
export const getBestAiMove = (
  board: TicTacToeCell[],
  aiRole: 'X' | 'O',
  difficulty: 'easy' | 'medium' | 'hard' = 'hard'
): number => {
  const humanRole: 'X' | 'O' = aiRole === 'X' ? 'O' : 'X';
  const availableMoves: number[] = [];
  board.forEach((cell, idx) => {
    if (cell === null) availableMoves.push(idx);
  });

  if (availableMoves.length === 0) return -1;

  // 1. Easy mode: mostly random
  if (difficulty === 'easy') {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // 2. Medium mode: Win if possible, block if possible, else 50% random or strategic
  if (difficulty === 'medium') {
    // Check immediate win
    for (const move of availableMoves) {
      const copy = [...board];
      copy[move] = aiRole;
      if (calculateWinner(copy).winner === aiRole) return move;
    }
    // Check immediate block
    for (const move of availableMoves) {
      const copy = [...board];
      copy[move] = humanRole;
      if (calculateWinner(copy).winner === humanRole) return move;
    }
    // Center preference
    if (board[4] === null && Math.random() > 0.3) return 4;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // 3. Hard mode: Unbeatable Minimax algorithm
  const minimax = (
    currentBoard: TicTacToeCell[],
    depth: number,
    isMaximizing: boolean
  ): { score: number; move?: number } => {
    const { winner, isDraw } = calculateWinner(currentBoard);
    if (winner === aiRole) return { score: 10 - depth };
    if (winner === humanRole) return { score: depth - 10 };
    if (isDraw) return { score: 0 };

    const freeIndices: number[] = [];
    currentBoard.forEach((c, i) => {
      if (c === null) freeIndices.push(i);
    });

    if (isMaximizing) {
      let bestScore = -Infinity;
      let bestMove = freeIndices[0];
      for (const idx of freeIndices) {
        currentBoard[idx] = aiRole;
        const result = minimax(currentBoard, depth + 1, false);
        currentBoard[idx] = null;
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = idx;
        }
      }
      return { score: bestScore, move: bestMove };
    } else {
      let bestScore = Infinity;
      let bestMove = freeIndices[0];
      for (const idx of freeIndices) {
        currentBoard[idx] = humanRole;
        const result = minimax(currentBoard, depth + 1, true);
        currentBoard[idx] = null;
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = idx;
        }
      }
      return { score: bestScore, move: bestMove };
    }
  };

  const result = minimax([...board], 0, true);
  return result.move !== undefined ? result.move : availableMoves[0];
};

/**
 * Synthesizes dynamic, clean audio effects for web without external files.
 */
let audioCtx: AudioContext | null = null;
export const playGameSound = (type: 'move_x' | 'move_o' | 'win' | 'lose' | 'draw' | 'click' | 'pop') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'move_x') {
      // Golden bright ping
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'move_o') {
      // Emerald soft chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(390, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'win') {
      // African fanfare chord
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const o = audioCtx!.createOscillator();
        const g = audioCtx!.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        o.connect(g);
        g.connect(audioCtx!.destination);
        const startTime = now + idx * 0.08;
        g.gain.setValueAtTime(0.15, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);
        o.start(startTime);
        o.stop(startTime + 0.5);
      });
    } else if (type === 'draw') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'lose') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'click' || type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Graceful fallback if audio context blocked by browser autoplay
  }
};

/**
 * Triggers subtle haptic feedback on supported mobile devices.
 */
export const triggerHaptic = (pattern: number | number[] = 30) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignored
    }
  }
};

/**
 * Creates an initial game state for Tic-Tac-Toe.
 */
export const createInitialGameState = (params: {
  id?: string;
  host: GamePlayerInfo;
  guest?: GamePlayerInfo;
  stakeFcfa?: number;
  isAiOpponent?: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}): TicTacToeGameState => {
  const roomCode = `AFRI-${Math.floor(1000 + Math.random() * 9000)}`;
  const gameId = params.id || `game_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    id: gameId,
    roomCode,
    host: {
      ...params.host,
      role: 'X',
    },
    guest: params.guest
      ? {
          ...params.guest,
          role: 'O',
        }
      : undefined,
    board: Array(9).fill(null),
    currentTurn: 'X',
    status: params.guest || params.isAiOpponent ? 'in_progress' : 'waiting',
    scores: {
      playerX: 0,
      playerO: 0,
      draws: 0,
    },
    stakeFcfa: params.stakeFcfa || 0,
    isAiOpponent: params.isAiOpponent || false,
    aiDifficulty: params.aiDifficulty || 'medium',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

/**
 * Supabase Realtime Channel Subscription for live Tic-Tac-Toe gameplay.
 * Connects to 'game_room' and room-specific channels to sync between PC and Mobile.
 */
export interface GameRealtimeHandlers {
  onMove?: (data: {
    gameId?: string;
    index: number;
    player: 'X' | 'O';
    nextTurn: 'X' | 'O';
    board?: TicTacToeCell[];
    scores?: { playerX: number; playerO: number; draws: number };
    status?: TicTacToeGameState['status'];
    winner?: 'X' | 'O' | 'draw' | null;
    winningLine?: [number, number, number] | null;
  }) => void;
  onRematch?: (data?: { gameId?: string; timestamp?: number }) => void;
  onJoin?: (guest: GamePlayerInfo, gameId?: string) => void;
  onReaction?: (reaction: { emoji: string; text?: string; senderName: string; senderId: string; gameId?: string }) => void;
  onStateSync?: (state: Partial<TicTacToeGameState>) => void;
}

// Keep active channels map to reuse or clean up properly
const activeChannels = new Map<string, any>();

export const subscribeToGameChannel = (
  gameId: string,
  handlers: GameRealtimeHandlers
): (() => void) => {
  const client = getSupabaseClient();
  if (!client) {
    console.log('[Supabase Realtime] No client available, offline fallback enabled');
    return () => {};
  }

  // Subscribe to 'game_room' channel (universal channel for cross-device PC/Mobile sync)
  // and room-specific channel 'game_room_' + gameId
  const channelNames = ['game_room', `game_room_${gameId}`, `game_tictactoe:${gameId}`];
  const subscriptions: any[] = [];

  channelNames.forEach((channelName) => {
    try {
      const channel = client.channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      });

      channel
        .on('broadcast', { event: 'game_move' }, (payload) => {
          if (!payload?.payload) return;
          const data = payload.payload;
          // Filter if gameId specified and doesn't match
          if (data.gameId && data.gameId !== gameId) return;
          if (handlers.onMove) {
            handlers.onMove(data);
          }
        })
        .on('broadcast', { event: 'game_rematch' }, (payload) => {
          const data = payload?.payload;
          if (data?.gameId && data.gameId !== gameId) return;
          if (handlers.onRematch) {
            handlers.onRematch(data);
          }
        })
        .on('broadcast', { event: 'game_join' }, (payload) => {
          const data = payload?.payload;
          if (!data) return;
          if (data.gameId && data.gameId !== gameId) return;
          const guestInfo = data.guest || data;
          if (handlers.onJoin) {
            handlers.onJoin(guestInfo, data.gameId || gameId);
          }
        })
        .on('broadcast', { event: 'game_reaction' }, (payload) => {
          const data = payload?.payload;
          if (!data) return;
          if (data.gameId && data.gameId !== gameId) return;
          if (handlers.onReaction) {
            handlers.onReaction(data);
          }
        })
        .on('broadcast', { event: 'game_sync' }, (payload) => {
          const data = payload?.payload;
          if (!data) return;
          if (data.gameId && data.gameId !== gameId) return;
          if (handlers.onStateSync) {
            handlers.onStateSync(data.state || data);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Supabase Realtime] Connected to channel '${channelName}' for Game ID: ${gameId}`);
          }
        });

      subscriptions.push(channel);
      activeChannels.set(channelName, channel);
    } catch (err) {
      console.warn(`[Supabase Realtime] Error subscribing to channel ${channelName}:`, err);
    }
  });

  return () => {
    subscriptions.forEach((channel) => {
      try {
        client.removeChannel(channel);
      } catch (err) {
        console.warn('Error removing game channel:', err);
      }
    });
  };
};

/**
 * Broadcasts a move across both 'game_room' and specific channels.
 */
export const broadcastGameMove = async (
  gameId: string,
  moveData: {
    index: number;
    player: 'X' | 'O';
    nextTurn: 'X' | 'O';
    board?: TicTacToeCell[];
    scores?: { playerX: number; playerO: number; draws: number };
    status?: TicTacToeGameState['status'];
    winner?: 'X' | 'O' | 'draw' | null;
    winningLine?: [number, number, number] | null;
    senderId?: string;
  }
) => {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = {
    gameId,
    ...moveData,
    timestamp: Date.now(),
  };

  const channelNames = ['game_room', `game_room_${gameId}`, `game_tictactoe:${gameId}`];
  for (const name of channelNames) {
    try {
      const channel = activeChannels.get(name) || client.channel(name);
      await channel.send({
        type: 'broadcast',
        event: 'game_move',
        payload,
      });
    } catch (err) {
      console.warn(`Failed to broadcast move on ${name}:`, err);
    }
  }
};

/**
 * Broadcasts a game rematch request.
 */
export const broadcastGameRematch = async (gameId: string, senderId?: string) => {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = { gameId, senderId, timestamp: Date.now() };
  const channelNames = ['game_room', `game_room_${gameId}`, `game_tictactoe:${gameId}`];
  for (const name of channelNames) {
    try {
      const channel = activeChannels.get(name) || client.channel(name);
      await channel.send({
        type: 'broadcast',
        event: 'game_rematch',
        payload,
      });
    } catch (err) {
      console.warn(`Failed to broadcast rematch on ${name}:`, err);
    }
  }
};

/**
 * Broadcasts joining player info.
 */
export const broadcastGameJoin = async (gameId: string, guest: GamePlayerInfo) => {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = { gameId, guest, timestamp: Date.now() };
  const channelNames = ['game_room', `game_room_${gameId}`, `game_tictactoe:${gameId}`];
  for (const name of channelNames) {
    try {
      const channel = activeChannels.get(name) || client.channel(name);
      await channel.send({
        type: 'broadcast',
        event: 'game_join',
        payload,
      });
    } catch (err) {
      console.warn(`Failed to broadcast join on ${name}:`, err);
    }
  }
};

/**
 * Broadcasts live game reaction emote.
 */
export const broadcastGameReaction = async (
  gameId: string,
  reaction: { emoji: string; text?: string; senderName: string; senderId: string }
) => {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = { gameId, ...reaction, timestamp: Date.now() };
  const channelNames = ['game_room', `game_room_${gameId}`, `game_tictactoe:${gameId}`];
  for (const name of channelNames) {
    try {
      const channel = activeChannels.get(name) || client.channel(name);
      await channel.send({
        type: 'broadcast',
        event: 'game_reaction',
        payload,
      });
    } catch (err) {
      console.warn(`Failed to broadcast reaction on ${name}:`, err);
    }
  }
};

/**
 * Broadcasts complete state sync.
 */
export const broadcastGameStateSync = async (
  gameId: string,
  state: Partial<TicTacToeGameState>
) => {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = { gameId, state, timestamp: Date.now() };
  const channelNames = ['game_room', `game_room_${gameId}`, `game_tictactoe:${gameId}`];
  for (const name of channelNames) {
    try {
      const channel = activeChannels.get(name) || client.channel(name);
      await channel.send({
        type: 'broadcast',
        event: 'game_sync',
        payload,
      });
    } catch (err) {
      console.warn(`Failed to broadcast state sync on ${name}:`, err);
    }
  }
};
