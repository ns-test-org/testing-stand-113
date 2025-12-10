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

    // Clear canvas with 70s background colors
    ctx.fillStyle = theme === 'dark' ? '#3E2723' : '#F4E4C1'; // Dark brown or cream
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw dots in 70s orange
    ctx.fillStyle = '#FF8C00'; // Dark orange - very 70s!
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (dotsRef.current[y]?.[x]) {
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    // Draw Pac-Man in 70s gold/mustard yellow
    const pacman = pacmanRef.current;
    ctx.fillStyle = '#FFD700'; // Gold - groovy!
    ctx.beginPath();
    
    let startAngle = 0;
    let endAngle = Math.PI * 2;
    
    if (mouthOpenRef.current) {
      switch (directionRef.current) {
        case 'RIGHT':
          startAngle = 0.2 * Math.PI;
          endAngle = 1.8 * Math.PI;
          break;
        case 'LEFT':
          startAngle = 1.2 * Math.PI;
          endAngle = 0.8 * Math.PI;
          break;
        case 'UP':
          startAngle = 1.7 * Math.PI;
          endAngle = 1.3 * Math.PI;
          break;
        case 'DOWN':
          startAngle = 0.7 * Math.PI;
          endAngle = 0.3 * Math.PI;
          break;
      }
    }
    
    ctx.arc(
      pacman.x * CELL_SIZE + CELL_SIZE / 2,
      pacman.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      startAngle,
      endAngle
    );
    ctx.lineTo(
      pacman.x * CELL_SIZE + CELL_SIZE / 2,
      pacman.y * CELL_SIZE + CELL_SIZE / 2
    );
    ctx.fill();

    // Draw ghosts
    ghostsRef.current.forEach((ghost, index) => {
      ctx.fillStyle = GHOST_COLORS[index];
      
      // Ghost body
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        Math.PI,
        0
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + CELL_SIZE - 2,
        ghost.y * CELL_SIZE + CELL_SIZE - 2
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + CELL_SIZE - 5,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 + 3
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE - 2
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + 5,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 + 3
      );
      ctx.lineTo(ghost.x * CELL_SIZE + 2, ghost.y * CELL_SIZE + CELL_SIZE - 2);
      ctx.closePath();
      ctx.fill();

      // Ghost eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2 - 3,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2,
        2,
        0,
        Math.PI * 2
      );
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2 + 3,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Ghost pupils in 70s brown
      ctx.fillStyle = '#654321'; // Dark brown
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2 - 3,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2,
        1,
        0,
        Math.PI * 2
      );
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2 + 3,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 2,
        1,
        0,
        Math.PI * 2
      );
      ctx.fill();
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
    <div className="min-h-screen bg-[#F4E4C1] dark:bg-[#3E2723] flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Cooper Black', 'Arial Black', sans-serif" }}>
      <div className="flex items-center justify-between w-full max-w-md mb-6">
        <div className="text-center flex-1">
          <h1 className="text-5xl font-black text-[#FF8C00] dark:text-[#FFD700] mb-2 tracking-wider" style={{ 
            textShadow: '3px 3px 0px #8B4513, 6px 6px 0px rgba(0,0,0,0.2)',
            fontFamily: "'Cooper Black', 'Arial Black', sans-serif"
          }}>
            PAC-MAN
          </h1>
          <p className="text-[#8B4513] dark:text-[#DAA520] text-2xl font-bold tracking-wide">SCORE: {score}</p>
        </div>
        <button
          onClick={toggleTheme}
          className="ml-4 p-3 rounded-full bg-[#DAA520] dark:bg-[#8B4513] hover:bg-[#FF8C00] dark:hover:bg-[#D2691E] transition-colors shadow-lg"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-8 border-[#8B4513] dark:border-[#DAA520] rounded-lg shadow-2xl"
          style={{ boxShadow: '0 8px 0 #654321, 0 12px 20px rgba(0,0,0,0.4)' }}
        />
        
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F4E4C1]/95 dark:bg-[#3E2723]/95 rounded-lg">
            <button
              onClick={startGame}
              className="px-10 py-5 bg-[#FF8C00] text-[#3E2723] font-black text-2xl rounded-full hover:bg-[#FFD700] transition-all shadow-lg transform hover:scale-105"
              style={{ 
                textShadow: '2px 2px 0px rgba(255,255,255,0.3)',
                boxShadow: '0 6px 0 #8B4513, 0 8px 15px rgba(0,0,0,0.3)'
              }}
            >
              START GAME
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F4E4C1]/95 dark:bg-[#3E2723]/95 rounded-lg">
            <h2 className="text-4xl font-black text-[#D2691E] dark:text-[#FF8C00] mb-4 tracking-wider" style={{ textShadow: '3px 3px 0px #654321' }}>
              GAME OVER!
            </h2>
            <p className="text-[#8B4513] dark:text-[#DAA520] text-2xl font-bold mb-6">FINAL SCORE: {score}</p>
            <button
              onClick={restartGame}
              className="px-10 py-5 bg-[#FF8C00] text-[#3E2723] font-black text-2xl rounded-full hover:bg-[#FFD700] transition-all shadow-lg transform hover:scale-105"
              style={{ 
                textShadow: '2px 2px 0px rgba(255,255,255,0.3)',
                boxShadow: '0 6px 0 #8B4513, 0 8px 15px rgba(0,0,0,0.3)'
              }}
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-[#8B4513] dark:text-[#DAA520] text-center font-bold">
        <p className="text-lg tracking-wide">⬆️ ⬇️ ⬅️ ➡️ USE ARROW KEYS TO MOVE</p>
        <p className="text-sm text-[#D2691E] dark:text-[#CD853F] mt-3 tracking-wider">🌼 EAT ALL DOTS • AVOID THE GHOSTS! 🌼</p>
      </div>
    </div>
  );
}
























