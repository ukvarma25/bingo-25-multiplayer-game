import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';

interface BingoProgressBadgeProps {
  completedLines: number;
  requiredLines: number;
}

export const BingoProgressBadge: React.FC<BingoProgressBadgeProps> = ({
  completedLines,
  requiredLines,
}) => {
  const letters = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-lg">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
            Lines Completed
          </span>
          <span className="text-sm sm:text-base font-black text-white">
            <span className="text-amber-400 text-lg sm:text-xl font-mono">{completedLines}</span> / {requiredLines} Lines
          </span>
        </div>
      </div>

      {/* B-I-N-G-O letters badge */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {letters.map((letter, idx) => {
          const isLit = idx < completedLines;
          return (
            <div
              key={letter}
              className={`w-8 h-9 sm:w-10 sm:h-11 rounded-xl flex items-center justify-center font-black text-base sm:text-lg tracking-wider transition-all transform ${
                isLit
                  ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-300'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60'
              }`}
            >
              {letter}
            </div>
          );
        })}
      </div>
    </div>
  );
};
