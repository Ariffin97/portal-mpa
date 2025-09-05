/**
 * Tournament Compatibility Layer
 * 
 * This module provides compatibility between the old tournament system and the new 
 * TournamentApplication system in the MPA Portal. It allows the old system to work
 * with the new database structure seamlessly.
 */

const mongoose = require('mongoose');

// New TournamentApplication Schema (from MPA Portal)
const tournamentApplicationSchema = new mongoose.Schema({
  applicationId: String,
  organiserName: String,
  registrationNo: String,
  telContact: String,
  email: String,
  organisingPartner: String,
  eventTitle: String,
  eventStartDate: Date,
  eventEndDate: Date,
  state: String,
  city: String,
  venue: String,
  classification: String,
  expectedParticipants: Number,
  eventSummary: String,
  scoringFormat: String,
  dataConsent: Boolean,
  termsConsent: Boolean,
  status: String,
  submissionDate: Date,
  lastUpdated: Date,
  remarks: String
}, {
  timestamps: true
});

class TournamentCompatibilityLayer {
  constructor(databaseUri) {
    this.databaseUri = databaseUri;
    this.connection = null;
    this.TournamentApplication = null;
  }

  async connect() {
    this.connection = await mongoose.createConnection(this.databaseUri);
    this.TournamentApplication = this.connection.model('TournamentApplication', tournamentApplicationSchema);
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  /**
   * Convert new TournamentApplication format to old tournament format
   */
  convertToOldFormat(application) {
    // Map new classification back to old type
    const classificationToType = {
      'District': 'local',
      'Divisional': 'wmalaysia',
      'State': application.state === 'Sarawak' ? 'sarawak' : 'state',
      'National': 'national',
      'International': 'international'
    };

    return {
      _id: application._id,
      name: application.eventTitle,
      startDate: application.eventStartDate,
      endDate: application.eventEndDate,
      type: classificationToType[application.classification] || 'local',
      venue: application.venue,
      city: application.city,
      organizer: application.organiserName,
      personInCharge: application.organisingPartner,
      phoneNumber: application.telContact,
      registrationOpen: application.status === 'Approved', // Only approved tournaments are "open"
      createdAt: application.submissionDate,
      updatedAt: application.lastUpdated,
      __v: 0,
      // Additional fields for compatibility
      months: [], // Legacy field, keep empty
      version: 0,
      lastModifiedBy: 'mpa-portal'
    };
  }

  /**
   * Get all approved tournaments in old format
   */
  async getAllTournaments() {
    const approvedApplications = await this.TournamentApplication.find({ 
      status: 'Approved' 
    }).sort({ eventStartDate: 1 });

    return approvedApplications.map(app => this.convertToOldFormat(app));
  }

  /**
   * Get tournament by ID (compatible with old system)
   */
  async getTournamentById(id) {
    const application = await this.TournamentApplication.findById(id);
    if (!application || application.status !== 'Approved') {
      return null;
    }
    return this.convertToOldFormat(application);
  }

  /**
   * Get tournament by name (compatible with old system)
   */
  async getTournamentByName(name) {
    const application = await this.TournamentApplication.findOne({ 
      eventTitle: name, 
      status: 'Approved' 
    });
    if (!application) {
      return null;
    }
    return this.convertToOldFormat(application);
  }

  /**
   * Get tournaments by type (compatible with old system)
   */
  async getTournamentsByType(type) {
    // Map old type to new classification
    const typeToClassification = {
      'local': 'District',
      'wmalaysia': 'Divisional',
      'sarawak': 'State',
      'state': 'State',
      'national': 'National',
      'international': 'International'
    };

    const classification = typeToClassification[type];
    if (!classification) {
      return [];
    }

    let query = { 
      classification: classification, 
      status: 'Approved' 
    };

    // Special handling for sarawak vs other states
    if (type === 'sarawak') {
      query.state = 'Sarawak';
    } else if (type === 'state' && classification === 'State') {
      query.state = { $ne: 'Sarawak' };
    }

    const applications = await this.TournamentApplication.find(query).sort({ eventStartDate: 1 });
    return applications.map(app => this.convertToOldFormat(app));
  }

  /**
   * Get upcoming tournaments (compatible with old system)
   */
  async getUpcomingTournaments() {
    const now = new Date();
    const applications = await this.TournamentApplication.find({ 
      status: 'Approved',
      eventStartDate: { $gte: now }
    }).sort({ eventStartDate: 1 });

    return applications.map(app => this.convertToOldFormat(app));
  }

  /**
   * Search tournaments by name (compatible with old system)
   */
  async searchTournaments(searchTerm) {
    const applications = await this.TournamentApplication.find({
      status: 'Approved',
      eventTitle: { $regex: searchTerm, $options: 'i' }
    }).sort({ eventStartDate: 1 });

    return applications.map(app => this.convertToOldFormat(app));
  }

  /**
   * Get tournament statistics (compatible with old system)
   */
  async getTournamentStats() {
    const total = await this.TournamentApplication.countDocuments({ status: 'Approved' });
    const now = new Date();
    const upcoming = await this.TournamentApplication.countDocuments({ 
      status: 'Approved',
      eventStartDate: { $gte: now }
    });
    const thisMonth = await this.TournamentApplication.countDocuments({
      status: 'Approved',
      eventStartDate: { 
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
    });

    return {
      total,
      upcoming,
      thisMonth,
      registrationOpen: upcoming // All upcoming approved tournaments are "open"
    };
  }
}

/**
 * Middleware for Express.js to replace old tournament queries
 */
function createTournamentMiddleware(compatibilityLayer) {
  return {
    // Replace old Tournament.find() calls
    async getAllTournaments(req, res, next) {
      try {
        const tournaments = await compatibilityLayer.getAllTournaments();
        res.json(tournaments);
      } catch (error) {
        next(error);
      }
    },

    // Replace old Tournament.findById() calls
    async getTournamentById(req, res, next) {
      try {
        const tournament = await compatibilityLayer.getTournamentById(req.params.id);
        if (!tournament) {
          return res.status(404).json({ error: 'Tournament not found' });
        }
        res.json(tournament);
      } catch (error) {
        next(error);
      }
    },

    // Replace old Tournament.find({ type: 'xyz' }) calls
    async getTournamentsByType(req, res, next) {
      try {
        const tournaments = await compatibilityLayer.getTournamentsByType(req.params.type);
        res.json(tournaments);
      } catch (error) {
        next(error);
      }
    },

    // New endpoint for upcoming tournaments
    async getUpcomingTournaments(req, res, next) {
      try {
        const tournaments = await compatibilityLayer.getUpcomingTournaments();
        res.json(tournaments);
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  TournamentCompatibilityLayer,
  createTournamentMiddleware
};