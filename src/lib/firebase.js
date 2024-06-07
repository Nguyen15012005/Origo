// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "origo-9e630.firebaseapp.com",
  projectId: "origo-9e630",
  storageBucket: "origo-9e630.appspot.com",
  messagingSenderId: "885203918804",
  appId: "1:885203918804:web:7c05b888233b214aff4041",
  measurementId: "G-CFKWTW68FJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
