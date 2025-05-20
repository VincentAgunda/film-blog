const admin = require('firebase-admin');

const initializeFirebase = () => {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Optional, but good practice
    });
    console.log('Firebase Admin SDK initialized successfully!');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    // Depending on your setup, you might want to exit the process or just log
    // process.exit(1);
  }
};

module.exports = initializeFirebase;