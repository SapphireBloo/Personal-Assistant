import React from "react";
import "./VoiceToggle.css";

export default function VoiceToggle({ voiceEnabled, setVoiceEnabled }) {
  return (
    <div className="voice-toggle">
      <label className="switch">
        <input
          type="checkbox"
          checked={voiceEnabled}
          onChange={() => setVoiceEnabled(!voiceEnabled)}
        />
        <span className="slider round"></span>
      </label>
      <span className="label-text">{voiceEnabled ? "Voice On" : "Voice Off"}</span>
    </div>
  );
}

