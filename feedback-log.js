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

// FEEDBACK TABLE
// Helper function for filterFeedback to check if a date is within the given range (this week or this month)
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

// Linear Search to search logs
function linearSearchKeyword(feedbackList, keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    for (let i = 0; i < feedbackList.length; i++) {
        const title = feedbackList[i].title.toLowerCase();

        // Check if the title contains the keyword (anywhere in the title)
        if (title.includes(lowerKeyword)) {
            results.push(feedbackList[i]);
        }
    }

    return results;
}

// Quick Sort Function to sort the feedback list in reverse chronological order (latest to oldest)
function quickSort(arr, left, right) {
    if (left < right) {
        const pivotIndex = partition(arr, left, right);
        quickSort(arr, left, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, right);
    }
}

// Partition function for Quick Sort
function partition(arr, left, right) {
    const pivot = new Date(arr[right].dateTime); // Choose the last element as pivot
    let i = left - 1; // Pointer for the smaller element

    for (let j = left; j < right; j++) {
        if (new Date(arr[j].dateTime) >= pivot) { // Compare with pivot (latest to oldest)
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
        }
    }

    // Swap pivot with the element at i + 1
    [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
    return i + 1;
}


// Function to filter feedback in the table based on user (student or admin), status/date (sidebar options), and keyword
function filterFeedback(statusFilter = null, dateFilter = null, categoryFilter = null, keyword = null) {
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

                        // Convert feedbacks object to an array with UIDs
                        let feedbackList = Object.keys(feedbacks).map((key) => ({
                            ...feedbacks[key],
                            feedback_id: key // Store the feedback UIDs for Feedback View
                        }));

                        // Apply filters: role, status, and date
                        feedbackList = feedbackList.filter((feedback) => {
                            const matchesRole =
                                userRole === 'Student'
                                    ? feedback.student === uid
                                    : feedback.college === userCollege;
                            const matchesStatus = !statusFilter || feedback.status === statusFilter;
                            const matchesDate = !dateFilter || isDateInRange(feedback.dateTime, dateFilter);
                            const matchesCategory = !categoryFilter || feedback.category === categoryFilter;

                            return matchesRole && matchesStatus && matchesDate && matchesCategory;
                        });

                        // If keyword is provided, use linearSearchKeyword to filter further
                        if (keyword) {
                            feedbackList = linearSearchKeyword(feedbackList, keyword);
                        }
                        //  Quick Sort (latest to oldest - reverse chronological order) based on the dateTime
                        quickSort(feedbackList, 0, feedbackList.length - 1);

                        resolve(feedbackList);
                    }, reject);
                }, reject);
            } else {
                reject("User is not authenticated.");
            }
        });
    });
}

// Search Bar Input
document.addEventListener('DOMContentLoaded', () => {
    const feedbackItems = document.getElementById('feedback-items');
    const searchInput = document.getElementById('search'); 

    // Search functionality for keyword filter
    searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.trim();
        filterFeedback(null, null, null, keyword).then(feedbackList => {
            feedbackItems.innerHTML = '';
            feedbackList.forEach((feedback, index) => formatFeedback(feedback, index));
        }).catch(error => {
            console.error('Error fetching filtered feedback:', error);
        });
    });
});


// Search Bar Input
document.addEventListener('DOMContentLoaded', () => {
    const feedbackItems = document.getElementById('feedback-items');
    const searchInput = document.getElementById('search'); 

    // Search functionality for keyword filter
    searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.trim();
        filterFeedback(null, null, null, keyword).then(feedbackList => {
            feedbackItems.innerHTML = '';
            feedbackList.forEach((feedback, index) => displayFeedback(feedback, index));
        }).catch(error => {
            console.error('Error fetching filtered feedback:', error);
        });
    });
});


// Function to format each feedback in the table
function formatFeedback(feedback, index) {
    const feedbackRow = document.createElement('tr');
    // Color classes based on status
    const statusClasses = {
        "Pending": "pending",
        "Ongoing": "ongoing",
        "Resolved": "resolved"
    };
    const statusClass = statusClasses[feedback.status] || "pending"; // Default to pending

    feedbackRow.innerHTML = `
        <td class="feedback-text">${feedback.title.length > 70 ? feedback.title.slice(0, 70) + "..." : feedback.title}</td>
        <td class="feedback-type">${feedback.type}</td>
        <td class="feedback-status"><div class="status-background ${statusClass}">${feedback.status}</div></td>
        <td class="feedback-date">${formatDate(feedback.dateTime)}</td>
    `;

    document.getElementById('feedback-items').appendChild(feedbackRow); // Add feedback items to body
    feedbackRow.addEventListener('click', () => feedbackView(feedback)); // Pass the feedback data for Feedback View when clicked
}

