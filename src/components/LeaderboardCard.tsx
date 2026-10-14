import React from 'react';
import { Trophy, Users, Bot, Crown, Sparkles } from 'lucide-react';
import { Player } from '../types';

interface LeaderboardCardProps {
  players: Player[];
  currentPlayerId: string;
  winningLinesRequired: number;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  players,
  currentPlayerId,
  winningLinesRequired,
}) => {
  // Sort players by: 1. completedLineCount descending, 2. earliest lastLineCompletedAt
  const sortedPlayers = React.useMemo(() => {
    return [...players].sort((a, b) => {
      if (b.completedLineCount !== a.completedLineCount) {
        return b.completedLineCount - a.completedLineCount;
      }
      return (a.lastLineCompletedAt || Infinity) - (b.lastLineCompletedAt || Infinity);
    });
  }, [players]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> Live Standings
        </span>
        <span className="text-[11px] text-slate-500">Goal: {winningLinesRequired} lines</span>
      </div>

      <div className="space-y-2">
        {sortedPlayers.map((player, idx) => {
          const isMe = player.id === currentPlayerId;
          const progressPercent = Math.min(100, Math.round((player.completedLineCount / winningLinesRequired) * 100));

          return (
            <div
              key={player.id}
              className={`p-2.5 rounded-xl border transition-all ${
                isMe
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                  : 'bg-slate-950/60 border-slate-850 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-4 text-center font-bold text-slate-500">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <span className="font-bold text-white flex items-center gap-1">
                    {player.name}
                    {isMe && <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded">You</span>}
                    {player.isBot && <Bot className="w-3 h-3 text-purple-400 inline" />}
                  </span>
                </div>

                <span className="font-mono font-black text-amber-300 text-xs">
                  {player.completedLineCount} / {winningLinesRequired} Lines
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    player.completedLineCount >= winningLinesRequired
                      ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
