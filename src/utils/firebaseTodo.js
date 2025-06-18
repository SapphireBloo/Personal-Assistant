import { collection, addDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

// Add a to-do item
export async function addToFirebaseTodo(uid, text) {
  if (!text.trim()) return;
  await addDoc(collection(db, "todos"), {
    uid,
    text: text.trim(),
    createdAt: new Date(),
  });
}

// Fetch all to-do items for a user
export async function fetchFirebaseTodos(uid) {
  const q = query(collection(db, "todos"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Delete a to-do item by matching text
export async function deleteFirebaseTodoByText(uid, text) {
  const q = query(collection(db, "todos"), where("uid", "==", uid), where("text", "==", text.trim()));
  const querySnapshot = await getDocs(q);

  let deleted = false;
  for (const docSnap of querySnapshot.docs) {
    await deleteDoc(docSnap.ref);
    deleted = true;
  }

  return deleted;
}
