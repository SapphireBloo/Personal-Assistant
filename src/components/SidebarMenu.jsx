import React, { useState, useEffect } from "react";
import "./SidebarMenu.css";
import AuthModal from "./AuthModal";
import ChatHistoryModal from "./ChatHistoryModal";
import ProfileModal from "./ProfileModal"; // ✅ ADD THIS LINE
import { auth } from "../firebase";

const buttons = ["Chat History", "Help"];

export default function SidebarMenu({ userAvatar, assistantAvatar, onAvatarChange }) {
  const [open, setOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // ✅ NEW STATE
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleButtonClick = (label) => {
    if (label === "Sign up") {
      setAuthMode("signup");
    } else if (label === "Sign in") {
      setAuthMode("signin");
    } else if (label === "Chat History") {
      setShowHistory(true);
    } else if (label === "Sign out") {
      auth.signOut();
      setUser(null);
      setOpen(false);
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
            {user && (
              <div className="user-info">
                Signed in as <strong>{user.email}</strong>
              </div>
            )}

            {!user && (
              <>
                <button
                  className="sidebar-button"
                  onClick={() => handleButtonClick("Sign up")}
                >
                  Sign up
                </button>
                <button
                  className="sidebar-button"
                  onClick={() => handleButtonClick("Sign in")}
                >
                  Sign in
                </button>
              </>
            )}

            {user && (
  <>
    <button
      className="sidebar-button"
      onClick={() => handleButtonClick("Sign out")}
    >
      Sign out
    </button>

    <button
      className="sidebar-button"
      onClick={() => setShowProfileModal(true)}
    >
      Profile
    </button>

    {/* ADD CHAT HISTORY BUTTON HERE */}
    <button
      className="sidebar-button"
      onClick={() => setShowHistory(true)}
    >
      Chat History
    </button>
  </>
)}


          </div>
        )}
      </div>

      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />}
      {showHistory && <ChatHistoryModal onClose={() => setShowHistory(false)} />}
      
      {/* ✅ PROFILE MODAL */}
      {showProfileModal && (
        <ProfileModal
          userAvatar={userAvatar}
          assistantAvatar={assistantAvatar}
          onAvatarChange={onAvatarChange}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
}
