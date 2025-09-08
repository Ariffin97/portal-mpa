# Local Development Sync Guide

This guide explains how to work with the tournament sync system in local development mode without interfering with MongoDB Atlas production data.

## Quick Setup for Local Development

1. **Create `.env.local`** (copy from template):
   ```bash
   cp .env.local.template .env.local
   ```

2. **Verify the content** of `.env.local`:
   ```bash
   # Key setting to enable local isolation
   USE_LOCAL_DB=true
   ENABLE_DATABASE_SYNC=true
   ```

3. **Start your local MongoDB** (if not already running):
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Linux systemd
   sudo systemctl start mongod
   
   # Manual start
   mongod --dbpath /path/to/your/data
   ```

## How It Works

### Production Mode (`.env`)
- **Portal Database**: `mongodb+srv://...atlas.../malaysia-pickleball-portal`
- **Old Database**: `mongodb+srv://...atlas.../malaysia-pickleball`
- **Sync**: Atlas ↔ Atlas

### Local Development Mode (`.env.local`)
- **Portal Database**: `mongodb://localhost:27017/malaysia-pickleball-portal-dev`
- **Old Database**: `mongodb://localhost:27017/malaysia-pickleball-dev`
- **Sync**: Localhost ↔ Localhost (completely isolated!)

## Sync Features Available in Local Mode

### ✅ What Works in Local Development

1. **Forward Sync** (Portal → Old Database):
   - Approve tournament → Automatically migrates to old database
   - Update approved tournament → Automatically updates old database

2. **Reverse Sync** (Old Database → Portal):
   - Manual sync via API endpoints
   - All sync operations stay within localhost

3. **API Endpoints**:
   ```bash
   GET  /api/sync/status              # Check sync status
   POST /api/sync/tournament/:id      # Sync specific tournament
   POST /api/sync/all-tournaments     # Sync all tournaments
   ```

### 🔒 Safety Features

- **Complete Isolation**: Local mode never touches Atlas
- **Safe Mode**: Automatic detection and warnings
- **Environment Detection**: Clear logging of which mode you're in

## Testing Your Setup

Run this command to verify your local setup:

```bash
node -e "
const { getDatabaseConfig, getOldDatabaseConfig, isLocalDevelopment } = require('./config/database');
console.log('Local Development:', isLocalDevelopment());
console.log('New DB:', getDatabaseConfig().uri);
console.log('Old DB:', getOldDatabaseConfig().uri);
"
```

**Expected output for local development:**
```
Local Development: true
New DB: mongodb://localhost:27017/malaysia-pickleball-portal-dev
Old DB: mongodb://localhost:27017/malaysia-pickleball-dev
```

## Starting the Server

When you start the server in local development mode:

```bash
npm start
```

You should see output like:
```
📁 Using .env.local (local development mode)
🏠 Using LOCAL MongoDB for development
🏠 Old database mapped to LOCAL for testing
🔄 Local Development: Database sync ENABLED (local-to-local only)
✅ Connected to MongoDB (local)
```

## Switching Between Modes

| To Use | Action |
|--------|--------|
| **Production/Atlas** | Remove or rename `.env.local` |
| **Local Development** | Ensure `.env.local` exists with `USE_LOCAL_DB=true` |

## Troubleshooting

### Problem: Still connecting to Atlas in local mode
**Solution**: Check that `.env.local` exists and contains `USE_LOCAL_DB=true`

### Problem: MongoDB connection errors in local mode
**Solution**: Make sure local MongoDB is running:
```bash
# Check if MongoDB is running
ps aux | grep mongod
# Or try connecting directly
mongo --eval "db.runCommand({connectionStatus: 1})"
```

### Problem: Sync not working in local mode
**Solution**: Verify `ENABLE_DATABASE_SYNC=true` in `.env.local`

## Best Practices

1. **Always use `.env.local`** for local development
2. **Never commit `.env.local`** to git (already in .gitignore)  
3. **Test sync functionality locally** before production
4. **Verify isolation** before making changes

---

**✅ With this setup, you can safely test all tournament sync functionality locally without any risk of affecting the production Atlas database!**