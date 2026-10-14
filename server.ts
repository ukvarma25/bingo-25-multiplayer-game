import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';

// Types for server state
interface WinningLine {
  type: 'row' | 'column' | 'diagonal';
  index: number;
  indices: number[];
  label: string;
}

interface WinningCheckResult {
  count: number;
  lines: WinningLine[];
  completedLines: number;
  winningLines: WinningLine[];
}

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isBot?: boolean;
  connected: boolean;
  board: number[]; // 25 numbers
  boardLocked: boolean;
  markedNumbers: number[];
  completedLines: WinningLine[];
  completedLineCount: number;
  lastLineCompletedAt?: number;
  socketId?: string;
}

interface GameSettings {
  maxPlayers: number;
  winningLinesRequired: number;
  allowSpectators: boolean;
  autoCall: boolean;
  autoCallInterval: number;
}

type GameStatus = 'waiting' | 'playing' | 'ended';

interface GameHistoryItem {
  id: string;
  roomCode: string;
  winnerName: string;
  winningLineCount: number;
  totalCalls: number;
  durationSeconds: number;
  playersCount: number;
  endedAt: number;
}

interface Room {
  roomCode: string;
  status: GameStatus;
  hostId: string;
  players: Player[];
  settings: GameSettings;
  calledNumbers: number[];
  currentNumber: number | null;
  currentTurnPlayerId: string | null;
  winnerId: string | null;
  winningLines: WinningLine[];
  winningLineCount: number;
  isAutoCallingPaused: boolean;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  autoCallTimer?: NodeJS.Timeout | null;
  countdownTimer?: NodeJS.Timeout | null;
}

const WINNING_LINES_DEFINITIONS = {
  rows: [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
  ],
  columns: [
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
  ],
  diagonals: [
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ],
};

function validateBoard(board: number[]): { valid: boolean; error?: string } {
  if (!Array.isArray(board) || board.length !== 25) {
    return { valid: false, error: 'Board must contain exactly 25 cells.' };
  }
  const counts = new Map<number, number>();
  let filledCount = 0;
  board.forEach((num) => {
    if (num > 0) {
      filledCount++;
      counts.set(num, (counts.get(num) || 0) + 1);
    }
  });

  if (filledCount < 25) {
    return { valid: false, error: `Your board is incomplete. Place all numbers 1–25 (${filledCount}/25 placed).` };
  }

  const duplicates: number[] = [];
  const missing: number[] = [];
  for (let n = 1; n <= 25; n++) {
    const c = counts.get(n) || 0;
    if (c === 0) missing.push(n);
    if (c > 1) duplicates.push(n);
  }

  if (duplicates.length > 0) {
    return { valid: false, error: `Duplicate numbers found: ${duplicates.join(', ')}` };
  }
  if (missing.length > 0) {
    return { valid: false, error: `Missing numbers: ${missing.join(', ')}` };
  }

  return { valid: true };
}

function generateBoard(): number[] {
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}

function checkWinningLines(board: number[], markedNumbers: number[]): WinningCheckResult {
  const markedSet = new Set(markedNumbers);
  const winningLines: WinningLine[] = [];

  // Rows
  WINNING_LINES_DEFINITIONS.rows.forEach((indices, index) => {
    if (indices.every((cellIdx) => board[cellIdx] > 0 && markedSet.has(board[cellIdx]))) {
      winningLines.push({
        type: 'row',
        index,
        indices,
        label: `Row ${index + 1}`,
      });
    }
  });

  // Columns
  WINNING_LINES_DEFINITIONS.columns.forEach((indices, index) => {
    if (indices.every((cellIdx) => board[cellIdx] > 0 && markedSet.has(board[cellIdx]))) {
      winningLines.push({
        type: 'column',
        index,
        indices,
        label: `Column ${index + 1}`,
      });
    }
  });

  // Diagonals
  WINNING_LINES_DEFINITIONS.diagonals.forEach((indices, index) => {
    if (indices.every((cellIdx) => board[cellIdx] > 0 && markedSet.has(board[cellIdx]))) {
      winningLines.push({
        type: 'diagonal',
        index,
        indices,
        label: index === 0 ? 'Main Diagonal' : 'Opposite Diagonal',
      });
    }
  });

  return {
    count: winningLines.length,
    lines: winningLines,
    completedLines: winningLines.length,
    winningLines,
  };
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// In-Memory Storage
const rooms = new Map<string, Room>();
const gameHistory: GameHistoryItem[] = [];
// Map socketId -> { roomCode, playerId }
const socketPlayerMap = new Map<string, { roomCode: string; playerId: string }>();

function sanitizeRoomForClient(room: Room): Omit<Room, 'autoCallTimer' | 'countdownTimer'> {
  const { autoCallTimer, countdownTimer, ...rest } = room;
  return rest;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  app.get('/api/history', (req, res) => {
    res.json(gameHistory.slice(0, 20));
  });

  // Socket.IO server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  function stopAutoCaller(room: Room) {
    if (room.autoCallTimer) {
      clearInterval(room.autoCallTimer);
      room.autoCallTimer = null;
    }
  }

  function startAutoCaller(room: Room) {
    stopAutoCaller(room);
    if (!room.settings.autoCall || room.status !== 'playing' || room.isAutoCallingPaused) {
      return;
    }

    const intervalMs = Math.max(2, room.settings.autoCallInterval || 4) * 1000;
    room.autoCallTimer = setInterval(() => {
      if (room.status !== 'playing' || room.isAutoCallingPaused) {
        stopAutoCaller(room);
        return;
      }
      callNextRandomNumber(room);
    }, intervalMs);
  }

  function rotateTurn(room: Room) {
    if (room.players.length === 0) return;
    const currentIdx = room.players.findIndex((p) => p.id === room.currentTurnPlayerId);
    let nextIdx = (currentIdx + 1) % room.players.length;
    // Find next connected player (or bot)
    for (let attempts = 0; attempts < room.players.length; attempts++) {
      const candidate = room.players[nextIdx];
      if (candidate && (candidate.connected || candidate.isBot)) {
        room.currentTurnPlayerId = candidate.id;
        break;
      }
      nextIdx = (nextIdx + 1) % room.players.length;
    }
  }

  function callNextRandomNumber(room: Room): boolean {
    const calledSet = new Set(room.calledNumbers);
    const remaining: number[] = [];
    for (let n = 1; n <= 25; n++) {
      if (!calledSet.has(n)) {
        remaining.push(n);
      }
    }
    if (remaining.length === 0) {
      return false;
    }
    const randomIndex = Math.floor(Math.random() * remaining.length);
    const chosenNumber = remaining[randomIndex];
    return processNumberCall(room, chosenNumber, room.currentTurnPlayerId || room.hostId);
  }

  function processNumberCall(room: Room, num: number, calledById: string): boolean {
    if (room.status !== 'playing') return false;
    if (num < 1 || num > 25) return false;
    if (room.calledNumbers.includes(num)) return false;

    room.calledNumbers.push(num);
    room.currentNumber = num;

    // Mark number for every player and evaluate lines
    const winners: Player[] = [];

    for (const player of room.players) {
      if (player.board.includes(num) && !player.markedNumbers.includes(num)) {
        player.markedNumbers.push(num);
      }

      const evalResult = checkWinningLines(player.board, player.markedNumbers);
      const prevLineCount = player.completedLineCount;
      player.completedLines = evalResult.winningLines;
      player.completedLineCount = evalResult.completedLines;

      if (player.completedLineCount > prevLineCount) {
        player.lastLineCompletedAt = Date.now();
      }

      // Check win condition (must be >= winningLinesRequired, default 5)
      if (player.completedLineCount >= room.settings.winningLinesRequired) {
        winners.push(player);
      }
    }

    if (winners.length > 0) {
      // Deterministic tie-break for simultaneous winners:
      // 1. Highest completed line count (e.g. 6 lines vs 5 lines)
      // 2. Earliest lastLineCompletedAt timestamp
      winners.sort((a, b) => {
        if (b.completedLineCount !== a.completedLineCount) {
          return b.completedLineCount - a.completedLineCount;
        }
        return (a.lastLineCompletedAt || 0) - (b.lastLineCompletedAt || 0);
      });
      const winningPlayer = winners[0];
      // WINNER DETECTED
      room.status = 'ended';
      room.winnerId = winningPlayer.id;
      room.winningLines = winningPlayer.completedLines;
      room.winningLineCount = winningPlayer.completedLineCount;
      room.endedAt = Date.now();
      stopAutoCaller(room);

      const durationSec = room.startedAt ? Math.round((room.endedAt - room.startedAt) / 1000) : 0;
      gameHistory.unshift({
        id: 'hist_' + Date.now(),
        roomCode: room.roomCode,
        winnerName: winningPlayer.name,
        winningLineCount: winningPlayer.completedLineCount,
        totalCalls: room.calledNumbers.length,
        durationSeconds: durationSec,
        playersCount: room.players.length,
        endedAt: room.endedAt,
      });

      io.to(room.roomCode).emit('game:win', {
        winnerId: winningPlayer.id,
        winnerName: winningPlayer.name,
        winningLines: winningPlayer.completedLines,
        room: sanitizeRoomForClient(room),
      });

      return true;
    }

    // Move to next player's turn if in manual mode
    rotateTurn(room);

    // Broadcast updated state
    io.to(room.roomCode).emit('game:number-called', {
      number: num,
      calledBy: calledById,
      room: sanitizeRoomForClient(room),
    });

    // Check if next turn is a bot
    triggerBotTurnIfNeeded(room);

    return true;
  }

  function triggerBotTurnIfNeeded(room: Room) {
    if (room.status !== 'playing' || room.settings.autoCall) return;
    const activePlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
    if (activePlayer && activePlayer.isBot) {
      setTimeout(() => {
        if (room.status !== 'playing' || room.currentTurnPlayerId !== activePlayer.id) return;
        // Bot picks an unmarked number from its own board, or any remaining number
        const uncalledNumbers = Array.from({ length: 25 }, (_, i) => i + 1).filter(
          (n) => !room.calledNumbers.includes(n)
        );
        if (uncalledNumbers.length === 0) return;

        // Smart bot: pick an uncalled number on its board that helps complete a line
        const botUncalled = activePlayer.board.filter((n) => !room.calledNumbers.includes(n));
        const picked = botUncalled.length > 0 ? botUncalled[Math.floor(Math.random() * botUncalled.length)] : uncalledNumbers[0];

        processNumberCall(room, picked, activePlayer.id);
      }, 1400);
    }
  }

  io.on('connection', (socket: Socket) => {
    // 1. Create Room
    socket.on('room:create', ({ hostName, settings }: { hostName: string; settings: Partial<GameSettings> }, callback) => {
      const cleanName = (hostName || '').trim() || 'Host';
      let code = generateRoomCode();
      while (rooms.has(code)) {
        code = generateRoomCode();
      }

      const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
      const initialSettings: GameSettings = {
        maxPlayers: settings.maxPlayers || 6,
        winningLinesRequired: settings.winningLinesRequired || 5,
        allowSpectators: settings.allowSpectators ?? true,
        autoCall: settings.autoCall ?? false,
        autoCallInterval: settings.autoCallInterval || 4,
      };

      const hostPlayer: Player = {
        id: playerId,
        name: cleanName,
        isHost: true,
        connected: true,
        board: Array(25).fill(0),
        boardLocked: false,
        markedNumbers: [],
        completedLines: [],
        completedLineCount: 0,
        socketId: socket.id,
      };

      const newRoom: Room = {
        roomCode: code,
        status: 'waiting',
        hostId: playerId,
        players: [hostPlayer],
        settings: initialSettings,
        calledNumbers: [],
        currentNumber: null,
        currentTurnPlayerId: playerId,
        winnerId: null,
        winningLines: [],
        winningLineCount: 0,
        isAutoCallingPaused: false,
        createdAt: Date.now(),
      };

      rooms.set(code, newRoom);
      socket.join(code);
      socketPlayerMap.set(socket.id, { roomCode: code, playerId });

      if (typeof callback === 'function') {
        callback({ success: true, room: sanitizeRoomForClient(newRoom), player: hostPlayer });
      }
    });

    // 2. Join Room
    socket.on('room:join', ({ roomCode, playerName, playerId: existingPlayerId }: { roomCode: string; playerName: string; playerId?: string }, callback) => {
      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        if (typeof callback === 'function') callback({ success: false, message: "Room doesn't exist." });
        return;
      }

      // Check reconnect
      if (existingPlayerId) {
        const existingPlayer = room.players.find((p) => p.id === existingPlayerId);
        if (existingPlayer) {
          existingPlayer.connected = true;
          existingPlayer.socketId = socket.id;
          socket.join(code);
          socketPlayerMap.set(socket.id, { roomCode: code, playerId: existingPlayer.id });

          io.to(code).emit('room:update', sanitizeRoomForClient(room));
          if (typeof callback === 'function') {
            callback({ success: true, room: sanitizeRoomForClient(room), player: existingPlayer });
          }
          return;
        }
      }

      if (room.status !== 'waiting') {
        if (typeof callback === 'function') callback({ success: false, message: 'This game has already started.' });
        return;
      }

      if (room.players.length >= room.settings.maxPlayers) {
        if (typeof callback === 'function') callback({ success: false, message: 'This room is full.' });
        return;
      }

      const cleanName = (playerName || '').trim();
      if (!cleanName) {
        if (typeof callback === 'function') callback({ success: false, message: 'Please enter a valid player name.' });
        return;
      }

      if (room.players.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
        if (typeof callback === 'function') callback({ success: false, message: 'Username is already taken in this room.' });
        return;
      }

      const newPlayer: Player = {
        id: 'player_' + Math.random().toString(36).substring(2, 9),
        name: cleanName,
        isHost: false,
        connected: true,
        board: Array(25).fill(0),
        boardLocked: false,
        markedNumbers: [],
        completedLines: [],
        completedLineCount: 0,
        socketId: socket.id,
      };

      room.players.push(newPlayer);
      socket.join(code);
      socketPlayerMap.set(socket.id, { roomCode: code, playerId: newPlayer.id });

      io.to(code).emit('room:update', sanitizeRoomForClient(room));
      if (typeof callback === 'function') {
        callback({ success: true, room: sanitizeRoomForClient(room), player: newPlayer });
      }
    });

    // 2b. Board Save Draft
    socket.on('board:save', ({ roomCode, playerId, board }: { roomCode: string; playerId: string; board: number[] }, callback) => {
      const room = rooms.get(roomCode);
      if (!room || room.status !== 'waiting') return;
      const player = room.players.find((p) => p.id === playerId);
      if (!player || player.boardLocked) return;

      if (Array.isArray(board) && board.length === 25) {
        player.board = board;
      }
      if (typeof callback === 'function') callback({ success: true });
    });

    // 2c. Board Lock (Verification & Lock)
    socket.on('board:lock', ({ roomCode, playerId, board }: { roomCode: string; playerId: string; board: number[] }, callback) => {
      const room = rooms.get(roomCode);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, message: 'Room not found.' });
        return;
      }
      if (room.status !== 'waiting') {
        if (typeof callback === 'function') callback({ success: false, message: 'Game has already started.' });
        return;
      }
      const player = room.players.find((p) => p.id === playerId);
      if (!player) {
        if (typeof callback === 'function') callback({ success: false, message: 'Player not found.' });
        return;
      }

      const val = validateBoard(board);
      if (!val.valid) {
        if (typeof callback === 'function') callback({ success: false, message: val.error || 'Invalid board.' });
        return;
      }

      player.board = [...board];
      player.boardLocked = true;
      io.to(roomCode).emit('room:update', sanitizeRoomForClient(room));
      if (typeof callback === 'function') callback({ success: true, player });
    });

    // 2d. Board Unlock (Before game starts)
    socket.on('board:unlock', ({ roomCode, playerId }: { roomCode: string; playerId: string }, callback) => {
      const room = rooms.get(roomCode);
      if (!room || room.status !== 'waiting') {
        if (typeof callback === 'function') callback({ success: false, message: 'Cannot unlock board after game start.' });
        return;
      }
      const player = room.players.find((p) => p.id === playerId);
      if (!player) return;

      player.boardLocked = false;
      io.to(roomCode).emit('room:update', sanitizeRoomForClient(room));
      if (typeof callback === 'function') callback({ success: true });
    });

    // 3. Start Game
    socket.on('game:start', ({ roomCode, playerId }: { roomCode: string; playerId: string }, callback) => {
      const room = rooms.get(roomCode);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, message: "Room doesn't exist." });
        return;
      }

      if (room.hostId !== playerId) {
        if (typeof callback === 'function') callback({ success: false, message: 'Only the host can start the game.' });
        return;
      }

      if (room.players.length < 2) {
        if (typeof callback === 'function') callback({ success: false, message: 'At least 2 players are required to start.' });
        return;
      }

      // Check that all players have locked their boards
      const unreadyPlayers = room.players.filter((p) => !p.boardLocked);
      if (unreadyPlayers.length > 0) {
        const names = unreadyPlayers.map((p) => p.name).join(', ');
        if (typeof callback === 'function') {
          callback({ success: false, message: `Cannot start game: ${names} still building board.` });
        }
        return;
      }

      // Preserve player manually created boards exactly! Reset game marks and lines
      room.players.forEach((p) => {
        p.markedNumbers = [];
        p.completedLines = [];
        p.completedLineCount = 0;
      });

      room.status = 'playing';
      room.calledNumbers = [];
      room.currentNumber = null;
      room.currentTurnPlayerId = room.players[0].id;
      room.winnerId = null;
      room.winningLines = [];
      room.winningLineCount = 0;
      room.startedAt = Date.now();
      room.endedAt = undefined;
      room.isAutoCallingPaused = false;

      io.to(roomCode).emit('game:start', sanitizeRoomForClient(room));

      if (room.settings.autoCall) {
        startAutoCaller(room);
      } else {
        triggerBotTurnIfNeeded(room);
      }

      if (typeof callback === 'function') callback({ success: true });
    });

    // 4. Call Number
    socket.on('game:call-number', ({ roomCode, playerId, number }: { roomCode: string; playerId: string; number: number }, callback) => {
      const room = rooms.get(roomCode);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, message: 'Room not found.' });
        return;
      }

      if (room.status !== 'playing') {
        if (typeof callback === 'function') callback({ success: false, message: 'Game is not in playing state.' });
        return;
      }

      // Check turn if manual calling
      if (!room.settings.autoCall && room.currentTurnPlayerId !== playerId) {
        if (typeof callback === 'function') callback({ success: false, message: 'Wait for your turn.' });
        return;
      }

      const num = Number(number);
      if (isNaN(num) || num < 1 || num > 25) {
        if (typeof callback === 'function') callback({ success: false, message: 'Number must be between 1 and 25.' });
        return;
      }

      if (room.calledNumbers.includes(num)) {
        if (typeof callback === 'function') callback({ success: false, message: 'This number has already been called.' });
        return;
      }

      const processed = processNumberCall(room, num, playerId);
      if (typeof callback === 'function') {
        callback({ success: processed });
      }
    });

    // 5. Toggle Auto Calling (Pause / Resume)
    socket.on('game:toggle-auto-call', ({ roomCode, playerId }: { roomCode: string; playerId: string }, callback) => {
      const room = rooms.get(roomCode);
      if (!room || room.hostId !== playerId) return;

      room.isAutoCallingPaused = !room.isAutoCallingPaused;
      if (room.isAutoCallingPaused) {
        stopAutoCaller(room);
      } else {
        startAutoCaller(room);
      }

      io.to(roomCode).emit('room:update', sanitizeRoomForClient(room));
      if (typeof callback === 'function') callback({ success: true, isPaused: room.isAutoCallingPaused });
    });

    // 6. Rematch
    socket.on('game:rematch', ({ roomCode, playerId }: { roomCode: string; playerId: string }, callback) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      stopAutoCaller(room);

      // Keep players in the room, reset game to waiting and empty boards for players
      room.players.forEach((p) => {
        p.board = p.isBot ? generateBoard() : Array(25).fill(0);
        p.boardLocked = p.isBot ? true : false;
        p.markedNumbers = [];
        p.completedLines = [];
        p.completedLineCount = 0;
      });

      room.status = 'waiting';
      room.calledNumbers = [];
      room.currentNumber = null;
      room.currentTurnPlayerId = room.players[0].id;
      room.winnerId = null;
      room.winningLines = [];
      room.winningLineCount = 0;
      room.startedAt = undefined;
      room.endedAt = undefined;
      room.isAutoCallingPaused = false;

      io.to(roomCode).emit('game:rematch', sanitizeRoomForClient(room));
      io.to(roomCode).emit('room:update', sanitizeRoomForClient(room));

      if (typeof callback === 'function') callback({ success: true });
    });

    // 7. Add Bot to Room (for Host or Demo)
    socket.on('room:add-bot', ({ roomCode, playerId }: { roomCode: string; playerId: string }, callback) => {
      const room = rooms.get(roomCode);
      if (!room || room.hostId !== playerId) {
        if (typeof callback === 'function') callback({ success: false, message: 'Only host can add bots.' });
        return;
      }
      if (room.players.length >= room.settings.maxPlayers) {
        if (typeof callback === 'function') callback({ success: false, message: 'Room is full.' });
        return;
      }

      const botNames = ['Bot Alpha', 'Bot Blitz', 'Bot Nova', 'Bot Titan', 'Bot Echo'];
      const existingNames = new Set(room.players.map((p) => p.name));
      const availableName = botNames.find((n) => !existingNames.has(n)) || `Bot ${room.players.length + 1}`;

      const botPlayer: Player = {
        id: 'bot_' + Math.random().toString(36).substring(2, 9),
        name: availableName,
        isHost: false,
        isBot: true,
        connected: true,
        board: generateBoard(),
        boardLocked: true,
        markedNumbers: [],
        completedLines: [],
        completedLineCount: 0,
      };

      room.players.push(botPlayer);
      io.to(roomCode).emit('room:update', sanitizeRoomForClient(room));
      if (typeof callback === 'function') callback({ success: true, bot: botPlayer });
    });

    // 8. Leave Room
    socket.on('room:leave', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      socket.leave(roomCode);
      socketPlayerMap.delete(socket.id);

      const pIdx = room.players.findIndex((p) => p.id === playerId);
      if (pIdx !== -1) {
        const leaving = room.players[pIdx];
        room.players.splice(pIdx, 1);

        // If host left, reassign
        if (leaving.isHost && room.players.length > 0) {
          const nextHost = room.players.find((p) => !p.isBot) || room.players[0];
          nextHost.isHost = true;
          room.hostId = nextHost.id;
          io.to(roomCode).emit('host:transfer', { newHostName: nextHost.name });
        }

        if (room.players.length === 0) {
          stopAutoCaller(room);
          rooms.delete(roomCode);
        } else {
          // If was leaving player's turn, rotate
          if (room.currentTurnPlayerId === playerId) {
            rotateTurn(room);
          }
          io.to(roomCode).emit('room:update', sanitizeRoomForClient(room));
        }
      }
    });

    // 9. Disconnect
    socket.on('disconnect', () => {
      const mapping = socketPlayerMap.get(socket.id);
      if (!mapping) return;
      const { roomCode, playerId } = mapping;
      socketPlayerMap.delete(socket.id);

      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.find((p) => p.id === playerId);
      if (!player) return;

      player.connected = false;

      // Broadcast disconnect notice
      io.to(roomCode).emit('player:disconnect', {
        playerId,
        playerName: player.name,
        room: sanitizeRoomForClient(room),
      });

      // Grace period: if in waiting room and host disconnects, or if 1 minute passes
      if (room.status === 'waiting' && player.isHost) {
        const otherHuman = room.players.find((p) => p.id !== playerId && !p.isBot);
        if (otherHuman) {
          player.isHost = false;
          otherHuman.isHost = true;
          room.hostId = otherHuman.id;
          io.to(roomCode).emit('room:update', sanitizeRoomForClient(room));
          io.to(roomCode).emit('host:transfer', { newHostName: otherHuman.name });
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Bingo 25 server running on http://localhost:${PORT}`);
  });
}

startServer();
