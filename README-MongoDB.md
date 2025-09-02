# Malaysia Pickleball Portal - MongoDB Integration

This application now integrates with MongoDB to store all form submissions persistently.

## Prerequisites

1. **MongoDB Installation**: Make sure you have MongoDB installed and running locally
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud) by updating the connection string in `.env`

2. **Node.js**: Ensure Node.js is installed (version 14+)

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   The `.env` file has been created with default MongoDB settings:
   ```
   MONGODB_URI=mongodb://localhost:27017/malaysia-pickleball-portal
   PORT=5000
   NODE_ENV=development
   ```

3. **Start the Application**:
   
   **Option 1 - Start both server and client together:**
   ```bash
   npm run dev
   ```
   
   **Option 2 - Start server and client separately:**
   ```bash
   # Terminal 1 - Start the backend server
   npm run server
   
   # Terminal 2 - Start the React app
   npm start
   ```

## Database Collections

The application creates the following MongoDB collections:

### 1. Tournament Applications (`tournamentapplications`)
Stores all tournament application form submissions with fields:
- `applicationId` - Unique application ID (MPA + 6 chars)
- `organiserName` - Name of the organiser
- `registrationNo` - PJS/ROS/Company registration number
- `telContact` - Contact telephone number
- `organisingPartner` - Partner organization (optional)
- `eventTitle` - Tournament title
- `eventStartDate` - Event start date
- `eventEndDate` - Event end date  
- `state` - Malaysian state
- `city` - City within the state
- `venue` - Venue name
- `classification` - Event level (District/Divisional/State/National/International)
- `expectedParticipants` - Expected number of participants
- `eventSummary` - Brief description of the event
- `scoringFormat` - Scoring format preference
- `dataConsent` - Data protection consent
- `termsConsent` - Terms and conditions consent
- `status` - Application status (Pending Review/Under Review/Approved/Rejected/More Info Required)
- `submissionDate` - When the application was submitted
- `lastUpdated` - Last modification timestamp

### 2. Admin Login History (`adminlogins`)
Tracks admin login attempts with fields:
- `username` - Login username
- `loginTime` - When the login occurred
- `ipAddress` - IP address of the login
- `userAgent` - Browser/client information

## API Endpoints

### Tournament Applications
- `GET /api/applications` - Get all applications (admin)
- `GET /api/applications/:id` - Get specific application by ID
- `POST /api/applications` - Submit new application
- `PATCH /api/applications/:id/status` - Update application status (admin)

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/login-history` - Get login history

### System
- `GET /api/health` - Health check endpoint

## MongoDB Compass Connection

1. **Open MongoDB Compass**
2. **Connection String**: `mongodb://localhost:27017`
3. **Database Name**: `malaysia-pickleball-portal`
4. **Collections**:
   - `tournamentapplications` - View all tournament applications
   - `adminlogins` - View admin login history

## Features

✅ **Form Data Persistence**: All form submissions are saved to MongoDB
✅ **Unique Application IDs**: Automatically generated unique IDs (MPA + 6 chars)
✅ **Admin Login Tracking**: All login attempts are logged
✅ **Error Handling**: Proper error handling and user feedback
✅ **Data Validation**: Server-side validation for all form fields
✅ **Application Status Management**: Admin can update application status
✅ **Real-time Feedback**: Loading states and error messages

## Development

- **Frontend**: React application runs on port 3000
- **Backend**: Express server runs on port 5000
- **Database**: MongoDB on default port 27017

## Production Deployment

For production deployment:
1. Update `MONGODB_URI` in `.env` to point to your production MongoDB instance
2. Run `npm run start:prod` to build and start the production server
3. Consider using PM2 or similar for process management

## Troubleshooting

**MongoDB Connection Issues**:
- Ensure MongoDB service is running: `sudo systemctl start mongod` (Linux) or start MongoDB service on Windows
- Check connection string in `.env` file
- Verify MongoDB is accessible on port 27017

**Port Conflicts**:
- If port 5000 is in use, update the PORT in `.env` file
- If port 3000 is in use, React will prompt to use a different port

**Form Submission Issues**:
- Check browser console for error messages
- Verify backend server is running and accessible
- Check MongoDB connection status in server logs