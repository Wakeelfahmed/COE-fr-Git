
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyDZwfJd_agEK0gqL0010d93QxbGGzSuMWM",
  authDomain: "coe-management-system-2641d.firebaseapp.com",
  projectId: "coe-management-system-2641d",
  storageBucket: "coe-management-system-2641d.firebasestorage.app",
  messagingSenderId: "9208225917",
  appId: "1:9208225917:web:dc944bc3c4814677091114",
  measurementId: "G-B8J3C0L148"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app); // Initialize Firebase Storage


export { auth, storage };