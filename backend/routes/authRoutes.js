const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

async function setFirebaseCustomClaims(uid, claims) {
    try {
        await admin.auth().setCustomUserClaims(uid, claims);
        console.log(`Set claims for ${uid}:`, claims);
    } catch (error) {
        console.error('Error setting custom claims:', error);
        throw error;
    }
}

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'Email already exists' });

        user = await User.findOne({ username });
        if (user) return res.status(400).json({ message: 'Username taken' });

        // Create Firebase user
        const firebaseUser = await admin.auth().createUser({
            email,
            password,
            displayName: username
        });

        // Set admin claim if admin email
        const isAdmin = email === process.env.ADMIN_EMAIL;
        await setFirebaseCustomClaims(firebaseUser.uid, { admin: isAdmin });

        // Create MongoDB user
        user = new User({
            username,
            email,
            password,
            role: isAdmin ? 'admin' : 'user',
            firebaseUid: firebaseUser.uid
        });

        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username, 
                role: user.role,
                isAdmin 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User registered',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isAdmin
            }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check MongoDB user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Get Firebase user to check claims
        const firebaseUser = await admin.auth().getUserByEmail(email);
        const idToken = await admin.auth().createCustomToken(firebaseUser.uid);
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // Generate JWT
        const token = jwt.sign(
            { 
                id: user._id,
                username: user.username,
                role: user.role,
                isAdmin: decodedToken.admin || false
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Logged in',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isAdmin: decodedToken.admin || false
            }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            ...user.toObject(),
            isAdmin: req.user.isAdmin
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;