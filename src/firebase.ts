import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyCjmJg2MXnlUmNg1U0m2NvlaPnVPctGCoI",
  authDomain: "success-payment-dashboard.firebaseapp.com",
  projectId: "success-payment-dashboard",
  storageBucket: "success-payment-dashboard.firebasestorage.app",
  messagingSenderId: "635643668373",
  appId: "1:635643668373:web:e519559793ec93af03389c",
};

const app = initializeApp(firebaseConfig)

export const auth: Auth = getAuth(app);
export const db = getFirestore(app);