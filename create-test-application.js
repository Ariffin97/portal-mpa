// Test script to create a dummy tournament application with 8 categories
const FormData = require('form-data');
const fetch = require('node-fetch');

const testApplication = {
  // Organiser Information
  organiserName: 'Test Pickleball Club',
  registrationNo: 'REG-TEST-001',
  telContact: '0123456789',
  personInCharge: 'John Doe',
  email: 'ariffinanuar@gmail.com', // Change this to your email to receive the PDF
  organisingPartner: 'Sports Malaysia',

  // Event Details
  eventTitle: 'Malaysia Open Pickleball Championship 2026',
  eventStartDate: '2026-03-15',
  eventEndDate: '2026-03-17',
  eventStartDateFormatted: '15 March 2026',
  eventEndDateFormatted: '17 March 2026',
  state: 'Selangor',
  city: 'Shah Alam',
  venue: 'Shah Alam Sports Complex',
  classification: 'National',
  eventType: 'Open',
  expectedParticipants: '500',

  // 8 Categories
  categories: [
    { category: "Men's Singles", malaysianEntryFee: 80, internationalEntryFee: 120 },
    { category: "Women's Singles", malaysianEntryFee: 80, internationalEntryFee: 120 },
    { category: "Men's Doubles", malaysianEntryFee: 100, internationalEntryFee: 150 },
    { category: "Women's Doubles", malaysianEntryFee: 100, internationalEntryFee: 150 },
    { category: "Mixed Doubles", malaysianEntryFee: 100, internationalEntryFee: 150 },
    { category: "Senior Men's Singles (50+)", malaysianEntryFee: 70, internationalEntryFee: 100 },
    { category: "Senior Women's Singles (50+)", malaysianEntryFee: 70, internationalEntryFee: 100 },
    { category: "Junior Mixed Doubles (U18)", malaysianEntryFee: 50, internationalEntryFee: 80 }
  ],

  // Tournament Software
  tournamentSoftware: ['Pickleball Brackets', 'Other'],
  tournamentSoftwareOther: 'Custom Tournament System',

  // Emergency Plan
  hospitalName: 'Shah Alam General Hospital',
  hospitalDistance: '3 km',
  numberOfMedics: '4',
  emergencyTransportType: 'ambulance',
  emergencyTransportQuantity: '2',
  standbyVehicleType: '',

  // Event Summary
  eventSummary: 'The Malaysia Open Pickleball Championship 2026 is a premier national tournament bringing together the best pickleball players from across Malaysia and international participants.',

  // Scoring Format
  scoringFormat: 'traditional',

  // Consent
  dataConsent: true,
  termsConsent: true
};

async function createApplication() {
  console.log('Creating test tournament application with 8 categories...');
  console.log('');
  console.log('Categories:');
  testApplication.categories.forEach((cat, i) => {
    console.log(`  ${i + 1}. ${cat.category} - RM${cat.malaysianEntryFee} / RM${cat.internationalEntryFee}`);
  });
  console.log('');
  console.log('Emergency Plan:');
  console.log(`  Hospital: ${testApplication.hospitalName}`);
  console.log(`  Distance: ${testApplication.hospitalDistance}`);
  console.log(`  Medics: ${testApplication.numberOfMedics}`);
  console.log(`  Transport: ${testApplication.emergencyTransportType} (${testApplication.emergencyTransportQuantity})`);
  console.log('');

  const formData = new FormData();

  // Add all fields to form data
  Object.keys(testApplication).forEach(key => {
    if (key === 'categories' || key === 'tournamentSoftware') {
      formData.append(key, JSON.stringify(testApplication[key]));
    } else if (typeof testApplication[key] === 'boolean') {
      formData.append(key, testApplication[key].toString());
    } else {
      formData.append(key, testApplication[key]);
    }
  });

  try {
    const response = await fetch('http://localhost:5000/api/applications', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.application) {
      console.log('='.repeat(50));
      console.log('Application created successfully!');
      console.log('='.repeat(50));
      console.log('Application ID:', data.application.applicationId);
      console.log('Event Title:', data.application.eventTitle);
      console.log('Email sent to:', testApplication.email);
      console.log('');
      console.log('Check your email for the PDF with all 8 categories and Emergency Plan.');
    } else {
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('');
    console.log('Make sure the server is running on port 5000');
    console.log('Run: npm start (or node server.js)');
  }
}

createApplication();
