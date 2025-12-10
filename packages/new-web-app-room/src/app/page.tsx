'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from './providers';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];

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

    // Clear canvas
    ctx.fillStyle = theme === 'dark' ? '#1F2937' : '#F5F5F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw dots
    ctx.fillStyle = '#FFA500';
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

    // Draw Pac-Man
    const pacman = pacmanRef.current;
    ctx.fillStyle = '#FFFF00';
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

      // Ghost pupils
      ctx.fillStyle = '#0000FF';
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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="flex items-center justify-between w-full max-w-md mb-6">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">PAC-MAN v5</h1>
          <p className="text-gray-800 dark:text-gray-200 text-xl">Score: {score}</p>
        </div>
        <button
          onClick={toggleTheme}
          className="ml-4 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-gray-800 dark:text-gray-200 font-medium"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-4 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
        />
        
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded-lg">
            <button
              onClick={startGame}
              className="px-8 py-4 bg-blue-600 text-white font-bold text-xl rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              START GAME
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-gray-800/95 rounded-lg">
            <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">GAME OVER!</h2>
            <p className="text-gray-800 dark:text-gray-200 text-xl mb-6">Final Score: {score}</p>
            <button
              onClick={restartGame}
              className="px-8 py-4 bg-blue-600 text-white font-bold text-xl rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 text-gray-800 dark:text-gray-200 text-center">
        <p className="text-sm">Use arrow keys to move</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Eat all dots and avoid the ghosts!</p>
      </div>
    </div>
  );
}













