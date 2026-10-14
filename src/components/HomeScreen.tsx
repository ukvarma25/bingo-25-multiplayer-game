import React, { useEffect, useState } from 'react';
import { Play, PlusCircle, LogIn, Bot, HelpCircle, Trophy, Clock, Sparkles, CheckSquare } from 'lucide-react';
import { GameHistoryItem } from '../types';
import { soundManager } from '../utils/audio';

interface HomeScreenProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
  onDemoClick: () => void;
  onOpenRules: () => void;
  onOpenTests: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onCreateClick,
  onJoinClick,
  onDemoClick,
  onOpenRules,
  onOpenTests,
}) => {
  const [history, setHistory] = useState<GameHistoryItem[]>([]);

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch(() => {});
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-widest shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-Time Multiplayer 1–25 Bingo</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black font-['Outfit'] tracking-tight text-white">
          BINGO <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">25</span>
        </h1>

        <p className="text-base sm:text-xl font-medium text-slate-300 tracking-wide font-['Outfit']">
          Create. Join. Mark. Win.
        </p>

        <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-400 leading-relaxed">
          The beloved 5×5 paper grid number battle, reimagined for live multiplayer.
          Each player gets numbers 1–25 randomized. Call numbers, complete 5 lines, and claim BINGO!
        </p>
      </div>

      {/* Primary Action Buttons */}
      <div className="max-w-md mx-auto space-y-3.5">
        {/* Create Game Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onCreateClick();
          }}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base sm:text-lg tracking-wide uppercase shadow-xl shadow-amber-500/25 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 cursor-pointer group"
        >
          <PlusCircle className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform" />
          <span>Create Game</span>
        </button>

        {/* Join Game Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onJoinClick();
          }}
          className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-emerald-500/50 text-white font-black text-base sm:text-lg tracking-wide uppercase shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 cursor-pointer group"
        >
          <LogIn className="w-6 h-6 text-emerald-400 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
          <span>Join Game</span>
        </button>

        {/* Demo Mode Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onDemoClick();
          }}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 hover:from-purple-900/60 hover:to-indigo-900/60 border border-purple-500/30 text-purple-200 font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Bot className="w-5 h-5 text-purple-400" />
          <span>Play Instant Demo (Solo vs Bots)</span>
        </button>
      </div>

      {/* Quick Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-left space-y-1.5 shadow">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            #
          </div>
          <h3 className="font-bold text-white text-sm font-['Outfit']">1–25 Random Board</h3>
          <p className="text-xs text-slate-400">
            Every player gets a uniquely shuffled 5×5 board containing every number exactly once.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-left space-y-1.5 shadow">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            ⚡
          </div>
          <h3 className="font-bold text-white text-sm font-['Outfit']">Instant Server Sync</h3>
          <p className="text-xs text-slate-400">
            Live turn rotation or auto-caller broadcasts to all players instantly with authoritative validation.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-left space-y-1.5 shadow">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
            🏆
          </div>
          <h3 className="font-bold text-white text-sm font-['Outfit']">12 Winning Lines</h3>
          <p className="text-xs text-slate-400">
            5 horizontal rows, 5 vertical columns, and 2 diagonals. Reach 5 completed lines to win!
          </p>
        </div>
      </div>

      {/* Recent Games History */}
      {history.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Recent Matches
            </span>
            <span>{history.length} games recorded</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {history.slice(0, 5).map((game) => (
              <div key={game.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-amber-300 font-bold">
                    #{game.roomCode}
                  </span>
                  <span className="font-bold text-white">Winner: {game.winnerName}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <span>{game.winningLineCount} lines</span>
                  <span>{game.totalCalls} calls</span>
                  <span className="hidden sm:inline">{game.durationSeconds}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Links */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-4">
        <button
          onClick={onOpenRules}
          className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Rules & Instructions</span>
        </button>
        <span>•</span>
        <button
          onClick={onOpenTests}
          className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Run Algorithm Diagnostics</span>
        </button>
      </div>
    </div>
  );
};
