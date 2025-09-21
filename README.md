# Homework Tracker

A modern, responsive web application for tracking homework assignments across different devices using Firebase authentication and real-time synchronization.

## Features

- 🔐 **Google Sign-In Authentication** - Secure login with Google accounts
- 📱 **Cross-Device Sync** - Real-time synchronization across all devices
- 📝 **Homework Management** - Add, edit, delete, and track homework assignments
- 🏷️ **Organization** - Filter by subject, priority, and status
- 📊 **Status Tracking** - Track assignments from pending to completed
- 📅 **Due Date Management** - Never miss a deadline
- 🎨 **Modern UI** - Beautiful, responsive design that works on all devices
- ⚡ **Real-time Updates** - Changes sync instantly across devices

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains
4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)
5. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click on the web app icon to add a web app
   - Copy the configuration object

### 2. Update Configuration

The Firebase configuration is already set up in `app.js` with your project details:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCA3ECMlIUGr9lh56y4lfcv2Laehxxln2A",
  authDomain: "homework-website-236e8.firebaseapp.com",
  projectId: "homework-website-236e8",
  storageBucket: "homework-website-236e8.firebasestorage.app",
  messagingSenderId: "111412349330",
  appId: "1:111412349330:web:30f429000a07a3fd13194b",
  measurementId: "G-BYR8YTGDFL"
};
```

**Note**: The configuration is already updated with your Firebase project details!

### 3. Firestore Security Rules

Set up these security rules in your Firestore Database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /homework/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 4. Deploy

You can deploy this application to any static hosting service:

- **Firebase Hosting**: `firebase deploy`
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Push to a GitHub repository

## Usage

1. **Sign In**: Click "Sign in with Google" to authenticate
2. **Add Homework**: Fill out the form to add new assignments
3. **Track Progress**: Update status from pending → in progress → completed
4. **Filter & Sort**: Use the controls to organize your homework
5. **Cross-Device**: Sign in on any device to access your homework

## File Structure

```
Homework Website/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── app.js             # JavaScript application logic
├── firebase-config.js # Firebase configuration template
└── README.md          # This file
```

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox and Grid
- **JavaScript (ES6+)** - Application logic with ES6 modules
- **Firebase v9+** - Modern Firebase SDK with modular imports
- **Firestore** - Real-time NoSQL database
- **Google Authentication** - Secure sign-in
- **Google Fonts** - Typography
- **Font Awesome** - Icons

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).
