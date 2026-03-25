import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Firebase Config API Key Loaded:", firebaseConfig.apiKey ? "Yes (starts with " + firebaseConfig.apiKey.substring(0, 5) + ")" : "No");

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Force long-polling to prevent WebSocket connection drops during Next.js Hot Module Replacement
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} else {
  app = getApps()[0];
  db = getFirestore(app);
}

const auth = getAuth(app);

export { app, auth, db };
