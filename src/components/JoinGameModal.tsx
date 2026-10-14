import React, { useState } from 'react';
import { X, LogIn, KeyRound, User } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  isLoading: boolean;
  externalError?: string;
}

export const JoinGameModal: React.FC<JoinGameModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
  isLoading,
  externalError,
}) => {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('bingo25_username') || '');
  const [roomCode, setRoomCode] = useState('');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    const cleanCode = roomCode.trim().toUpperCase();

    if (!cleanName) {
      setLocalError('Please enter a valid player name.');
      return;
    }
    if (!cleanCode || cleanCode.length < 4) {
      setLocalError('Enter a valid room code (e.g. B7K4P).');
      return;
    }

    setLocalError('');
    localStorage.setItem('bingo25_username', cleanName);
    soundManager.playClick();
    onJoinRoom(cleanCode, cleanName);
  };

  const displayedError = externalError || localError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold font-['Outfit'] text-white">Join Existing Game</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {displayedError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {displayedError}
            </div>
          )}

          {/* Player Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-400" /> Player Name
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your username"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
          </div>

          {/* Room Code */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Room Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. B7K4P"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold tracking-widest text-center text-lg placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all uppercase"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide uppercase shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Connecting...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Join Game</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
