import { database, auth } from './firebase.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js';

// Fetch feedback count for Dashboard
function setElementTextContent(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
        const uid = user.uid;

        // Fetch the user's role and college from the database
        const userRef = ref(database, 'users/' + uid);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            const userRole = userData && userData.role ? userData.role : '';
            const userCollege = userData && userData.college ? userData.college : '';

            // Display the college icon and name (Admins only)
            if (userRole === 'Admin') {
                const adminTitleElement = document.querySelector('.dashboard-admin-title h1');
                const adminIconElement = document.querySelector('.dashboard-admin-title img');

                if (adminTitleElement && adminIconElement) {
                    adminTitleElement.textContent = userCollege;

                    // Set the appropriate college icon
                    if (userCollege === 'College of Business Administration and Accountancy') {
                        adminIconElement.src = './icons/icon-cbaa.svg';
                    } else if (userCollege === 'College of Criminal Justice Education') {
                        adminIconElement.src = './icons/icon-ccje.svg';
                    } else if (userCollege === 'College of Education') {
                        adminIconElement.src = './icons/icon-coed.svg';
                    } else if (userCollege === 'College of Engineering, Architecture and Technology') {
                        adminIconElement.src = './icons/icon-ceat.svg';
                    } else if (userCollege === 'College of Information and Computer Studies') {
                        adminIconElement.src = './icons/icon-cics.svg';
                    } else if (userCollege === 'College of Liberal Arts and Communication') {
                        adminIconElement.src = './icons/icon-clac.svg';
                    } else if (userCollege === 'College of Tourism and Hospitality Management') {
                        adminIconElement.src = './icons/icon-cthm.svg';
                    } else if (userCollege === 'College of Science') {
                        adminIconElement.src = './icons/icon-cos.svg';
                    } else {
                        adminIconElement.src = './icons/default-icon.svg'; // Default icon if no match
                    }
                }
            }

            // Student and Admin Feedback Count Functionality
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
                    let adminThisWeekCount = 0;
                    let adminThisMonthCount = 0;
                    let suggestionCount = 0;
                    let concernCount = 0;
                    let curriculumCount = 0;
                    let assessmentsCount = 0;
                    let facultyCount = 0;
                    let facilitiesCount = 0;
                    let affairsCount = 0;

                    Object.values(feedbacks).forEach(feedback => {
                        const isThisWeek = isDateInRange(feedback.dateTime, 'This Week');
                        const isThisMonth = isDateInRange(feedback.dateTime, 'This Month');

                        // For Students: Count feedbacks with their UID
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
                            if (feedback.type === 'Suggestion') suggestionCount++;
                            if (feedback.type === 'Concern') concernCount++;
                            if (isThisWeek) adminThisWeekCount++;
                            if (isThisMonth) adminThisMonthCount++;
                            if (feedback.category === 'Curriculum') curriculumCount++;
                            if (feedback.category === 'Assessments') assessmentsCount++;
                            if (feedback.category === 'Faculty') facultyCount++;
                            if (feedback.category === 'Facilities') facilitiesCount++;
                            if (feedback.category === 'Student Affairs') affairsCount++;
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
                    setElementTextContent('admin-weekly-feedback', adminThisWeekCount);
                    setElementTextContent('admin-monthly-feedback', adminThisMonthCount);
                    setElementTextContent('suggestion-feedback', suggestionCount);
                    setElementTextContent('concern-feedback', concernCount);

                    // Admin Feedback Category Chart
                    var xValues = ["Curriculum", "Assessments", "Faculty", "Facilities", "Student Affairs"];
                    var yValues = [curriculumCount, assessmentsCount, facultyCount, facilitiesCount, affairsCount];
                    var barColors = ["red", "green", "blue", "orange", "yellow"];

                    // Sort the data (optional: to arrange counts from highest to lowest)
                    var sortedIndices = yValues.map((value, index) => index)
                    .sort((a, b) => yValues[b] - yValues[a]);
                    xValues = sortedIndices.map(index => xValues[index]);
                    yValues = sortedIndices.map(index => yValues[index]);
                    barColors = sortedIndices.map(index => barColors[index]);

                    // Create the chart
                    new Chart("myChart", {
                        type: "bar",
                        data: {
                            labels: xValues,
                            datasets: [{
                                backgroundColor: barColors,
                                data: yValues
                            }]
                        },
                        options: {
                            legend: { display: false },
                            title: {
                                display: true,
                                text: "Automated Feedback Categorization"
                            },
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        beginAtZero: true, // The scale starts at 0
                                        callback: function(value) { // Only show integers
                                            return Number.isInteger(value) ? value : null; 
                                        },
                                    }
                                }]
                            }
                        }
                    });
                }
            });

            // Helper function to check if a date is within the given range (for this week or this month)
            function isDateInRange(feedbackDateTime, dateFilter) {
                const feedbackDate = new Date(feedbackDateTime);
                const currentDate = new Date();

                if (dateFilter === 'This Week') {
                    const startOfWeek = new Date(currentDate);
                    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);

                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);

                    return feedbackDate >= startOfWeek && feedbackDate <= endOfWeek;
                } else if (dateFilter === 'This Month') {
                    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                    startOfMonth.setHours(0, 0, 0, 0);

                    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                    endOfMonth.setHours(23, 59, 59, 999);

                    return feedbackDate >= startOfMonth && feedbackDate <= endOfMonth;
                }
                return false;
            }
        });
    }
});
