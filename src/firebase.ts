import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCLl9uWB6acyVDptk-2J79OVEAzNut4m5s",
  authDomain: "africhat-connect.firebaseapp.com",
  projectId: "africhat-connect",
  storageBucket: "africhat-connect.firebasestorage.app",
  messagingSenderId: "1019647791780",
  appId: "1:1019647791780:web:5a4b18f6e54504aad5cc31"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export * from './lib/firebase';
export default app;
