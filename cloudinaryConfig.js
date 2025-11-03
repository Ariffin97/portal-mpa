const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary with explicit values
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
};

cloudinary.config(cloudinaryConfig);

// Profile storage configuration
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    resource_type: 'auto'
  }
});

// News storage configuration
const newsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'news',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }],
    resource_type: 'auto'
  }
});

// Journey storage configuration
const journeyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'journey',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }],
    resource_type: 'auto'
  }
});

// Tournament application documents storage
const applicationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Always use 'auto' resource type - Cloudinary will detect correctly
    return {
      folder: 'tournament-applications',
      resource_type: 'auto',
      type: 'upload',
      flags: 'attachment' // Force download instead of inline display
    };
  }
});

// Tournament poster storage configuration
const posterStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tournament-posters',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
    resource_type: 'image'
  }
});

module.exports = {
  cloudinary,
  profileStorage,
  newsStorage,
  journeyStorage,
  applicationStorage,
  posterStorage
};
