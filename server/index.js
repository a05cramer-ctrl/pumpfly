import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = join(__dirname, 'leaderboard.json');

app.use(cors());
app.use(express.json());

// Initialize data file if it doesn't exist
if (!existsSync(DATA_FILE)) {
  writeFileSync(DATA_FILE, JSON.stringify({ scores: [] }));
}

// Get all scores
app.get('/api/leaderboard', (req, res) => {
  try {
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
    const sortedScores = data.scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 50); // Top 50 scores
    res.json(sortedScores);
  } catch (error) {
    console.error('Error reading leaderboard:', error);
    res.status(500).json({ error: 'Failed to read leaderboard' });
  }
});

// Add a new score
app.post('/api/leaderboard', (req, res) => {
  try {
    const { name, score } = req.body;
    
    if (!name || typeof score !== 'number') {
      return res.status(400).json({ error: 'Name and score are required' });
    }

    const sanitizedName = name.trim().slice(0, 20); // Max 20 characters
    
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
    
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
    
    res.json(newEntry);
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// Get player's best score
app.get('/api/leaderboard/:name', (req, res) => {
  try {
    const { name } = req.params;
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
    
    const playerScores = data.scores
      .filter(s => s.name.toLowerCase() === name.toLowerCase())
      .sort((a, b) => b.score - a.score);
    
    res.json(playerScores);
  } catch (error) {
    console.error('Error reading player scores:', error);
    res.status(500).json({ error: 'Failed to read player scores' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Leaderboard server running on http://localhost:${PORT}`);
});
