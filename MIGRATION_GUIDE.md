# Tournament System Migration Guide

This guide helps you migrate your existing tournament system to use the new MPA Portal database as the single source of truth.

## 🎯 Migration Overview

**Before:** Two separate databases
- `malaysia-pickleball` (old system)
- `malaysia-pickleball-portal` (new system)

**After:** Single database
- `malaysia-pickleball-portal` (unified system)
- All systems read from the same source
- All approved tournaments available everywhere

## 📋 What Changed

### Old Tournament Schema
```javascript
{
  _id: ObjectId,
  name: String,
  startDate: Date,
  endDate: Date,
  type: String, // 'local', 'state', 'sarawak', 'national', 'wmalaysia'
  registrationOpen: Boolean,
  venue: String,
  city: String,
  organizer: String
}
```

### New Tournament Schema (TournamentApplication)
```javascript
{
  _id: ObjectId,
  eventTitle: String,
  eventStartDate: Date,
  eventEndDate: Date,
  classification: String, // 'District', 'State', 'National', 'Divisional'
  status: String, // 'Approved' tournaments are visible
  venue: String,
  city: String,
  state: String,
  organiserName: String,
  // ... many more fields for comprehensive tournament management
}
```

## 🔧 Step-by-Step Migration

### Step 1: Install Compatibility Layer

Copy these files to your old system:
- `tournament-compatibility-layer.js`
- `legacy-tournament-endpoints.js`

### Step 2: Update Database Connection

**Old Code:**
```javascript
const MONGODB_URI = 'mongodb+srv://user:pass@cluster.net/malaysia-pickleball';
```

**New Code:**
```javascript
const MONGODB_URI = 'mongodb+srv://user:pass@cluster.net/malaysia-pickleball-portal';
```

### Step 3: Replace Tournament Queries

**Old Code:**
```javascript
const mongoose = require('mongoose');
const Tournament = mongoose.model('Tournament', tournamentSchema);

// Get all tournaments
const tournaments = await Tournament.find({ registrationOpen: true });

// Get tournament by ID
const tournament = await Tournament.findById(tournamentId);

// Get tournaments by type
const sarawakTournaments = await Tournament.find({ type: 'sarawak' });
```

**New Code:**
```javascript
const { TournamentCompatibilityLayer } = require('./tournament-compatibility-layer');

// Initialize compatibility layer
const compatibilityLayer = new TournamentCompatibilityLayer(process.env.MONGODB_URI);
await compatibilityLayer.connect();

// Get all approved tournaments (equivalent to registrationOpen: true)
const tournaments = await compatibilityLayer.getAllTournaments();

// Get tournament by ID
const tournament = await compatibilityLayer.getTournamentById(tournamentId);

// Get tournaments by type
const sarawakTournaments = await compatibilityLayer.getTournamentsByType('sarawak');
```

### Step 4: Update API Endpoints

**Old Express Routes:**
```javascript
// Replace these old routes
app.get('/api/tournaments', async (req, res) => {
  const tournaments = await Tournament.find();
  res.json(tournaments);
});
```

**New Express Routes:**
```javascript
// With new compatibility layer
const tournamentMiddleware = createTournamentMiddleware(compatibilityLayer);
app.get('/api/tournaments', tournamentMiddleware.getAllTournaments);
```

### Step 5: Handle Tournament Types

The compatibility layer automatically maps between old and new types:

| Old Type | New Classification | Notes |
|----------|-------------------|-------|
| `local` | `District` | Local/district level |
| `state` | `State` | State level (non-Sarawak) |
| `sarawak` | `State` | Sarawak state tournaments |
| `national` | `National` | National level |
| `wmalaysia` | `Divisional` | West Malaysia region |

### Step 6: Update Tournament Registration Logic

**Old Logic:**
```javascript
const openTournaments = await Tournament.find({ registrationOpen: true });
```

**New Logic:**
```javascript
// All approved tournaments are considered "open" for registration
const openTournaments = await compatibilityLayer.getAllTournaments();
// OR for upcoming only:
const upcomingTournaments = await compatibilityLayer.getUpcomingTournaments();
```

## 🧪 Testing the Migration

