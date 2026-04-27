/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Music2, 
  Trophy, 
  Gamepad2,
  RefreshCw,
  Info
} from 'lucide-react';

// --- Types ---

interface Point {
  x: number;
  y: number;
}

enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT
}

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  color: string;
}

// --- Constants ---

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = Direction.UP;
const GAME_SPEED = 120; // ms

const TRACKS: Track[] = [
  { id: '1', title: 'Cyber Pulse', artist: 'AI Voyager', duration: 184, color: 'from-cyan-500 to-blue-500' },
  { id: '2', title: 'Neon Drift', artist: 'Synth Ghost', duration: 212, color: 'from-magenta-500 to-purple-500' },
  { id: '3', title: 'Grid Runner', artist: 'Byte Beat', duration: 165, color: 'from-lime-500 to-emerald-500' },
];

// --- Components ---

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [progress, setProgress] = useState(0);

  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // --- Logic ---

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ x: 5, y: 5 });
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // Check collisions
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setIsGameOver(true);
        setIsPaused(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== Direction.DOWN) setDirection(Direction.UP); break;
        case 'ArrowDown': if (direction !== Direction.UP) setDirection(Direction.DOWN); break;
        case 'ArrowLeft': if (direction !== Direction.RIGHT) setDirection(Direction.LEFT); break;
        case 'ArrowRight': if (direction !== Direction.LEFT) setDirection(Direction.RIGHT); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastUpdateRef.current) lastUpdateRef.current = timestamp;
    const delta = timestamp - lastUpdateRef.current;

    if (delta > GAME_SPEED) {
      moveSnake();
      lastUpdateRef.current = timestamp;
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [moveSnake]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  // Music Logic
  useEffect(() => {
    let interval: number;
    if (isPlayingMusic) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            skipTrack(1);
            return 0;
          }
          return p + 0.5;
        });
      }, 1000) as unknown as number;
    }
    return () => clearInterval(interval);
  }, [isPlayingMusic, currentTrackIndex]);

  const skipTrack = (dir: number) => {
    setCurrentTrackIndex(prev => {
      const next = prev + dir;
      if (next < 0) return TRACKS.length - 1;
      if (next >= TRACKS.length) return 0;
      return next;
    });
    setProgress(0);
  };

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#050505] p-4 lg:p-8 gap-8 font-sans">
      
      {/* Left Sidebar: Stats & Info */}
      <div className="flex flex-col gap-6 w-full lg:w-64 order-2 lg:order-1">
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-neon-cyan">
            <Trophy className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-widest">Rankings</h2>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase mb-1">Current Score</p>
            <p className="text-4xl font-mono font-bold text-neon-cyan">{score.toString().padStart(4, '0')}</p>
          </div>
          <div className="h-px bg-white/10" />
          <div>
            <p className="text-xs text-white/40 uppercase mb-1">Sector Record</p>
            <p className="text-2xl font-mono font-bold text-white/60">{highScore.toString().padStart(4, '0')}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-neon-lime">
            <Info className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-widest">Controls</h2>
          </div>
          <ul className="text-xs space-y-3 text-white/50 font-mono">
            <li className="flex justify-between items-center bg-white/5 p-2 rounded">
              <span>MOVE</span>
              <span className="text-neon-lime">ARROWS</span>
            </li>
            <li className="flex justify-between items-center bg-white/5 p-2 rounded">
              <span>PAUSE</span>
              <span className="text-neon-lime">SPACE</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Center: Snake Game Window */}
      <div className="flex-1 flex flex-col items-center justify-center order-1 lg:order-2">
        <div className="relative group">
          {/* Game Frame */}
          <div className="neon-border-cyan rounded-lg overflow-hidden bg-black p-1">
            <div 
              className="grid gap-[1px] bg-white/5" 
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                width: 'min(80vw, 500px)',
                aspectRatio: '1/1'
              }}
            >
              {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isBody = snake.slice(1).some(s => s.x === x && s.y === y);
                const isFood = food.x === x && food.y === y;

                return (
                  <div key={i} className="relative w-full h-full">
                    {isHead && (
                      <motion.div 
                        layoutId="snake-head"
                        className="absolute inset-0 bg-neon-cyan rounded-sm z-20"
                        animate={{ scale: isPaused ? 1 : [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                    )}
                    {isBody && (
                      <div className="absolute inset-[15%] bg-neon-cyan/40 rounded-sm z-10" />
                    )}
                    {isFood && (
                      <motion.div 
                        className="absolute inset-[10%] bg-neon-magenta rounded-full z-10"
                        animate={{ 
                          scale: [1, 1.3, 1],
                          boxShadow: [
                            '0 0 0px #ff00ff',
                            '0 0 15px #ff00ff',
                            '0 0 0px #ff00ff'
                          ]
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overlays */}
          <AnimatePresence>
            {(isPaused || isGameOver) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-md bg-black/60 rounded-lg"
              >
                {isGameOver ? (
                  <div className="text-center animate-in zoom-in duration-300">
                    <h2 className="text-5xl font-black text-neon-magenta mb-2 italic tracking-tighter uppercase">Terminated</h2>
                    <p className="text-white/60 mb-8 font-mono">LINK LOST • SECTOR {score / 10}</p>
                    <button 
                      onClick={resetGame}
                      className="group flex items-center gap-3 bg-neon-magenta text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                      <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                      Reboot
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-neon-cyan mb-8 uppercase tracking-[0.2em]">Suspended</h2>
                    <button 
                      onClick={() => setIsPaused(false)}
                      className="group flex items-center gap-3 bg-neon-cyan text-black px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                      <Play className="w-6 h-6 fill-current" />
                      Resume
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Sidebar: Music Player */}
      <div className="w-full lg:w-80 flex flex-col gap-6 order-3">
        <div className="glass-panel rounded-3xl p-8 flex flex-col items-center gap-6 relative overflow-hidden">
          {/* Animated Background Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-neon-cyan/20 blur-[60px] rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-neon-magenta/20 blur-[60px] rounded-full" />

          {/* Album Art Placeholder */}
          <div className={`w-48 h-48 rounded-2xl bg-gradient-to-br ${currentTrack.color} shadow-2xl flex items-center justify-center p-8 group relative`}>
            <Music2 className="w-20 h-20 text-white/80 group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="text-center w-full">
            <h3 className="text-xl font-bold text-white truncate px-2">{currentTrack.title}</h3>
            <p className="text-neon-cyan text-sm tracking-widest uppercase font-semibold mt-1">{currentTrack.artist}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-2">
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-neon-cyan"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
              <span>{Math.floor((progress * currentTrack.duration) / 6000)}:{(Math.floor((progress * currentTrack.duration) / 100) % 60).toString().padStart(2, '0')}</span>
              <span>{Math.floor(currentTrack.duration / 60)}:{Math.floor(currentTrack.duration % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button onClick={() => skipTrack(-1)} className="text-white/40 hover:text-white transition-colors cursor-pointer">
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <button 
              onClick={() => setIsPlayingMusic(!isPlayingMusic)}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
            >
              {isPlayingMusic ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button onClick={() => skipTrack(1)} className="text-white/40 hover:text-white transition-colors cursor-pointer">
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
          </div>

          <div className="flex items-center gap-4 w-full px-4 text-white/40">
            <Volume2 className="w-4 h-4" />
            <div className="flex-1 h-[2px] bg-white/10 rounded-full relative">
              <div className="absolute top-0 left-0 w-2/3 h-full bg-white/30 rounded-full" />
            </div>
          </div>
        </div>

        {/* Playback Feed / Visualizer Simulated */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
          <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/40">Audio Stream • Live</h4>
          <div className="flex items-end gap-1 h-12">
            {[...Array(24)].map((_, i) => (
              <motion.div 
                key={i}
                className="flex-1 bg-neon-cyan/40 rounded-t-sm"
                animate={{ 
                  height: isPlayingMusic ? [10, 40, 20, 48, 15] : 4
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.5 + Math.random(), 
                  delay: i * 0.05 
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
