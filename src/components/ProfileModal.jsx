import React, { useState } from "react";
import "./ProfileModal.css"; // optional for styling, or use inline

export default function ProfileModal({ userAvatar, assistantAvatar, onAvatarChange, onClose }) {
  const [userInput, setUserInput] = useState(userAvatar);
  const [assistantInput, setAssistantInput] = useState(assistantAvatar);

  const handleSave = () => {
    if (userInput) onAvatarChange("user", userInput);
    if (assistantInput) onAvatarChange("assistant", assistantInput);
    onClose();
  };

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <h2>Customize Avatars</h2>

        <div className="avatar-section">
          <label>User Avatar:</label>
          <img src={userInput} alt="User" className="avatar-preview" />
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Image URL or /path/to/image.png"
          />
        </div>

        <div className="avatar-section">
          <label>Assistant Avatar:</label>
          <img src={assistantInput} alt="Assistant" className="avatar-preview" />
          <input
            type="text"
            value={assistantInput}
            onChange={(e) => setAssistantInput(e.target.value)}
            placeholder="Image URL or /path/to/image.png"
          />
        </div>

        <div className="modal-buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose} className="cancel-button">Cancel</button>
        </div>
      </div>
    </div>
  );
}
