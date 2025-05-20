// backend/createAdmin.js

// Import the Firebase Admin SDK
const admin = require('firebase-admin');

// IMPORTANT: Replace this with the correct path to your downloaded service account key file.
// Assuming this script is in the 'backend' folder and the key is also there.
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Define the admin user's email and a TEMPORARY password
const adminEmail = 'mcmusci@admin.com';
const adminPassword = 'Viniko3488'; // <--- CHOOSE A VERY STRONG TEMPORARY PASSWORD HERE

async function createAndSetAdmin() {
  try {
    let userRecord;
    try {
      // 1. Try to get the user; if they exist, we just update their claims
      userRecord = await admin.auth().getUserByEmail(adminEmail);
      console.log(`User ${adminEmail} already exists. Proceeding to set/update admin claim.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User does not exist, so create them
        console.log(`Creating new user: ${adminEmail}...`);
        userRecord = await admin.auth().createUser({
          email: adminEmail,
          password: adminPassword,
          emailVerified: true // Optional: Mark email as verified for this admin user
        });
        console.log('User created successfully:', userRecord.uid);
      } else {
        throw error; // Re-throw other errors
      }
    }

    // 2. Set the custom claim for the admin role
    console.log(`Setting admin custom claim for user: ${userRecord.uid}...`);
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`Custom claim 'admin: true' set for user ${adminEmail}.`);

    // 3. (Optional but recommended) Revoke all refresh tokens
    // This forces the user to re-authenticate if they were already logged in,
    // ensuring the new claims are picked up immediately on next login.
    await admin.auth().revokeRefreshTokens(userRecord.uid);
    console.log(`Revoked refresh tokens for ${adminEmail}.`);


    console.log('\n--- Admin Setup Complete! ---');
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Temporary Password: ${adminPassword}`);
    console.log('\nIMPORTANT: Log in with this user and change the password immediately via Firebase console or a password reset flow!');

  } catch (error) {
    console.error('Error during admin setup:', error.message);
    if (error.code) {
        console.error('Firebase Error Code:', error.code);
    }
  } finally {
      process.exit(); // Ensure the Node.js process exits
  }
}

createAndSetAdmin();