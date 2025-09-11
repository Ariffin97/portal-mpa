# 🏠 Local Development Setup Guide

This guide shows you how to run the MPA Portal on localhost using a local database, so testing won't affect your production MongoDB Atlas.

## 🎯 What This Achieves

**✅ Safe Testing Environment**
- All changes happen on localhost only
- Production MongoDB Atlas is never touched
- Test tournament applications, approvals, rejections safely

**✅ Independent Development**
- Portal runs completely independently
- No external database dependencies
- Full tournament management functionality

## 🚀 Quick Start

### Step 1: Set Up Local Environment
Create a `.env.local` file for development:
```bash
cp .env.local.template .env.local
```

Edit `.env.local` with your local settings:
```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/malaysia-pickleball-portal-dev
USE_LOCAL_DB=true
NODE_ENV=development

# Local API URL
REACT_APP_API_URL=http://localhost:5001/api

# Email settings (optional for testing)
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password
```

### Step 2: Start Local Development Server
```bash
# Backend only (port 5001)
npm run server:dev

# Or full development (backend + frontend)
npm run dev
```

### Step 3: Access Your Local MPA Portal
```
🌐 Frontend: http://localhost:3000
🔌 Backend API: http://localhost:5001
🏥 Health Check: http://localhost:5001/api/health
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
Data: Independent development database
```

## 🔍 Verification

Test that everything works:

### 1. Check Health Status
```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "status": "OK (DEVELOPMENT)",
  "database": "LOCAL MongoDB (safe)",
  "mode": "development"
}
```

### 2. Test Application Submission
- Go to http://localhost:3000
- Submit a test tournament application
- Application ID will have standard format (e.g., `MPA123ABC`)
- Check that data is saved in your local database

## 🛡️ Safety Features

### Automatic Protection
- **Database URI Check**: Server uses local database when `USE_LOCAL_DB=true`
- **Safe Mode**: Only uses local MongoDB when in development
- **Environment Isolation**: Separate config files for development and production

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
   - Gets standard ID like `MPA123ABC`
   - Status: "Pending Review"

2. **Admin Approval Workflow**
   - Login to admin dashboard
   - Approve/reject applications
   - See them appear in "Approved Tournaments"

3. **Status Updates**
   - Change tournament status
   - Email notifications (if configured)
   - Verify data consistency

## 🔧 File Structure

```
📁 malaysia-pickleball-portal/
├── 📄 .env                     # Production config
├── 📄 .env.local               # Local development config  
├── 📄 server.js                # Main server file
├── 📁 config/
│   └── 📄 database.js          # Database configuration
├── 📁 src/                     # Frontend React app
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
PORT=5002 npm start
```

### Environment Variables Not Loading
```bash
# Verify .env.local exists
ls -la .env.local

# Check contents
cat .env.local
```

## 🎉 Benefits

**✅ Independent Development**
- No external database dependencies
- Self-contained portal system
- Full control over your data

**✅ Safe Testing**
- Zero risk to production data
- Test all features thoroughly
- Debug without consequences

**✅ Easy Setup**
- Simple local MongoDB setup
- Standard development workflow
- No complex sync processes

## 🔄 Regular Workflow

### Daily Development
1. Start local server: `npm start` or `npm run server:dev`
2. Make changes and test
3. Data stays local, production safe

### Deploy to Production
1. Test thoroughly on localhost
2. Push code changes
3. Production uses production database automatically

## 📚 Next Steps

Once comfortable with local development:

1. **Implement New Features** - Test safely on localhost
2. **Database Schema Changes** - Verify on local data first  
3. **API Modifications** - No production impact
4. **Frontend Updates** - Complete local testing environment

Your production MongoDB Atlas remains completely untouched! 🛡️