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
  if (!title.trim() || !date) {
    console.warn("❌ Missing title or date:", { title, date });
    return;
  }

  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (isNaN(parsedDate)) {
    console.error("❌ Invalid date passed to addCalendarEvent:", date);
    return;
  }

  console.log("📅 Attempting to add event:", { uid, title, date: parsedDate });

  await addDoc(collection(db, "calendarEvents"), {
    uid,
    title: title.trim(),
    date: parsedDate, // use Firestore Timestamp-compatible Date
    createdAt: new Date(),
  });

  console.log("✅ Successfully added event to Firestore.");
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



// ✅ Updated: Update a calendar event
export async function updateCalendarEvent(eventId, newTitle, newDate) {
  const eventRef = doc(db, "calendarEvents", eventId);

  // Convert to YYYY-MM-DD string for consistency
  const d = new Date(newDate);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;

  await updateDoc(eventRef, {
    title: newTitle.trim(),
    date: dateString,
  });
}

