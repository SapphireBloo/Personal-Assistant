// components/Footer.jsx
import React, { useState, useEffect } from "react";

export default function Footer() {
  const [musicMuted, setMusicMuted] = useState(false);

  useEffect(() => {
    const audio = document.getElementById("bg-music");
    if (audio) {
      setMusicMuted(audio.muted);
    }
  }, []);

  const toggleMute = () => {
    const audio = document.getElementById("bg-music");
    if (audio) {
      const newMuteState = !audio.muted;
      audio.muted = newMuteState;
      setMusicMuted(newMuteState);
    }
  };

  return (
    <footer
      style={{
        position: "fixed",
        bottom: 10,
        right: 20,
        zIndex: 100,
        backgroundColor: "#0f52ba",
        color: "#fff",
        borderRadius: "20px",
        padding: "8px 16px",
        fontSize: "14px",
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "0 0 10px rgba(0,0,0,0.4)",
      }}
      onClick={toggleMute}
    >
      {musicMuted ? "🔇 Unmute Music" : "🎵 Mute Music"}
    </footer>
  );
}
