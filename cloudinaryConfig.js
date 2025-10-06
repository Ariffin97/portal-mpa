const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Profile storage configuration
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// News storage configuration
const newsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'news',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  }
});

// Journey storage configuration
const journeyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'journey',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  }
});

module.exports = {
  cloudinary,
  profileStorage,
  newsStorage,
  journeyStorage
};
