import React, { useState, useEffect, useRef } from "react";
import StarfieldBackground from "./components/StarfieldBackground";
import WeatherWidget from "./components/WeatherWidget";
import SidebarMenu from "./components/SidebarMenu";
import VoiceVisualizer from "./components/VoiceVisualizer";
import ProfileModal from "./components/ProfileModal";
import VoiceToggle from "./components/VoiceToggle";
import useSpeechQueue from "./hooks/useSpeechQueue";
import useSpeechRecognition from "./hooks/useSpeechRecognition";
import { auth } from "./firebase";
import { handleUserInput } from "./utils/apiHandlers";
import Clock from "./components/Clock";
import TodoWidget from "./components/TodoWidget";
import { Toaster } from "react-hot-toast";
import { saveUserProfile, loadUserProfile } from "./utils/userProfileUtils";
import "./components/WidgetPanel.css";
import Footer from "./components/Footer";
import CurrentDate from "./components/CurrentDate";
import WelcomeModal from "./components/WelcomeModal";
import YouTube from "react-youtube";

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;

export default function App() {
  const [listening, setListening] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [userText, setUserText] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [widgetsVisible, setWidgetsVisible] = useState(true);
  const [userAvatar, setUserAvatar] = useState("default-user.png");
  const [assistantAvatar, setAssistantAvatar] = useState("default-assistant.png");
  const [userProfile, setUserProfile] = useState({
    userName: "",
    assistantName: "Assistant",
  });
const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  const chatEndRef = useRef(null); // 👈 New ref for auto-scroll

  const toggleWidgets = () => {
    setWidgetsVisible((prev) => !prev);
  };

  const { speakIncrementally, isSpeaking, audioRef } = useSpeechQueue(
    ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_ID
  );

  const cleanProfileData = (data) =>
    Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const profile = await loadUserProfile(u.uid);
        if (profile) {
          if (profile.userAvatar) setUserAvatar(profile.userAvatar);
          if (profile.assistantAvatar) setAssistantAvatar(profile.assistantAvatar);
          setUserProfile({
            userName: profile.userName || "",
            assistantName: profile.assistantName || "Assistant",
          });
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      const cleanData = cleanProfileData({
        userAvatar,
        assistantAvatar,
        ...userProfile,
      });
      saveUserProfile(auth.currentUser.uid, cleanData);
    }
  }, [userAvatar, assistantAvatar, userProfile]);

  // 👇 Scroll to bottom on new message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const handleAvatarChange = (type, url) => {
    if (type === "user") {
      setUserAvatar(url);
    } else {
      setAssistantAvatar(url);
    }
  };

  const handleNameChange = (type, name) => {
    setUserProfile((prev) => ({
      ...prev,
      [type === "user" ? "userName" : "assistantName"]: name,
    }));
  };

  const processUserInput = async (text) => {
    const result = await handleUserInput({
      userText: text,
      chatHistory,
      voiceEnabled,
      speakFn: speakIncrementally,
      setAssistantText,
      setChatHistory,
      CEREBRAS_API_KEY,
      userProfile,
    });

    if (result?.error) {
      setAssistantText((prev) => prev || "Sorry, I had trouble understanding that.");
    }
  };

  const { startListening } = useSpeechRecognition({
    enabled: true,
    onResult: (transcript) => {
      setUserText(transcript);
      setListening(false);
      processUserInput(transcript);
    },
    onError: () => setListening(false),
    onStart: () => setListening(true),
    onEnd: () => setListening(false),
  });

  const sendTypedText = () => {
    if (!typedText.trim()) return;
    setUserText(typedText);
    setAssistantText("");
    processUserInput(typedText);
    setTypedText("");
  };
const handleWelcomeConfirm = () => {
  // Unmute YouTube music player if available
  if (window.youtubePlayer) {
    window.youtubePlayer.unMute();
  }

  setShowWelcomeModal(false);
};


  return (
    <>
    {showWelcomeModal && <WelcomeModal onConfirm={handleWelcomeConfirm} />}

      <Toaster
        position="top-left"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #333",
            fontFamily: "Arial, sans-serif",
          },
          iconTheme: {
            primary: "#0f52ba",
            secondary: "#1a1a1a",
          },
          duration: 4000,
        }}
        containerStyle={{
          marginTop: "70px",
          marginLeft: "20px",
        }}
      />

      <StarfieldBackground />
      <SidebarMenu
        userAvatar={userAvatar}
        assistantAvatar={assistantAvatar}
        onAvatarChange={handleAvatarChange}
        userName={userProfile.userName}
        assistantName={userProfile.assistantName}
        onNameChange={handleNameChange}
      />

      <div className={`widget-panel ${widgetsVisible ? "visible" : "hidden"}`}>
        <WeatherWidget />
        <TodoWidget />
      </div>

      <button className="widget-toggle-btn" onClick={toggleWidgets}>
        {widgetsVisible ? "Hide Tools" : "Show Tools"}
      </button>

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
          zIndex: 10,
        }}
      >
        <Clock />
        <CurrentDate />
        <VoiceVisualizer audioRef={audioRef} isSpeaking={isSpeaking} />
        <VoiceToggle voiceEnabled={voiceEnabled} setVoiceEnabled={setVoiceEnabled} user={user} />

        <div style={{ display: "flex", gap: 8, maxWidth: 600, width: "100%" }}>
          <input
            type="text"
            placeholder="Type your message here..."
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            disabled={listening || isSpeaking}
            onKeyDown={(e) => e.key === "Enter" && sendTypedText()}
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
            {chatHistory.map((msg, index) => {
              const formattedTime = msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    alignItems: "flex-start",
                    gap: "8px",
                    marginBottom: "10px",
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
                      position: "relative",
                    }}
                  >
                    <div>{msg.content}</div>
                    {formattedTime && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#ccc",
                          marginTop: "4px",
                          textAlign: "right",
                          userSelect: "none",
                        }}
                      >
                        {formattedTime}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} /> {/* 👈 Auto-scroll anchor */}
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
 <YouTube
  videoId="am1VJP0RnmQ"
  opts={{
    height: "0",
    width: "0",
    playerVars: {
      autoplay: 1,
      loop: 1,
      playlist: "am1VJP0RnmQ", // Required for loop to work
    },
  }}
  onReady={(event) => {
    window.youtubePlayer = event.target;
    event.target.mute(); // Start muted
  }}
/>




    

        {showProfileModal && (
          <ProfileModal
            userAvatar={userAvatar}
            assistantAvatar={assistantAvatar}
            onAvatarChange={handleAvatarChange}
            onClose={() => setShowProfileModal(false)}
            userName={userProfile.userName}
            assistantName={userProfile.assistantName}
            onNameChange={handleNameChange}
          />
        )}
        <Footer />
      </div>
    </>
  );
}
