export const firebaseConfig = {
  apiKey: "YOUR_DEV_API_KEY", // Get from Firebase Console after project creation
  authDomain: "linkedgoals-dev.firebaseapp.com",
  databaseURL: "https://linkedgoals-dev-default-rtdb.firebaseio.com",
  projectId: "linkedgoals-dev",
  storageBucket: "linkedgoals-dev.firebasestorage.app",
  messagingSenderId: "YOUR_DEV_SENDER_ID", // Get from Firebase Console
  appId: "YOUR_DEV_APP_ID", // Get from Firebase Console
};

export const environment = {
  production: false,
  staging: false,
  development: true,
  enableEmulators: true,
  apiUrl: "https://us-central1-linkedgoals-dev.cloudfunctions.net",
  linkedinClientId: "7880c93kzzfsgj", // Use production for now, create separate dev app later
  linkedinRedirectUri: "https://linkedgoals-dev.web.app/linkedin",
  localRedirectUri: "http://localhost:5173/linkedin",
};