// Function to style active class in sidebar buttons
function toggleActive(element) {
    const items = document.querySelectorAll('.menu-item');
    items.forEach(item => item.classList.remove('active'));
    element.classList.add('active');
}

// Call filterFeedback and formatFeedback to display filtered feedback table
document.addEventListener('DOMContentLoaded', () => {

    // Sidebar options (menu-items)
    const sidebarOptions = {
        "All Feedback": { status: null, date: null, category: null},
        "Pending": { status: "Pending", date: null, category: null },
        "Ongoing": { status: "Ongoing", date: null, category: null },
        "Resolved": { status: "Resolved", date: null, category: null },
        "This Week": { status: null, date: "This Week", category: null },
        "This Month": { status: null, date: "This Month", category: null },
        "Curriculum": { status: null, date: null, category: "Curriculum" },
        "Assessments": { status: null, date: null, category: "Assessments" },
        "Faculty": { status: null, date: null, category: "Faculty" },
        "Facilities": { status: null, date: null, category: "Facilities" },
        "Student Affairs": { status: null, date: null, category: "Student Affairs" }
    };

    // Track the currently selected menu item
    let activeMenuItem = "All Feedback";

    // Function to filter feedback based on the active menu item
    function applyFilter() {
        const { status, date, category } = sidebarOptions[activeMenuItem];
        filterFeedback(status, date, category)
            .then((feedbackList) => {
                document.querySelector('.no-items').innerHTML = ''; // Clear no-items message
                document.getElementById('feedback-items').innerHTML = ''; // Clear existing feedback
                if (feedbackList.length === 0) {    // If feedbackList is empty, display No Items and hide table 
                    document.querySelector('.no-items').innerHTML = 'No Items.'; 
                    document.getElementById('feedback-table').classList.add('feedback-hidden');
                } 
                else {
                    feedbackList.forEach((feedback, index) => formatFeedback(feedback, index)); // Display feedback if list is not empty
                }
            })
            .catch((error) => {
                console.error('Error fetching feedback:', error);
            });
    }

    // Listen for database changes
    const feedbackRef = ref(database, 'feedbacks');
    onValue(feedbackRef, () => {
        applyFilter(); // Reapply filter for the currently active menu item
    });

    // Sidebar click listener to set the active menu item
    document.querySelectorAll('.menu-item').forEach((menuItem) => {
        menuItem.addEventListener('click', () => {
            activeMenuItem = menuItem.textContent.trim(); // Update the active menu item
            applyFilter(); // Filter feedback based on the clicked menu item
            toggleActive(menuItem); // Call toggleActive to style the selected menu item

            // Exit Feedback View when sidebar options are clicked
            document.getElementById('feedback-content-container').classList.add('feedback-hidden');
            document.getElementById('feedback-table').classList.remove('feedback-hidden');
        });
    });
});

// FEEDBACK VIEW
// Function to get user details for displaying in Feedback View
async function getUserDetails(uid) {
    const db = getDatabase();
    const userRef = ref(db, 'users/' + uid);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        throw new Error("User not found");
    }
}

// Display feedback view with user details and status updates
async function feedbackView(feedback) {
    // Store the feedback UID in localStorage to be accessed in feedback-update.js
    const feedbackUID = feedback.feedback_id;
    localStorage.setItem('currentFeedbackUID', feedbackUID);

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

    // Feedback Updates
    const updatesDiv = document.getElementById('status-updates');
    updatesDiv.innerHTML = ''; // Reset the updates display

    // Check if the feedback has the "updates" field
    if (feedback.updates) {
        // Convert the updates object to an array and sort by date (ascending)
        const sortedUpdates = Object.values(feedback.updates).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        // Fetch admin details for each update
        const updatesWithAdmin = await Promise.all(
            sortedUpdates.map(async (update) => {
                const adminDetails = await getUserDetails(update.admin);
                return {
                    ...update,
                    adminName: adminDetails.name,
                    adminEmail: adminDetails.email
                };
            })
        );

        // Map values to HTML elements and display Feedback Updates
        updatesDiv.innerHTML = updatesWithAdmin.map(update => `
            <div class="status-update">
                <div class="status-date">Updated on ${formatDate(update.dateTime)}</div>
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
document.addEventListener('DOMContentLoaded', () => {
    const goBackButton = document.getElementById('goBackButton');
    goBackButton.addEventListener('click', () => {
        document.getElementById('feedback-content-container').classList.add('feedback-hidden');
        document.getElementById('feedback-table').classList.remove('feedback-hidden');
    });
});

// Update button directs to feedback-update.html
const updateButton = document.getElementById('update-btn');
if (updateButton) {
    updateButton.addEventListener('click', () => {
        window.location.href = './feedback-update.html';  // Redirect to the update page
    });
}