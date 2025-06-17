import React, { useState, useEffect, useRef } from "react";
import VantaBackground from "./VantaBackground";
import WeatherWidget from "./components/WeatherWidget";
import SidebarMenu from "./components/SidebarMenu";
import VoiceVisualizer from "./components/VoiceVisualizer";
import ProfileModal from "./components/ProfileModal";
import { auth, db, saveAvatarsToFirestore, loadAvatarsFromFirestore } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import VoiceToggle from "./components/VoiceToggle";

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

export default function App() {
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem("userAvatar") || "/src/assets/default-user.png");
  const [assistantAvatar, setAssistantAvatar] = useState(() => localStorage.getItem("assistantAvatar") || "/default-assistant.png");
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // <-- ADDED: user state to track auth
  const [user, setUser] = useState(null);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const speechQueue = useRef([]);
  const speakingRef = useRef(false);

  // Load avatars from Firestore when user logs in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u); // <-- Set user on auth state change
      if (u) {
        try {
          const data = await loadAvatarsFromFirestore();
          if (data) {
            if (data.userAvatar) setUserAvatar(data.userAvatar);
            if (data.assistantAvatar) setAssistantAvatar(data.assistantAvatar);
          }
        } catch (error) {
          console.error("Failed to load avatars from Firestore:", error);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Save avatars to Firestore whenever they change (if logged in)
  useEffect(() => {
    if (auth.currentUser) {
      saveAvatarsToFirestore(userAvatar, assistantAvatar).catch((err) =>
        console.error("Failed to save avatars to Firestore:", err)
      );
    }
  }, [userAvatar, assistantAvatar]);

  // Update localStorage & state on avatar change
  const handleAvatarChange = (type, url) => {
    if (type === "user") {
      setUserAvatar(url);
      localStorage.setItem("userAvatar", url);
    } else {
      setAssistantAvatar(url);
      localStorage.setItem("assistantAvatar", url);
    }
  };

  useEffect(() => {
    if (!("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition API not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserText(transcript);
      setListening(false);
      handleUserInput(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !listening && !isSpeaking) {
      setUserText("");
      setAssistantText("");
      setListening(true);
      recognitionRef.current.start();
    }
  };

  const sendTypedText = () => {
    if (!typedText.trim()) return;
    setUserText(typedText);
    setAssistantText("");
    handleUserInput(typedText);
    setTypedText("");
  };

  async function handleUserInput(text) {
    try {
      setAssistantText("");
      let fullAssistantText = "";

      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CEREBRAS_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-4-scout-17b-16e-instruct",
          messages: [...chatHistory, { role: "user", content: text }],
          stream: true,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let phraseBuffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "");
            try {
              const json = JSON.parse(jsonStr);
              const token = json.choices?.[0]?.delta?.content;
              if (token) {
                setAssistantText((prev) => prev + token);
                fullAssistantText += token;
                phraseBuffer += token;

                if (/[.!?]\s$/.test(phraseBuffer) || phraseBuffer.length > 80) {
                  if (voiceEnabled) {
                    await speakIncrementally(phraseBuffer.trim());
                  }
                  phraseBuffer = "";
                }
              }
            } catch (err) {
              console.warn("Skipping invalid JSON line:", jsonStr);
            }
          }
        }

        buffer = "";
      }

      if (phraseBuffer && voiceEnabled) {
        await speakIncrementally(phraseBuffer.trim());
      }

      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: fullAssistantText.trim() },
      ]);

      if (auth.currentUser) {
        await saveChat(text, fullAssistantText.trim());
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setIsSpeaking(false);
      setAssistantText((prev) => (prev.trim() ? prev : "Sorry, I had trouble understanding that."));
    }
  }

  async function speakIncrementally(text) {
    if (!voiceEnabled) return;
    speechQueue.current.push(text);
    if (!speakingRef.current) {
      playNextSpeech();
    }
  }

  async function saveChat(userMessage, assistantMessage) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, "chats"), {
        uid: user.uid,
        userMessage,
        assistantMessage,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  }

  async function playNextSpeech() {
    if (speechQueue.current.length === 0) {
      speakingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    speakingRef.current = true;
    setIsSpeaking(true);
    const text = speechQueue.current.shift();

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );

      if (!response.ok) {
        console.error("TTS error", await response.text());
        playNextSpeech();
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = audioRef.current;
      audio.src = url;
      audio.onended = () => playNextSpeech();
      audio.onerror = () => playNextSpeech();
      audio.load();
      await audio.play();
    } catch (err) {
      console.error("TTS playback error:", err);
      playNextSpeech();
    }
  }

  return (
    <>
      <VantaBackground
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <SidebarMenu
        userAvatar={userAvatar}
        assistantAvatar={assistantAvatar}
        onAvatarChange={handleAvatarChange}
      />

      <WeatherWidget />
      <div
        style={{
          position: "relative",
          padding: 20,
          paddingBottom: 100,
          fontFamily: "Arial, sans-serif",
          color: "#e0e0e0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <h1>Waiting on a solid Header</h1>
        <VoiceVisualizer audioRef={audioRef} isSpeaking={isSpeaking} />

        <div style={{ marginTop: 20 }}>
          {/* PASS user here */}
          <VoiceToggle voiceEnabled={voiceEnabled} setVoiceEnabled={setVoiceEnabled} user={user} />
        </div>

        <div style={{ display: "flex", gap: 8, maxWidth: 600, width: "100%" }}>
          <input
            type="text"
            placeholder="Type your message here..."
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            disabled={listening || isSpeaking}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendTypedText();
            }}
            style={{
              flexGrow: 1,
              padding: 10,
              fontSize: 16,
              borderRadius: 6,
              border: "1px solid #0f52ba",
              backgroundColor: "#111",
              color: "#e0e0e0",
            }}
          />
          <button
            onClick={sendTypedText}
            disabled={listening || isSpeaking || !typedText.trim()}
            style={{
              padding: "10px 16px",
              fontSize: 16,
              borderRadius: 6,
              border: "none",
              backgroundColor: "#0f52ba",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>

        <button
          onClick={startListening}
          disabled={listening || isSpeaking}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            fontSize: 16,
            borderRadius: 6,
            backgroundColor: listening ? "#555" : "#0f52ba",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          {listening ? "Listening..." : "Start Talking"}
        </button>

        <div style={{ marginTop: 40, maxWidth: 600, width: "100%" }}>
          <h3 style={{ textAlign: "center", marginBottom: 10 }}>Conversation History</h3>
          <div
            style={{
              backgroundColor: "#1a1a1a",
              padding: "10px 16px",
              borderRadius: 8,
              maxHeight: "300px",
              overflowY: "auto",
              border: "1px solid #333",
            }}
          >
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: "10px",
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: "8px",
                  maxWidth: "100%",
                }}
              >
                <img
                  src={msg.role === "user" ? userAvatar : assistantAvatar}
                  alt={`${msg.role} avatar`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #555",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    backgroundColor: msg.role === "user" ? "#0f52ba" : "#333",
                    color: "#fff",
                    padding: "10px 16px",
                    borderRadius: "16px",
                    maxWidth: "75%",
                    wordWrap: "break-word",
                    fontSize: "16px",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setChatHistory([])}
          style={{
            marginTop: 10,
            padding: "6px 12px",
            backgroundColor: "#0f52ba",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Clear Conversation
        </button>

        <audio ref={audioRef} />
        {showProfileModal && (
          <ProfileModal
            userAvatar={userAvatar}
            assistantAvatar={assistantAvatar}
            onAvatarChange={handleAvatarChange}
            onClose={() => setShowProfileModal(false)}
          />
        )}
      </div>
    </>
  );
}
