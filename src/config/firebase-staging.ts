export const firebaseConfig = {
  apiKey: "AIzaSyA9DBA7m42wOVMX2W6VlY8-ptQ8I3XK-tQ",
  authDomain: "linkedgoals-staging.firebaseapp.com",
  databaseURL: "https://linkedgoals-staging-default-rtdb.firebaseio.com",
  projectId: "linkedgoals-staging",
  storageBucket: "linkedgoals-staging.firebasestorage.app",
  messagingSenderId: "82785247102",
  appId: "1:82785247102:web:a6a6b0e8550e5b125d5d2f",
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