import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from "./firebaseConfig";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getAuth,
} from "firebase/auth";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
  updateEmail as firebaseUpdateEmail,
} from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig.extra.API_URL_DATA;
const USER_ID_KEY = "currentUserId";
const POST_STORAGE_KEY = "cachedPosts";


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
  async fetchUserProfile(userId) {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`);
      if (!res.ok) throw new Error("Server error fetching user profile");
      const json = await res.json();
      return json; 
    } catch (error) {
      console.warn("Error fetching profile:", error);
      return null;
    }
  }
  async fetchUserName(userId) {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`);
      if (!res.ok) throw new Error("Server error fetching user profile");
      const json = await res.json();
      return json.name; 
    } catch (error) {
      console.warn("Error fetching profile:", error);
      return null;
    }
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
    const userProfile = await this.fetchUserProfile(user.uid);
    return userCredential;
  }

  async logout() {
    await AsyncStorage.clear();
    return signOut(auth);
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  async getCurrentUserId() {
    if (this.user?.uid) return this.user.uid;
    return await AsyncStorage.getItem(USER_ID_KEY); 
  }
  async reauthenticate(currentPassword) {
    const user = this.getCurrentUser();
    if (!user || !currentPassword) {
      throw new Error("Missing user or password");
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    return await reauthenticateWithCredential(user, credential);
  }
  async getToken() {
    const user = getAuth().currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }
  
  async updatePassword(newPassword, currentPassword) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("No user signed in");
    await this.reauthenticate(currentPassword);
    return await firebaseUpdatePassword(user, newPassword);
  }

  async updateEmail(newEmail) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("No user signed in");
    return await firebaseUpdateEmail(user, newEmail);
  }

  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Password reset error:", error.message);
      throw new Error(error.message);
    }
  }

  cleanup() {
    if (this.unsubscribeFn) this.unsubscribeFn();
  }
}

export default new AuthObserver();
