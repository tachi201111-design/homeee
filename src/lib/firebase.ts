import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "";

let app;
let db: any;
let auth: any;

if (isConfigValid) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID);
  auth = getAuth(app);
} else {
  console.warn("Firebase configuration is missing or invalid. Some features may not work.");
}

export { db, auth };

// Validate connection to Firestore
async function testConnection() {
  if (!isConfigValid) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
