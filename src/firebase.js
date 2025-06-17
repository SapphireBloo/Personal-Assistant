// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ Optional Firestore Avatar Helpers
export async function saveAvatarsToFirestore(userAvatar, assistantAvatar) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await setDoc(doc(db, "users", user.uid), {
      userAvatar,
      assistantAvatar,
    }, { merge: true });
  } catch (err) {
    console.error("❌ Error saving avatars:", err);
  }
}

export async function loadAvatarsFromFirestore() {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error("❌ Error loading avatars:", err);
  }
  return null;
}
