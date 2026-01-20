import { useRef, useEffect, useCallback, useState } from 'react';
import { Obstacle, Particle } from '../types';
import { submitScore } from '../api/leaderboard';

const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 90;
const BASE_SPEED = 4;
const SPEED_INCREMENT = 0.001;
const BASE_SPAWN_RATE = 0.02;
const SPAWN_RATE_INCREMENT = 0.00002;
const MAX_OBSTACLES = 25;
const BOOST_SPEED = 12;
const BOOST_DURATION = 30;
const BOOST_COOLDOWN = 120;
const MAX_PARTICLES = 30;

interface Planet {
  x: number;
  y: number;
  size: number;
  colors: string[];
  hasRing: boolean;
  ringAngle: number;
  speed: number;
}

interface BackgroundPill {
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  rotationSpeed: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface Nebula {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color: string;
  rotation: number;
}

interface GameStateRef {
  playerX: number;
  targetX: number;
  obstacles: Obstacle[];
  particles: Particle[];
  gameSpeed: number;
  frameCount: number;
  shakeAmount: number;
  score: number;
  boostFrames: number;
  boostCooldownFrames: number;
  waveTimer: number;
  isRunning: boolean;
  isDemo: boolean;
  demoTargetX: number;
  demoChangeTimer: number;
  playerImage: HTMLImageElement | null;
  // Background elements
  stars: Star[];
  planets: Planet[];
  backgroundPills: BackgroundPill[];
  nebulas: Nebula[];
  backgroundInitialized: boolean;
}

export function useGame(canvasRef: React.RefObject<HTMLCanvasElement>, playerName: string) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(`pumpfly-highscore-${playerName}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostCooldown, setBoostCooldown] = useState(0);
  const [difficulty, setDifficulty] = useState(1);

  const animationId = useRef<number>(0);
  const gameState = useRef<GameStateRef>({
    playerX: 0,
    targetX: 0,
    obstacles: [],
    particles: [],
    gameSpeed: BASE_SPEED,
    frameCount: 0,
    shakeAmount: 0,
    score: 0,
    boostFrames: 0,
    boostCooldownFrames: 0,
    waveTimer: 300,
    isRunning: false,
    isDemo: true,
    demoTargetX: 0,
    demoChangeTimer: 0,
    playerImage: null,
    stars: [],
    planets: [],
    backgroundPills: [],
    nebulas: [],
    backgroundInitialized: false,
  });

  // Load player image
  useEffect(() => {
    const img = new Image();
    img.src = '/player.png';
    img.onload = () => {
      gameState.current.playerImage = img;
    };
  }, []);

  // Update highscore when player name changes
  useEffect(() => {
    if (playerName) {
      const saved = localStorage.getItem(`pumpfly-highscore-${playerName}`);
      setHighScore(saved ? parseInt(saved, 10) : 0);
    }
  }, [playerName]);

  const initializeBackground = (width: number, height: number) => {
    const gs = gameState.current;
    if (gs.backgroundInitialized) return;

    // Create stars
    gs.stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random(),
      twinkleSpeed: Math.random() * 0.05 + 0.02,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    // Create nebulas
    gs.nebulas = [
      { x: width * 0.2, y: height * 0.3, radiusX: 300, radiusY: 200, color: 'rgba(138, 43, 226, 0.15)', rotation: 0.3 },
      { x: width * 0.8, y: height * 0.7, radiusX: 250, radiusY: 180, color: 'rgba(0, 191, 255, 0.12)', rotation: -0.5 },
      { x: width * 0.5, y: height * 0.5, radiusX: 400, radiusY: 250, color: 'rgba(0, 255, 136, 0.08)', rotation: 0.2 },
      { x: width * 0.1, y: height * 0.8, radiusX: 200, radiusY: 150, color: 'rgba(255, 20, 147, 0.1)', rotation: 0.7 },
    ];

    // Create planets
    const planetColors = [
      ['#4a9eff', '#1a5a9e', '#0d3a6e'], // Blue planet
      ['#ff6b4a', '#9e3a1a', '#6e1a0d'], // Mars-like
      ['#9b59b6', '#6c3483', '#4a235a'], // Purple planet
      ['#2ecc71', '#1e8449', '#145a32'], // Green planet
      ['#f39c12', '#d68910', '#9a7d0a'], // Orange/Saturn
      ['#3498db', '#2874a6', '#1a5276'], // Neptune-like
      ['#e74c3c', '#922b21', '#641e16'], // Red planet
      ['#1abc9c', '#148f77', '#0e6655'], // Teal planet
    ];

    gs.planets = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 30 + Math.random() * 60,
      colors: planetColors[i % planetColors.length],
      hasRing: Math.random() > 0.7,
      ringAngle: Math.random() * 0.5 - 0.25,
      speed: 0.3 + Math.random() * 0.5,
    }));

    // Create background pills (smaller and fewer for clarity)
    gs.backgroundPills = Array.from({ length: 12 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 10 + Math.random() * 12,
      rotation: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
    }));

    gs.backgroundInitialized = true;
  };

  const drawNebulas = (ctx: CanvasRenderingContext2D, _width: number, _height: number) => {
    const gs = gameState.current;
    for (const nebula of gs.nebulas) {
      ctx.save();
      ctx.translate(nebula.x, nebula.y);
      ctx.rotate(nebula.rotation);
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, nebula.radiusX);
      gradient.addColorStop(0, nebula.color);
      gradient.addColorStop(0.5, nebula.color.replace(/[\d.]+\)$/, '0.05)'));
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.scale(1, nebula.radiusY / nebula.radiusX);
      ctx.beginPath();
      ctx.arc(0, 0, nebula.radiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const drawStars = (ctx: CanvasRenderingContext2D, frameCount: number, speed: number, height: number) => {
    const gs = gameState.current;
    for (const star of gs.stars) {
      star.y = (star.y + speed * 0.2) % height;
      const twinkle = Math.sin(frameCount * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
      const alpha = 0.3 + twinkle * 0.7 * star.brightness;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawPlanet = (ctx: CanvasRenderingContext2D, planet: Planet) => {
    const { x, y, size, colors, hasRing, ringAngle } = planet;
    
    // Planet shadow/atmosphere
    const atmosphereGradient = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size * 1.2);
    atmosphereGradient.addColorStop(0, colors[0] + '40');
    atmosphereGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = atmosphereGradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Planet body
    const gradient = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Planet highlight
    const highlightGradient = ctx.createRadialGradient(x - size * 0.4, y - size * 0.4, 0, x, y, size);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
    highlightGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Ring (if has ring)
    if (hasRing) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ringAngle);
      ctx.scale(1, 0.3);
      
      ctx.strokeStyle = `${colors[0]}80`;
      ctx.lineWidth = size * 0.15;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.strokeStyle = `${colors[1]}60`;
      ctx.lineWidth = size * 0.08;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.7, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.restore();
    }
  };

  const drawPill = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, isObstacle: boolean = false) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    const pillWidth = size;
    const pillHeight = size * 2.2;
    const radius = pillWidth / 2;
    
    if (isObstacle) {
      // DANGEROUS PILL - Red/Orange with glow warning effect
      
      // Danger glow
      const glowSize = pillWidth * 2;
      const dangerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
      dangerGlow.addColorStop(0, 'rgba(255, 50, 50, 0.4)');
      dangerGlow.addColorStop(0.5, 'rgba(255, 100, 50, 0.2)');
      dangerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = dangerGlow;
      ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
      
      // Red half (top)
      const redGradient = ctx.createLinearGradient(-pillWidth / 2, -pillHeight / 2, pillWidth / 2, -pillHeight / 2);
      redGradient.addColorStop(0, '#8b0000');
      redGradient.addColorStop(0.3, '#ff4444');
      redGradient.addColorStop(0.7, '#cc0000');
      redGradient.addColorStop(1, '#8b0000');
      
      ctx.fillStyle = redGradient;
      ctx.beginPath();
      ctx.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight / 2 + radius / 2, [radius, radius, 0, 0]);
      ctx.fill();
      
      // Orange/Yellow half (bottom)
      const orangeGradient = ctx.createLinearGradient(-pillWidth / 2, 0, pillWidth / 2, 0);
      orangeGradient.addColorStop(0, '#cc6600');
      orangeGradient.addColorStop(0.3, '#ffaa00');
      orangeGradient.addColorStop(0.7, '#ff8800');
      orangeGradient.addColorStop(1, '#cc6600');
      
      ctx.fillStyle = orangeGradient;
      ctx.beginPath();
      ctx.roundRect(-pillWidth / 2, -radius / 2, pillWidth, pillHeight / 2 + radius / 2, [0, 0, radius, radius]);
      ctx.fill();
      
      // Warning outline
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, radius);
      ctx.stroke();
      
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-pillWidth * 0.15, -pillHeight * 0.25, pillWidth * 0.15, pillHeight * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      
    } else {
      // BACKGROUND PILL - Faded blue/cyan, decorative only
      
      // Soft shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.roundRect(-pillWidth / 2 + 2, -pillHeight / 2 + 2, pillWidth, pillHeight, radius);
      ctx.fill();
      
      // Blue half (top)
      const blueGradient = ctx.createLinearGradient(-pillWidth / 2, -pillHeight / 2, pillWidth / 2, -pillHeight / 2);
      blueGradient.addColorStop(0, 'rgba(30, 80, 120, 0.6)');
      blueGradient.addColorStop(0.5, 'rgba(50, 120, 180, 0.6)');
      blueGradient.addColorStop(1, 'rgba(30, 80, 120, 0.6)');
      
      ctx.fillStyle = blueGradient;
      ctx.beginPath();
      ctx.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight / 2 + radius / 2, [radius, radius, 0, 0]);
      ctx.fill();
      
      // Cyan half (bottom)
      const cyanGradient = ctx.createLinearGradient(-pillWidth / 2, 0, pillWidth / 2, 0);
      cyanGradient.addColorStop(0, 'rgba(50, 150, 180, 0.5)');
      cyanGradient.addColorStop(0.5, 'rgba(80, 200, 220, 0.5)');
      cyanGradient.addColorStop(1, 'rgba(50, 150, 180, 0.5)');
      
      ctx.fillStyle = cyanGradient;
      ctx.beginPath();
      ctx.roundRect(-pillWidth / 2, -radius / 2, pillWidth, pillHeight / 2 + radius / 2, [0, 0, radius, radius]);
      ctx.fill();
      
      // Subtle highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.ellipse(-pillWidth * 0.15, -pillHeight * 0.25, pillWidth * 0.1, pillHeight * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };

  const drawSpiral = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Draw spiral galaxy
    const arms = 2;
    const points = 100;
    
    for (let arm = 0; arm < arms; arm++) {
      const armOffset = (arm / arms) * Math.PI * 2;
      
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const t = i / points;
        const angle = t * Math.PI * 3 + armOffset;
        const radius = t * size;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      
      const gradient = ctx.createLinearGradient(-size, 0, size, 0);
      gradient.addColorStop(0, 'rgba(255, 200, 100, 0.1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.3)');
      gradient.addColorStop(1, 'rgba(200, 150, 255, 0.1)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = size * 0.15;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    
    // Center glow
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.3);
    centerGradient.addColorStop(0, 'rgba(255, 255, 200, 0.5)');
    centerGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  const createObstacle = (canvasWidth: number, demo: boolean = false): Obstacle => {
    const gs = gameState.current;
    const types: Obstacle['type'][] = ['cloud', 'meteor', 'rug', 'pump', 'rocket', 'moon'];
    const type = types[Math.floor(Math.random() * types.length)];
    const baseSize = demo ? 20 + Math.random() * 15 : 20 + Math.random() * 20;
    const sizeBonus = demo ? 0 : Math.min(gs.frameCount * 0.004, 15);
    const size = baseSize + sizeBonus;
    
    return {
      x: Math.random() * (canvasWidth - size * 2) + size,
      y: -size - Math.random() * 50,
      width: size,
      height: size * 2.2,
      type,
      rotation: Math.random() * Math.PI * 2,
      horizontalSpeed: (!demo && Math.random() < 0.15) ? (Math.random() - 0.5) * 1.5 : 0,
    };
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      animationId.current = requestAnimationFrame(gameLoop);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationId.current = requestAnimationFrame(gameLoop);
      return;
    }

    const gs = gameState.current;
    const width = canvas.width;
    const height = canvas.height;
    const inDemo = gs.isDemo && !gs.isRunning;
    const playerY = height * 0.65;

    // Initialize background elements
    initializeBackground(width, height);

    // Update difficulty - slower progression
    const diffLevel = inDemo ? 1 : Math.floor(gs.frameCount / 600) + 1;

    // Handle boost
    const currentlyBoosting = gs.isRunning && gs.boostFrames > 0;
    if (currentlyBoosting) {
      gs.boostFrames--;
      if (gs.boostFrames <= 0) {
        gs.boostCooldownFrames = BOOST_COOLDOWN;
        setIsBoosting(false);
      }
    }
    
    if (gs.boostCooldownFrames > 0 && gs.isRunning) {
      gs.boostCooldownFrames--;
      const newCooldown = Math.ceil(gs.boostCooldownFrames / 60);
      setBoostCooldown(newCooldown);
    }

    // Demo AI
    if (inDemo) {
      gs.demoChangeTimer--;
      if (gs.demoChangeTimer <= 0) {
        gs.demoTargetX = width * 0.2 + Math.random() * (width * 0.6);
        gs.demoChangeTimer = 60 + Math.random() * 60;
      }
      gs.targetX = gs.demoTargetX;
    }

    // Player movement - smooth lerp
    if (gs.isRunning) {
      const dx = gs.targetX - gs.playerX;
      gs.playerX += dx * 0.08;
    } else if (inDemo) {
      const dx = gs.demoTargetX - gs.playerX;
      gs.playerX += dx * 0.05;
    }
    gs.playerX = Math.max(0, Math.min(width - PLAYER_WIDTH, gs.playerX));

    // Current speed - gentler difficulty scaling
    const currentSpeed = inDemo ? 2.5 : (currentlyBoosting ? BOOST_SPEED : gs.gameSpeed * (1 + (diffLevel - 1) * 0.08));

    // === DRAW BACKGROUND ===
    
    // Base gradient - deep space
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0a0a1a');
    bgGradient.addColorStop(0.3, '#1a1040');
    bgGradient.addColorStop(0.6, '#0d2040');
    bgGradient.addColorStop(1, '#0a1a2a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw nebulas
    drawNebulas(ctx, width, height);

    // Draw spiral galaxies (2 of them)
    if (gs.frameCount % 2 === 0) {
      drawSpiral(ctx, width * 0.15, height * 0.25, 80, gs.frameCount * 0.001);
      drawSpiral(ctx, width * 0.85, height * 0.6, 60, -gs.frameCount * 0.0008);
    }

    // Draw stars
    drawStars(ctx, gs.frameCount, currentSpeed, height);

    // Update and draw background pills (decorative - faded and smaller)
    for (const pill of gs.backgroundPills) {
      pill.y = (pill.y + currentSpeed * pill.speed * 0.2) % (height + pill.size * 3);
      if (pill.y < -pill.size * 3) pill.y = height + pill.size;
      pill.rotation += pill.rotationSpeed * 0.5;
      
      ctx.globalAlpha = 0.35; // Very faded
      drawPill(ctx, pill.x, pill.y, pill.size * 0.8, pill.rotation, false);
      ctx.globalAlpha = 1;
    }

    // Update and draw planets
    for (const planet of gs.planets) {
      planet.y = (planet.y + currentSpeed * planet.speed * 0.15) % (height + planet.size * 3);
      if (planet.y < -planet.size * 3) {
        planet.y = height + planet.size * 2;
        planet.x = Math.random() * width;
      }
      
      ctx.globalAlpha = 0.8;
      drawPlanet(ctx, planet);
      ctx.globalAlpha = 1;
    }

    // Update particles (player trail)
    gs.particles = gs.particles.filter(p => {
      p.y += currentSpeed * 1.5;
      p.alpha -= 0.03;
      return p.alpha > 0.05;
    });

    // Add particles
    if (gs.frameCount % 4 === 0 && gs.particles.length < MAX_PARTICLES) {
      gs.particles.push({
        x: gs.playerX + PLAYER_WIDTH / 2 + (Math.random() - 0.5) * 20,
        y: playerY + PLAYER_HEIGHT,
        alpha: 0.7,
        size: 2 + Math.random() * 2,
      });
    }

    // Draw particles
    const particleColor = currentlyBoosting ? '#ffd700' : '#00ff88';
    for (const p of gs.particles) {
      ctx.fillStyle = particleColor;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Spawn obstacles (pills) - more gradual difficulty
    const spawnRate = inDemo ? 0.012 : BASE_SPAWN_RATE + gs.frameCount * SPAWN_RATE_INCREMENT + (diffLevel * 0.003);
    if (Math.random() < spawnRate && gs.obstacles.length < (inDemo ? 6 : MAX_OBSTACLES)) {
      gs.obstacles.push(createObstacle(width, inDemo));
      // Only spawn extra obstacles at higher difficulties with lower chance
      if (!inDemo && diffLevel > 3 && Math.random() < 0.1) {
        gs.obstacles.push(createObstacle(width, false));
      }
    }

    // Update and draw obstacles (as pills)
    gs.obstacles = gs.obstacles.filter(obs => {
      obs.y += currentSpeed;
      obs.x += obs.horizontalSpeed || 0;
      obs.rotation += 0.02;
      
      // Bounce off walls
      if (obs.x <= 0 || obs.x >= width - obs.width) {
        obs.horizontalSpeed = -(obs.horizontalSpeed || 0);
        obs.x = Math.max(0, Math.min(width - obs.width, obs.x));
      }
      
      // Draw obstacle as pill
      drawPill(ctx, obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width, obs.rotation, true);
      
      return obs.y < height + obs.height;
    });

    // Draw player glow
    const glowColor = currentlyBoosting ? 'rgba(255, 215, 0, ' : 'rgba(0, 255, 136, ';
    const glowGradient = ctx.createRadialGradient(
      gs.playerX + PLAYER_WIDTH / 2, playerY + PLAYER_HEIGHT / 2, 0,
      gs.playerX + PLAYER_WIDTH / 2, playerY + PLAYER_HEIGHT / 2, 80
    );
    glowGradient.addColorStop(0, glowColor + '0.5)');
    glowGradient.addColorStop(0.5, glowColor + '0.2)');
    glowGradient.addColorStop(1, glowColor + '0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(gs.playerX - 50, playerY - 50, PLAYER_WIDTH + 100, PLAYER_HEIGHT + 100);

    // Draw player
    if (gs.playerImage && gs.playerImage.complete) {
      ctx.drawImage(gs.playerImage, gs.playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);
    } else {
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🦸', gs.playerX + PLAYER_WIDTH / 2, playerY + PLAYER_HEIGHT / 2);
    }

    // Collision detection (only when playing) - more forgiving
    if (gs.isRunning) {
      for (const obs of gs.obstacles) {
        if (obs.y < playerY - 100 || obs.y > playerY + PLAYER_HEIGHT + 50) continue;
        
        const px = gs.playerX + PLAYER_WIDTH / 2;
        const py = playerY + PLAYER_HEIGHT / 2;
        const ox = obs.x + obs.width / 2;
        const oy = obs.y + obs.height / 2;
        const dist = Math.sqrt((px - ox) ** 2 + (py - oy) ** 2);
        const collisionDist = (PLAYER_WIDTH + obs.width) / 3.5; // More forgiving hitbox
        
        if (dist < collisionDist) {
          // Game over
          gs.isRunning = false;
          gs.shakeAmount = 20;
          
          // Submit score
          if (playerName && gs.score > 0) {
            submitScore(playerName, gs.score).then((result) => {
              console.log('Score submitted successfully:', result);
            }).catch((error) => {
              console.error('Failed to submit score:', error);
            });
          }
          
          // Update high score
          if (gs.score > highScore) {
            setHighScore(gs.score);
            localStorage.setItem(`pumpfly-highscore-${playerName}`, gs.score.toString());
          }
          
          setIsPlaying(false);
          setIsGameOver(true);
          setIsBoosting(false);
          break;
        }
      }
    }

    // Update score
    gs.frameCount++;
    if (gs.isRunning) {
      gs.gameSpeed = BASE_SPEED + gs.frameCount * SPEED_INCREMENT;
      gs.score = Math.floor(gs.frameCount / 6 * (1 + diffLevel * 0.1));
      
      // Update React state less frequently
      if (gs.frameCount % 6 === 0) {
        setScore(gs.score);
        setDifficulty(diffLevel);
      }
    }

    // Apply screen shake
    if (gs.shakeAmount > 0.5) {
      ctx.setTransform(1, 0, 0, 1, (Math.random() - 0.5) * gs.shakeAmount, (Math.random() - 0.5) * gs.shakeAmount);
      gs.shakeAmount *= 0.9;
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    animationId.current = requestAnimationFrame(gameLoop);
  }, [canvasRef, playerName, highScore]);

  // Start game loop once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      gameState.current.playerX = canvas.width / 2 - PLAYER_WIDTH / 2;
      gameState.current.targetX = gameState.current.playerX;
      gameState.current.demoTargetX = gameState.current.playerX;
    }
    
    animationId.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationId.current);
    };
  }, [gameLoop]);

  // Mouse handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !gameState.current.isRunning) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - PLAYER_WIDTH / 2;
      gameState.current.targetX = Math.max(0, Math.min(canvas.width - PLAYER_WIDTH, x));
    };

    const handleClick = () => {
      const gs = gameState.current;
      if (gs.isRunning && gs.boostCooldownFrames <= 0 && gs.boostFrames <= 0) {
        gs.boostFrames = BOOST_DURATION;
        setIsBoosting(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleClick();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvasRef]);

  const startGame = useCallback(() => {
    const gs = gameState.current;
    const canvas = canvasRef.current;
    
    gs.obstacles = [];
    gs.particles = [];
    gs.frameCount = 0;
    gs.gameSpeed = BASE_SPEED;
    gs.score = 0;
    gs.boostFrames = 0;
    gs.boostCooldownFrames = 0;
    gs.waveTimer = 300;
    gs.isDemo = false;
    gs.shakeAmount = 0;
    gs.isRunning = true;
    
    if (canvas) {
      gs.targetX = gs.playerX;
    }
    
    setScore(0);
    setIsPlaying(true);
    setIsGameOver(false);
    setIsBoosting(false);
    setBoostCooldown(0);
    setDifficulty(1);
  }, [canvasRef]);

  const resetToMenu = useCallback(() => {
    const gs = gameState.current;
    gs.isRunning = false;
    gs.isDemo = true;
    gs.obstacles = [];
    gs.particles = [];
    gs.frameCount = 0;
    
    setIsPlaying(false);
    setIsGameOver(false);
  }, []);

  return {
    score,
    highScore,
    isPlaying,
    isGameOver,
    startGame,
    resetToMenu,
    isBoosting,
    boostCooldown,
    isDemoMode: gameState.current.isDemo,
    difficulty,
  };
}
