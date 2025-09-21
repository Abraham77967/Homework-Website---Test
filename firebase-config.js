// Firebase Configuration Template
// Copy this file and rename it to firebase-config.js
// Replace the placeholder values with your actual Firebase project configuration

const firebaseConfig = {
    // Your Firebase project configuration
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
} else {
    window.firebaseConfig = firebaseConfig;
}
