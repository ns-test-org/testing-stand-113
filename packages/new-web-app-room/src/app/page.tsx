'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from './providers';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;
const ADVANCED_INITIAL_SPEED = 120;

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type PowerUpType = 'speed' | 'freeze' | 'shield' | 'multiplier';

interface PowerUp {
  position: Position;
  type: PowerUpType;
  active: boolean;
}

interface Ghost extends Position {
  mode: 'chase' | 'scatter' | 'frightened';
  target?: Position;
  color: string;
}

const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
const POWER_UP_COLORS = {
  speed: '#00FF00',
  freeze: '#00FFFF',
  shield: '#FFD700',
  multiplier: '#FF00FF'
};

export default function PacManGame() {
  const { theme, toggleTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  
  const pacmanRef = useRef<Position>({ x: 10, y: 10 });
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const dotsRef = useRef<boolean[][]>([]);
  const ghostsRef = useRef<Ghost[]>([]);
  const mouthOpenRef = useRef(true);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const activePowerUpsRef = useRef<{ type: PowerUpType; endTime: number }[]>([]);
  const speedRef = useRef(INITIAL_SPEED);
  const lastDotTimeRef = useRef(Date.now());
  const difficultyRef = useRef(1);

  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Initialize ghosts with advanced AI
    const ghosts: Ghost[] = [
      { x: 5, y: 5, mode: 'chase', color: GHOST_COLORS[0] },
      { x: 14, y: 5, mode: 'scatter', color: GHOST_COLORS[1] },
      { x: 5, y: 14, mode: 'chase', color: GHOST_COLORS[2] },
      { x: 14, y: 14, mode: 'scatter', color: GHOST_COLORS[3] },
    ];
    ghostsRef.current = ghosts;

    // Initialize power-ups in advanced mode
    if (advancedMode) {
      const powerUps: PowerUp[] = [];
      const types: PowerUpType[] = ['speed', 'freeze', 'shield', 'multiplier'];
      for (let i = 0; i < 4; i++) {
        powerUps.push({
          position: {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
          },
          type: types[i],
          active: true
        });
      }
      powerUpsRef.current = powerUps;
      speedRef.current = ADVANCED_INITIAL_SPEED;
    } else {
      powerUpsRef.current = [];
      speedRef.current = INITIAL_SPEED;
    }

    // Reset game state
    pacmanRef.current = { x: 10, y: 10 };
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    activePowerUpsRef.current = [];
    lastDotTimeRef.current = Date.now();
    setScore(0);
    setGameOver(false);
    setCombo(0);
    setLives(advancedMode ? 3 : 1);
    setLevel(1);
    difficultyRef.current = 1;
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
    }, speedRef.current);

    return () => clearInterval(gameLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, gameOver, score, advancedMode]);

  const updateGame = () => {
    const now = Date.now();
    
    // Update active power-ups
    activePowerUpsRef.current = activePowerUpsRef.current.filter(pu => pu.endTime > now);
    
    const hasShield = activePowerUpsRef.current.some(pu => pu.type === 'shield');
    const hasFreeze = activePowerUpsRef.current.some(pu => pu.type === 'freeze');
    const hasSpeed = activePowerUpsRef.current.some(pu => pu.type === 'speed');
    const hasMultiplier = activePowerUpsRef.current.some(pu => pu.type === 'multiplier');
    
    // Update speed based on power-ups and difficulty
    if (advancedMode) {
      const baseSpeed = ADVANCED_INITIAL_SPEED - (difficultyRef.current * 10);
      speedRef.current = hasSpeed ? Math.max(baseSpeed * 0.7, 50) : baseSpeed;
    }
    
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

    // Check dot collision with combo system
    if (dotsRef.current[newPos.y]?.[newPos.x]) {
      dotsRef.current[newPos.y][newPos.x] = false;
      
      if (advancedMode) {
        const timeSinceLastDot = now - lastDotTimeRef.current;
        if (timeSinceLastDot < 500) {
          setCombo(prev => prev + 1);
        } else {
          setCombo(1);
        }
        lastDotTimeRef.current = now;
        
        const currentMultiplier = hasMultiplier ? 2 : 1;
        const comboBonus = Math.floor(combo / 5);
        const points = 10 * currentMultiplier * (1 + comboBonus);
        setScore((prev) => prev + points);
      } else {
        setScore((prev) => prev + 10);
      }
    }

    // Check power-up collision
    if (advancedMode) {
      powerUpsRef.current.forEach(powerUp => {
        if (powerUp.active && powerUp.position.x === newPos.x && powerUp.position.y === newPos.y) {
          powerUp.active = false;
          activePowerUpsRef.current.push({
            type: powerUp.type,
            endTime: now + 5000
          });
          setScore(prev => prev + 50);
        }
      });
    }

    // Move ghosts with advanced AI
    if (!hasFreeze) {
      ghostsRef.current = ghostsRef.current.map((ghost) => {
        if (advancedMode) {
          return moveGhostAdvanced(ghost, newPos, difficultyRef.current);
        } else {
          return moveGhostRandom(ghost);
        }
      });
    }

    // Check ghost collision
    for (const ghost of ghostsRef.current) {
      if (ghost.x === newPos.x && ghost.y === newPos.y) {
        if (hasShield) {
          // Shield protects, remove shield
          activePowerUpsRef.current = activePowerUpsRef.current.filter(pu => pu.type !== 'shield');
        } else {
          if (advancedMode) {
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameOver(true);
              } else {
                // Reset position
                pacmanRef.current = { x: 10, y: 10 };
              }
              return newLives;
            });
          } else {
            setGameOver(true);
          }
          return;
        }
      }
    }

    // Toggle mouth animation
    mouthOpenRef.current = !mouthOpenRef.current;

    // Check win condition and level progression
    const allDotsEaten = dotsRef.current.every((row) => row.every((dot) => !dot));
    if (allDotsEaten) {
      if (advancedMode) {
        // Progress to next level
        setLevel(prev => prev + 1);
        difficultyRef.current += 0.5;
        initializeGame();
      } else {
        setGameOver(true);
      }
    }
  };

  const moveGhostRandom = (ghost: Ghost): Ghost => {
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
  };

  const moveGhostAdvanced = (ghost: Ghost, pacmanPos: Position, difficulty: number): Ghost => {
    const newGhost = { ...ghost };
    
    // Calculate distance to Pac-Man
    const dx = pacmanPos.x - ghost.x;
    const dy = pacmanPos.y - ghost.y;
    
    // Smart AI: Chase mode - move towards Pac-Man
    if (ghost.mode === 'chase' && Math.random() < 0.7 + (difficulty * 0.1)) {
      if (Math.abs(dx) > Math.abs(dy)) {
        newGhost.x = dx > 0 ? (ghost.x + 1) % GRID_SIZE : (ghost.x - 1 + GRID_SIZE) % GRID_SIZE;
      } else {
        newGhost.y = dy > 0 ? (ghost.y + 1) % GRID_SIZE : (ghost.y - 1 + GRID_SIZE) % GRID_SIZE;
      }
    } 
    // Scatter mode - move to corners
    else if (ghost.mode === 'scatter') {
      const targetX = ghost.color === GHOST_COLORS[1] ? GRID_SIZE - 1 : 0;
      const targetY = ghost.color === GHOST_COLORS[1] ? 0 : GRID_SIZE - 1;
      const tdx = targetX - ghost.x;
      const tdy = targetY - ghost.y;
      
      if (Math.abs(tdx) > Math.abs(tdy)) {
        newGhost.x = tdx > 0 ? (ghost.x + 1) % GRID_SIZE : (ghost.x - 1 + GRID_SIZE) % GRID_SIZE;
      } else {
        newGhost.y = tdy > 0 ? (ghost.y + 1) % GRID_SIZE : (ghost.y - 1 + GRID_SIZE) % GRID_SIZE;
      }
    }
    // Random movement fallback
    else {
      return moveGhostRandom(ghost);
    }
    
    // Randomly switch modes
    if (Math.random() < 0.02) {
      newGhost.mode = newGhost.mode === 'chase' ? 'scatter' : 'chase';
    }
    
    return newGhost;
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

    // Draw power-ups
    if (advancedMode) {
      powerUpsRef.current.forEach(powerUp => {
        if (powerUp.active) {
          ctx.fillStyle = POWER_UP_COLORS[powerUp.type];
          ctx.beginPath();
          ctx.arc(
            powerUp.position.x * CELL_SIZE + CELL_SIZE / 2,
            powerUp.position.y * CELL_SIZE + CELL_SIZE / 2,
            4,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          // Draw power-up icon
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const icon = powerUp.type === 'speed' ? '⚡' : 
                       powerUp.type === 'freeze' ? '❄️' : 
                       powerUp.type === 'shield' ? '🛡️' : '✨';
          ctx.fillText(icon, 
            powerUp.position.x * CELL_SIZE + CELL_SIZE / 2,
            powerUp.position.y * CELL_SIZE + CELL_SIZE / 2
          );
        }
      });
    }

    // Draw Pac-Man
    const pacman = pacmanRef.current;
    const hasShield = activePowerUpsRef.current.some(pu => pu.type === 'shield');
    
    // Draw shield effect
    if (hasShield) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        pacman.x * CELL_SIZE + CELL_SIZE / 2,
        pacman.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 + 2,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    
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
    const hasFreeze = activePowerUpsRef.current.some(pu => pu.type === 'freeze');
    ghostsRef.current.forEach((ghost) => {
      ctx.fillStyle = hasFreeze ? '#87CEEB' : ghost.color;
      
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

  const startGame = (advanced: boolean) => {
    setAdvancedMode(advanced);
    setTimeout(() => {
      initializeGame();
      setGameStarted(true);
    }, 0);
  };

  const restartGame = () => {
    initializeGame();
    setGameStarted(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            PAC-MAN {advancedMode && '⚡ ADVANCED'}
          </h1>
          <div className="flex justify-center gap-4 text-gray-800 dark:text-gray-200">
            <p className="text-xl">Score: {score}</p>
            {advancedMode && (
              <>
                <p className="text-xl">Level: {level}</p>
                <p className="text-xl">Lives: {'❤️'.repeat(lives)}</p>
              </>
            )}
          </div>
          {advancedMode && combo > 1 && (
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
              Combo x{combo}! 🔥
            </p>
          )}
        </div>
        <button
          onClick={toggleTheme}
          className="ml-4 p-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {advancedMode && activePowerUpsRef.current.length > 0 && (
        <div className="mb-2 flex gap-2">
          {activePowerUpsRef.current.map((pu, i) => (
            <div key={i} className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">
              {pu.type === 'speed' && '⚡ Speed'}
              {pu.type === 'freeze' && '❄️ Freeze'}
              {pu.type === 'shield' && '🛡️ Shield'}
              {pu.type === 'multiplier' && '✨ 2x Points'}
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="border-4 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
        />
        
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-gray-800/95 rounded-lg gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Choose Mode</h2>
            <button
              onClick={() => startGame(false)}
              className="px-8 py-4 bg-blue-600 text-white font-bold text-xl rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              CLASSIC MODE
            </button>
            <button
              onClick={() => startGame(true)}
              className="px-8 py-4 bg-purple-600 text-white font-bold text-xl rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
            >
              ⚡ ADVANCED MODE
            </button>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs text-center">
              <p className="font-semibold mb-2">Advanced Mode Features:</p>
              <p>• Smart ghost AI • Power-ups • Multiple lives</p>
              <p>• Progressive difficulty • Combo system</p>
            </div>
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

      <div className="mt-6 text-gray-800 dark:text-gray-200 text-center max-w-md">
        <p className="text-sm font-semibold">Use arrow keys to move</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {advancedMode 
            ? 'Collect power-ups for special abilities! Chain dots for combos!' 
            : 'Eat all dots and avoid the ghosts!'}
        </p>
        {advancedMode && (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
            <div>⚡ Speed Boost</div>
            <div>❄️ Freeze Ghosts</div>
            <div>🛡️ Shield</div>
            <div>✨ 2x Points</div>
          </div>
        )}
      </div>
    </div>
  );
}































