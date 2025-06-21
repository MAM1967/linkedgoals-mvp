export const firebaseConfig = {
  apiKey: "YOUR_STAGING_API_KEY",
  authDomain: "linkedgoals-staging.firebaseapp.com",
  databaseURL: "https://linkedgoals-staging-default-rtdb.firebaseio.com",
  projectId: "linkedgoals-staging",
  storageBucket: "linkedgoals-staging.firebasestorage.app",
  messagingSenderId: "YOUR_STAGING_SENDER_ID",
  appId: "YOUR_STAGING_APP_ID",
};

export const environment = {
  production: false,
  staging: true,
  development: false,
  enableEmulators: false,
  apiUrl: "https://us-central1-linkedgoals-staging.cloudfunctions.net",
  linkedinClientId: "YOUR_STAGING_LINKEDIN_CLIENT_ID",
};