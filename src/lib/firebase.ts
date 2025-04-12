//
//  firebase.ts
//  
//
//  Created by Michael McDermott on 4/8/25.
//
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD2q7PxQoZykMIih6-8fCeNhxBjPxVpBpc",
    authDomain: "linkedgoals-d7053.firebaseapp.com",
    projectId: "linkedgoals-d7053",
    storageBucket: "linkedgoals-d7053.firebasestorage.app",
    messagingSenderId: "753801883214",
    appId: "1:753801883214:web:cf46567024a37452a65d1f"
};
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
