import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../api/leaderboard';
import { useWallet } from '../hooks/useWallet';
import './StartScreen.css';

interface StartScreenProps {
  onStart: () => void;
  highScore: number;
  playerName: string;
  onChangeName: () => void;
}

export function StartScreen({ onStart, highScore, playerName, onChangeName }: StartScreenProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { walletAddress, isConnecting, isPhantomInstalled, connectWallet, disconnectWallet, getShortAddress } = useWallet();

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      const scores = await getLeaderboard();
      setLeaderboard(scores);
      setIsLoading(false);
    };
    fetchLeaderboard();
    
    // Refresh leaderboard every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTwitterShare = () => {
    window.open('https://x.com/PumpFly_Dev', '_blank');
  };

  return (
    <div className="start-screen">
      <div className="start-content">
        <div className="logo-container">
          <img src="/hero.png" alt="Hero" className="logo-hero" />
          <h1 className="game-title">PUMP FLY</h1>
          <p className="game-subtitle">TO THE MOON 🚀</p>
        </div>

        <div className="player-welcome">
          <span className="welcome-text">Welcome back,</span>
          <span className="welcome-name">{playerName}</span>
          <button className="change-name-btn" onClick={onChangeName}>
            Change Name
          </button>
        </div>

        <div className="instructions">
          <p>🖱️ Move mouse left/right to dodge</p>
          <p>🖱️ <strong>CLICK</strong> or <strong>SPACE</strong> to BOOST!</p>
          <p>⚠️ One hit and you're REKT!</p>
        </div>

        {highScore > 0 && (
          <div className="high-score-badge">
            <span>🏆 YOUR BEST: {highScore.toLocaleString()}</span>
          </div>
        )}

        <button className="start-button" onClick={onStart}>
          <span className="button-text">START FLYING</span>
          <span className="button-icon">🚀</span>
        </button>

        <button className="twitter-button-start" onClick={handleTwitterShare}>
          <span className="button-text">TWITTER</span>
          <span className="button-icon">🐦</span>
        </button>

        <div className="mini-leaderboard">
          <h3 className="mini-lb-title">🌍 TOP PLAYERS</h3>
          <div className="mini-lb-list">
            {isLoading ? (
              <div className="mini-lb-loading">Loading...</div>
            ) : leaderboard.length === 0 ? (
              <div className="mini-lb-empty">Be the first to set a score!</div>
            ) : (
              leaderboard.slice(0, 5).map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`mini-lb-entry ${entry.name === playerName ? 'is-player' : ''}`}
                >
                  <span className="mini-rank">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <span className="mini-name">{entry.name}</span>
                  <span className="mini-score">{entry.score.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
          
          <div className="prize-pool">
            <div className="prize-pool-header">
              <span className="prize-icon">💰</span>
              <h4 className="prize-title">PRIZE POOL</h4>
              <span className="prize-total">1 SOL</span>
            </div>
            <div className="prize-note">
              <span>💎 Based on dev's Pump.fun rewards</span>
            </div>
            <div className="prize-distribution">
              <div className={`prize-row first-place ${leaderboard[0]?.name === playerName ? 'is-player' : ''}`}>
                <span className="prize-rank">🥇</span>
                <span className="prize-winner">{leaderboard[0]?.name || '---'}</span>
                <span className="prize-amount">0.5 SOL</span>
                <span className="prize-percent">50%</span>
              </div>
              <div className={`prize-row ${leaderboard[1]?.name === playerName ? 'is-player' : ''}`}>
                <span className="prize-rank">🥈</span>
                <span className="prize-winner">{leaderboard[1]?.name || '---'}</span>
                <span className="prize-amount">0.25 SOL</span>
                <span className="prize-percent">25%</span>
              </div>
              <div className={`prize-row ${leaderboard[2]?.name === playerName ? 'is-player' : ''}`}>
                <span className="prize-rank">🥉</span>
                <span className="prize-winner">{leaderboard[2]?.name || '---'}</span>
                <span className="prize-amount">0.15 SOL</span>
                <span className="prize-percent">15%</span>
              </div>
              <div className={`prize-row ${leaderboard[3]?.name === playerName ? 'is-player' : ''}`}>
                <span className="prize-rank">#4</span>
                <span className="prize-winner">{leaderboard[3]?.name || '---'}</span>
                <span className="prize-amount">0.07 SOL</span>
                <span className="prize-percent">7%</span>
              </div>
              <div className={`prize-row ${leaderboard[4]?.name === playerName ? 'is-player' : ''}`}>
                <span className="prize-rank">#5</span>
                <span className="prize-winner">{leaderboard[4]?.name || '---'}</span>
                <span className="prize-amount">0.03 SOL</span>
                <span className="prize-percent">3%</span>
              </div>
            </div>
            
            {/* Wallet Connection */}
            <div className="wallet-section">
              {!walletAddress ? (
                <button 
                  className="connect-wallet-btn" 
                  onClick={connectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>⏳ Connecting...</>
                  ) : (
                    <>🦄 Connect Phantom Wallet</>
                  )}
                </button>
              ) : (
                <div className="wallet-connected">
                  <div className="wallet-info">
                    <span className="wallet-label">Connected:</span>
                    <span className="wallet-address">{getShortAddress(walletAddress)}</span>
                    <button className="disconnect-wallet-btn" onClick={disconnectWallet}>
                      ✕
                    </button>
                  </div>
                  
                  {/* Check if player is a winner */}
                  {(() => {
                    const playerRank = leaderboard.findIndex(entry => entry.name === playerName);
                    const isWinner = playerRank >= 0 && playerRank < 5;
                    const prizeAmounts = [0.5, 0.25, 0.15, 0.07, 0.03];
                    const prizeAmount = isWinner ? prizeAmounts[playerRank] : 0;
                    
                    return isWinner ? (
                      <button 
                        className="claim-prize-btn"
                        onClick={() => {
                          alert(`Claim functionality will be implemented!\n\nYou won ${prizeAmount} SOL!\n\nWallet: ${walletAddress}`);
                        }}
                      >
                        🎁 Claim {prizeAmount} SOL Prize
                      </button>
                    ) : (
                      <div className="not-winner-message">
                        Connect wallet to claim prize if you're a winner!
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
