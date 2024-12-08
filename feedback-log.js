import { database, auth } from './firebase.js';
import { getDatabase, ref, get, onValue } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js';

// Write Feedback button
document.addEventListener('DOMContentLoaded', () => {
    const writeFeedbackBtn = document.querySelector('.write-feedback-btn');
    
    if (writeFeedbackBtn) {
        writeFeedbackBtn.addEventListener('click', () => {
            window.location.href = './feedback-form.html';
        });
    }
});

// Function to format date when displayed
function formatDate(isoDate) {
    return new Date(isoDate).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Function to filter feedback in the table based on user role (student/admin)
export function feedbackTable() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                const uid = user.uid;
                const userRef = ref(database, `users/${uid}`);

                onValue(userRef, (snapshot) => {
                    const userData = snapshot.val();
                    const userRole = userData.role;
                    const userCollege = userData.college;

                    const feedbackRef = ref(database, 'feedbacks');

                    onValue(feedbackRef, (feedbackSnapshot) => {
                        const feedbacks = feedbackSnapshot.val();
                        if (!feedbacks) {
                            resolve([]); // No feedback found
                            return;
                        }

                        // Filter feedback based on role
                        const filteredFeedback = Object.keys(feedbacks).map((key) => ({
                            ...feedbacks[key],
                            feedback_id: key // Store the feedback key/id
                        })).filter((feedback) => {
                            if (userRole === 'Student') {
                                return feedback.student === uid;
                            } else if (userRole === 'Admin') {
                                return feedback.college === userCollege;
                            }
                            return false;
                        });

                        resolve(filteredFeedback.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)));
                    }, reject);
                }, reject);
            } else {
                reject("User is not authenticated.");
            }
        });
    });
}

// Function to filter feedback in the table based on status or date (sidebar options)
function feedbackTableByStatus(statusFilter = null, dateFilter = null) {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                const uid = user.uid;
                const userRef = ref(database, `users/${uid}`);

                onValue(userRef, (snapshot) => {
                    const userData = snapshot.val();
                    const userRole = userData.role;
                    const userCollege = userData.college;

                    const feedbackRef = ref(database, 'feedbacks');

                    onValue(feedbackRef, (feedbackSnapshot) => {
                        const feedbacks = feedbackSnapshot.val();
                        if (!feedbacks) {
                            resolve([]); // No feedback found
                            return;
                        }

                        // Filter feedback based on role and status/date
                        const filteredFeedback = Object.keys(feedbacks).map((key) => ({
                            ...feedbacks[key],
                            feedback_id: key // Store the feedback key/id
                        })).filter((feedback) => {
                            const matchesRole =
                                userRole === 'Student'
                                    ? feedback.student === uid
                                    : feedback.college === userCollege;
                            const matchesStatus = !statusFilter || feedback.status === statusFilter;
                            const matchesDate = !dateFilter || isDateInRange(feedback.dateTime, dateFilter);

                            return matchesRole && matchesStatus && matchesDate;
                        });

                        resolve(filteredFeedback.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)));
                    }, reject);
                }, reject);
            } else {
                reject("User is not authenticated.");
            }
        });
    });
}

// Helper function to check if a date is within the given range (this week or this month)
function isDateInRange(feedbackDateTime, dateFilter) {
    const feedbackDate = new Date(feedbackDateTime);
    const currentDate = new Date();

    if (dateFilter === 'This Week') {
        // Get the start of the current week (Sunday)
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0); // Set to midnight for exact comparison

        // Get the end of the current week (Saturday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999); // End of the day for comparison

        return feedbackDate >= startOfWeek && feedbackDate <= endOfWeek;
    } else if (dateFilter === 'This Month') {
        // Get the start of the current month
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Get the end of the current month
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return feedbackDate >= startOfMonth && feedbackDate <= endOfMonth;
    }

    // Default return false if no specific filter is matched
    return false;
}

// Add event listeners for sidebar options
document.addEventListener('DOMContentLoaded', () => {
    const feedbackItems = document.getElementById('feedback-items');

    const sidebarOptions = {
        "All Feedback": { status: null, date: null },
        "Pending": { status: "Pending", date: null },
        "Ongoing": { status: "Ongoing", date: null },
        "Resolved": { status: "Resolved", date: null },
        "This Week": { status: null, date: "This Week" },
        "This Month": { status: null, date: "This Month" }
    };

    document.querySelectorAll('.menu-item').forEach((menuItem) => {
        menuItem.addEventListener('click', () => {
            // Highlight the selected menu item
            toggleActive(menuItem);

            // Determine the filter based on the button clicked
            const { status, date } = sidebarOptions[menuItem.textContent.trim()];

            // Fetch and display filtered feedback
            feedbackTableByStatus(status, date)
                .then(feedbackList => {
                    feedbackItems.innerHTML = ''; // Clear existing feedback

                    feedbackList.forEach((feedback, index) => renderFeedback(feedback, index));
                })
                .catch(error => {
                    console.error('Error fetching feedback:', error);
                });
        });
    });
});

// Assign the side button toggle function to the global window object
window.toggleActive = toggleActive;

document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.menu-item');
    items.forEach((item) => {
        item.addEventListener('click', () => toggleActive(item));
    });
});

