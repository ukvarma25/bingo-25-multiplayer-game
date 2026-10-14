import React, { useEffect, useState, useRef } from 'react';
import { getSocket } from './services/socket';
import { RoomState, Player, GameSettings } from './types';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { CreateGameModal } from './components/CreateGameModal';
import { JoinGameModal } from './components/JoinGameModal';
import { WaitingRoom } from './components/WaitingRoom';
import { GameBoard } from './components/GameBoard';
import { NumberCallArea } from './components/NumberCallArea';
import { NumberSelectorModal } from './components/NumberSelectorModal';
import { BingoProgressBadge } from './components/BingoProgressBadge';
import { LeaderboardCard } from './components/LeaderboardCard';
import { WinnerCelebrationModal } from './components/WinnerCelebrationModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { TestRunnerModal } from './components/TestRunnerModal';
import { soundManager } from './utils/audio';
import { generateBoard } from './utils/gameLogic';

export default function App() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  const prevLineCountRef = useRef<number>(0);
  const socket = getSocket();

  // Show temporary toast message
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Socket event listeners
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      // Attempt restore session on reconnect
      const savedSession = sessionStorage.getItem('bingo25_session');
      if (savedSession) {
        try {
          const { roomCode, playerId, playerName } = JSON.parse(savedSession);
          if (roomCode && playerId) {
            socket.emit(
              'room:join',
              { roomCode, playerName, playerId },
              (res: { success: boolean; room?: RoomState; player?: Player; message?: string }) => {
                if (res.success && res.room && res.player) {
                  setRoom(res.room);
                  setCurrentPlayer(res.player);
                } else {
                  sessionStorage.removeItem('bingo25_session');
                }
              }
            );
          }
        } catch {
          sessionStorage.removeItem('bingo25_session');
        }
      }
    });

    socket.on('room:update', (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
      if (currentPlayer) {
        const me = updatedRoom.players.find((p) => p.id === currentPlayer.id);
        if (me) setCurrentPlayer(me);
      }
    });

    socket.on('game:start', (startedRoom: RoomState) => {
      soundManager.playPop();
      setRoom(startedRoom);
      if (currentPlayer) {
        const me = startedRoom.players.find((p) => p.id === currentPlayer.id);
        if (me) {
          setCurrentPlayer(me);
          prevLineCountRef.current = me.completedLineCount;
        }
      }
      setIsStarting(false);
      showToast('Game Started! Check your 5x5 board.');
    });

    socket.on('game:number-called', ({ number, calledBy, room: updatedRoom }: { number: number; calledBy: string; room: RoomState }) => {
      soundManager.playPop();
      setRoom(updatedRoom);

      if (currentPlayer) {
        const me = updatedRoom.players.find((p) => p.id === currentPlayer.id);
        if (me) {
          if (me.completedLineCount > prevLineCountRef.current) {
            soundManager.playLineCompleted();
            showToast(`🎉 You completed ${me.completedLineCount} line(s)!`);
          }
          prevLineCountRef.current = me.completedLineCount;
          setCurrentPlayer(me);
        }
      }
    });

    socket.on('game:win', ({ winnerName, room: endedRoom }: { winnerName: string; room: RoomState }) => {
      setRoom(endedRoom);
      if (currentPlayer) {
        const me = endedRoom.players.find((p) => p.id === currentPlayer.id);
        if (me) setCurrentPlayer(me);
      }
    });

    socket.on('game:rematch', (resetRoom: RoomState) => {
      soundManager.playPop();
      setRoom(resetRoom);
      if (currentPlayer) {
        const me = resetRoom.players.find((p) => p.id === currentPlayer.id);
        if (me) {
          setCurrentPlayer(me);
          prevLineCountRef.current = 0;
        }
      }
      showToast('Rematch started with new boards!');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('player:disconnect', ({ playerName }: { playerName: string }) => {
      showToast(`${playerName} disconnected`);
    });

    socket.on('host:transfer', ({ newHostName }: { newHostName: string }) => {
      showToast(`${newHostName} is now the host.`);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:update');
      socket.off('game:start');
      socket.off('game:number-called');
      socket.off('game:win');
      socket.off('game:rematch');
      socket.off('player:disconnect');
      socket.off('host:transfer');
    };
  }, [currentPlayer]);

  // Sync session in sessionStorage
  useEffect(() => {
    if (room && currentPlayer) {
      sessionStorage.setItem(
        'bingo25_session',
        JSON.stringify({
          roomCode: room.roomCode,
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
        })
      );
    } else {
      sessionStorage.removeItem('bingo25_session');
    }
  }, [room?.roomCode, currentPlayer?.id]);

  // Create Room handler
  const handleCreateRoom = (hostName: string, settings: GameSettings) => {
    setIsLoading(true);
    socket.emit(
      'room:create',
      { hostName, settings },
      (res: { success: boolean; room?: RoomState; player?: Player; message?: string }) => {
        setIsLoading(false);
        if (res.success && res.room && res.player) {
          setRoom(res.room);
          setCurrentPlayer(res.player);
          prevLineCountRef.current = 0;
          setIsCreateOpen(false);
        } else {
          showToast(res.message || 'Failed to create room.');
        }
      }
    );
  };

  // Join Room handler
  const handleJoinRoom = (roomCode: string, playerName: string) => {
    setIsLoading(true);
    setJoinError('');
    socket.emit(
      'room:join',
      { roomCode, playerName },
      (res: { success: boolean; room?: RoomState; player?: Player; message?: string }) => {
        setIsLoading(false);
        if (res.success && res.room && res.player) {
          setRoom(res.room);
          setCurrentPlayer(res.player);
          prevLineCountRef.current = 0;
          setIsJoinOpen(false);
        } else {
          setJoinError(res.message || 'Failed to join room.');
        }
      }
    );
  };

  // Demo Mode: 1-Click Solo Game with Bots
  const handleStartDemoGame = () => {
    setIsLoading(true);
    const hostName = localStorage.getItem('bingo25_username') || 'Player 1';
    socket.emit(
      'room:create',
      {
        hostName,
        settings: {
          maxPlayers: 3,
          winningLinesRequired: 5,
          allowSpectators: true,
          autoCall: false,
          autoCallInterval: 4,
        },
      },
      (res: { success: boolean; room?: RoomState; player?: Player }) => {
        if (res.success && res.room && res.player) {
          const roomCode = res.room.roomCode;
          const hostId = res.player.id;
          setRoom(res.room);
          setCurrentPlayer(res.player);
          prevLineCountRef.current = 0;

          // For quick demo match: lock a randomized board for host and add bots
          const demoBoard = generateBoard();
          socket.emit('board:lock', { roomCode, playerId: hostId, board: demoBoard }, () => {
            socket.emit('room:add-bot', { roomCode, playerId: hostId }, () => {
              socket.emit('room:add-bot', { roomCode, playerId: hostId }, () => {
                socket.emit('game:start', { roomCode, playerId: hostId }, () => {
                  setIsLoading(false);
                  showToast('Demo match started! Play against Bot Alpha & Bot Blitz.');
                });
              });
            });
          });
        } else {
          setIsLoading(false);
        }
      }
    );
  };

  // Board management handlers
  const handleSaveBoard = (board: number[]) => {
    if (!room || !currentPlayer) return;
    socket.emit('board:save', { roomCode: room.roomCode, playerId: currentPlayer.id, board });
  };

  const handleLockBoard = (board: number[]) => {
    if (!room || !currentPlayer) return;
    try {
      sessionStorage.setItem('bingo25_previous_board', JSON.stringify(board));
    } catch {
      // Ignore
    }
    socket.emit(
      'board:lock',
      { roomCode: room.roomCode, playerId: currentPlayer.id, board },
      (res: { success: boolean; message?: string; player?: Player }) => {
        if (!res.success && res.message) {
          showToast(res.message);
        } else {
          showToast('Board locked! Ready for match.');
        }
      }
    );
  };

  const handleUnlockBoard = () => {
    if (!room || !currentPlayer) return;
    socket.emit(
      'board:unlock',
      { roomCode: room.roomCode, playerId: currentPlayer.id },
      (res: { success: boolean; message?: string }) => {
        if (!res.success && res.message) {
          showToast(res.message);
        } else {
          showToast('Board unlocked. You can modify your numbers.');
        }
      }
    );
  };

  // Start Game (Host only)
  const handleStartGame = () => {
    if (!room || !currentPlayer) return;
    setIsStarting(true);
    socket.emit(
      'game:start',
      { roomCode: room.roomCode, playerId: currentPlayer.id },
      (res: { success: boolean; message?: string }) => {
        setIsStarting(false);
        if (!res.success && res.message) {
          showToast(res.message);
        }
      }
    );
  };

  // Add Bot to Room (Host only)
  const handleAddBot = () => {
    if (!room || !currentPlayer) return;
    socket.emit('room:add-bot', { roomCode: room.roomCode, playerId: currentPlayer.id });
  };

  // Call Number
  const handleCallNumber = (num: number) => {
    if (!room || !currentPlayer) return;
    socket.emit(
      'game:call-number',
      { roomCode: room.roomCode, playerId: currentPlayer.id, number: num },
      (res: { success: boolean; message?: string }) => {
        if (!res.success && res.message) {
          showToast(res.message);
        }
      }
    );
  };

  // Toggle Auto Calling
  const handleToggleAutoCall = () => {
    if (!room || !currentPlayer) return;
    socket.emit('game:toggle-auto-call', { roomCode: room.roomCode, playerId: currentPlayer.id });
  };

  // Call Next Random Number
  const handleCallNextRandom = () => {
    if (!room) return;
    const calledSet = new Set(room.calledNumbers);
    const uncalled: number[] = [];
    for (let i = 1; i <= 25; i++) {
      if (!calledSet.has(i)) uncalled.push(i);
    }
    if (uncalled.length > 0) {
      const picked = uncalled[Math.floor(Math.random() * uncalled.length)];
      handleCallNumber(picked);
    }
  };

  // Rematch
  const handleRematch = () => {
    if (!room || !currentPlayer) return;
    socket.emit('game:rematch', { roomCode: room.roomCode, playerId: currentPlayer.id });
  };

  // Leave Room
  const handleLeaveRoom = () => {
    if (room && currentPlayer) {
      socket.emit('room:leave', { roomCode: room.roomCode, playerId: currentPlayer.id });
    }
    setRoom(null);
    setCurrentPlayer(null);
    sessionStorage.removeItem('bingo25_session');
  };

  // Current turn player
  const currentTurnPlayer = room?.players.find((p) => p.id === room.currentTurnPlayerId);
  const isMyTurn = currentTurnPlayer?.id === currentPlayer?.id;
  const isHost = room?.hostId === currentPlayer?.id;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] relative selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 backdrop-blur-md animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        roomCode={room?.roomCode}
        playerCount={room?.players.length}
        maxPlayers={room?.settings.maxPlayers}
        isConnected={isConnected}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
        onLeaveRoom={room ? handleLeaveRoom : undefined}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {!room ? (
          /* Home Screen */
          <HomeScreen
            onCreateClick={() => setIsCreateOpen(true)}
            onJoinClick={() => {
              setJoinError('');
              setIsJoinOpen(true);
            }}
            onDemoClick={handleStartDemoGame}
            onOpenRules={() => setIsRulesOpen(true)}
            onOpenTests={() => setIsTestsOpen(true)}
          />
        ) : room.status === 'waiting' && currentPlayer ? (
          /* Waiting Room / Lobby */
          <WaitingRoom
            room={room}
            currentPlayer={currentPlayer}
            onStartGame={handleStartGame}
            onAddBot={handleAddBot}
            onLeaveRoom={handleLeaveRoom}
            onSaveBoard={handleSaveBoard}
            onLockBoard={handleLockBoard}
            onUnlockBoard={handleUnlockBoard}
            isStarting={isStarting}
          />
        ) : currentPlayer ? (
          /* Main Active Gameplay Screen */
          <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
            {/* Top row: B-I-N-G-O Progress Badge */}
            <BingoProgressBadge
              completedLines={currentPlayer.completedLineCount}
              requiredLines={room.settings.winningLinesRequired}
            />

            {/* Grid layout: Left/Center Board, Right/Below Call Area & Standings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 5x5 Board (7 cols on large screens) */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <GameBoard
                  board={currentPlayer.board}
                  markedNumbers={currentPlayer.markedNumbers}
                  currentNumber={room.currentNumber}
                  winningLines={currentPlayer.completedLines}
                  onCellClick={handleCallNumber}
                  isMyTurn={isMyTurn}
                />
              </div>

              {/* Right Column: Number Call & Standings (5 cols on large screens) */}
              <div className="lg:col-span-5 space-y-6">
                <NumberCallArea
                  currentNumber={room.currentNumber}
                  calledNumbers={room.calledNumbers}
                  currentTurnPlayer={currentTurnPlayer}
                  currentPlayer={currentPlayer}
                  isHost={isHost}
                  settings={room.settings}
                  isAutoCallingPaused={room.isAutoCallingPaused}
                  onOpenSelector={() => setIsSelectorOpen(true)}
                  onToggleAutoCall={handleToggleAutoCall}
                  onCallNextRandom={handleCallNextRandom}
                />

                <LeaderboardCard
                  players={room.players}
                  currentPlayerId={currentPlayer.id}
                  winningLinesRequired={room.settings.winningLinesRequired}
                />
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Number Selector Modal (when manual calling and your turn) */}
      {room && (
        <NumberSelectorModal
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          calledNumbers={room.calledNumbers}
          onSelectNumber={handleCallNumber}
        />
      )}

      {/* Winner Celebration Modal */}
      {room && room.status === 'ended' && currentPlayer && (
        <WinnerCelebrationModal
          room={room}
          currentPlayer={currentPlayer}
          onRematch={handleRematch}
          onExit={handleLeaveRoom}
          isHost={isHost}
        />
      )}

      {/* Create Game Modal */}
      <CreateGameModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateRoom={handleCreateRoom}
        isLoading={isLoading}
      />

      {/* Join Game Modal */}
      <JoinGameModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoinRoom={handleJoinRoom}
        isLoading={isLoading}
        externalError={joinError}
      />

      {/* How to Play Modal */}
      <HowToPlayModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Test Suite Modal */}
      <TestRunnerModal isOpen={isTestsOpen} onClose={() => setIsTestsOpen(false)} />
    </div>
  );
}
