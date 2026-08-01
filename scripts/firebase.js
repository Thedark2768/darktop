import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyBhFO0vj9KVVs5dRKpfritpHPl3y6_HY3A",
  authDomain: "darktop-94a0a.firebaseapp.com",
  projectId: "darktop-94a0a",
  storageBucket: "darktop-94a0a.firebasestorage.app",
  messagingSenderId: "468740111278",
  appId: "1:468740111278:web:d2600ffdefccdb7238e63f"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
