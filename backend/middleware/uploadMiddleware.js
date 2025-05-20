const multer = require('multer');
const admin = require('firebase-admin'); // Ensure firebase-admin is imported
const { v4: uuidv4 } = require('uuid'); // For generating unique filenames

// Multer storage configuration (in-memory for Firebase upload)
const storage = multer.memoryStorage();

// Multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB file size limit (5MB)
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true); // Accept file
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
        }
    }
});

// Middleware to upload file to Firebase Storage
const uploadToFirebase = (req, res, next) => {
    if (!req.file) {
        return next(); // No file to upload, proceed
    }

    // Initialize Firebase Storage bucket *here*, after firebase.js has been called in server.js
    // This ensures that admin.initializeApp() has definitely run.
    const bucket = admin.storage().bucket();

    const file = req.file;
    const filename = `${uuidv4()}-${file.originalname}`; // Unique filename
    const fileUpload = bucket.file(filename);

    const blobStream = fileUpload.createWriteStream({
        metadata: {
            contentType: file.mimetype
        }
    });

    blobStream.on('error', (error) => {
        console.error('Firebase upload error:', error);
        res.status(500).json({ message: 'Failed to upload image to Firebase Storage.' });
    });

    blobStream.on('finish', () => {
        // Create public URL for the file
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURI(fileUpload.name)}?alt=media`;
        req.file.firebaseUrl = publicUrl; // Attach the URL to the request object
        req.file.filename = fileUpload.name; // Store the generated filename
        next();
    });

    blobStream.end(file.buffer);
};

module.exports = { upload, uploadToFirebase };