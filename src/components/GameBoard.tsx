import React from 'react';
import { Check, Sparkles, Star } from 'lucide-react';
import { WinningLine } from '../types';

interface GameBoardProps {
  board: number[];
  markedNumbers: number[];
  currentNumber: number | null;
  winningLines: WinningLine[];
  onCellClick?: (num: number) => void;
  isMyTurn?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  markedNumbers,
  currentNumber,
  winningLines,
  onCellClick,
  isMyTurn,
}) => {
  const markedSet = React.useMemo(() => new Set(markedNumbers), [markedNumbers]);

  // Map cell index (0..24) to any winning lines it belongs to
  const winningCellIndices = React.useMemo(() => {
    const indices = new Set<number>();
    winningLines.forEach((line) => {
      line.indices.forEach((idx) => indices.add(idx));
    });
    return indices;
  }, [winningLines]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Board Card Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background decoration */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 5x5 Grid */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative z-10">
          {board.map((num, idx) => {
            const isMarked = markedSet.has(num);
            const isCurrent = currentNumber === num;
            const isWinningCell = winningCellIndices.has(idx);

            // Row and column for accessibility
            const rowNum = Math.floor(idx / 5) + 1;
            const colNum = (idx % 5) + 1;

            return (
              <button
                key={`${num}-${idx}`}
                type="button"
                onClick={() => {
                  if (onCellClick && isMyTurn && !isMarked) {
                    onCellClick(num);
                  }
                }}
                disabled={isMarked || !isMyTurn}
                aria-label={`Row ${rowNum}, Column ${colNum}, number ${num}${isMarked ? ', marked' : ''}${
                  isCurrent ? ', currently called' : ''
                }`}
                className={`group relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1 font-['Outfit'] font-black transition-all duration-200 select-none ${
                  isWinningCell
                    ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30 scale-[1.02] ring-2 ring-yellow-200 z-10'
                    : isCurrent
                    ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-white scale-[1.03] animate-pulse z-10'
                    : isMarked
                    ? 'bg-emerald-600/25 border border-emerald-500/50 text-emerald-200 shadow-inner'
                    : isMyTurn
                    ? 'bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 text-white cursor-pointer hover:scale-[1.02] active:scale-95 shadow-sm'
                    : 'bg-slate-850/90 border border-slate-800 text-slate-200 cursor-default'
                }`}
              >
                {/* Number Display */}
                <span
                  className={`leading-none font-bold tracking-tight ${
                    isWinningCell
                      ? 'text-slate-950 text-xl sm:text-2xl font-black'
                      : isCurrent
                      ? 'text-white text-xl sm:text-2xl font-black'
                      : isMarked
                      ? 'text-emerald-300 text-lg sm:text-xl line-through opacity-80'
                      : 'text-white text-lg sm:text-2xl font-bold'
                  }`}
                >
                  {num}
                </span>

                {/* State Badge (Checkmark or Star) */}
                {isWinningCell ? (
                  <div className="absolute top-1 right-1">
                    <Star className="w-3 h-3 text-slate-950 fill-current" />
                  </div>
                ) : isMarked ? (
                  <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5 shadow">
                    <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                  </div>
                ) : null}

                {/* Call this number hint if user's turn */}
                {isMyTurn && !isMarked && (
                  <span className="hidden sm:block absolute bottom-0.5 text-[9px] uppercase tracking-wider font-semibold text-amber-400/70 group-hover:text-amber-300">
                    Call
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend / Completed lines tags */}
        {winningLines.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-1.5 justify-center">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Completed:
            </span>
            {winningLines.map((line, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold"
              >
                ✓ {line.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
