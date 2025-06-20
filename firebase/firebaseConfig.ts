import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


// this analytics is only initialized in the browser environment
// and only if the measurement ID is provided in the environment variables then it will be initialized by getAnalytics if it is not provided then it will be undefined
// this is to avoid errors in server-side rendering
// if we dont check for the environment and measurement ID, it will throw an error during server-side rendering
// this is because getAnalytics tries to access the window object which is not available in server-side rendering
// so if we dont write this check, it will throw an error during server-side rendering
// and we dont want that to happen
// so we check if the window object is defined and if the measurement ID is provided in the environment variables
let analytics;
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
  analytics = getAnalytics(app);
}