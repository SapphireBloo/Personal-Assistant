import React from "react";

export default function CurrentDate() {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div
    
    >
      📅 {formattedDate}
    </div>
  );
}
