import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { USER_STATE_CHANGE } from "../constants/index.js";

export function fetchUser() {
  const db = getFirestore();
  return async (dispatch) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.log("No user logged in");
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(userDocRef);

      if (snapshot.exists()) {
        dispatch({
          type: USER_STATE_CHANGE,
          currentUser: snapshot.data(),
        });
      } else {
        console.log(" User document does not exist in Firestore.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };
}
