require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors middleware
const path = require('path'); // For serving static files

// Import route files
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const contentRoutes = require('./routes/contentRoutes'); 

// Initialize database connections
const connectDB = require('./config/db');
const initializeFirebase = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 5000; // Backend will run on port 5000 by default

// Connect to MongoDB
connectDB();

// Initialize Firebase Admin SDK
initializeFirebase();

// --- Middleware ---
// Enable CORS for all origins during development.
// For production, you should restrict this to your frontend's domain:
// const corsOptions = {
//   origin: 'http://localhost:3000' // Your frontend's URL
// };
// app.use(cors(corsOptions));
app.use(cors()); // Allows all cross-origin requests (for development)

// Body parser middleware for JSON data
app.use(express.json());
// Body parser middleware for URL-encoded data (for form submissions)
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api/auth', authRoutes); // Handles /api/auth/register, /api/auth/login
app.use('/api/admin', adminRoutes); // Handles /api/admin/images, /api/admin/content (protected)
app.use('/api', publicRoutes);
app.use('/api/content', contentRoutes); 
 // Handles /api/images, /api/content (public data)

// --- Serving Frontend (Optional, for easy deployment) ---
// If you want to serve your frontend from the same Node.js server in production,
// uncomment and configure these lines. During development, you'll open frontend HTML directly.
// app.use(express.static(path.join(__dirname, '../frontend')));
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../frontend', 'index.html'));
// });

// Basic test route
app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));