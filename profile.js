import { auth, database } from './firebase.js'; // Import Firebase initialization
import { ref, get } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";

// Get the current user from Firebase Auth
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const userRef = ref(database, 'users/' + user.uid); // Reference to the user's data in the database
            const snapshot = await get(userRef); // Fetch user data from the database

            if (snapshot.exists()) {
                const userData = snapshot.val(); // Get the user data
                const { name, role, idnumber, college, email } = userData;

                // Update the profile page with user data
                document.getElementById('name').textContent = name || "User Name";
                document.getElementById('role').textContent = role || "Role";
                document.getElementById('idnumber').textContent = idnumber || "ID Number";
                document.getElementById('college').textContent = college || "College";
                document.getElementById('email').textContent = email || "Email";

                // Update the HOME link based on the role (student or admin)
                const homeLink = document.getElementById('home-link');
                if (role === 'Student') {
                    homeLink.setAttribute('href', 'dashboard-stu.html');
                } else if (role === 'Admin') {
                    homeLink.setAttribute('href', 'dashboard-admin.html');
                }
            } else {
                console.error("User data not found in the database.");
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    } else {
        console.error("No user is signed in.");
    }
});
