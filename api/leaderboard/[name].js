import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Use /tmp directory for Vercel serverless functions (writable)
const DATA_FILE = process.env.VERCEL 
  ? join('/tmp', 'leaderboard.json')
  : join(process.cwd(), 'server', 'leaderboard.json');

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
      
      if (!existsSync(DATA_FILE)) {
        return res.status(200).json([]);
      }

      const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      
      const playerScores = data.scores
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
