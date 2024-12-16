import { auth, database } from './firebase.js'; // Import Firebase initialization
import { ref, push, set } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";

// Get the feedback form elements
const feedbackForm = document.querySelector('form');
const titleInput = document.querySelector('#title');
const descriptionInput = document.querySelector('#description');
const attachmentInput = document.querySelector('#attachment');
const typeRadioInputs = document.querySelectorAll('input[name="feedback-type"]');
const collegeSelect = document.querySelector('#college');

// Predict the category of feedback
async function predictCategory(feedback) {
    try {
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ feedback })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch category prediction');
        }

        const data = await response.json();
        return data.category;
    } catch (error) {
        console.error('Error predicting category:', error);
        return 'Unknown'; // Fallback category
    }
}

// Attach event listener to form submit
feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = titleInput.value;
    const description = descriptionInput.value;
    const attachment = attachmentInput.files[0] || null; // Handle file attachment
    const type = [...typeRadioInputs].find(input => input.checked)?.value;
    const college = collegeSelect.value;
    const user = auth.currentUser;

    // Check if user is logged in
    if (!user) {
        alert('You need to log in to submit feedback.');
        return;
    }

    // Get the current date and time for feedback submission
    const dateTime = new Date().toISOString();

    // Predict category
    const combinedText = title + ". " + description;
    const category = await predictCategory(combinedText);

    // Create feedback object
    const feedbackData = {
        title,
        description,
        attachment: attachment ? attachment.name : null, // Store file name or null if no file
        type,
        college,
        student: user.uid, // Use the UID of the logged-in user
        status: 'Pending', // Default status when submitted
        dateTime,
        category
    };

    try {
        // Reference to the feedback collection in the database
        const feedbackRef = ref(database, 'feedbacks');

        // Push the feedback data to the database
        const newFeedbackRef = push(feedbackRef);
        await set(newFeedbackRef, feedbackData);

        alert('Your feedback has been submitted successfully!');
        window.location.href = 'feedback-log-stu.html';

        // Clear the form
        feedbackForm.reset();
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('There was an error submitting your feedback. Please try again later.');
    }
});