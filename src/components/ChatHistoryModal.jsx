// src/ChatHistoryModal.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import "./ChatHistoryModal.css"; // New dedicated modal CSS

export default function ChatHistoryModal({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, "chats"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(data);
    };

    fetchHistory();
  }, []);

  const toggleFavorite = async (id, currentStatus) => {
    const chatRef = doc(db, "chats", id);
    await updateDoc(chatRef, { favorite: !currentStatus });

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, favorite: !currentStatus } : msg
      )
    );
  };

  const filteredMessages =
    activeTab === "favorites"
      ? messages.filter((msg) => msg.favorite)
      : messages;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2>Chat History</h2>

      <div className="tabs">
  <button
    className={`tab-button ${activeTab === "all" ? "active" : ""}`}
    onClick={() => setActiveTab("all")}
  >
    All Chats
  </button>

  <button
    className={`tab-button ${activeTab === "favorites" ? "active" : ""}`}
    onClick={() => setActiveTab("favorites")}
  >
    <span className="favorites-tab-label">
      Favorites <span className="star">★</span>
    </span>
  </button>
</div>



        {filteredMessages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          <ul style={{ maxHeight: "300px", overflowY: "auto" }}>
            {filteredMessages.map((msg, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: "0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <strong>You:</strong> {msg.userMessage}
                  <br />
                  <strong>AI:</strong> {msg.assistantMessage}
                </div>
               <button
  onClick={() => toggleFavorite(msg.id, msg.favorite)}
  style={{
    border: "none",
    background: "none",
    fontSize: msg.favorite ? "1.5rem" : "1.25rem",
    cursor: "pointer",
    color: msg.favorite ? "#0a84ff" : "#888",
    textShadow: msg.favorite ? "0 0 6px #0a84ff" : "none",
    transition: "all 0.2s ease",
  }}
  title={msg.favorite ? "Unfavorite" : "Favorite"}
>
  {msg.favorite ? "★" : "☆"}
</button>

              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
