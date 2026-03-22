// @ts-ignore
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getAuth } from "firebase/auth";
// @ts-ignore
import { getFirestore } from "firebase/firestore";
type Auth = ReturnType<typeof getAuth>;

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