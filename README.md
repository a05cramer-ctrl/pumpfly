# 🚀 PUMP FLY - To The Moon!

An endless flying game inspired by Pump.fun, built with React, Vite, and TypeScript.

## 🎮 Features

- **Endless Flying Gameplay** - Dodge obstacles and fly to the moon!
- **Boost Mechanic** - Click or press Space to boost your speed
- **Progressive Difficulty** - Game gets harder as you progress
- **Global Leaderboard** - Compete with players worldwide
- **Prize Pool** - Win SOL based on dev's Pump.fun rewards
- **Beautiful Space Background** - Nebulas, planets, and stars

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Express.js (local) / Vercel Serverless Functions (production)
- **Styling**: CSS with animations
- **Canvas**: HTML5 Canvas for game rendering

## 📦 Installation

```bash
npm install
```

## 🚀 Development

```bash
npm run dev
```

This starts both the frontend (Vite) and backend (Express) servers.

## 🏗️ Build

```bash
npm run build
```

Builds the app for production to the `dist` folder.

## 🌐 Deployment

### Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect the Vite configuration
4. Deploy!

The project includes:
- `vercel.json` - Vercel configuration
- `api/` - Serverless functions for leaderboard API

### Environment Variables

No environment variables required for basic functionality.

## 📝 API Endpoints

- `GET /api/leaderboard` - Get top scores
- `POST /api/leaderboard` - Submit a new score
- `GET /api/leaderboard/:name` - Get player's scores

## 🎯 Game Controls

- **Mouse Movement** - Move left/right to dodge obstacles
- **Click or Space** - Activate boost (with cooldown)

## 📄 License

MIT
