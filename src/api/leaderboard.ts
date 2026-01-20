import { LeaderboardEntry } from '../types';

// Use relative URL for production, localhost for development
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    console.log(`Fetching leaderboard from ${API_URL}/leaderboard`);
    const response = await fetch(`${API_URL}/leaderboard`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    const scores = await response.json();
    console.log(`Fetched ${scores.length} scores from server`);
    return scores;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    // Fallback to localStorage if server is not available
    const saved = localStorage.getItem('pumpfly-leaderboard');
    const fallbackScores = saved ? JSON.parse(saved) : [];
    console.log(`Using ${fallbackScores.length} scores from localStorage fallback`);
    return fallbackScores;
  }
}

export async function submitScore(name: string, score: number): Promise<LeaderboardEntry | null> {
  console.log(`Submitting score: ${name} - ${score} to ${API_URL}/leaderboard`);
  try {
    const response = await fetch(`${API_URL}/leaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, score }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Failed to submit score: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Score submitted successfully:', result);
    return result;
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
    console.log('Saved to localStorage as fallback');
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
