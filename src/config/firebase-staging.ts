export const firebaseConfig = {
  apiKey: "YOUR_STAGING_API_KEY", // Get from Firebase Console after project creation
  authDomain: "linkedgoals-staging.firebaseapp.com",
  databaseURL: "https://linkedgoals-staging-default-rtdb.firebaseio.com",
  projectId: "linkedgoals-staging",
  storageBucket: "linkedgoals-staging.firebasestorage.app",
  messagingSenderId: "YOUR_STAGING_SENDER_ID", // Get from Firebase Console
  appId: "YOUR_STAGING_APP_ID", // Get from Firebase Console
};

export const environment = {
  production: false,
  staging: true,
  development: false,
  enableEmulators: false,
  apiUrl: "https://us-central1-linkedgoals-staging.cloudfunctions.net",
  linkedinClientId: "7880c93kzzfsgj", // Use production for now, create separate staging app later
  linkedinRedirectUri: "https://linkedgoals-staging.web.app/linkedin",
};