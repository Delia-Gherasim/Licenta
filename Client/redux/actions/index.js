import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { USER_STATE_CHANGE } from "../constants";

export function fetchUser() {
    const db = getFirestore();
    return async (dispatch) => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            return;
        }

        try {
            const userDocRef = doc(db, "users", user.uid);
            const snapshot = await getDoc(userDocRef);

            if (snapshot.exists()) {
                dispatch({ type: USER_STATE_CHANGE, currentUser: snapshot.data() });
            } else {
                console.log("⚠️ User document does not exist in Firestore. Check if it was created properly.");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };
}
