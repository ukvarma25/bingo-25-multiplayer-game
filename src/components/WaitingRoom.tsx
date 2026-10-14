import React, { useState } from 'react';
import {
  Play,
  Copy,
  Check,
  Share2,
  Bot,
  Crown,
  Users,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { RoomState, Player } from '../types';
import { soundManager } from '../utils/audio';
import { BoardBuilder } from './BoardBuilder';

interface WaitingRoomProps {
  room: RoomState;
  currentPlayer: Player;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeaveRoom: () => void;
  onSaveBoard: (board: number[]) => void;
  onLockBoard: (board: number[]) => void;
  onUnlockBoard: () => void;
  isStarting: boolean;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  room,
  currentPlayer,
  onStartGame,
  onAddBot,
  onLeaveRoom,
  onSaveBoard,
  onLockBoard,
  onUnlockBoard,
  isStarting,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'lobby'>('builder');

  const isHost = room.hostId === currentPlayer.id;
  const hasMinPlayers = room.players.length >= 2;
  const unreadyPlayers = room.players.filter((p) => !p.boardLocked);
  const allBoardsLocked = hasMinPlayers && unreadyPlayers.length === 0;

  const copyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    soundManager.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoom = async () => {
    soundManager.playClick();
    const shareData = {
      title: 'Join my Bingo 25 Game!',
      text: `Join my real-time Bingo 25 match! Room Code: ${room.roomCode}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        copyCode();
      }
    } else {
      copyCode();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Lobby Bar: Room Code & Quick Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
              Match Lobby
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">Room Code:</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 tracking-wider bg-slate-950 px-3 py-1 rounded-xl border border-amber-500/30 select-all">
                {room.roomCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={shareRoom}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow shadow-amber-500/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Build Board vs Players List) */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto justify-center">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('builder');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'builder'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Build Board</span>
            {currentPlayer.boardLocked ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" title="Locked" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5 animate-ping" title="Building" />
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('lobby');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'lobby'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Players ({room.players.length})</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                allBoardsLocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {room.players.filter((p) => p.boardLocked).length}/{room.players.length} Ready
            </span>
          </button>
        </div>

        {/* Host Start Game Button */}
        {isHost && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                if (allBoardsLocked && !isStarting) {
                  soundManager.playClick();
                  onStartGame();
                }
              }}
              disabled={!allBoardsLocked || isStarting}
              className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                allBoardsLocked
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 cursor-pointer hover:scale-105 active:scale-95 animate-pulse'
                  : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isStarting ? 'Starting...' : 'Start Game'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Warning banner if host cannot start */}
      {isHost && (!hasMinPlayers || unreadyPlayers.length > 0) && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              {!hasMinPlayers
                ? 'At least 2 players are required to start the match.'
                : 'Waiting for all players to finish their boards.'}
            </span>
          </div>

          {!hasMinPlayers && room.players.length < room.settings.maxPlayers && (
            <button
              onClick={() => {
                soundManager.playClick();
                onAddBot();
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>+ Add Bot</span>
            </button>
          )}
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'builder' ? (
        /* Board Builder Section */
        <div className="space-y-4">
          <BoardBuilder
            board={currentPlayer.board}
            isLocked={currentPlayer.boardLocked}
            onSaveBoard={onSaveBoard}
            onLockBoard={onLockBoard}
            onUnlockBoard={onUnlockBoard}
          />
        </div>
      ) : (
        /* Lobby Players List & Match Settings */
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-white">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Players Status
              </span>
              <span>
                {room.players.length}/{room.settings.maxPlayers} Joined
              </span>
            </div>

            {/* Players Status List */}
            <div className="space-y-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-850">
              {room.players.map((player) => {
                const isMe = player.id === currentPlayer.id;
                const isLocked = player.boardLocked;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isMe
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow ${
                            player.isBot
                              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-white border border-slate-700'
                          }`}
                        >
                          {player.isBot ? <Bot className="w-5 h-5" /> : player.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                            player.connected ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          title={player.connected ? 'Connected' : 'Disconnected'}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{player.name}</span>
                          {isMe && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-semibold">
                              You
                            </span>
                          )}
                          {player.isHost && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-400/20 rounded font-semibold flex items-center gap-1">
                              <Crown className="w-3 h-3" /> Host
                            </span>
                          )}
                          {player.isBot && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-semibold">
                              Bot
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Board Status Badge */}
                    <div>
                      {isLocked ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Board Ready</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-400 text-xs font-bold animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Building Board</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Match Settings Info */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl">
                <span className="text-slate-400 block text-[11px]">Win Condition</span>
                <span className="font-bold text-white text-sm">
                  {room.settings.winningLinesRequired} Completed Lines (B-I-N-G-O)
                </span>
              </div>
              <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl">
                <span className="text-slate-400 block text-[11px]">Calling Mode</span>
                <span className="font-bold text-white text-sm">
                  {room.settings.autoCall ? `Auto (${room.settings.autoCallInterval}s)` : 'Turn-by-Turn'}
                </span>
              </div>
            </div>

            {isHost && room.players.length < room.settings.maxPlayers && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onAddBot();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span>Add AI Bot Player (Instant Testing)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave Room Action */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => {
            soundManager.playClick();
            onLeaveRoom();
          }}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Leave Room</span>
        </button>
      </div>
    </div>
  );
};
