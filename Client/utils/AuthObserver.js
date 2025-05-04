import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from "./firebaseConfig";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";

const USER_ID_KEY = "currentUserId";

class AuthObserver {
  constructor() {
    this.subscribers = [];
    this.user = null;
    this.unsubscribeFn = null;
  }

  init() {
    this.unsubscribeFn = onAuthStateChanged(auth, async (user) => {
      this.user = user;
      if (user?.uid) {
        await AsyncStorage.setItem(USER_ID_KEY, user.uid); 
      } else {
        await AsyncStorage.removeItem(USER_ID_KEY); 
      }
      this.notify(user);
    });
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    if (this.user !== null) callback(this.user);
  }

  unsubscribe(callback) {
    this.subscribers = this.subscribers.filter(cb => cb !== callback);
  }

  notify(user) {
    this.subscribers.forEach(cb => cb(user));
  }

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user?.uid;
      if (uid) await AsyncStorage.setItem(USER_ID_KEY, uid); 
      return userCredential;
    } catch (error) {
      console.error("Login error:", error.message);
      throw new Error(error.message);
    }
  }

  async register({ email, password, name, bio }) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const db = getFirestore();
    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      bio,
      postRating: 0,
      commentsRating: 0,
      followers: [],
      following: [],
    });

    await AsyncStorage.setItem(USER_ID_KEY, user.uid); 
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      console.log("User data:", userDoc.data());
    } else {
      console.log("No such document!");
    }

    return userCredential;
  }

  async logout() {
    await AsyncStorage.removeItem(USER_ID_KEY); 
    return signOut(auth);
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  async getCurrentUserId() {
    if (this.user?.uid) return this.user.uid;
    return await AsyncStorage.getItem(USER_ID_KEY); 
  }

  cleanup() {
    if (this.unsubscribeFn) this.unsubscribeFn();
  }
}

export default new AuthObserver();
