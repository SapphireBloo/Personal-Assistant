import React, { useState } from "react";
import "./SidebarMenu.css";

const buttons = ["Sign up", "Sign in", "Chat History", "Help"];

export default function SidebarMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sidebar-toggle-wrapper">
      <button className="menu-toggle" onClick={() => setOpen(!open)}>
        ☰ Menu
      </button>

      {open && (
        <div className="sidebar">
          {buttons.map((label) => (
            <button key={label} className="sidebar-button">
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
