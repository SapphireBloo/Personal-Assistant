import React from "react";
import toast from "react-hot-toast";
import "./VoiceToggle.css";

function VoiceToggle({ voiceEnabled, setVoiceEnabled, user }) {
  const handleChange = () => {
  if (!user && !voiceEnabled) {
    toast("Please sign in to enable voice.", {
      icon: (
        <span style={{ animation: "flash 1s infinite", fontSize: "20px" }}>
          ⬆️
        </span>
      ),
    });
    return;
  }
  setVoiceEnabled(!voiceEnabled);
};


  return (
    <div className="voice-toggle-wrapper">
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={voiceEnabled}
          onChange={handleChange}
        />
        <span className="slider"></span>
      </label>
      <span className="toggle-label">
        {voiceEnabled ? "Voice Enabled" : "Voice Disabled"}
      </span>
    </div>
  );
}

export default VoiceToggle;