### Test Compatibility
```bash
node legacy-tournament-endpoints.js
```

Then visit: `http://localhost:5002/api/tournaments/compatibility-test`

Expected response:
```json
{
  "totalApprovedTournaments": 26,
  "upcomingTournaments": 20,
  "stats": {
    "total": 26,
    "upcoming": 20,
    "thisMonth": 3,
    "registrationOpen": 20
  },
  "compatibility": "SUCCESS",
  "message": "Old system can now read tournaments from new MPA Portal database"
}
```

### Test Individual Endpoints
- `GET /api/tournaments` - All approved tournaments
- `GET /api/tournaments/type/sarawak` - Sarawak tournaments
- `GET /api/tournaments/upcoming` - Upcoming tournaments
- `GET /api/tournaments/stats` - Tournament statistics

## 📱 Frontend Updates

### React/Vue Components

**Old Code:**
```javascript
const response = await fetch('/api/tournaments');
const tournaments = await response.json();
// tournaments have: name, startDate, endDate, type, registrationOpen
```

**New Code (No Change Required!):**
```javascript
const response = await fetch('/api/tournaments');
const tournaments = await response.json();
// tournaments still have: name, startDate, endDate, type, registrationOpen
// (converted automatically by compatibility layer)
```

### Angular Services

**Old Service:**
```typescript
getTournaments(): Observable<Tournament[]> {
  return this.http.get<Tournament[]>('/api/tournaments');
}
```

**New Service (No Change Required!):**
```typescript
// Same code works! Compatibility layer handles the conversion
getTournaments(): Observable<Tournament[]> {
  return this.http.get<Tournament[]>('/api/tournaments');
}
```

## 🔄 Tournament Notice Updates

For `tournamentnotices` collection that references `tournamentName`:

**Migration Script:**
```javascript
// Update tournament notices to use new tournament names
const { TournamentCompatibilityLayer } = require('./tournament-compatibility-layer');

async function updateTournamentNotices() {
  const compatibilityLayer = new TournamentCompatibilityLayer(process.env.MONGODB_URI);
  await compatibilityLayer.connect();
  
  // Get all notices
  const notices = await db.collection('tournamentnotices').find({}).toArray();
  
  for (const notice of notices) {
    // Find matching tournament in new system
    const tournament = await compatibilityLayer.getTournamentByName(notice.tournamentName);
    if (tournament) {
      // Update notice with any additional info if needed
      console.log(`✅ Notice for ${notice.tournamentName} is compatible`);
    } else {
      console.log(`⚠️ Notice for ${notice.tournamentName} needs review`);
    }
  }
}
```

## 🚀 Deployment Checklist

- [ ] Update environment variables to point to new database
- [ ] Deploy compatibility layer files
- [ ] Update all tournament query code
- [ ] Test all tournament-related endpoints
- [ ] Verify frontend displays tournaments correctly
- [ ] Update any scheduled jobs or cron tasks
- [ ] Update documentation and API docs
- [ ] Monitor for any missing tournament references

## 🎉 Benefits After Migration

1. **Single Source of Truth** - All systems use the same tournament data
2. **Real-time Sync** - No delay between MPA Portal and old system
3. **Rich Tournament Data** - Access to detailed tournament information
4. **Approval Workflow** - Only approved tournaments appear in old system
5. **Better Organization** - Tournaments organized by classification
6. **Audit Trail** - Complete history of tournament applications

## 🆘 Troubleshooting

### Common Issues

**Issue:** "Tournament not found" errors
**Solution:** Check if tournament status is "Approved" in MPA Portal

**Issue:** Tournament types don't match
**Solution:** Use compatibility layer type mapping functions

**Issue:** Missing tournament fields
**Solution:** Check field mapping in compatibility layer conversion

### Support

For migration support:
1. Check the compatibility test endpoint
2. Review the conversion functions
3. Ensure all tournaments are properly approved in MPA Portal

## 📈 Future Improvements

Once migration is complete, you can:
1. Add direct access to rich tournament data (organizer info, expected participants, etc.)
2. Implement tournament registration through MPA Portal
3. Add tournament status tracking
4. Integrate with approval workflow