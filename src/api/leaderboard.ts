import { LeaderboardEntry } from '../types';

// Use relative URL for production, localhost for development
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_URL}/leaderboard`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return await response.json();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    // Fallback to localStorage if server is not available
    const saved = localStorage.getItem('pumpfly-leaderboard');
    return saved ? JSON.parse(saved) : [];
  }
}

export async function submitScore(name: string, score: number): Promise<LeaderboardEntry | null> {
  try {
    const response = await fetch(`${API_URL}/leaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, score }),
    });
    
    if (!response.ok) throw new Error('Failed to submit score');
    return await response.json();
  } catch (error) {
    console.error('Error submitting score:', error);
    // Fallback to localStorage
    const saved = localStorage.getItem('pumpfly-leaderboard');
    const scores: LeaderboardEntry[] = saved ? JSON.parse(saved) : [];
    const newEntry: LeaderboardEntry = {
      id: Date.now().toString(),
      name,
      score,
      date: new Date().toISOString(),
    };
    scores.push(newEntry);
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('pumpfly-leaderboard', JSON.stringify(scores.slice(0, 50)));
    return newEntry;
  }
}

export async function getPlayerScores(name: string): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_URL}/leaderboard/${encodeURIComponent(name)}`);
    if (!response.ok) throw new Error('Failed to fetch player scores');
    return await response.json();
  } catch (error) {
    console.error('Error fetching player scores:', error);
    return [];
  }
}
