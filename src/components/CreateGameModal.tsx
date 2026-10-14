import React, { useState } from 'react';
import { X, Play, Settings2, Users, Trophy, Clock, Sparkles } from 'lucide-react';
import { GameSettings } from '../types';
import { soundManager } from '../utils/audio';

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (hostName: string, settings: GameSettings) => void;
  isLoading: boolean;
}

export const CreateGameModal: React.FC<CreateGameModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  isLoading,
}) => {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('bingo25_username') || '');
  const [maxPlayers, setMaxPlayers] = useState<number>(6);
  const [winningLinesRequired, setWinningLinesRequired] = useState<number>(5);
  const [allowSpectators, setAllowSpectators] = useState<boolean>(true);
  const [autoCall, setAutoCall] = useState<boolean>(false);
  const [autoCallInterval, setAutoCallInterval] = useState<number>(4);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    if (!cleanName) {
      setError('Please enter a valid player name.');
      return;
    }
    setError('');
    localStorage.setItem('bingo25_username', cleanName);
    soundManager.playClick();
    onCreateRoom(cleanName, {
      maxPlayers,
      winningLinesRequired,
      allowSpectators,
      autoCall,
      autoCallInterval,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold font-['Outfit'] text-white">Create New Game</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Player Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Your Player Name
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Uday, Rahul, MasterBingo"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
          </div>

          {/* Number of Players */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Max Players
              </span>
              <span className="text-amber-400 font-bold">{maxPlayers} players</span>
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => {
                    setMaxPlayers(num);
                    soundManager.playClick();
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    maxPlayers === num
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Winning Lines Required */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Winning Lines Required
              </span>
              <span className="text-amber-400 font-bold">{winningLinesRequired} Lines (Default: 5)</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => {
                    setWinningLinesRequired(num);
                    soundManager.playClick();
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                    winningLinesRequired === num
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-sm">{num}</span>
                  <span className="text-[10px] opacity-80">{num === 5 ? 'BINGO' : 'Lines'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Calling Options */}
          <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-amber-400" /> Calling Mode
            </h3>

            {/* Auto Call Switch */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white">Automatic Number Calling</span>
                <p className="text-xs text-slate-400">Server periodically draws numbers randomly</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAutoCall(!autoCall);
                  soundManager.playClick();
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  autoCall ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    autoCall ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto Call Interval if active */}
            {autoCall && (
              <div className="pt-2 border-t border-slate-750">
                <label className="block text-xs text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> Draw Interval
                  </span>
                  <span className="text-amber-300 font-bold">{autoCallInterval}s</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 7].map((sec) => (
                    <button
                      type="button"
                      key={sec}
                      onClick={() => setAutoCallInterval(sec)}
                      className={`py-1.5 rounded-lg text-xs font-semibold ${
                        autoCallInterval === sec
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {sec} sec
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide uppercase shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Creating Room...</span>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Create Room</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
