/**
 * Legacy Tournament Endpoints
 * 
 * This file shows how to update your old system's tournament endpoints
 * to use the new MPA Portal database while maintaining compatibility.
 */

const express = require('express');
const { TournamentCompatibilityLayer, createTournamentMiddleware } = require('./tournament-compatibility-layer');
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize compatibility layer
const compatibilityLayer = new TournamentCompatibilityLayer(process.env.MONGODB_URI);

// Connect to database
compatibilityLayer.connect().then(() => {
  console.log('✅ Connected to MPA Portal database');
}).catch(err => {
  console.error('❌ Database connection failed:', err);
});

// Create middleware
const tournamentMiddleware = createTournamentMiddleware(compatibilityLayer);

// ==========================================
// LEGACY TOURNAMENT ENDPOINTS (Updated to use new database)
// ==========================================

// Get all tournaments (replaces old Tournament.find())
app.get('/api/tournaments', tournamentMiddleware.getAllTournaments);

// Get tournament by ID (replaces old Tournament.findById())
app.get('/api/tournaments/:id', tournamentMiddleware.getTournamentById);

// Get tournaments by type (replaces old Tournament.find({ type: 'xyz' }))
app.get('/api/tournaments/type/:type', tournamentMiddleware.getTournamentsByType);

// Get upcoming tournaments
app.get('/api/tournaments/upcoming', tournamentMiddleware.getUpcomingTournaments);

// Get tournament statistics
app.get('/api/tournaments/stats', async (req, res) => {
  try {
    const stats = await compatibilityLayer.getTournamentStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search tournaments
app.get('/api/tournaments/search/:term', async (req, res) => {
  try {
    const tournaments = await compatibilityLayer.searchTournaments(req.params.term);
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// MIGRATION UTILITIES
// ==========================================

// Endpoint to test compatibility
app.get('/api/tournaments/compatibility-test', async (req, res) => {
  try {
    const allTournaments = await compatibilityLayer.getAllTournaments();
    const upcomingTournaments = await compatibilityLayer.getUpcomingTournaments();
    const stats = await compatibilityLayer.getTournamentStats();
    
    const testResults = {
      totalApprovedTournaments: allTournaments.length,
      upcomingTournaments: upcomingTournaments.length,
      stats: stats,
      sampleTournament: allTournaments[0] || null,
      compatibility: 'SUCCESS',
      message: 'Old system can now read tournaments from new MPA Portal database'
    };
    
    res.json(testResults);
  } catch (error) {
    res.status(500).json({
      compatibility: 'FAILED',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: 'MPA Portal (new)',
    compatibilityLayer: 'Active',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// EXAMPLE: How to update your existing code
// ==========================================

/*
// OLD CODE (using old database):
const Tournament = mongoose.model('Tournament', oldTournamentSchema);
const tournaments = await Tournament.find({ registrationOpen: true });

// NEW CODE (using compatibility layer):
const tournaments = await compatibilityLayer.getAllTournaments();
// All returned tournaments are approved and "open" for registration

// OLD CODE:
const sarawakTournaments = await Tournament.find({ type: 'sarawak' });

// NEW CODE:
const sarawakTournaments = await compatibilityLayer.getTournamentsByType('sarawak');

// OLD CODE:
const tournament = await Tournament.findById(tournamentId);

// NEW CODE:
const tournament = await compatibilityLayer.getTournamentById(tournamentId);
*/

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Legacy Tournament API Server running on port ${PORT}`);
  console.log('📡 Using MPA Portal database with compatibility layer');
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/tournaments/compatibility-test`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔐 Closing database connection...');
  await compatibilityLayer.disconnect();
  process.exit(0);
});