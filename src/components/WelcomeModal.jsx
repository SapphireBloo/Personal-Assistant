// src/components/WelcomeModal.jsx
import React from "react";

export default function WelcomeModal({ onConfirm }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Welcome to Your Virtual Assistant</h2>
        <p>This assistant responds to your voice and text input, plays background music (and sometimes ads), and shows live tools like weather and to-do lists.</p>
        <p>Click the button below to start the experience. </p>
        <p>Signing in Offers a unique memory experience.(You can use a made up email, this is just a fun project.)</p>
        <button style={styles.button} onClick={onConfirm}>
          Start Assistant
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0,
    width: "100vw", height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999
  },
  modal: {
    background: "#111",
    color: "#fff",
    padding: "30px 40px",
    borderRadius: 12,
    maxWidth: 500,
    textAlign: "center",
    boxShadow: "0 0 10px #0f52ba"
  },
  button: {
    marginTop: 20,
    padding: "12px 20px",
    backgroundColor: "#0f52ba",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    fontSize: 16,
    cursor: "pointer",
  },
};
