const multer = require('multer');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Multer configuration remains the same
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
        }
    }
});

const uploadToFirebase = (req, res, next) => {
    // ... existing uploadToFirebase implementation remains the same ...
};

// New auth middleware with Firebase claims verification
const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // First try Firebase verification
        const decodedToken = await admin.auth().verifyIdToken(token);
        const firebaseUser = await admin.auth().getUser(decodedToken.uid);
        
        if (firebaseUser) {
            req.user = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                isAdmin: decodedToken.admin || false
            };
            return next();
        }
    } catch (firebaseError) {
        console.log('Firebase verification failed, falling back to JWT');
    }

    // Fallback to JWT verification
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        req.user = {
            id: user._id,
            email: user.email,
            isAdmin: user.role === 'admin'
        };
        next();
    } catch (error) {
        console.error('Error in auth middleware:', error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const authorize = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user.isAdmin && (!requiredRole || req.user.role !== requiredRole)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        next();
    };
};

module.exports = { 
    upload, 
    uploadToFirebase, 
    protect, 
    authorize 
};