import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: "gandharva-2026.firebaseapp.com",
    projectId: "gandharva-2026",
    storageBucket: "gandharva-2026.firebasestorage.app",
    messagingSenderId: "203538225457",
    appId: "1:203538225457:web:cb659270a5e08aeeab3810"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
