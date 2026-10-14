import React from 'react';
import { Volume2, VolumeX, HelpCircle, LogOut, CheckSquare, Copy, Check, Users } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  roomCode?: string;
  playerCount?: number;
  maxPlayers?: number;
  isConnected?: boolean;
  onOpenRules: () => void;
  onOpenTests: () => void;
  onLeaveRoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  playerCount,
  maxPlayers,
  isConnected = true,
  onOpenRules,
  onOpenTests,
  onLeaveRoom,
}) => {
  const [soundOn, setSoundOn] = React.useState(soundManager.enabled);
  const [copied, setCopied] = React.useState(false);

  const toggleSound = () => {
    const next = soundManager.toggle();
    setSoundOn(next);
    if (next) soundManager.playClick();
  };

  const copyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    soundManager.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Room Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black text-slate-950 text-xl tracking-tight">
              25
            </div>
            <div>
              <span className="font-black text-lg sm:text-xl tracking-wider uppercase text-white font-['Outfit']">
                Bingo <span className="text-amber-400">25</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Multiplayer
              </span>
            </div>
          </div>

          {roomCode && (
            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-800">
              <button
                onClick={copyRoomCode}
                title="Click to copy Room Code"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs sm:text-sm tracking-wider transition-all cursor-pointer"
              >
                <span>#{roomCode}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {playerCount !== undefined && (
                <div className="hidden md:flex items-center gap-1 text-xs text-slate-400 px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-800">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {playerCount}
                    {maxPlayers ? `/${maxPlayers}` : ''}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Connection Status Pill (Part 27) */}
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-750 text-[11px] font-semibold text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="hidden sm:inline">{isConnected ? 'Connected' : 'Reconnecting...'}</span>
          </div>

          {/* Rules / Tutorial */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenRules();
            }}
            title="How to Play"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Test suite runner */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenTests();
            }}
            title="Algorithm Test Suite"
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <CheckSquare className="w-5 h-5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Sound is ON' : 'Sound is OFF'}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          {/* Leave Room if inside room */}
          {onLeaveRoom && (
            <button
              onClick={() => {
                soundManager.playClick();
                onLeaveRoom();
              }}
              title="Leave Room"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
