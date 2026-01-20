import { kv } from '@vercel/kv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const USE_REDIS = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Fallback to file system for local development
const DATA_FILE = join(process.cwd(), 'server', 'leaderboard.json');

// Redis key for leaderboard
const LEADERBOARD_KEY = 'leaderboard:scores';

// Get scores from Redis or file system
async function getScores() {
  if (USE_REDIS) {
    try {
      const scores = await kv.get(LEADERBOARD_KEY);
      return scores || [];
    } catch (error) {
      console.error('Error reading from Redis:', error);
      return [];
    }
  } else {
    // Local file system fallback
    if (!existsSync(DATA_FILE)) {
      return [];
    }
    try {
      const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      return data.scores || [];
    } catch {
      return [];
    }
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const { name } = req.query;
      
      const scores = await getScores();
      
      const playerScores = scores
        .filter(s => s.name.toLowerCase() === name.toLowerCase())
        .sort((a, b) => b.score - a.score);
      
      res.status(200).json(playerScores);
    } catch (error) {
      console.error('Error reading player scores:', error);
      res.status(500).json({ error: 'Failed to read player scores' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
