import React from "react";
import "./VoiceToggle.css";

function VoiceToggle({ voiceEnabled, setVoiceEnabled, user }) {
  const handleChange = () => {
    if (!user && !voiceEnabled) {
      alert("Please sign up or sign in to enable voice.");
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
