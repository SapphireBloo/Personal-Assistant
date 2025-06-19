// utils/memoryUtils.js
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function loadMemory(uid) {
  const ref = doc(db, "memories", uid);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : { facts: [] };
}

export async function saveMemory(uid, memoryData) {
  const ref = doc(db, "memories", uid);
  await setDoc(ref, memoryData, { merge: true });
}
