import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Play, RefreshCw, Terminal } from 'lucide-react';
import { runBingoAlgorithmTests, TestCaseResult } from '../utils/tests';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [running, setRunning] = useState(false);

  const executeTests = () => {
    setRunning(true);
    setTimeout(() => {
      const res = runBingoAlgorithmTests();
      setResults(res);
      setRunning(false);
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = totalCount > 0 && passCount === totalCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Outfit'] text-white">Bingo 25 Algorithm Test Suite</h2>
              <p className="text-xs text-slate-400">Verifying board generation, line checking, and win logic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold px-2.5 py-1 rounded-full ${
                allPassed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {passCount} / {totalCount} Passed
            </span>
            <span className="text-slate-400">{allPassed ? 'All criteria met!' : 'Checking test cases...'}</span>
          </div>
          <button
            onClick={executeTests}
            disabled={running}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            <span>Re-run Tests</span>
          </button>
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto space-y-2.5 max-h-[60vh]">
          {results.map((test) => (
            <div
              key={test.id}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                test.passed
                  ? 'bg-slate-800/30 border-slate-800 text-slate-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {test.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-white">
                    {test.id}. {test.name}
                  </div>
                  <div className="text-slate-400 mt-0.5">{test.details}</div>
                </div>
              </div>
              <span
                className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                  test.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {test.passed ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
