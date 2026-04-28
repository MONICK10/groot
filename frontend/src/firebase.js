// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSJD6wUj3XZQC_NpJFG91HWIc0NA9R0Zw",
  authDomain: "iamgroot-214e3.firebaseapp.com",
  projectId: "iamgroot-214e3",
  storageBucket: "iamgroot-214e3.appspot.com",
  messagingSenderId: "1090235921959",
  appId: "1:1090235921959:web:e522539fdb6063ef99c002",
  measurementId: "G-KR4SPYYKY7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };