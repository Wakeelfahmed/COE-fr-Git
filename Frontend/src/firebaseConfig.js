
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

import { getAuth } from "firebase/auth";
const firebaseConfig = {
    apiKey: "AIzaSyBvASPgz4stJKmkJ0rbYDuDMarQjxdsoik",
    authDomain: "coe-management-system.firebaseapp.com",
    projectId: "coe-management-system",
    storageBucket: "coe-management-system.appspot.com",
    messagingSenderId: "1092603393427",
    appId: "1:1092603393427:web:bf8a010c1c6faa3b516466",
    measurementId: "G-NZ4V4L7H10"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app); // Initialize Firebase Storage


export { auth, storage };