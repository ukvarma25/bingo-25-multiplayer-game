export type WinningLineType = 'row' | 'column' | 'diagonal';

export interface WinningLine {
  type: WinningLineType;
  index: number;
  indices: number[]; // indices in 0..24
  label: string; // e.g. "Row 1", "Column 3", "Main Diagonal"
}

export interface WinningCheckResult {
  completedLines: number;
  winningLines: WinningLine[];
  count: number;
  lines: WinningLine[];
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isBot?: boolean;
  connected: boolean;
  board: number[]; // 25 numbers (0 indicates unplaced)
  boardLocked: boolean;
  markedNumbers: number[];
  completedLines: WinningLine[];
  completedLineCount: number;
  lastLineCompletedAt?: number;
}

export interface GameSettings {
  maxPlayers: number;
  winningLinesRequired: number; // 1 to 5, default 5
  allowSpectators: boolean;
  autoCall: boolean;
  autoCallInterval: number; // in seconds, e.g. 4
}

export type GameStatus = 'waiting' | 'playing' | 'ended';

export interface GameHistoryItem {
  id: string;
  roomCode: string;
  winnerName: string;
  winningLineCount: number;
  totalCalls: number;
  durationSeconds: number;
  playersCount: number;
  endedAt: number;
}

export interface RoomState {
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
  turnCountdown?: number;
}
