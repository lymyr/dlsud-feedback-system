// Firebase CDN imports for the browser
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-analytics.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBp4R5n9WqF77UV22XU7ocXJuJrahtZsRA",
  authDomain: "feedback-system-b7f3f.firebaseapp.com",
  databaseURL: "https://feedback-system-b7f3f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "feedback-system-b7f3f",
  storageBucket: "feedback-system-b7f3f.firebasestorage.app",
  messagingSenderId: "911664091868",
  appId: "1:911664091868:web:19ede5018cf9fc5b30da19",
  measurementId: "G-D2C84Y449K"
};

// Initialize Firebase app and services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const analytics = getAnalytics(app);

export { auth, database };