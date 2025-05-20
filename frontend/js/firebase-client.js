// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbugll6RRXT-UPZ4ipHZD-ilXLOIo7oT8",
  authDomain: "mcmemuci-7943c.firebaseapp.com",
  projectId: "mcmemuci-7943c",
  storageBucket: "mcmemuci-7943c.firebasestorage.app",
  messagingSenderId: "614792317536",
  appId: "1:614792317536:web:14f371fac44b65bf8dd105"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Export storage for potential client-side use (e.g., if you show upload progress)
// For your current plan, the backend handles actual uploads via Firebase Admin SDK.
// This is mainly for displaying images from Firebase Storage.
export const storage = getStorage(firebaseApp);