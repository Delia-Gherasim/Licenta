import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCUBmFQPFFsZGZtcBYnRjTJLpg2k4MEl1Q",
  authDomain: "photoadvice-3724b.firebaseapp.com",
  projectId: "photoadvice-3724b",
  storageBucket: "photoadvice-3724b.appspot.com",
  messagingSenderId: "398427724040",
  appId: "1:398427724040:web:b827a2506f7ed5c633b4bd",
  measurementId: "G-2CZBLCMB26",
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };