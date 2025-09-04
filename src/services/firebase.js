// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3mm5G54GOQVAp0JKsKKIhUZWe5HPSQkA",
  authDomain: "anhduongmanagement.firebaseapp.com",
  projectId: "anhduongmanagement",
  storageBucket: "anhduongmanagement.appspot.com",
  messagingSenderId: "126238613337",
  appId: "1:126238613337:web:100d76c28803bfe5d47648",
  measurementId: "G-NQTC9NDCC4",
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  console.log("🔄 Initializing Firebase...");
  app = initializeApp(firebaseConfig);

  // Initialize Auth with specific settings
  auth = getAuth(app);

  // Initialize Firestore
  db = getFirestore(app);

  console.log("✅ Firebase initialized successfully!");
  console.log("📝 Project ID:", app.options.projectId);
  console.log("🌐 Auth Domain:", app.options.authDomain);
  console.log("🔑 API Key exists:", !!firebaseConfig.apiKey);
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
  console.error("Config used:", firebaseConfig);
  throw error;
}

export { app, auth, db };
