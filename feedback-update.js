import { auth, database } from './firebase.js'; // Import Firebase initialization
import { ref, push, set, child, get } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";

// Fetch the current feedback from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const feedbackUID = localStorage.getItem('currentFeedbackUID'); // Get the selected feedback UID from localStorage

    if (feedbackUID) {
        // Reference to the selected feedback in the database
        const feedbackRef = ref(database, 'feedbacks/' + feedbackUID);

        // Fetch feedback data from Firebase
        get(feedbackRef).then((snapshot) => {
            if (snapshot.exists()) {
                const feedback = snapshot.val();
                
                // Display feedback title and description
                document.getElementById('feedback-title').textContent = feedback.title;
                document.getElementById('feedback-description').textContent = feedback.description;

                // Get form elements
                const feedbackForm = document.querySelector('form');
                const descriptionInput = document.querySelector('#description');
                const statusRadioInputs = document.querySelectorAll('input[name="feedback-status-update"]');
                
                // Attach event listener to form submit
                feedbackForm.addEventListener('submit', async (event) => {
                    event.preventDefault();

                    const description = descriptionInput.value;
                    const status = [...statusRadioInputs].find(input => input.checked)?.value;
                    const user = auth.currentUser;

                    // Check if user is logged in
                    if (!user) {
                        alert('You need to log in to update feedback.');
                        return;
                    }

                    // Get the current date and time for feedback update
                    const dateTime = new Date().toISOString();

                    // Create update object
                    const updateData = {
                        message: description,
                        status,
                        dateTime,
                        admin: user.uid
                    };

                    try {
                        // Reference to the updates node under the selected feedback
                        const updatesRef = ref(database, `feedbacks/${feedbackUID}/updates`);

                        // Push the new update under the feedback's updates
                        const newUpdateRef = push(updatesRef);
                        await set(newUpdateRef, updateData);

                        alert('Feedback has been updated successfully!');
                        
                        // Optionally clear the form after submitting
                        feedbackForm.reset();
                    } catch (error) {
                        console.error('Error submitting feedback update:', error);
                        alert('There was an error submitting your feedback update. Please try again later.');
                    }
                });
            } else {
                console.error('Selected feedback not found in the database.');
            }
        }).catch(error => {
            console.error('Error fetching feedback:', error);
            alert('There was an error fetching the feedback data. Please try again later.');
        });
    } else {
        console.error('No feedback found in localStorage.');
    }
});