import React, { useState, useEffect } from "react";

const tips = [
  "💡 Tip: You can ask the assistant to add things to your to-do list if signed in.",
  "💡 Tip: Signing in offers a more unique experience with the Assistant.",
  "💡 Tip: The profile option under menu offers customization options once signed in!",
  "🎵 Use the button to the right to mute or unmute background music.",
  "💡 Tip: The Show/Hide Tools button is a great way to uncramp the screen on mobile!",
];

export default function Footer() {
  const [musicMuted, setMusicMuted] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    const audio = document.getElementById("bg-music");
    if (audio) {
      setMusicMuted(audio.muted);
    }

    const interval = setInterval(() => {
      setShowTip(false);
      setTimeout(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
        setShowTip(true);
      }, 500);
    }, 10000);

    return () => clearInterval(interval);
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
    <>
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

      {showTip && (
        <div
          key={currentTip}
          style={{
            position: "fixed",
            bottom: 50,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "16px",
            fontSize: "14px",
            maxWidth: "90vw",
            width: "fit-content",
            textAlign: "center",
            whiteSpace: "normal",
            wordWrap: "break-word",
            zIndex: 99,
            animation: "tip-scroll 8s ease-in-out forwards",
          }}
        >
          {tips[currentTip]}
        </div>
      )}

      <style>
        {`
          @keyframes tip-scroll {
            0% {
              transform: translateX(-100vw) translateY(0);
              opacity: 0;
            }
            30% {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
            50% {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
            70% {
              transform: translateX(-50%) translateY(20px);
              opacity: 0.8;
            }
            100% {
              transform: translateX(-50%) translateY(60px);
              opacity: 0;
            }

            @media (max-width: 480px) {
              div[style*="tip-scroll"] {
                font-size: 12px !important;
                padding: 6px 12px !important;
              }
            }
          }
        `}
      </style>
    </>
  );
}
