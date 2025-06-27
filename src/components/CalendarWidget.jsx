// src/components/CalendarWidget.jsx
import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { fetchCalendarEvents } from "../utils/firebaseCalendar";
import CalendarEventModal from "./CalendarEventModal";
import "./CalendarWidget.css";
import { onAuthStateChanged } from "firebase/auth";

export default function CalendarWidget() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);

  // Fetch events from Firestore
  const refetchEvents = async () => {
    if (auth.currentUser) {
      const allEvents = await fetchCalendarEvents(auth.currentUser.uid);
      setEvents(allEvents);
    }
  };


useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchCalendarEvents(user.uid).then(setEvents);
    }
  });

  return () => unsubscribe();
}, []);
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateString = (year, month, day) => {
    const mm = (month + 1).toString().padStart(2, "0");
    const dd = day.toString().padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const weeks = [];
    let day = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];

      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDay) || day > daysInMonth) {
          week.push(<td key={j}></td>);
        } else {
          const dayDate = new Date(currentYear, currentMonth, day);
          const dateString = formatDateString(currentYear, currentMonth, day);

          const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          const isSelected =
            selectedDate &&
            selectedDate.toDateString() === dayDate.toDateString();

          const hasEvent = events.some((e) => e.date === dateString);

          week.push(
            <td
              key={j}
              onClick={() => setSelectedDate(dayDate)}
              className={hasEvent ? "flash-blue" : ""}
              style={{
                padding: "6px",
                borderRadius: "6px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: isToday
                  ? "#0f52ba"
                  : isSelected
                  ? "rgba(255,255,255,0.2)"
                  : "transparent",
                color: isToday ? "#fff" : "#e0e0e0",
                fontWeight: isToday || isSelected ? "bold" : "normal",
              }}
            >
              {day}
            </td>
          );

          day++;
        }
      }

      weeks.push(<tr key={i}>{week}</tr>);
    }

    return weeks;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return events.filter((e) => e.date === dateStr);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div style={widgetStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <button onClick={handlePrevMonth} style={navBtn}>‹</button>
        <span style={{ fontWeight: "bold" }}>
          {monthNames[currentMonth]} {currentYear}
        </span>
        <button onClick={handleNextMonth} style={navBtn}>›</button>
      </div>

      <table style={{ width: "100%", borderSpacing: "4px" }}>
        <thead>
          <tr style={{ color: "#0f52ba", fontSize: "12px" }}>
            <th>Su</th><th>Mo</th><th>Tu</th><th>We</th>
            <th>Th</th><th>Fr</th><th>Sa</th>
          </tr>
        </thead>
        <tbody>{renderCalendar()}</tbody>
      </table>

      {selectedDate && (
        <CalendarEventModal
          date={selectedDate}
          events={getEventsForSelectedDate()}
          onClose={() => setSelectedDate(null)}
          onUpdate={refetchEvents}
        />
      )}
    </div>
  );
}

const widgetStyle = {
  padding: 16,
  backgroundColor: "rgba(0,0,0,0.6)",
  color: "#e0e0e0",
  borderRadius: 12,
  maxWidth: 260,
  fontSize: 14,
  fontFamily: "Arial, sans-serif",
  boxShadow: "0 0 15px rgba(15,82,186,0.7)",
};

const navBtn = {
  backgroundColor: "transparent",
  border: "1px solid #444",
  color: "#e0e0e0",
  padding: "2px 8px",
  borderRadius: 4,
  cursor: "pointer",
};
