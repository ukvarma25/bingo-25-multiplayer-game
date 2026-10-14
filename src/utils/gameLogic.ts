import { WinningCheckResult, WinningLine } from '../types';

export const WINNING_LINES_DEFINITIONS = {
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
    [0, 6, 12, 18, 24], // Main diagonal (Top-left -> Bottom-right)
    [4, 8, 12, 16, 20], // Opposite diagonal (Top-right -> Bottom-left)
  ],
};

/**
 * Creates an empty 5x5 board with 25 unplaced cells (represented by 0).
 */
export function createEmptyBoard(): number[] {
  return Array(25).fill(0);
}

/**
 * Validates whether a board has exactly numbers 1 to 25 placed with no empty slots and no duplicates.
 */
export function validateBoard(board: number[]): {
  valid: boolean;
  error?: string;
  filledCount: number;
  missingNumbers: number[];
  duplicates: number[];
} {
  if (!Array.isArray(board) || board.length !== 25) {
    return {
      valid: false,
      error: 'Board must contain exactly 25 cells.',
      filledCount: 0,
      missingNumbers: Array.from({ length: 25 }, (_, i) => i + 1),
      duplicates: [],
    };
  }

  const counts = new Map<number, number>();
  let filledCount = 0;

  board.forEach((num) => {
    if (num > 0) {
      filledCount++;
      counts.set(num, (counts.get(num) || 0) + 1);
    }
  });

  const missingNumbers: number[] = [];
  const duplicates: number[] = [];

  for (let n = 1; n <= 25; n++) {
    const c = counts.get(n) || 0;
    if (c === 0) {
      missingNumbers.push(n);
    } else if (c > 1) {
      duplicates.push(n);
    }
  }

  if (filledCount < 25) {
    return {
      valid: false,
      error: `Your board is incomplete. Place all numbers 1–25 (${filledCount}/25 placed, ${25 - filledCount} remaining).`,
      filledCount,
      missingNumbers,
      duplicates,
    };
  }

  if (duplicates.length > 0) {
    return {
      valid: false,
      error: `Duplicate numbers found: ${duplicates.join(', ')}. Each number from 1 to 25 must appear exactly once.`,
      filledCount,
      missingNumbers,
      duplicates,
    };
  }

  if (missingNumbers.length > 0) {
    return {
      valid: false,
      error: `Missing numbers: ${missingNumbers.join(', ')}. Place all numbers 1–25.`,
      filledCount,
      missingNumbers,
      duplicates,
    };
  }

  return {
    valid: true,
    filledCount: 25,
    missingNumbers: [],
    duplicates: [],
  };
}

/**
 * Generates a randomized 5x5 board containing numbers 1 to 25 exactly once.
 * Used for bot players and optional player auto-fill.
 */
export function generateBoard(): number[] {
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  // Fisher-Yates shuffle
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}

/**
 * Dedicated function to check completed lines given a player's 25-number board and array of marked numbers.
 * Checks all 12 valid lines (5 rows, 5 columns, 2 diagonals) and avoids duplicate counts.
 * Returns: { count, lines, completedLines, winningLines }
 */
export function checkCompletedLines(board: number[], markedNumbers: number[]): WinningCheckResult {
  const markedSet = new Set(markedNumbers);
  const winningLines: WinningLine[] = [];

  // 1. Check 5 Horizontal Rows
  WINNING_LINES_DEFINITIONS.rows.forEach((indices, index) => {
    const isComplete = indices.every((cellIdx) => {
      const val = board[cellIdx];
      return val > 0 && markedSet.has(val);
    });
    if (isComplete) {
      winningLines.push({
        type: 'row',
        index,
        indices,
        label: `Row ${index + 1}`,
      });
    }
  });

  // 2. Check 5 Vertical Columns
  WINNING_LINES_DEFINITIONS.columns.forEach((indices, index) => {
    const isComplete = indices.every((cellIdx) => {
      const val = board[cellIdx];
      return val > 0 && markedSet.has(val);
    });
    if (isComplete) {
      winningLines.push({
        type: 'column',
        index,
        indices,
        label: `Column ${index + 1}`,
      });
    }
  });

  // 3. Check 2 Diagonals (Main and Opposite)
  WINNING_LINES_DEFINITIONS.diagonals.forEach((indices, index) => {
    const isComplete = indices.every((cellIdx) => {
      const val = board[cellIdx];
      return val > 0 && markedSet.has(val);
    });
    if (isComplete) {
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

/**
 * Alias for backward compatibility.
 */
export function checkWinningLines(board: number[], markedNumbers: number[]): WinningCheckResult {
  return checkCompletedLines(board, markedNumbers);
}

/**
 * Generate a clean 5-character alphanumeric room code (e.g. B7K4P).
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
