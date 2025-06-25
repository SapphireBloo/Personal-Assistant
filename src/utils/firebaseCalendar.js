// firebaseCalendar.js
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export async function addCalendarEvent(uid, title, date) {
  if (!title.trim() || !date) return;

  // date here is a Date object or ISO string
  // Convert to local YYYY-MM-DD string:
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;

  await addDoc(collection(db, "calendarEvents"), {
    uid,
    title: title.trim(),
    date: dateString, // <-- store only YYYY-MM-DD string
    createdAt: new Date(),
  });
}


// Fetch all calendar events for a user
export async function fetchCalendarEvents(uid) {
  const q = query(collection(db, "calendarEvents"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Delete by exact match (optional)
export async function deleteCalendarEventByTitle(uid, title) {
  const q = query(
    collection(db, "calendarEvents"),
    where("uid", "==", uid),
    where("title", "==", title.trim())
  );
  const snapshot = await getDocs(q);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(docSnap.ref);
  }
}


// Update a calendar event
export async function updateCalendarEvent(eventId, newTitle, newDate) {
  const eventRef = doc(db, "calendarEvents", eventId);
  await updateDoc(eventRef, {
    title: newTitle,
    date: new Date(newDate),
  });
}
