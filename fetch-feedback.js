import { database, auth } from './firebase.js'; // Import Firebase initialization
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js';

// Reference to the feedback collection in the database
const feedbackRef = ref(database, 'feedbacks');

auth.onAuthStateChanged((user) => {
    if (user) {
        const currentUserUID = user.uid;

        // Fetch feedbacks that match the current student UID
        onValue(feedbackRef, (snapshot) => {
            const feedbacks = snapshot.val();

            let totalFeedback = 0;
            let pendingFeedback = 0;
            let ongoingFeedback = 0;
            let resolvedFeedback = 0;

            if (feedbacks) {
                // Loop through each feedback and categorize by status
                Object.values(feedbacks).forEach((feedback) => {
                    if (feedback.student === currentUserUID) {
                        totalFeedback++;
                        switch (feedback.status) {
                            case 'Pending':
                                pendingFeedback++;
                                break;
                            case 'Ongoing':
                                ongoingFeedback++;
                                break;
                            case 'Resolved':
                                resolvedFeedback++;
                                break;
                        }
                    }
                });
            }

            // Update the HTML elements with the counts
            document.getElementById('total-feedback').textContent = totalFeedback;
            document.getElementById('pending-feedback').textContent = pendingFeedback;
            document.getElementById('ongoing-feedback').textContent = ongoingFeedback;
            document.getElementById('resolved-feedback').textContent = resolvedFeedback;
        });
    } else {
        alert('Please log in to view feedbacks.');
    }
});
