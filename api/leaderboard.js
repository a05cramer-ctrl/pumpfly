import { kv } from '@vercel/kv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const USE_REDIS = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const IS_VERCEL = process.env.VERCEL;

// Fallback to file system for local development or Vercel /tmp
const DATA_FILE = IS_VERCEL 
  ? join('/tmp', 'leaderboard.json')
  : join(process.cwd(), 'server', 'leaderboard.json');

// Initialize data file if it doesn't exist
function ensureDataFile() {
  if (!USE_REDIS && !existsSync(DATA_FILE)) {
    try {
      // Ensure directory exists for /tmp
      if (IS_VERCEL) {
        const dir = DATA_FILE.substring(0, DATA_FILE.lastIndexOf('/'));
        if (dir && !existsSync(dir)) {
          // /tmp should always exist, but just in case
        }
      }
      writeFileSync(DATA_FILE, JSON.stringify({ scores: [] }));
    } catch (error) {
      console.error('Error creating data file:', error);
    }
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
      console.log(`[Vercel] Saved ${scores.length} scores to Redis`);
    } catch (error) {
      console.error('[Vercel] Error saving to Redis:', error);
      throw error;
    }
  } else {
    // File system fallback (local dev or Vercel /tmp)
    try {
      ensureDataFile();
      writeFileSync(DATA_FILE, JSON.stringify({ scores }, null, 2));
      console.log(`[Vercel] Saved ${scores.length} scores to file: ${DATA_FILE}`);
    } catch (error) {
      console.error('[Vercel] Error saving to file system:', error);
      console.error('[Vercel] File path:', DATA_FILE);
      throw error;
    }
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
      
      console.log(`[Vercel] Received score submission: ${name} - ${score}, Redis: ${USE_REDIS}, Vercel: ${IS_VERCEL}`);
      
      if (!name || typeof score !== 'number') {
        console.error(`[Vercel] Invalid score submission:`, { name, score, nameType: typeof name, scoreType: typeof score });
        return res.status(400).json({ error: 'Name and score are required' });
      }

      const sanitizedName = name.trim().slice(0, 20); // Max 20 characters
      
      const scores = await getScores();
      console.log(`[Vercel] Current scores count: ${scores.length}`);
      
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
      console.log(`[Vercel] Score saved successfully. Total scores: ${sortedScores.length}`);
      
      res.status(200).json(newEntry);
    } catch (error) {
      console.error('[Vercel] Error saving score:', error);
      console.error('[Vercel] Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to save score', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
