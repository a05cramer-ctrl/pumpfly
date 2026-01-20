# Leaderboard Setup Guide

The leaderboard now uses **Vercel KV** (Redis) for persistent storage, which solves the issue of scores disappearing on Vercel deployments.

## Setup Instructions

### For Vercel Deployment:

1. **Install Vercel KV** in your Vercel project:
   - Go to your Vercel project dashboard
   - Navigate to **Storage** → **Create Database**
   - Select **KV** (Redis)
   - Create the database

2. **Add Environment Variables**:
   - Vercel will automatically add these environment variables:
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
   - These are automatically available to your serverless functions

3. **Deploy**:
   - The code will automatically detect Redis and use it
   - If Redis is not configured, it will fall back to file system (local dev only)

### For Local Development:

The code will automatically use the local file system (`server/leaderboard.json`) when Redis is not configured. This works fine for local testing.

### Migration from Old Scores:

If you have existing scores in `server/leaderboard.json`, they will be used when running locally. For production on Vercel, you'll need to either:
- Manually add scores through the API after setting up KV
- Or migrate the existing scores (contact support if needed)

## How It Works:

- **Production (Vercel)**: Uses Redis via Vercel KV for persistent storage
- **Local Development**: Uses file system (`server/leaderboard.json`)
- **Automatic Fallback**: If Redis is not available, falls back gracefully

## Testing:

1. Run locally: `npm run dev`
2. Submit a score
3. Check `server/leaderboard.json` - scores should be saved there
4. Deploy to Vercel with KV configured
5. Scores will persist across deployments!
