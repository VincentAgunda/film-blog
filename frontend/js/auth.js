// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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
export const storage = getStorage(firebaseApp);

// Initialize Firebase Authentication and get a reference to the service
// *** IMPORTANT: Added 'export' here to make 'auth' accessible to other modules ***
export const auth = getAuth(firebaseApp);

// --- Helper function to display messages ---
function showMessage(elementId, message, type = 'danger') {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `alert alert-${type}`; // Use Bootstrap alert classes
        messageDiv.classList.remove('d-none');
        // Hide message after a few seconds, unless it's a success message that leads to redirect.
        // For success messages with redirect, the timeout is handled before redirect.
        if (type !== 'success') {
            setTimeout(() => {
                messageDiv.classList.add('d-none');
                messageDiv.textContent = ''; // Clear text
            }, 5000);
        }
    }
}

// --- Check Auth State on Page Load (e.g., to redirect based on login status/role) ---
// This listener can be used on any page that needs to know if a user is logged in
// and what their role is (e.g., admin_dashboard.html, index.html).
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        // Get the ID token result to check custom claims
        const idTokenResult = await user.getIdTokenResult(true); // 'true' forces a token refresh to get latest claims

        if (idTokenResult.claims.admin) {
            // User is an admin
            console.log('User is an admin.');
            // If on a regular page, you might redirect to admin dashboard,
            // or show admin-specific UI elements.
            // Example for admin_dashboard.html: If not on admin_dashboard.html, redirect there
            if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html')) {
                // If the user logs in as admin, they will be redirected by the form handler.
                // This 'onAuthStateChanged' listener would typically handle redirections
                // for users who are already logged in when they navigate to a page.
                // For instance, if a logged-in admin tries to go to login.html, they could be redirected.
            } else if (!window.location.pathname.endsWith('admin-dashboard.html')) {
                    // If a user is already logged in as admin and not on the admin dashboard, redirect them
                    // This ensures protected admin pages are handled correctly.
                    // window.location.href = 'admin-dashboard.html';
            }

        } else {
            // User is a regular user
            console.log('User is a regular user.');
            // If a regular user tries to access admin-dashboard.html, redirect them away
            if (window.location.pathname.endsWith('admin-dashboard.html')) {
                // window.location.href = 'index.html'; // Or to a 'not authorized' page
            }
        }
    } else {
        // User is signed out or not logged in
        console.log('No user is signed in.');
        // If on a protected page (like admin_dashboard.html), redirect to login
        if (window.location.pathname.endsWith('admin-dashboard.html')) {
            // window.location.href = 'login.html';
        }
    }
});


// --- Register Form Handling ---
const registerForm = document.getElementById('registerForm');
const registerMessageDiv = document.getElementById('message');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        registerMessageDiv.classList.add('d-none');
        document.querySelectorAll('.form-control').forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
        document.getElementById('terms').classList.remove('is-invalid', 'is-valid');


        const email = registerForm.elements['email'].value;
        const password = registerForm.elements['password'].value;
        const confirmPassword = registerForm.elements['confirmPassword'].value;
        const termsAccepted = registerForm.elements['terms'].checked;

        let isValid = true;
        if (password !== confirmPassword) {
            showMessage('message', 'Passwords do not match.', 'danger');
            document.getElementById('password').classList.add('is-invalid');
            document.getElementById('confirmPassword').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('password').classList.remove('is-invalid');
            document.getElementById('confirmPassword').classList.remove('is-invalid');
            document.getElementById('password').classList.add('is-valid');
            document.getElementById('confirmPassword').classList.add('is-valid');
        }

        if (!termsAccepted) {
            showMessage('message', 'You must agree to the terms and conditions.', 'danger');
            document.getElementById('terms').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('terms').classList.remove('is-invalid');
            document.getElementById('terms').classList.add('is-valid');
        }

        if (email.length === 0 || password.length === 0) {
            showMessage('message', 'Email and password cannot be empty.', 'danger');
            isValid = false;
        }
        
        if (isValid) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                showMessage('message', `Registration successful! Redirecting to login...`, 'success');
                registerForm.reset();

                // Redirect to login page after successful registration
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);

            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Firebase Registration Error:", errorCode, errorMessage);

                let displayMessage = "An error occurred during registration.";
                if (errorCode === 'auth/email-already-in-use') {
                    displayMessage = 'The email address is already in use by another account.';
                    document.getElementById('email').classList.add('is-invalid');
                } else if (errorCode === 'auth/invalid-email') {
                    displayMessage = 'The email address is not valid.';
                    document.getElementById('email').classList.add('is-invalid');
                } else if (errorCode === 'auth/operation-not-allowed') {
                    displayMessage = 'Email/password accounts are not enabled. Enable in Firebase console.';
                } else if (errorCode === 'auth/weak-password') {
                    displayMessage = 'The password is too weak. Please choose a stronger password.';
                    document.getElementById('password').classList.add('is-invalid');
                    document.getElementById('confirmPassword').classList.add('is-invalid');
                }
                showMessage('message', displayMessage, 'danger');
            }
        }
    });
}


// --- Login Form Handling ---
const loginForm = document.getElementById('loginForm');
const loginMessageDiv = document.getElementById('message');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        loginMessageDiv.classList.add('d-none');
        document.querySelectorAll('.form-control').forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });

        const email = loginForm.elements['uname'].value; // 'uname' is used for email on login page
        const password = loginForm.elements['loginPassword'].value;

        let isValid = true;
        if (email.length === 0) {
            showMessage('message', 'Email cannot be empty.', 'danger');
            document.getElementById('uname').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('uname').classList.remove('is-invalid');
            document.getElementById('uname').classList.add('is-valid');
        }

        if (password.length === 0) {
            showMessage('message', 'Password cannot be empty.', 'danger');
            document.getElementById('loginPassword').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('loginPassword').classList.remove('is-invalid');
            document.getElementById('loginPassword').classList.add('is-valid');
        }

        if (isValid) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // After successful login, force refresh token to get latest claims
                const idTokenResult = await user.getIdTokenResult(true);

                if (idTokenResult.claims.admin) {
                    showMessage('message', `Admin login successful! Welcome, ${user.email}. Redirecting to admin dashboard...`, 'success');
                    loginForm.reset();
                    setTimeout(() => {
                        window.location.href = 'admin-dashboard.html'; // Redirect to your admin page
                    }, 2000);
                } else {
                    showMessage('message', `Login successful! Welcome, ${user.email}. Redirecting to home...`, 'success');
                    loginForm.reset();
                    setTimeout(() => {
                        window.location.href = 'index.html'; // Redirect to your regular home page
                    }, 2000);
                }

            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Firebase Login Error:", errorCode, errorMessage);

                let displayMessage = "An error occurred during login.";
                if (errorCode === 'auth/invalid-email') {
                    displayMessage = 'Invalid email address.';
                    document.getElementById('uname').classList.add('is-invalid');
                } else if (errorCode === 'auth/user-disabled') {
                    displayMessage = 'This account has been disabled.';
                } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
                    displayMessage = 'Invalid email or password.';
                    document.getElementById('uname').classList.add('is-invalid');
                    document.getElementById('loginPassword').classList.add('is-invalid');
                }
                showMessage('message', displayMessage, 'danger');
            }
        }
    });
}