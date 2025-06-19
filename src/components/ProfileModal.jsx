import React, { useState } from "react";
import "./ProfileModal.css";

export default function ProfileModal({
  userAvatar,
  assistantAvatar,
  userName: initialUserName = "",
  assistantName: initialAssistantName = "",
  onAvatarChange,
  onNameChange,
  onClose,
}) {

  const [userInput, setUserInput] = useState(userAvatar);
  const [assistantInput, setAssistantInput] = useState(assistantAvatar);
  const [userName, setUserName] = useState(initialUserName);
  const [assistantName, setAssistantName] = useState(initialAssistantName);

  const handleSave = () => {
  if (userInput) onAvatarChange("user", userInput);
  if (assistantInput) onAvatarChange("assistant", assistantInput);
  if (userName) onNameChange("user", userName);
  if (assistantName) onNameChange("assistant", assistantName);
  onClose();
};


  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <h2>Customize Profile</h2>

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

        <div className="name-section">
          <label>User Name:</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="name-section">
          <label>Assistant Name:</label>
          <input
            type="text"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            placeholder="Assistant's name"
          />
        </div>

        <div className="modal-buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose} className="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
