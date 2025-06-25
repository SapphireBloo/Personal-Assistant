import React, { useState, useEffect } from "react";

const tips = [
  " Tip: You can ask the assistant to add things to your to-do list if signed in.",
  " Tip: Signing in offers a more unique experience with the Assistant.",
  " Tip: The profile option under menu offers customization options once signed in!",
  " Use the button to the right to mute or unmute background music.",
  " Tip: The Show/Hide Tools button is a great way to uncramp the screen on mobile!",
  " Tip: You can add Events to your calendar by clicking the day under Tools!",
  " Tip: Under heavy construction....(Is it a bug or a feature?)",
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
      }, 600);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    const player = window.youtubePlayer;
    if (player) {
      const newMuteState = !musicMuted;
      if (newMuteState) {
        player.mute();
      } else {
        player.unMute();
      }
      setMusicMuted(newMuteState);
    }
  };

  const dismissTip = () => {
    setShowTip(false);
  };

  return (
    <>
      <footer
        onClick={toggleMute}
        title="Click to toggle music mute"
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
          boxShadow: "0 0 15px #0f52ba",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: "600",
          letterSpacing: "0.02em",
        }}
      >
        {musicMuted ? "🔇 Unmute Music" : "🎵 Mute Music"}
      </footer>

      {showTip && (
        <div className="footer-tip" key={currentTip}>
          <span className="tip-icon">💡</span>
          <span>{tips[currentTip]}</span>
          <button onClick={dismissTip} aria-label="Dismiss tip" className="tip-dismiss">
            ×
          </button>
        </div>
      )}

      <style>{`
        .footer-tip {
          position: fixed;
          bottom: 50px;
          left: 50%;
          transform: translateX(-50%) translateY(0);
          background: rgba(15, 82, 186, 0.8);
          backdrop-filter: blur(6px);
          color: white;
          padding: 12px 20px;
          border-radius: 20px;
          font-size: 14px;
          max-width: 90vw;
          width: fit-content;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 0 15px #0f52ba;
          animation: fadeSlideIn 0.6s ease forwards;
          user-select: none;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .tip-icon {
          animation: pulse 2.5s infinite ease-in-out;
          font-size: 18px;
        }

        .tip-dismiss {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 20px;
          cursor: pointer;
          user-select: none;
          font-weight: bold;
          padding: 0 4px;
          line-height: 1;
          transition: color 0.3s ease;
        }
        .tip-dismiss:hover {
          color: #ff6666;
        }

        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            text-shadow: 0 0 6px #0f52ba;
          }
          50% {
            text-shadow: 0 0 12px #3ea6ff;
          }
        }

        @media (max-width: 480px) {
          .footer-tip {
            font-size: 12px;
            padding: 8px 16px;
            border-radius: 16px;
          }
          .tip-icon {
            font-size: 16px;
          }
          .tip-dismiss {
            font-size: 18px;
          }
        }
      `}</style>
    </>
  );
}
