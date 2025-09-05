/**
 * Database Configuration
 * Automatically switches between local and production databases based on environment
 */

require('dotenv').config();

const isLocalDevelopment = () => {
  return process.env.NODE_ENV === 'development' && 
         (process.env.USE_LOCAL_DB === 'true' || 
          process.env.MONGODB_URI?.includes('localhost'));
};

const getDatabaseConfig = () => {
  if (isLocalDevelopment()) {
    console.log('🏠 Using LOCAL MongoDB for development');
    return {
      uri: 'mongodb://localhost:27017/malaysia-pickleball-portal-dev',
      type: 'local',
      safe: true
    };
  } else {
    console.log('☁️  Using PRODUCTION MongoDB Atlas');
    return {
      uri: process.env.MONGODB_URI,
      type: 'production',
      safe: false
    };
  }
};

const getOldDatabaseConfig = () => {
  if (isLocalDevelopment()) {
    console.log('🏠 Old database mapped to LOCAL for testing');
    return {
      uri: 'mongodb://localhost:27017/malaysia-pickleball-dev',
      type: 'local',
      safe: true
    };
  } else {
    console.log('☁️  Old database using PRODUCTION Atlas');
    return {
      uri: process.env.MONGODB_URI.replace('/malaysia-pickleball-portal', '/malaysia-pickleball'),
      type: 'production',
      safe: false
    };
  }
};

const displayEnvironmentInfo = () => {
  const config = getDatabaseConfig();
  const oldConfig = getOldDatabaseConfig();
  
  console.log('\n=== DATABASE CONFIGURATION ===');
  console.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`Mode: ${config.type.toUpperCase()}`);
  console.log(`Safe Mode: ${config.safe ? '✅ ON (localhost only)' : '⚠️  OFF (production)'}`);
  console.log(`New DB: ${config.uri}`);
  console.log(`Old DB: ${oldConfig.uri}`);
  console.log('===============================\n');
};

module.exports = {
  getDatabaseConfig,
  getOldDatabaseConfig,
  isLocalDevelopment,
  displayEnvironmentInfo
};