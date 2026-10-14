import React, { useState } from 'react';
import { Play, Pause, FastForward, PhoneCall, Volume2, UserCheck, Clock } from 'lucide-react';
import { Player, GameSettings } from '../types';
import { soundManager } from '../utils/audio';

interface NumberCallAreaProps {
  currentNumber: number | null;
  calledNumbers: number[];
  currentTurnPlayer?: Player;
  currentPlayer: Player;
  isHost: boolean;
  settings: GameSettings;
  isAutoCallingPaused: boolean;
  onOpenSelector: () => void;
  onToggleAutoCall: () => void;
  onCallNextRandom: () => void;
}

export const NumberCallArea: React.FC<NumberCallAreaProps> = ({
  currentNumber,
  calledNumbers,
  currentTurnPlayer,
  currentPlayer,
  isHost,
  settings,
  isAutoCallingPaused,
  onOpenSelector,
  onToggleAutoCall,
  onCallNextRandom,
}) => {
  const isMyTurn = currentTurnPlayer?.id === currentPlayer.id;
  const reversedHistory = [...calledNumbers].reverse();

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Current Turn Status Banner */}
      {!settings.autoCall && (
        <div
          className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
            isMyTurn
              ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-rose-500/20 border-amber-500/40 text-amber-200 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                isMyTurn ? 'bg-amber-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 block font-bold">
                Current Turn
              </span>
              <span className="text-sm font-black text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-400" />
                {isMyTurn ? 'It’s your turn!' : `${currentTurnPlayer?.name || 'Someone'} is choosing...`}
              </span>
            </div>
          </div>

          {isMyTurn ? (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenSelector();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 animate-bounce transition-transform cursor-pointer"
            >
              Call Number
            </button>
          ) : (
            <span className="text-xs text-slate-500 italic">Waiting...</span>
          )}
        </div>
      )}

      {/* Main Number Call Display Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Ambient glow behind number */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400/90 mb-1">
          Current Number
        </span>

        {/* Large Number Token */}
        <div className="my-2 relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-850 border-2 border-amber-500/50 shadow-2xl flex items-center justify-center font-['Outfit'] text-5xl sm:text-6xl font-black text-amber-300 tracking-tight shadow-amber-500/20 transform hover:scale-105 transition-all">
            {currentNumber !== null ? currentNumber : '—'}
          </div>
        </div>

        <p className="text-xs text-slate-400 font-medium">
          {currentNumber !== null ? (
            <span className="text-slate-300">
              <strong className="text-amber-400">Number {currentNumber}</strong> was called
            </span>
          ) : (
            'Waiting for first number call...'
          )}
        </p>

        {/* Auto Calling Controls if enabled */}
        {settings.autoCall && (
          <div className="mt-4 pt-3 border-t border-slate-800 w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Auto Mode ({settings.autoCallInterval}s interval)
                {isAutoCallingPaused && <strong className="text-rose-400 ml-1">(Paused)</strong>}
              </span>
            </div>

            {isHost && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onToggleAutoCall();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isAutoCallingPaused ? (
                    <>
                      <Play className="w-3 h-3 text-emerald-400 fill-current" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 text-amber-400 fill-current" />
                      <span>Pause</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    onCallNextRandom();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FastForward className="w-3 h-3" />
                  <span>Call Next</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Previous Numbers Reel */}
        <div className="w-full mt-4 pt-4 border-t border-slate-850 text-left">
          <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-bold mb-2">
            <span>Call History ({calledNumbers.length}/25)</span>
            <span className="text-slate-500 font-mono">Latest first</span>
          </div>

          {calledNumbers.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-1">
              No numbers called yet.
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
              {reversedHistory.map((num, idx) => (
                <div
                  key={`${num}-${idx}`}
                  className={`shrink-0 w-8 h-8 rounded-xl font-['Outfit'] font-bold text-xs flex items-center justify-center transition-all ${
                    idx === 0
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 ring-1 ring-amber-300 scale-105'
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
