export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cloud' | 'meteor' | 'rug' | 'pump' | 'rocket' | 'moon';
  rotation: number;
  horizontalSpeed?: number;
}

export interface Particle {
  x: number;
  y: number;
  alpha: number;
  size: number;
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  distance: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: string;
}
