import React from 'react';
import { X, Hash, Check } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface NumberSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  calledNumbers: number[];
  onSelectNumber: (num: number) => void;
}

export const NumberSelectorModal: React.FC<NumberSelectorModalProps> = ({
  isOpen,
  onClose,
  calledNumbers,
  onSelectNumber,
}) => {
  if (!isOpen) return null;

  const calledSet = new Set(calledNumbers);
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Outfit'] text-white">Call a Number</h2>
              <p className="text-xs text-slate-400">Pick any uncalled number (1–25)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5x5 Picker Grid */}
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-5 gap-2">
            {numbers.map((num) => {
              const isCalled = calledSet.has(num);
              return (
                <button
                  key={num}
                  disabled={isCalled}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectNumber(num);
                    onClose();
                  }}
                  className={`relative aspect-square rounded-xl font-['Outfit'] font-bold text-lg flex items-center justify-center transition-all ${
                    isCalled
                      ? 'bg-slate-950/80 border border-slate-850 text-slate-600 cursor-not-allowed opacity-60'
                      : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 hover:border-amber-400 text-white shadow hover:scale-105 active:scale-95 cursor-pointer font-black'
                  }`}
                >
                  <span>{num}</span>
                  {isCalled && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-2.5 h-2.5 text-slate-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Remaining: {25 - calledNumbers.length} numbers</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors text-xs font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
