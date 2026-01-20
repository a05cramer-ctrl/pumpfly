import { kv } from '@vercel/kv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const USE_REDIS = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Fallback to file system for local development
const DATA_FILE = join(process.cwd(), 'server', 'leaderboard.json');

// Initialize data file if it doesn't exist (for local dev)
function ensureDataFile() {
  if (!USE_REDIS && !existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify({ scores: [] }));
  }
}

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
    ensureDataFile();
    try {
      const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      return data.scores || [];
    } catch {
      return [];
    }
  }
}

// Save scores to Redis or file system
async function saveScores(scores) {
  if (USE_REDIS) {
    try {
      await kv.set(LEADERBOARD_KEY, scores);
    } catch (error) {
      console.error('Error saving to Redis:', error);
      throw error;
    }
  } else {
    // Local file system fallback
    ensureDataFile();
    writeFileSync(DATA_FILE, JSON.stringify({ scores }, null, 2));
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Get all scores
    try {
      const scores = await getScores();
      const sortedScores = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 50); // Top 50 scores
      res.status(200).json(sortedScores);
    } catch (error) {
      console.error('Error reading leaderboard:', error);
      res.status(200).json([]); // Return empty array on error
    }
  } else if (req.method === 'POST') {
    // Add a new score
    try {
      const { name, score } = req.body;
      
      if (!name || typeof score !== 'number') {
        return res.status(400).json({ error: 'Name and score are required' });
      }

      const sanitizedName = name.trim().slice(0, 20); // Max 20 characters
      
      const scores = await getScores();
      
      const newEntry = {
        id: Date.now().toString(),
        name: sanitizedName,
        score,
        date: new Date().toISOString(),
      };
      
      scores.push(newEntry);
      
      // Keep only top 100 scores to prevent storage from growing too large
      const sortedScores = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);
      
      await saveScores(sortedScores);
      
      res.status(200).json(newEntry);
    } catch (error) {
      console.error('Error saving score:', error);
      res.status(500).json({ error: 'Failed to save score' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
