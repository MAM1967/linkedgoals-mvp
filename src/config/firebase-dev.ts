export const firebaseConfig = {
  apiKey: "AIzaSyDlMrKCMZlxf_3WlV7TX7O7bymeLzU3Qtw",
  authDomain: "linkedgoals-development.firebaseapp.com",
  databaseURL: "https://linkedgoals-development-default-rtdb.firebaseio.com",
  projectId: "linkedgoals-development",
  storageBucket: "linkedgoals-development.firebasestorage.app",
  messagingSenderId: "820615632128",
  appId: "1:820615632128:web:4ef6e8a10bed5ee6accfe5",
};

export const environment = {
  production: false,
  staging: false,
  development: true,
  enableEmulators: true,
  apiUrl: "https://us-central1-linkedgoals-development.cloudfunctions.net",
  linkedinClientId: "7880c93kzzfsgj", // Use production for now, create separate dev app later
  linkedinRedirectUri: "https://linkedgoals-development.web.app/linkedin",
  localRedirectUri: "http://localhost:5173/linkedin",
};