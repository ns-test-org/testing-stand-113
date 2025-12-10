'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from './providers';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// 70s retro colors - groovy!
const GHOST_COLORS = ['#D2691E', '#DAA520', '#8B4513', '#CD853F']; // Chocolate, Goldenrod, SaddleBrown, Peru

export default function PacManGame() {
  const { theme, toggleTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const pacmanRef = useRef<Position>({ x: 10, y: 10 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const dotsRef = useRef<boolean[][]>([]);
  const ghostsRef = useRef<Position[]>([]);
  const mouthOpenRef = useRef(true);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Initialize dots grid
    const dots: boolean[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      dots[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        dots[y][x] = true;
      }
    }
    dotsRef.current = dots;

    // Initialize ghosts
    ghostsRef.current = [
      { x: 5, y: 5 },
      { x: 14, y: 5 },
      { x: 5, y: 14 },
      { x: 14, y: 14 },
    ];

    // Reset game state
    pacmanRef.current = { x: 10, y: 10 };
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
          nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
          nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
          nextDirectionRef.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      updateGame();
      drawGame();
    }, INITIAL_SPEED);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, score]);

  const updateGame = () => {
    // Update direction
    directionRef.current = nextDirectionRef.current;

    // Move Pac-Man
    const newPos = { ...pacmanRef.current };
    switch (directionRef.current) {
      case 'UP':
        newPos.y = (newPos.y - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'DOWN':
        newPos.y = (newPos.y + 1) % GRID_SIZE;
        break;
      case 'LEFT':
        newPos.x = (newPos.x - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'RIGHT':
        newPos.x = (newPos.x + 1) % GRID_SIZE;
        break;
    }
    pacmanRef.current = newPos;

    // Check dot collision
    if (dotsRef.current[newPos.y]?.[newPos.x]) {
      dotsRef.current[newPos.y][newPos.x] = false;
      setScore((prev) => prev + 10);
    }

    // Move ghosts
    ghostsRef.current = ghostsRef.current.map((ghost) => {
      const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      const randomDir = directions[Math.floor(Math.random() * directions.length)];
      
      const newGhost = { ...ghost };
      switch (randomDir) {
        case 'UP':
          newGhost.y = (newGhost.y - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'DOWN':
          newGhost.y = (newGhost.y + 1) % GRID_SIZE;
          break;
        case 'LEFT':
          newGhost.x = (newGhost.x - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'RIGHT':
          newGhost.x = (newGhost.x + 1) % GRID_SIZE;
          break;
      }
      return newGhost;
    });

    // Check ghost collision
    for (const ghost of ghostsRef.current) {
      if (ghost.x === newPos.x && ghost.y === newPos.y) {
        setGameOver(true);
        return;
      }
    }

    // Toggle mouth animation
    mouthOpenRef.current = !mouthOpenRef.current;

    // Check win condition
    const allDotsEaten = dotsRef.current.every((row) => row.every((dot) => !dot));
    if (allDotsEaten) {
      setGameOver(true);
    }
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with dark terminal background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ASCII-style grid background
    ctx.strokeStyle = '#1a4d2e';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw dots as ASCII characters
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (dotsRef.current[y]?.[x]) {
          ctx.fillText('·', x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
        }
      }
    }

    // Draw Pac-Man as ASCII character
    const pacman = pacmanRef.current;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px "Courier New", monospace';
    
    let pacmanChar = 'O';
    if (mouthOpenRef.current) {
      switch (directionRef.current) {
        case 'RIGHT':
          pacmanChar = '>';
          break;
        case 'LEFT':
          pacmanChar = '<';
          break;
        case 'UP':
          pacmanChar = '^';
          break;
        case 'DOWN':
          pacmanChar = 'v';
          break;
      }
    }
    
    ctx.fillText(
      pacmanChar,
      pacman.x * CELL_SIZE + CELL_SIZE / 2,
      pacman.y * CELL_SIZE + CELL_SIZE / 2
    );

    // Draw ghosts as ASCII characters
    ghostsRef.current.forEach((ghost, index) => {
      ctx.fillStyle = GHOST_COLORS[index];
      ctx.font = 'bold 18px "Courier New", monospace';
      
      // Ghost body as ASCII
      ctx.fillText(
        'M',
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE / 2
      );
      
      // Ghost eyes as dots
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px "Courier New", monospace';
      ctx.fillText(
        '··',
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 3
      );
    });
  };

  const startGame = () => {
    initializeGame();
    setGameStarted(true);
  };

  const restartGame = () => {
    initializeGame();
    setGameStarted(true);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Courier New', monospace" }}>
      {/* CRT Screen Effect Container */}
      <style jsx>{`
        @keyframes flicker {
          0% { opacity: 0.97; }
          5% { opacity: 1; }
          10% { opacity: 0.98; }
          15% { opacity: 1; }
          20% { opacity: 0.97; }
          100% { opacity: 1; }
        }
        
        .crt-screen {
          position: relative;
          border-radius: 8% / 5%;
          background: radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%);
          box-shadow: 
            0 0 40px rgba(0, 255, 0, 0.3),
            inset 0 0 100px rgba(0, 255, 0, 0.05);
          animation: flicker 0.15s infinite;
        }
        
        .crt-screen::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.15),
              rgba(0, 0, 0, 0.15) 1px,
              transparent 1px,
              transparent 2px
            );
          pointer-events: none;
          z-index: 10;
          border-radius: 8% / 5%;
        }
        
        .crt-screen::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.5) 100%);
          pointer-events: none;
          z-index: 11;
          border-radius: 8% / 5%;
        }
        
        .crt-content {
          position: relative;
          z-index: 5;
          filter: blur(0.3px);
        }
        
        .phosphor-glow {
          text-shadow: 
            0 0 5px #00FF00,
            0 0 10px #00FF00,
            0 0 20px #00FF00,
            0 0 40px #00FF00;
        }
      `}</style>

      <div className="crt-screen p-8">
        <div className="crt-content">
          <div className="flex items-center justify-between w-full max-w-md mb-6">
            <div className="text-center flex-1">
              <h1 className="text-5xl font-bold text-[#00FF00] mb-2 tracking-widest phosphor-glow" style={{ 
                fontFamily: "'Courier New', monospace"
              }}>
                ╔═══════════════╗
              </h1>
              <h1 className="text-4xl font-bold text-[#00FF00] mb-2 tracking-widest phosphor-glow" style={{ 
                fontFamily: "'Courier New', monospace"
              }}>
                ║  PAC-MAN  ║
              </h1>
              <h1 className="text-5xl font-bold text-[#00FF00] mb-4 tracking-widest phosphor-glow" style={{ 
                fontFamily: "'Courier New', monospace"
              }}>
                ╚═══════════════╝
              </h1>
              <p className="text-[#FFD700] text-2xl font-bold tracking-widest" style={{ 
                fontFamily: "'Courier New', monospace",
                textShadow: '0 0 10px #FFD700'
              }}>
                SCORE: {score.toString().padStart(4, '0')}
              </p>
            </div>
          </div>

          <div className="relative">
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * CELL_SIZE}
              height={GRID_SIZE * CELL_SIZE}
              className="border-4 border-[#00FF00]"
              style={{ 
                boxShadow: '0 0 20px #00FF00, inset 0 0 20px rgba(0,255,0,0.1)',
                filter: 'contrast(1.1) brightness(1.1)'
              }}
            />
        
            {!gameStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/95">
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-transparent border-4 border-[#00FF00] text-[#00FF00] font-bold text-2xl hover:bg-[#00FF00] hover:text-black transition-all phosphor-glow"
                  style={{ 
                    boxShadow: '0 0 20px #00FF00',
                    fontFamily: "'Courier New', monospace"
                  }}
                >
                  [ START GAME ]
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95">
                <h2 className="text-4xl font-bold text-[#FF0000] mb-4 tracking-widest" style={{ 
                  textShadow: '0 0 10px #FF0000, 0 0 20px #FF0000',
                  fontFamily: "'Courier New', monospace"
                }}>
                  *** GAME OVER ***
                </h2>
                <p className="text-[#FFD700] text-2xl font-bold mb-6 tracking-widest" style={{ 
                  fontFamily: "'Courier New', monospace",
                  textShadow: '0 0 10px #FFD700'
                }}>
                  FINAL: {score.toString().padStart(4, '0')}
                </p>
                <button
                  onClick={restartGame}
                  className="px-8 py-4 bg-transparent border-4 border-[#00FF00] text-[#00FF00] font-bold text-2xl hover:bg-[#00FF00] hover:text-black transition-all phosphor-glow"
                  style={{ 
                    boxShadow: '0 0 20px #00FF00',
                    fontFamily: "'Courier New', monospace"
                  }}
                >
                  [ PLAY AGAIN ]
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 text-[#00FF00] text-center font-bold" style={{ fontFamily: "'Courier New', monospace" }}>
            <p className="text-lg tracking-widest phosphor-glow">
              ↑ ↓ ← → ARROW KEYS
            </p>
            <p className="text-sm text-[#FFD700] mt-3 tracking-widest" style={{ textShadow: '0 0 5px #FFD700' }}>
              EAT DOTS · AVOID GHOSTS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




























