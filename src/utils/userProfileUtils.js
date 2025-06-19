import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

function removeUndefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  );
}

export async function saveUserProfile(uid, profileData) {
  const cleanData = removeUndefined(profileData);
  const docRef = doc(db, "userProfiles", uid);
  await setDoc(docRef, cleanData, { merge: true });
}

export async function loadUserProfile(uid) {
  const docRef = doc(db, "userProfiles", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return {
      userName: "User",
      assistantName: "Assistant",
      userAvatar: "default-user.png",
      assistantAvatar: "default-assistant.png",
    };
  }
}
