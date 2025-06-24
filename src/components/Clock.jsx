import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNodes } from "@fortawesome/free-solid-svg-icons"; // futuristic icon

export default function Clock() {
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <h1
        key={currentTime} // triggers animation on change
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "2.2rem",
          color: "#0f52ba",
          textAlign: "center",
          marginBottom: "1rem",
          letterSpacing: "1px",
          animation: "blip 0.3s ease-in-out",
        }}
      >
        <FontAwesomeIcon icon={faCircleNodes} style={{ marginRight: 8 }} />
        {currentTime}
      </h1>

      <style>{`
        @keyframes blip {
          0%   { transform: scale(1.05); opacity: 0.8; }
          50%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.05); opacity: 0.9; }
        }

        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600&display=swap');
      `}</style>
    </>
  );
}
