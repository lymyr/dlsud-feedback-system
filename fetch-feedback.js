import { database, auth } from './firebase.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js';

// Function to display values in HTML if element exists
function setElementTextContent(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
        const uid = user.uid;
        const feedbackRef = ref(database, 'feedbacks');

        onValue(feedbackRef, (snapshot) => {
            const feedbacks = snapshot.val();

            if (feedbacks) {
                // Student Dashboard Counters
                let studentTotalFeedback = 0;
                let studentPendingCount = 0;
                let studentOngoingCount = 0;
                let studentResolvedCount = 0;

                // Admin Dashboard Counters
                let adminTotalFeedback = 0;
                let adminPendingCount = 0;
                let adminOngoingCount = 0;
                let adminResolvedCount = 0;
                let suggestionCount = 0;
                let concernCount = 0;

                const userCollege = user.college || ''; // Assuming 'college' is stored in user profile

                Object.values(feedbacks).forEach(feedback => {
                    // For Students: Count feedbacks related to their UID
                    if (feedback.student === uid) {
                        studentTotalFeedback++;
                        if (feedback.status === 'Pending') studentPendingCount++;
                        if (feedback.status === 'Ongoing') studentOngoingCount++;
                        if (feedback.status === 'Resolved') studentResolvedCount++;
                    }

                    // For Admins: Count feedbacks in their college
                    if (feedback.college === userCollege) {
                        adminTotalFeedback++;
                        if (feedback.status === 'Pending') adminPendingCount++;
                        if (feedback.status === 'Ongoing') adminOngoingCount++;
                        if (feedback.status === 'Resolved') adminResolvedCount++;
                        if (feedback.category === 'Suggestion') suggestionCount++;
                        if (feedback.category === 'Concern') concernCount++;
                    }
                });

                // Display Student Dashboard Values
                setElementTextContent('total-feedback', studentTotalFeedback);
                setElementTextContent('pending-feedback', studentPendingCount);
                setElementTextContent('ongoing-feedback', studentOngoingCount);
                setElementTextContent('resolved-feedback', studentResolvedCount);

                // Display Admin Dashboard Values
                setElementTextContent('admin-total-feedback', adminTotalFeedback);
                setElementTextContent('admin-pending-feedback', adminPendingCount);
                setElementTextContent('admin-ongoing-feedback', adminOngoingCount);
                setElementTextContent('admin-resolved-feedback', adminResolvedCount);
                setElementTextContent('suggestion-feedback', suggestionCount);
                setElementTextContent('concern-feedback', concernCount);
            }
        });
    }
});
