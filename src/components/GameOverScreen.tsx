import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../api/leaderboard';
import './GameOverScreen.css';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  playerName: string;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export function GameOverScreen({
  score,
  highScore,
  playerName,
  onRestart,
  onBackToMenu,
}: GameOverScreenProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isNewHighScore = score >= highScore && score > 0;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      const scores = await getLeaderboard();
      setLeaderboard(scores);
      setIsLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const playerRank = leaderboard.findIndex(
    entry => entry.name === playerName && entry.score === score
  ) + 1;

  const handleTwitterShare = () => {
    window.open('https://x.com/PumpFly_Dev', '_blank');
  };

  return (
    <div className="game-over-screen">
      <div className="game-over-content">
        <div className="crash-header">
          <span className="crash-emoji">💥</span>
          <h1 className="game-over-title">REKT!</h1>
          {isNewHighScore && (
            <div className="new-high-score-badge">
              <span>🎉 NEW PERSONAL BEST! 🎉</span>
            </div>
          )}
        </div>

        <div className="player-info">
          <span className="player-name">{playerName}</span>
          {playerRank > 0 && playerRank <= 10 && (
            <span className="player-rank">#{playerRank} WORLDWIDE!</span>
          )}
        </div>

        <div className="score-summary">
          <div className="final-score">
            <span className="label">YOUR SCORE</span>
            <span className="value">{score.toLocaleString()}</span>
          </div>
          <div className="best-score">
            <span className="label">YOUR BEST</span>
            <span className="value">{highScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="leaderboard">
          <h2 className="leaderboard-title">
            <span>🏆</span> GLOBAL LEADERBOARD <span>🏆</span>
          </h2>
          <div className="leaderboard-list">
            {isLoading ? (
              <div className="loading">Loading scores...</div>
            ) : leaderboard.length === 0 ? (
              <div className="no-scores">No scores yet! Be the first!</div>
            ) : (
              leaderboard.slice(0, 10).map((entry, index) => (
                <div
                  key={entry.id}
                  className={`leaderboard-entry ${
                    entry.name === playerName && entry.score === score ? 'current' : ''
                  } ${entry.name === playerName ? 'is-player' : ''}`}
                >
                  <span className="rank">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <span className="entry-name">{entry.name}</span>
                  <span className="entry-score">{entry.score.toLocaleString()}</span>
                  <span className="entry-date">{formatDate(entry.date)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="button-group">
          <button className="restart-button" onClick={onRestart}>
            <span className="button-text">TRY AGAIN</span>
            <span className="button-icon">🔄</span>
          </button>
          
          <button className="twitter-button" onClick={handleTwitterShare}>
            <span className="button-text">TWITTER</span>
            <span className="button-icon">🐦</span>
          </button>
          
          <button className="menu-button" onClick={onBackToMenu}>
            <span className="button-text">BACK TO MENU</span>
            <span className="button-icon">🏠</span>
          </button>
        </div>

        <div className="meme-footer">
          <span>WAGMI 💎🙌</span>
        </div>
      </div>
    </div>
  );
}
