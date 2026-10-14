import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  Shuffle,
  AlertCircle,
  CheckCircle2,
  Undo2,
  Redo2,
  CopyCheck,
  X,
} from 'lucide-react';
import { validateBoard, generateBoard } from '../utils/gameLogic';
import { soundManager } from '../utils/audio';

interface BoardBuilderProps {
  board: number[]; // 25 numbers, 0 for empty
  isLocked: boolean;
  onSaveBoard: (board: number[]) => void;
  onLockBoard: (board: number[]) => void;
  onUnlockBoard: () => void;
}

export const BoardBuilder: React.FC<BoardBuilderProps> = ({
  board,
  isLocked,
  onSaveBoard,
  onLockBoard,
  onUnlockBoard,
}) => {
  const initialBoard = useMemo(
    () => (board && board.length === 25 ? [...board] : Array(25).fill(0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [currentBoard, setCurrentBoard] = useState<number[]>(initialBoard);
  const [history, setHistory] = useState<number[][]>([initialBoard]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedCellIdx, setSelectedCellIdx] = useState<number | null>(null);
  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const [hasSavedPreviousBoard, setHasSavedPreviousBoard] = useState(false);

  // Check if a previous board exists in sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('bingo25_previous_board');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 25 && validateBoard(parsed).valid) {
          setHasSavedPreviousBoard(true);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Sync if board prop updates from outside (e.g. rematch reset or socket sync)
  useEffect(() => {
    if (board && board.length === 25) {
      const isDifferent = board.some((val, i) => val !== currentBoard[i]);
      if (isDifferent) {
        setCurrentBoard([...board]);
        setHistory([[...board]]);
        setHistoryIndex(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  // Push new board state to history
  const pushBoardState = useCallback(
    (newBoard: number[]) => {
      setCurrentBoard(newBoard);
      onSaveBoard(newBoard);
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newBoard];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex, onSaveBoard]
  );

  // Undo
  const handleUndo = () => {
    if (isLocked || historyIndex <= 0) return;
    soundManager.playClick();
    const prevBoard = history[historyIndex - 1];
    setHistoryIndex((prev) => prev - 1);
    setCurrentBoard(prevBoard);
    onSaveBoard(prevBoard);
    setSelectedNumber(null);
    setSelectedCellIdx(null);
  };

  // Redo
  const handleRedo = () => {
    if (isLocked || historyIndex >= history.length - 1) return;
    soundManager.playClick();
    const nextBoard = history[historyIndex + 1];
    setHistoryIndex((prev) => prev + 1);
    setCurrentBoard(nextBoard);
    onSaveBoard(nextBoard);
    setSelectedNumber(null);
    setSelectedCellIdx(null);
  };

  // Validation
  const validation = useMemo(() => validateBoard(currentBoard), [currentBoard]);

  // Set of placed numbers
  const placedNumbersSet = useMemo(() => {
    const set = new Set<number>();
    currentBoard.forEach((n) => {
      if (n > 0) set.add(n);
    });
    return set;
  }, [currentBoard]);

  // Handle number tile click in available numbers tray
  const handleSelectNumber = (num: number) => {
    if (isLocked) return;
    soundManager.playClick();

    // If an empty cell was already selected, place it immediately!
    if (selectedCellIdx !== null) {
      const updated = [...currentBoard];
      // If this number was placed elsewhere on the board, clear that old cell
      const oldIdx = updated.indexOf(num);
      if (oldIdx !== -1) {
        updated[oldIdx] = 0;
      }
      updated[selectedCellIdx] = num;
      pushBoardState(updated);
      setSelectedCellIdx(null);
      setSelectedNumber(null);
      return;
    }

    // Otherwise toggle selection
    if (selectedNumber === num) {
      setSelectedNumber(null);
    } else {
      setSelectedNumber(num);
    }
  };

  // Handle cell click on 5x5 board
  const handleCellClick = (idx: number) => {
    if (isLocked) return;
    soundManager.playClick();

    const existingNum = currentBoard[idx];

    // Case 1: A number is selected from the tray -> place it in this cell!
    if (selectedNumber !== null) {
      const updated = [...currentBoard];
      // If this number was placed elsewhere on the board, clear old cell
      const oldIdx = updated.indexOf(selectedNumber);
      if (oldIdx !== -1) {
        updated[oldIdx] = 0;
      }
      updated[idx] = selectedNumber;
      pushBoardState(updated);
      setSelectedNumber(null);
      setSelectedCellIdx(null);
      return;
    }

    // Case 2: A cell was already selected -> swap or move!
    if (selectedCellIdx !== null) {
      if (selectedCellIdx === idx) {
        // Deselect
        setSelectedCellIdx(null);
        return;
      }
      const updated = [...currentBoard];
      const temp = updated[selectedCellIdx];
      updated[selectedCellIdx] = updated[idx];
      updated[idx] = temp;
      pushBoardState(updated);
      setSelectedCellIdx(null);
      return;
    }

    // Case 3: Cell is empty and no number selected -> select this cell to receive next clicked number
    if (existingNum === 0) {
      setSelectedCellIdx(idx);
      return;
    }

    // Case 4: Cell has a number -> select it for move / swap / clear
    setSelectedCellIdx(idx);
  };

  // Clear single cell
  const handleClearCell = (idx: number) => {
    if (isLocked) return;
    soundManager.playClick();
    const updated = [...currentBoard];
    updated[idx] = 0;
    pushBoardState(updated);
    if (selectedCellIdx === idx) setSelectedCellIdx(null);
  };

  // Reset entire board
  const handleResetBoard = () => {
    if (isLocked) return;
    soundManager.playClick();
    const empty = Array(25).fill(0);
    pushBoardState(empty);
    setSelectedNumber(null);
    setSelectedCellIdx(null);
  };

  // Quick-fill remaining empty cells with unplaced numbers
  const handleAutoFillRemaining = () => {
    if (isLocked) return;
    soundManager.playClick();
    const unplaced: number[] = [];
    for (let n = 1; n <= 25; n++) {
      if (!placedNumbersSet.has(n)) unplaced.push(n);
    }
    // Shuffle unplaced
    for (let i = unplaced.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unplaced[i], unplaced[j]] = [unplaced[j], unplaced[i]];
    }

    const updated = [...currentBoard];
    let unplacedIdx = 0;
    for (let i = 0; i < 25; i++) {
      if (updated[i] === 0 && unplacedIdx < unplaced.length) {
        updated[i] = unplaced[unplacedIdx++];
      }
    }
    pushBoardState(updated);
    setSelectedNumber(null);
    setSelectedCellIdx(null);
  };

  // Randomize full board
  const handleShuffleAll = () => {
    if (isLocked) return;
    soundManager.playClick();
    const shuffled = generateBoard();
    pushBoardState(shuffled);
    setSelectedNumber(null);
    setSelectedCellIdx(null);
  };

  // Reuse Previous Board (Part 30)
  const handleReusePreviousBoard = () => {
    if (isLocked) return;
    try {
      const saved = sessionStorage.getItem('bingo25_previous_board');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 25 && validateBoard(parsed).valid) {
          soundManager.playClick();
          pushBoardState([...parsed]);
          setSelectedNumber(null);
          setSelectedCellIdx(null);
        }
      }
    } catch {
      // Ignore
    }
  };

  // Confirm and lock
  const handleConfirmLock = () => {
    if (!validation.valid) return;
    soundManager.playPop();
    // Cache this board as the player's arrangement for future rematches
    try {
      sessionStorage.setItem('bingo25_previous_board', JSON.stringify(currentBoard));
      setHasSavedPreviousBoard(true);
    } catch {
      // Ignore
    }
    setShowConfirmLock(false);
    onLockBoard(currentBoard);
  };

  const remainingCount = 25 - validation.filledCount;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Header & Status Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs uppercase font-bold tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Board Setup</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white tracking-tight">
              BUILD YOUR BOARD
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Arrange numbers <strong className="text-amber-300 font-bold">1–25</strong> however you want.
            </p>
          </div>

          {/* Locked status or Lock button */}
          <div>
            {isLocked ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-black text-xs sm:text-sm shadow-sm">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>🔒 BOARD LOCKED</span>
                </div>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onUnlockBoard();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Unlock and edit board before game starts"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>EDIT BOARD</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (validation.valid) {
                    soundManager.playClick();
                    setShowConfirmLock(true);
                  }
                }}
                disabled={!validation.valid}
                className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-2 ${
                  validation.valid
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/25 cursor-pointer hover:scale-105 active:scale-95 animate-pulse'
                    : 'bg-slate-850 border border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>LOCK BOARD</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress and Action Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Board Progress indicator (Part 5) */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                BOARD PROGRESS
              </span>
              <span
                className={`font-mono font-black text-sm ${
                  validation.valid ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {validation.valid ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    25 / 25
                  </span>
                ) : (
                  `${validation.filledCount} / 25`
                )}
              </span>
            </div>

            {/* Smart Inline Feedback (Part 7) */}
            <div className="text-xs font-semibold">
              {validation.valid ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  ✓ Board Complete! Make sure your arrangement is final.
                </span>
              ) : remainingCount === 25 ? (
                <span className="text-slate-400">
                  Tap a number from the palette below, then tap any cell to place it.
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Place {remainingCount} more {remainingCount === 1 ? 'number' : 'numbers'}.
                </span>
              )}
            </div>
          </div>

          {/* Board Utility Buttons: Undo, Redo, Auto-Fill, Shuffle, Clear, Reuse */}
          {!isLocked && (
            <div className="flex items-center flex-wrap gap-1.5">
              {/* Undo Button (Part 4) */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Undo last change"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              {/* Redo Button (Part 4) */}
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo change"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Redo</span>
              </button>

              {/* Reuse Previous Board (Part 30) */}
              {hasSavedPreviousBoard && validation.filledCount < 25 && (
                <button
                  type="button"
                  onClick={handleReusePreviousBoard}
                  title="Copy your previous board arrangement into this round"
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <CopyCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reuse Board</span>
                </button>
              )}

              {/* Auto-Fill Remaining */}
              <button
                type="button"
                onClick={handleAutoFillRemaining}
                disabled={validation.valid}
                title="Quickly fill remaining empty cells"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Auto-Fill Remaining</span>
                <span className="sm:hidden">Auto-Fill</span>
              </button>

              {/* Shuffle All */}
              <button
                type="button"
                onClick={handleShuffleAll}
                title="Randomize complete 1-25 board"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                <span>Shuffle</span>
              </button>

              {/* Clear Entire Board */}
              <button
                type="button"
                onClick={handleResetBoard}
                disabled={validation.filledCount === 0}
                title="Clear all numbers"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 disabled:opacity-40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Layout: Left 5x5 Board, Right Available Numbers Tray */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 5x5 Player Board (7 columns on large screens) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl relative">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
              <span className="font-bold uppercase tracking-wider text-white">Your 5×5 Grid</span>
              <span className="font-medium text-slate-400">
                {validation.filledCount}/25 placed
              </span>
            </div>

            {/* 5x5 Grid */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {currentBoard.map((val, idx) => {
                const isCellSelected = selectedCellIdx === idx;
                const isFilled = val > 0;

                return (
                  <div key={idx} className="relative aspect-square">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleCellClick(idx)}
                      className={`w-full h-full rounded-2xl flex flex-col items-center justify-center font-['Outfit'] font-black text-xl sm:text-2xl transition-all select-none relative ${
                        isCellSelected
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-300 shadow-xl scale-105 z-10'
                          : isFilled
                          ? 'bg-slate-800 border border-amber-500/30 text-white hover:border-amber-400 shadow cursor-pointer'
                          : selectedNumber !== null
                          ? 'bg-slate-850/80 border-2 border-dashed border-amber-400/70 hover:bg-amber-500/20 text-amber-300 animate-pulse cursor-pointer'
                          : 'bg-slate-950/60 border border-slate-800 text-slate-600 hover:border-slate-700 cursor-pointer'
                      } ${isLocked ? 'cursor-default opacity-95' : ''}`}
                    >
                      {isFilled ? (
                        <span>{val}</span>
                      ) : (
                        <span className="text-xs font-normal text-slate-600">
                          {selectedNumber !== null ? '+' : ''}
                        </span>
                      )}
                    </button>

                    {/* Quick clear button on hover/selected if cell is filled and not locked */}
                    {isFilled && !isLocked && isCellSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearCell(idx);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center shadow-lg cursor-pointer z-20"
                        title="Remove number from this cell"
                      >
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hint below board */}
            {!isLocked && (
              <p className="text-[11px] text-slate-500 text-center mt-3">
                Tap an empty cell to place, or tap a placed number to remove or swap.
              </p>
            )}
          </div>
        </div>

        {/* Right: Available Numbers Palette (1 to 25) (5 columns on large screens) */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-white">Number Palette</span>
              <span className="text-amber-400 font-bold">
                {25 - placedNumbersSet.size} available
              </span>
            </div>

            {/* 5x5 Palette of Numbers 1 to 25 */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
                const isPlaced = placedNumbersSet.has(num);
                const isSelected = selectedNumber === num;

                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleSelectNumber(num)}
                    title={isPlaced ? `Number ${num} is placed on board` : `Select number ${num}`}
                    className={`aspect-square rounded-xl font-['Outfit'] font-black text-sm sm:text-base flex items-center justify-center transition-all relative ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-white shadow-lg scale-105 z-10'
                        : isPlaced
                        ? 'bg-slate-950/70 border border-slate-850 text-slate-600 opacity-50 cursor-pointer'
                        : 'bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white hover:border-amber-400/50 shadow hover:scale-105 active:scale-95 cursor-pointer'
                    }`}
                  >
                    <span>{num}</span>
                    {isPlaced && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] text-emerald-400 font-black">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              {isLocked ? (
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Board locked. Waiting for match to begin...</span>
                </div>
              ) : selectedNumber !== null ? (
                <span>
                  Selected <strong className="text-amber-300 font-bold">Number {selectedNumber}</strong>. Tap any grid cell to place it!
                </span>
              ) : (
                <span>Tap any available number, then tap a grid cell.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal on Lock */}
      {showConfirmLock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black font-['Outfit'] text-white">Lock Your Board?</h3>
                <p className="text-xs text-slate-400">Make sure your arrangement is final.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              All 25 numbers are placed. Once locked and the game begins, your board cannot be changed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmLock(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Review Again
              </button>
              <button
                onClick={handleConfirmLock}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-transform cursor-pointer"
              >
                LOCK BOARD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
