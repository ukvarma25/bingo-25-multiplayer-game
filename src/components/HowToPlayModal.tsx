import React from 'react';
import { X, Trophy, CheckCircle2, Sparkles, Hash, Users, Layers } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
              ?
            </div>
            <h2 className="text-xl font-bold font-['Outfit'] text-white">How to Play Bingo 25</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-300">
          {/* Note Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 text-amber-200">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Not Traditional 75-ball Bingo!</p>
              <p className="text-xs text-amber-200/80 mt-1">
                This is a fast-paced multiplayer number battle played on a 5×5 grid with numbers 1 to 25. Every number appears exactly once.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" /> 7 Easy Steps to Win
            </h3>
            <div className="space-y-2.5">
              {[
                { step: '1', title: 'Create or Join a Room', desc: 'Pick your username and share the 5-character Room Code with friends, or start an instant Demo Game.' },
                { step: '2', title: 'Build and Lock Your Board', desc: 'Place numbers 1–25 manually in your 5×5 grid in any order you choose. Lock your board when all 25 numbers are placed!' },
                { step: '3', title: 'Take Turns Calling Numbers', desc: 'Players rotate turns choosing one uncalled number (or use Automatic Calling mode).' },
                { step: '4', title: 'Automatic Marking', desc: 'Whenever any player calls a number, it is automatically marked on everyone’s board simultaneously.' },
                { step: '5', title: 'Complete Valid Lines', desc: 'Mark full rows, columns, or diagonal lines. Each completed 5-number line scores +1 completed line.' },
                { step: '6', title: 'Reach the Winning Lines Goal', desc: 'Race to complete the required number of lines (default is 5 lines: B - I - N - G - O!).' },
                { step: '7', title: 'BINGO!', desc: 'The first player to reach the winning line count stops the game and wins the celebration crown!' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <span className="font-semibold text-white text-sm">{item.title}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 12 Winning Lines Breakdown */}
          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Total 12 Possible Winning Lines
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">5 Horizontal Rows</span>
                <p className="text-slate-400">Row 1 (0-4), Row 2 (5-9), Row 3 (10-14), Row 4 (15-19), Row 5 (20-24)</p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">5 Vertical Columns</span>
                <p className="text-slate-400">Col 1 (0,5,10,15,20) through Col 5 (4,9,14,19,24)</p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">2 Diagonals</span>
                <p className="text-slate-400">Main (Top-L to Bottom-R: 0,6,12,18,24) & Opposite (Top-R to Bottom-L: 4,8,12,16,20)</p>
              </div>
            </div>
          </div>

          {/* Core Rules List */}
          <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Authoritative Rules</h4>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>Numbers 1–25 appear exactly once per board with no duplicates.</li>
              <li>A called number can never be called a second time.</li>
              <li>Every player has their own randomized board arrangement.</li>
              <li>Winner detection is evaluated on the server immediately after every called number.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
