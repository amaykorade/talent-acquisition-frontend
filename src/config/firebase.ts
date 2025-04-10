import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCeT_ez2jl4Z-5Zrt8g89JnCtVnYLp4Cls",
  authDomain: "talent-acquisition-371d2.firebaseapp.com",
  projectId: "talent-acquisition-371d2",
  storageBucket: "talent-acquisition-371d2.firebasestorage.app",
  messagingSenderId: "947335361800",
  appId: "1:947335361800:web:52fc7d8a96b4f12e39e8bd",
  measurementId: "G-7DPN16C6SP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);