// Function to toggle active class in sidebar buttons
function toggleActive(element) {
    const items = document.querySelectorAll('.menu-item');
    items.forEach(item => item.classList.remove('active'));
    element.classList.add('active');
}

// Fetch and display feedback for feedback table
feedbackTable().then(feedbackList => {
    const feedbackItems = document.getElementById('feedback-items');
    feedbackItems.innerHTML = ''; // Clear existing feedback

    feedbackList.forEach((feedback, index) => renderFeedback(feedback, index));
}).catch(error => {
    console.error('Error fetching feedback:', error);
});

// Function to render each feedback in the table
function renderFeedback(feedback, index) {
    const feedbackRow = document.createElement('tr');

    // Color classes based on status
    const statusClasses = {
        "Pending": "pending",
        "Ongoing": "ongoing",
        "Resolved": "resolved"
    };
    const statusClass = statusClasses[feedback.status] || "pending"; // Default to pending

    feedbackRow.innerHTML = `
        <td class="feedback-text">${feedback.title.length > 100 ? feedback.title.slice(0, 100) + "..." : feedback.title}</td>
        <td class="feedback-type">${feedback.type}</td>
        <td class="feedback-status"><div class="status-background ${statusClass}">${feedback.status}</div></td>
        <td class="feedback-date">${formatDate(feedback.dateTime)}</td>
    `;

    feedbackRow.addEventListener('click', () => feedbackView(feedback)); // Pass the feedback data for feedbackView
    document.getElementById('feedback-items').appendChild(feedbackRow); // Add feedback items to body
}

// Function to get user details for Feedback View
async function getUserDetails(uid) {
    const db = getDatabase(); // Get the Firebase database instance
    const userRef = ref(db, 'users/' + uid); // Access the 'users' collection and fetch the user by UID
    const snapshot = await get(userRef); // Fetch the data
    if (snapshot.exists()) {
        return snapshot.val(); // Return the user data if it exists
    } else {
        throw new Error("User not found"); // Handle case if user does not exist
    }
}

// FEEDBACK VIEW
async function feedbackView(feedback) {
    // Store the feedback key/id in localStorage to be accessed in feedback-update.js
    const feedbackUID = feedback.feedback_id || "unknown"; // Use feedback_id or fallback to 'unknown'
    localStorage.setItem('currentFeedbackUID', feedbackUID);
    console.log('Current Feedback ID:', feedbackUID); // Log Feedback ID for debugging

    document.querySelector('.header-type').textContent = feedback.type;

    const statusClasses = {
        "Pending": "pending",
        "Ongoing": "ongoing",
        "Resolved": "resolved"
    };

    const statusClass = statusClasses[feedback.status] || "pending"; // Default to pending
    const statusText = document.querySelector('.status-badge');
    statusText.textContent = feedback.status;
    statusText.className = `status-badge ${statusClass}`;

    const user = await getUserDetails(feedback.student);
    document.querySelector('.from').innerHTML = `<span class="name">${user.name}</span> <span class="email">&lt;${user.email}&gt;</span>`;
    document.querySelector('.date').textContent = formatDate(feedback.dateTime);
    document.querySelector('.to').innerHTML = `Submitted to ${feedback.college}`;
    document.querySelector('.subject').textContent = feedback.title;
    document.querySelector('.body').textContent = feedback.description;

    const updatesDiv = document.getElementById('status-updates');

    // Check if the feedback has the "updates" field
    if (feedback.updates) {
        // Convert the updates object to an array and sort by date (ascending)
        const sortedUpdates = Object.values(feedback.updates).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

        // Fetch admin details for each update and map sorted updates to HTML elements
        const updatesWithAdmin = await Promise.all(
            sortedUpdates.map(async (update) => {
                const adminDetails = await getUserDetails(update.admin); // Get admin details using UID
                return {
                    ...update,
                    adminName: adminDetails.name,
                    adminEmail: adminDetails.email
                };
            })
        );

        updatesDiv.innerHTML = updatesWithAdmin.map(update => `
            <div class="status-update">
                <div class="status-date">Updated on ${formatDate(feedback.dateTime)}</div>
                <div class="status-from">
                    <span class="name">${update.adminName}</span> 
                    <span class="email">&lt;${update.adminEmail}&gt;</span>
                </div>
                <div class="status-body">${update.message}</div>
                <div class="status-title">Status Update - ${update.status}</div>
            </div>
        `).join('');
    }

    document.getElementById('feedback-content-container').classList.remove('feedback-hidden');
    document.getElementById('feedback-table').classList.add('feedback-hidden');
}

// Feedback View goBack button
function goBack() {
    // Reset the updates display
    const updatesDiv = document.getElementById('status-updates');
    updatesDiv.innerHTML = ''; // Clear any previous updates

    // Hide the feedback content and show the feedback table
    document.getElementById('feedback-content-container').classList.add('feedback-hidden');
    document.getElementById('feedback-table').classList.remove('feedback-hidden');
}

// Attach goBack() to the button after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const goBackButton = document.getElementById('goBackButton');
    goBackButton.addEventListener('click', goBack);
});

// Update button directs to feedback-update.html
const updateButton = document.getElementById('update-btn');
if (updateButton) {
    updateButton.addEventListener('click', () => {
        window.location.href = './feedback-update.html';  // Redirect to the update page
    });
}