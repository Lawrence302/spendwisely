
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  projectId: import.meta.env.VIT_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VIT_FIREBASE_API_KEY,
  authDomain: import.meta.env.VIT_FIREBASE_AUTH_DOMAIN,
  firestoreDatabaseId: import.meta.env.VIT_FIRESTORE_DATABASE_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}
// Initialize the Firebase application with the configuration from firebase-applet-config.json
const app = initializeApp(firebaseConfig);

// Initialize Firestore database with the specific database ID provided in the config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export default app;