import { useRef, useEffect, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { GameOverScreen } from './GameOverScreen';
import { StartScreen } from './StartScreen';
import { NameEntry } from './NameEntry';
import './GameCanvas.css';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('pumpfly-playername') || '';
  });
  const [showNameEntry, setShowNameEntry] = useState(!playerName);

  const {
    score,
    highScore,
    isPlaying,
    isGameOver,
    startGame,
    resetToMenu,
    isBoosting,
    boostCooldown,
    difficulty,
  } = useGame(canvasRef, playerName);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('pumpfly-playername', name);
    setShowNameEntry(false);
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 1) return 'EASY';
    if (level <= 2) return 'MEDIUM';
    if (level <= 3) return 'HARD';
    if (level <= 4) return 'INSANE';
    if (level <= 5) return 'NIGHTMARE';
    return 'IMPOSSIBLE';
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 1) return '#00ff88';
    if (level <= 2) return '#ffff00';
    if (level <= 3) return '#ff8800';
    if (level <= 4) return '#ff4444';
    if (level <= 5) return '#ff00ff';
    return '#ff0000';
  };

  if (showNameEntry) {
    return (
      <div className="game-container">
        <canvas ref={canvasRef} className="game-canvas" />
        <NameEntry onSubmit={handleNameSubmit} savedName={playerName} />
      </div>
    );
  }

  return (
    <div className={`game-container ${isPlaying ? 'playing' : ''}`}>
      <canvas ref={canvasRef} className="game-canvas" />
      
      {isPlaying && (
        <>
          <div className="hud">
            <div className="score-display">
              <span className="score-label">SCORE</span>
              <span className="score-value">{score.toLocaleString()}</span>
            </div>
            <div 
              className="difficulty-display"
              style={{ borderColor: getDifficultyColor(difficulty) }}
            >
              <span className="difficulty-label">LEVEL</span>
              <span 
                className="difficulty-value"
                style={{ color: getDifficultyColor(difficulty) }}
              >
                {getDifficultyLabel(difficulty)}
              </span>
            </div>
            <div className="high-score-display">
              <span className="high-score-label">HIGH</span>
              <span className="high-score-value">{highScore.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="player-name-badge">
            <span>🦸 {playerName}</span>
          </div>
          
          <div className={`boost-indicator ${isBoosting ? 'active' : ''} ${boostCooldown > 0 ? 'cooldown' : ''}`}>
            {isBoosting ? (
              <>
                <span className="boost-icon">🔥</span>
                <span className="boost-text">BOOSTING!</span>
              </>
            ) : boostCooldown > 0 ? (
              <>
                <span className="boost-icon">⏳</span>
                <span className="boost-text">COOLDOWN {boostCooldown}s</span>
              </>
            ) : (
              <>
                <span className="boost-icon">⚡</span>
                <span className="boost-text">CLICK TO BOOST</span>
              </>
            )}
          </div>
        </>
      )}

      {!isPlaying && !isGameOver && (
        <StartScreen 
          onStart={startGame} 
          highScore={highScore}
          playerName={playerName}
          onChangeName={() => setShowNameEntry(true)}
        />
      )}

      {isGameOver && (
        <GameOverScreen
          score={score}
          highScore={highScore}
          playerName={playerName}
          onRestart={startGame}
          onBackToMenu={resetToMenu}
        />
      )}
    </div>
  );
}
