import { auth, database } from './firebase.js'; // Import Firebase initialization
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";

// LOGIN FUNCTIONALITY
const loginButton = document.querySelector('.login-btn');
const emailInput = document.querySelector('#login-email');
const passwordInput = document.querySelector('#login-password');

if (loginButton && emailInput && passwordInput) {
    // Get the expected role based on the page
    const isStudentLogin = window.location.pathname.includes('login-stu');
    const expectedRole = isStudentLogin ? 'Student' : 'Admin';

    loginButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            // Sign in the user with email and password
            const { user } = await signInWithEmailAndPassword(auth, email, password);

            // Check user role from Realtime Database
            const userRef = ref(database, 'users/' + user.uid);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const userData = snapshot.val();
                const userRole = userData.role;

                if (userRole === expectedRole) {
                    // Redirect based on user role
                    window.location.href = userRole === 'Student' ? 'dashboard-stu.html' : 'dashboard-admin.html';
                } else {
                    alert(`Invalid account. This page is for ${expectedRole} login only.`);
                }
            } else {
                console.error('User data not found in the database.');
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('Invalid email or password.');
        }
    });
}

// SWITCH BETWEEN STUDENT AND ADMIN LOGIN
const adminButton = document.querySelector('.admin-btn');
const studentButton = document.querySelector('.stu-btn');

if (adminButton) {
    adminButton.addEventListener('click', () => {
        window.location.href = 'login-admin.html';  // Redirect to Admin login page
    });
}
if (studentButton) {
    studentButton.addEventListener('click', () => {
        window.location.href = 'login-stu.html';    // Redirect to Student login page
    });
}

// LOG OUT FUNCTIONALITY
const logoutLink= document.getElementById('logout-link');

if (logoutLink) {
    logoutLink.addEventListener('click', async (event) => {
        event.preventDefault();
        await signOut(auth); // Log out the user
        window.location.href = './login-stu.html'; // Redirect to login page
    });
}