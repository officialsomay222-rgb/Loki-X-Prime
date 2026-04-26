import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEQTUcIlyeKasEDLVPWXEgx7KSJqBFd70",
  authDomain: "loki-x-prime-8b088.firebaseapp.com",
  projectId: "loki-x-prime-8b088",
  storageBucket: "loki-x-prime-8b088.firebasestorage.app",
  messagingSenderId: "470871430064",
  appId: "1:470871430064:web:9dcad83b72f3c35e567c75",
  measurementId: "G-NWTVPF2MJP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firebase Auth
import { getAuth } from "firebase/auth";
export const auth = getAuth(app);

export default app;
