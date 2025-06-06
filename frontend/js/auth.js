// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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

// Initialize Firebase services
export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);
export const db = getDatabase(firebaseApp);

// --- Helper function to display messages ---
function showMessage(elementId, message, type = 'danger') {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `alert alert-${type}`;
        messageDiv.classList.remove('d-none');
        if (type !== 'success') {
            setTimeout(() => {
                messageDiv.classList.add('d-none');
                messageDiv.textContent = '';
            }, 5000);
        }
    }
}

// --- Update UI based on auth state ---
function updateAuthUI(user) {
    const loginDropdownLink = document.getElementById('loginDropdownLink');
    const logoutDropdownLink = document.getElementById('logoutDropdownLink');
    const adminDashboardDropdownLink = document.getElementById('adminDashboardDropdownLink');
    const adminDivider = document.getElementById('adminDivider');
    const userDropdown = document.getElementById('userDropdown');
    
    if (user) {
        // User is signed in
        if (loginDropdownLink) loginDropdownLink.style.display = 'none';
        if (logoutDropdownLink) logoutDropdownLink.style.display = 'block';
        
        // Update user icon with logged-in state
        if (userDropdown) {
            const icon = userDropdown.querySelector('i') || document.createElement('i');
            icon.className = 'fas fa-user-circle text-success';
            userDropdown.innerHTML = '';
            userDropdown.appendChild(icon);
            if (userDropdown.querySelector('span')) {
                userDropdown.appendChild(userDropdown.querySelector('span'));
            }
        }

        // Check if user is admin and show/hide admin dashboard link
        user.getIdTokenResult().then((idTokenResult) => {
            if (idTokenResult.claims.admin) {
                console.log('User is an admin');
                if (adminDashboardDropdownLink) adminDashboardDropdownLink.style.display = 'block';
                if (adminDivider) adminDivider.style.display = 'block';
                
                // Update icon for admin users
                if (userDropdown) {
                    const icon = userDropdown.querySelector('i') || document.createElement('i');
                    icon.className = 'fas fa-user-shield text-primary';
                    userDropdown.innerHTML = '';
                    userDropdown.appendChild(icon);
                    if (userDropdown.querySelector('span')) {
                        userDropdown.appendChild(userDropdown.querySelector('span'));
                    }
                }
            } else {
                if (adminDashboardDropdownLink) adminDashboardDropdownLink.style.display = 'none';
                if (adminDivider) adminDivider.style.display = 'none';
            }
        }).catch(error => {
            console.error("Error getting ID token result:", error);
        });
    } else {
        // User is signed out
        if (loginDropdownLink) loginDropdownLink.style.display = 'block';
        if (logoutDropdownLink) logoutDropdownLink.style.display = 'none';
        if (adminDashboardDropdownLink) adminDashboardDropdownLink.style.display = 'none';
        if (adminDivider) adminDivider.style.display = 'none';
        
        // Update user icon with logged-out state
        if (userDropdown) {
            const icon = userDropdown.querySelector('i') || document.createElement('i');
            icon.className = 'fas fa-user-circle';
            userDropdown.innerHTML = '';
            userDropdown.appendChild(icon);
            if (userDropdown.querySelector('span')) {
                userDropdown.appendChild(userDropdown.querySelector('span'));
            }
        }
    }
}

// --- Handle logout ---
function setupLogout() {
    const logoutDropdownLink = document.getElementById('logoutDropdownLink');
    if (logoutDropdownLink) {
        logoutDropdownLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error("Logout error:", error);
                showMessage('message', 'Error during logout. Please try again.', 'danger');
            }
        });
    }
}

// --- Check Auth State on Page Load ---
onAuthStateChanged(auth, async (user) => {
    updateAuthUI(user);
    
    if (user) {
        // User is signed in
        const idTokenResult = await user.getIdTokenResult(true);

        if (idTokenResult.claims.admin) {
            console.log('User is an admin.');
            if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html')) {
                window.location.href = 'admin-dashboard.html';
            }
        } else {
            console.log('User is a regular user.');
            if (window.location.pathname.endsWith('admin-dashboard.html')) {
                window.location.href = 'index.html';
            }
        }
    } else {
        // User is signed out
        console.log('No user is signed in.');
        if (window.location.pathname.endsWith('admin-dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
});

// Initialize logout functionality
setupLogout();

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

        const email = loginForm.elements['uname'].value;
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

                const idTokenResult = await user.getIdTokenResult(true);

                if (idTokenResult.claims.admin) {
                    showMessage('message', `Admin login successful! Welcome, ${user.email}. Redirecting to admin dashboard...`, 'success');
                    loginForm.reset();
                    setTimeout(() => {
                        window.location.href = 'admin-dashboard.html';
                    }, 2000);
                } else {
                    showMessage('message', `Login successful! Welcome, ${user.email}. Redirecting to home...`, 'success');
                    loginForm.reset();
                    setTimeout(() => {
                        window.location.href = 'index.html';
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

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI(auth.currentUser);
});

// Export functions for use in other modules
export function getCurrentUser() {
    return auth.currentUser;
}

export async function checkAuthStatus() {
    const user = auth.currentUser;
    if (!user) return { isAuthenticated: false, isAdmin: false };
    
    const idTokenResult = await user.getIdTokenResult(true);
    return {
        isAuthenticated: true,
        isAdmin: idTokenResult.claims.admin || false,
        user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0]
        }
    };
}