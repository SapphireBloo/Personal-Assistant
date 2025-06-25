// src/components/CalendarEventModal.jsx
import React, { useState } from "react";
import "./ProfileModal.css";
import { auth } from "../firebase";
import {
  addCalendarEvent,
  deleteCalendarEventByTitle,
} from "../utils/firebaseCalendar";

export default function CalendarEventModal({ date, events = [], onClose, onUpdate }) {
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newTitle.trim() || !auth.currentUser) return;
    setLoading(true);
    await addCalendarEvent(auth.currentUser.uid, newTitle.trim(), date);
    setNewTitle("");
    await onUpdate(); // Re-fetch events from CalendarWidget
    setLoading(false);
  };

  const handleDelete = async (title) => {
    if (!auth.currentUser) return;
    setLoading(true);
    await deleteCalendarEventByTitle(auth.currentUser.uid, title);
    await onUpdate(); // Re-fetch events from CalendarWidget
    setLoading(false);
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: "12px" }}>Schedule</h2>

        {events.length > 0 ? (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {events.map((event, idx) => (
              <li key={idx} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{event.title}</span>
                <button
                  className="cancel-button"
                  onClick={() => handleDelete(event.title)}
                  style={{ marginLeft: "12px", padding: "4px 10px" }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>You're currently free for the day.</p>
        )}

        <div style={{ marginTop: "16px" }}>
          <input
            type="text"
            placeholder="Add event..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={loading}
          />
          <div className="modal-buttons">
            <button onClick={handleAdd} disabled={loading}>
              Add
            </button>
            <button onClick={onClose} className="cancel-button">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
