import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, Check, Hash, Award } from 'lucide-react';
import { RoomState, Player } from '../types';
import { soundManager } from '../utils/audio';

interface WinnerCelebrationModalProps {
  room: RoomState;
  currentPlayer: Player;
  onRematch: () => void;
  onExit: () => void;
  isHost: boolean;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  room,
  currentPlayer,
  onRematch,
  onExit,
  isHost,
}) => {
  const winner = room.players.find((p) => p.id === room.winnerId);
  const isMe = winner?.id === currentPlayer.id;

  // Trigger sound and confetti upon mounting
  useEffect(() => {
    soundManager.playBingoWin();

    // Respect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    // Confetti cannon
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#f59e0b', '#ec4899', '#10b981', '#3b82f6', '#f43f5e'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // Sorted final leaderboard
  const sortedPlayers = React.useMemo(() => {
    return [...room.players].sort((a, b) => {
      if (b.completedLineCount !== a.completedLineCount) {
        return b.completedLineCount - a.completedLineCount;
      }
      return (a.lastLineCompletedAt || Infinity) - (b.lastLineCompletedAt || Infinity);
    });
  }, [room.players]);

  const winnerBoard = winner?.board || [];
  const winnerMarkedSet = new Set(winner?.markedNumbers || []);
  const winningLines = room.winningLines || [];

  // Indices in winning lines
  const winningIndices = React.useMemo(() => {
    const set = new Set<number>();
    winningLines.forEach((l) => l.indices.forEach((idx) => set.add(idx)));
    return set;
  }, [winningLines]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl my-auto shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Top Celebration Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 p-6 sm:p-8 text-center text-slate-950 relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/20 backdrop-blur-sm text-slate-950 font-black text-xs uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" /> Final Results
            </div>
            <h1 className="text-4xl sm:text-5xl font-black font-['Outfit'] tracking-tight">
              {isMe ? '🎉 BINGO! 🎉' : '🏆 GAME OVER 🏆'}
            </h1>
            <p className="text-xl sm:text-2xl font-black text-slate-950 tracking-wide mt-1">
              {isMe
                ? `${currentPlayer.name.toUpperCase()} WINS! 5 / 5 LINES`
                : `${winner?.name || 'Player'} WINS!`}
            </p>
            {!isMe && (
              <p className="text-sm font-bold text-slate-900 bg-white/30 px-3 py-1 rounded-full inline-block mt-2">
                Your Result: {currentPlayer.completedLineCount} / {room.settings.winningLinesRequired} Lines
              </p>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Numbers stats banner */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-800/50 border border-slate-800 p-3 rounded-2xl">
              <span className="text-xs text-slate-400 block font-semibold">Total Calls</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {room.calledNumbers.length}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-800 p-3 rounded-2xl">
              <span className="text-xs text-slate-400 block font-semibold">Winning Lines</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {room.winningLineCount} / {room.settings.winningLinesRequired}
              </span>
            </div>
            <div className="bg-slate-800/50 border border-slate-800 p-3 rounded-2xl">
              <span className="text-xs text-slate-400 block font-semibold">Players</span>
              <span className="text-xl font-black text-white font-mono">
                {room.players.length}
              </span>
            </div>
          </div>

          {/* Winning Lines Checklist */}
          {winningLines.length > 0 && (
            <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Completed Winning Lines
              </span>
              <div className="flex flex-wrap gap-2">
                {winningLines.map((line, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    {line.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Winner's Board Showcase */}
          {winner && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-white">
                  {winner.name}’s Winning Board
                </span>
                <span className="text-amber-400 font-semibold">Golden cells completed the win</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="grid grid-cols-5 gap-1.5 max-w-xs mx-auto">
                  {winnerBoard.map((num, idx) => {
                    const isWinning = winningIndices.has(idx);
                    const isMarked = winnerMarkedSet.has(num);
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm font-['Outfit'] transition-all ${
                          isWinning
                            ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black ring-1 ring-amber-300 scale-105'
                            : isMarked
                            ? 'bg-emerald-950/40 border border-emerald-700/40 text-emerald-300'
                            : 'bg-slate-900 border border-slate-800 text-slate-500'
                        }`}
                      >
                        {num}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Final Results Leaderboard */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" /> Final Results
            </span>

            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
              {sortedPlayers.map((player, idx) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                    idx === 0
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <span className="font-bold text-white">
                      {player.name}
                      {player.id === currentPlayer.id && ' (You)'}
                    </span>
                  </div>

                  <span className="font-mono font-black text-amber-300">
                    {player.completedLineCount} lines completed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons: Rematch & Exit */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onExit();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Exit to Home</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onRematch();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide uppercase shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-transform cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again (Rematch)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
