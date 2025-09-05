# 🏠 Local Development Setup Guide

This guide shows you how to run the MPA Portal on localhost using a local database, so testing won't affect your production MongoDB Atlas.

## 🎯 What This Achieves

**✅ Safe Testing Environment**
- All changes happen on localhost only
- Production MongoDB Atlas is never touched
- Test tournament applications, approvals, rejections safely

**✅ Real Data for Testing**
- Copy of your production data in local database
- All 26 migrated tournaments available for testing
- Identical functionality to production

## 🚀 Quick Start

### Step 1: Copy Production Data to Local (One-time setup)
```bash
npm run copy-to-local
```

This safely copies your production data to localhost MongoDB for testing.

### Step 2: Start Local Development Server
```bash
# Option A: Backend only (port 5002)
npm run server:dev

# Option B: Full development (backend + frontend)
npm run dev:local
```

### Step 3: Access Your Local MPA Portal
```
🌐 Frontend: http://localhost:3000
🔌 Backend API: http://localhost:5002
🏥 Health Check: http://localhost:5002/api/health
```

## 📊 Database Status

### Production Database (Safe)
```
☁️  mongodb+srv://...@cluster0.../malaysia-pickleball-portal
Status: ✅ Protected (not affected by localhost)
```

### Local Development Database
```
🏠 mongodb://localhost:27017/malaysia-pickleball-portal-dev
Status: 🧪 Testing environment
Data: Copy of production (26 tournaments)
```

## 🔍 Verification

Test that everything works without affecting production:

### 1. Check Health Status
```bash
curl http://localhost:5002/api/health
```

Expected response:
```json
{
  "status": "OK (DEVELOPMENT)",
  "database": "LOCAL MongoDB (safe)",
  "mode": "development"
}
```

### 2. Check Tournament Count
```bash
curl http://localhost:5002/api/approved-tournaments | wc -l
```

Should return: `26` (your migrated tournaments)

### 3. Test Application Submission
- Go to http://localhost:3000
- Submit a test tournament application
- Application ID will have "DEV" prefix (e.g., `DEVAB1234`)
- Email notifications are mocked (won't send real emails)

## 🛡️ Safety Features

### Automatic Protection
- **Database URI Check**: Server refuses to start if pointing to production
- **Safe Mode**: Only starts when `USE_LOCAL_DB=true` or localhost URI detected
- **DEV Prefix**: All test applications get "DEV" prefix in ID
- **Mock Emails**: No real emails sent during testing

### Environment Isolation
```bash
# Production (.env)
MONGODB_URI=mongodb+srv://...atlas.../malaysia-pickleball-portal

# Development (.env.local)  
MONGODB_URI=mongodb://localhost:27017/malaysia-pickleball-portal-dev
USE_LOCAL_DB=true
NODE_ENV=development
```

## 📝 Testing Scenarios

### Test Tournament Applications
1. **Submit New Application**
   - Fill out tournament form
   - Gets ID like `DEVMPA123ABC`
   - Status: "Pending Review"

2. **Admin Approval Workflow**
   - Login to admin dashboard
   - Approve/reject applications
   - See them appear in "Approved Tournaments" folder

3. **Status Updates**
   - Change tournament status
   - Mock emails logged to console
   - Verify data consistency

### Test Compatibility Layer
```bash
# Test old system compatibility
node legacy-tournament-endpoints.js
```

Access: http://localhost:5002/api/tournaments/compatibility-test

## 🔧 File Structure

```
📁 malaysia-pickleball-portal/
├── 📄 .env                     # Production config
├── 📄 .env.local               # Local development config  
├── 📄 server.js                # Production server
├── 📄 server-dev.js            # Development server (local DB)
├── 📄 copy-to-local.js         # Data copying script
├── 📁 config/
│   └── 📄 database.js          # Environment switching logic
└── 📄 LOCAL_DEVELOPMENT_GUIDE.md
```

## 🚨 Troubleshooting

### MongoDB Not Running
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB (Ubuntu/Debian)
sudo systemctl start mongod

# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community
```

### Port Already in Use
```bash
# Kill existing processes
pkill -f "node server"

# Or use different port
PORT=5003 npm run server:dev
```

### Data Not Copying
```bash
# Re-run data copy
npm run copy-to-local

# Check local database
mongosh mongodb://localhost:27017/malaysia-pickleball-portal-dev
```

### Environment Variables Not Loading
```bash
# Verify .env.local exists
ls -la .env.local

# Check contents
cat .env.local
```

## 🎉 Benefits

**✅ Safe Development**
- Zero risk to production data
- Test all features thoroughly
- Debug without consequences

**✅ Realistic Testing**
- Same data as production
- Complete tournament workflow
- Admin dashboard functionality

**✅ Easy Reset**
- Delete local database anytime
- Re-copy production data
- Fresh testing environment

## 🔄 Regular Workflow

### Daily Development
1. Start local server: `npm run server:dev`
2. Make changes and test
3. Data stays local, production safe

### Fresh Data (Weekly)
1. Re-copy production data: `npm run copy-to-local`
2. Get latest tournaments for testing
3. Clear out old test data

### Deploy to Production
1. Test thoroughly on localhost
2. Push code changes (not data)
3. Production uses production database automatically

## 📚 Next Steps

Once comfortable with local development:

1. **Implement New Features** - Test safely on localhost
2. **Database Schema Changes** - Verify on local data first  
3. **API Modifications** - No production impact
4. **Frontend Updates** - Complete local testing environment

Your production MongoDB Atlas remains completely untouched! 🛡️