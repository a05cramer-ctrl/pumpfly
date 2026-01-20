import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Use /tmp directory for Vercel serverless functions (writable)
const DATA_FILE = process.env.VERCEL 
  ? join('/tmp', 'leaderboard.json')
  : join(process.cwd(), 'server', 'leaderboard.json');

// Initialize data file if it doesn't exist
function ensureDataFile() {
  if (!existsSync(DATA_FILE)) {
    // Ensure directory exists
    const dir = DATA_FILE.substring(0, DATA_FILE.lastIndexOf('/'));
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify({ scores: [] }));
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
      ensureDataFile();
      const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      const sortedScores = data.scores
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
      ensureDataFile();
      const { name, score } = req.body;
      
      if (!name || typeof score !== 'number') {
        return res.status(400).json({ error: 'Name and score are required' });
      }

      const sanitizedName = name.trim().slice(0, 20); // Max 20 characters
      
      let data;
      try {
        data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      } catch {
        data = { scores: [] };
      }
      
      const newEntry = {
        id: Date.now().toString(),
        name: sanitizedName,
        score,
        date: new Date().toISOString(),
      };
      
      data.scores.push(newEntry);
      
      // Keep only top 100 scores to prevent file from growing too large
      data.scores = data.scores
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);
      
      writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      
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
