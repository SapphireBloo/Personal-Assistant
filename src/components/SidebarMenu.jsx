import React, { useState } from "react";
import "./SidebarMenu.css";
import AuthModal from "./AuthModal";
import ChatHistoryModal from "./ChatHistoryModal";

const buttons = ["Sign up", "Sign in", "Chat History", "Help"];

export default function SidebarMenu() {
  const [open, setOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleButtonClick = (label) => {
    if (label === "Sign up") {
      setAuthMode("signup");
    } else if (label === "Sign in") {
      setAuthMode("signin");
    } else if (label === "Chat History") {
      setShowHistory(true);
    }
    setOpen(false);
  };

  return (
    <>
      <div className="sidebar-toggle-wrapper">
        <button className="menu-toggle" onClick={() => setOpen(!open)}>
          ☰ Menu
        </button>

        {open && (
          <div className="sidebar">
            {buttons.map((label) => (
              <button
                key={label}
                className="sidebar-button"
                onClick={() => handleButtonClick(label)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />}
      {showHistory && <ChatHistoryModal onClose={() => setShowHistory(false)} />}
    </>
  );
}
