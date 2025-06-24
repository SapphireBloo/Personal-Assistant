import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons"; // Futuristic-style icon

export default function CurrentDate() {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <>
      <div
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "1.5rem",
          color: "#6ec1e4",
          textAlign: "center",
          letterSpacing: "1px",
          animation: "pulseGlow 3s ease-in-out infinite",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <FontAwesomeIcon icon={faCalendarDays} />
        {formattedDate}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600&display=swap');

        @keyframes pulseGlow {
          0%, 100% {
            text-shadow: 0 0 6px #6ec1e4, 0 0 12px #0f52ba;
          }
          50% {
            text-shadow: 0 0 10px #a3c9ff, 0 0 20px #7f00ff;
          }
        }
      `}</style>
    </>
  );
}

