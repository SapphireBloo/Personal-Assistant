// components/TodoWidget.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";


export default function TodoWidget() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setTodos([]);
        return;
      }
      const q = query(
        collection(db, "todos"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const unsubTodos = onSnapshot(q, (snap) => {
        setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return unsubTodos;
    });
    return () => unsubAuth();
  }, []);

  const toggleComplete = async (todo) => {
    await updateDoc(doc(db, "todos", todo.id), {
      completed: !todo.completed
    });
  };

  const deleteTodo = async (id) => {
    await deleteDoc(doc(db, "todos", id));
  };

  return (
    <div style={widgetStyle}>
      <h3 style={{ marginBottom: 8 }}>📝 To‑Do List</h3>
      {todos.length === 0 && <p style={{ margin: 0 }}>No tasks yet.</p>}
      <ul style={listStyle}>
        {todos.map((todo) => (
          <li key={todo.id} style={itemStyle}>
            <input
              type="checkbox"
              checked={!!todo.completed}
              onChange={() => toggleComplete(todo)}
            />
            <span
              style={{
                marginLeft: 8,
                textDecoration: todo.completed ? "line-through" : "none",
                flex: 1
              }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              style={delBtnStyle}
              title="Delete task"
              aria-label={`Delete task "${todo.text}"`}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6b6b")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#f55")}
            >
              ✖
            </button>
          </li>
        ))}
      </ul>
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


const listStyle = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

const itemStyle = {
  display: "flex",
  alignItems: "center",
  padding: "4px 0",
};

const delBtnStyle = {
  marginLeft: 8,
  background: "transparent",
  border: "none",
  color: "#f55",
  fontSize: 16,
  cursor: "pointer",
  transition: "color 0.2s ease",
};
