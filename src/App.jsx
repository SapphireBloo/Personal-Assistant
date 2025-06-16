import React, { useState, useEffect, useRef } from "react";
import VantaBackground from "./VantaBackground";
import WeatherWidget from "./components/WeatherWidget";
import SidebarMenu from "./components/SidebarMenu";
import VoiceVisualizer from "./components/VoiceVisualizer";

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;


export default function App() {
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const speechQueue = useRef([]);
  const speakingRef = useRef(false);

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
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CEREBRAS_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-4-scout-17b-16e-instruct",
          messages: [{ role: "user", content: text }],
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

    } catch (error) {
      console.error("Streaming error:", error);
      setIsSpeaking(false);
      setAssistantText((prev) => prev.trim() ? prev : "Sorry, I had trouble understanding that.");
    }
  }

  async function speakIncrementally(text) {
    if (!voiceEnabled) return;
    speechQueue.current.push(text);
    if (!speakingRef.current) {
      playNextSpeech();
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
        buttons={[
          { label: "Sign up" },
          { label: "Sign in" },
          { label: "Chat History" },
          { label: "Help" },
        ]}
      />
      <WeatherWidget />
      <div
        style={{
          position: "relative",
          padding: 20,
          fontFamily: "Arial, sans-serif",
          color: "#e0e0e0",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <h1>Welcome to Sapphire</h1>
        <VoiceVisualizer audioRef={audioRef} isSpeaking={isSpeaking} />

        {/* TTS Toggle */}
        <div style={{ marginBottom: 20 }}>
          <label>
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Voice Enabled
          </label>
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

        <div style={{ marginTop: 20, textAlign: "center", maxWidth: 600 }}>
          <strong>You said:</strong>
          <p>{userText || "..."}</p>
        </div>

        <div style={{ marginTop: 20, textAlign: "center", maxWidth: 600 }}>
          <strong>Assistant says:</strong>
          <p>{assistantText || "..."}</p>
        </div>

        <audio ref={audioRef} />
      </div>
    </>
  );
}
