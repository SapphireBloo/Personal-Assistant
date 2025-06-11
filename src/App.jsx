import React, { useState, useEffect, useRef } from "react";
import VantaBackground from "./VantaBackground";
import WeatherWidget from "./components/WeatherWidget";


const ELEVENLABS_API_KEY = "sk_b193185ff7e46dcc02ddff6ee5f634ef75973617bd8caefa";
const CEREBRAS_API_KEY = "csk-h3cckk6vmk9nj3m383ceet2j9rrkcdr5w9yv3phn4tk449r3";
const ELEVENLABS_VOICE_ID = "7p1Ofvcwsv7UBPoFNcpI";

function VoiceVisualizer({ audioRef, isSpeaking }) {
  const canvasRef = useRef(null);
  const animationId = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const wavePhase = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = 80;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }

    if (isSpeaking && audioRef.current && !sourceRef.current) {
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch {}
    }

    const draw = () => {
      animationId.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      if (isSpeaking && audioRef.current && !audioRef.current.paused) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        let avg = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;

        const glowRadius = baseRadius + avg / 2;

        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          glowRadius * 0.7,
          centerX,
          centerY,
          glowRadius
        );
        gradient.addColorStop(0, "rgba(15,82,186, 0.8)");
        gradient.addColorStop(1, "rgba(15,82,186, 0)");

        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 12;
        ctx.shadowColor = "rgba(15,82,186, 0.7)";
        ctx.shadowBlur = 20;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#0f52ba";
        ctx.lineWidth = 6;
        ctx.shadowColor = "#0f52ba";
        ctx.shadowBlur = 10;
        ctx.stroke();

      } else {
        wavePhase.current += 0.05;
        const pulse = baseRadius + 10 * Math.sin(wavePhase.current * 2);
        const points = 64;
        const waveAmplitude = 10;
        const waveFrequency = 6;

        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const radius = pulse + waveAmplitude * Math.sin(waveFrequency * angle + wavePhase.current);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(centerX, centerY, pulse * 0.7, centerX, centerY, pulse + waveAmplitude);
        gradient.addColorStop(0, "rgba(15,82,186, 0.8)");
        gradient.addColorStop(1, "rgba(15,82,186, 0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 12;
        ctx.shadowColor = "rgba(15,82,186, 0.7)";
        ctx.shadowBlur = 20;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#0f52ba";
        ctx.lineWidth = 6;
        ctx.shadowColor = "#0f52ba";
        ctx.shadowBlur = 10;
        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId.current);
      ctx.clearRect(0, 0, width, height);
    };
  }, [isSpeaking, audioRef]);

  return <canvas ref={canvasRef} width={300} height={300} style={{ display: "block", margin: "40px auto" }} />;
}

export default function App() {
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typedText, setTypedText] = useState("");
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
          const json = JSON.parse(line.replace("data: ", ""));
          const token = json.choices?.[0]?.delta?.content;

          if (token) {
            setAssistantText((prev) => prev + token);
            phraseBuffer += token;

            if (/[.!?]\s$/.test(phraseBuffer) || phraseBuffer.length > 80) {
              await speakIncrementally(phraseBuffer.trim());
              phraseBuffer = "";
            }
          }
        }
      }

      buffer = ""; // Clear buffer each loop
    }

    if (phraseBuffer) {
      await speakIncrementally(phraseBuffer.trim());
    }

  } catch (error) {
  console.error("Streaming error:", error);
  setIsSpeaking(false);
  // Only show fallback text if nothing was received
  setAssistantText((prev) => prev.trim() ? prev : "Sorry, I had trouble understanding that.");
}

}


  async function speakIncrementally(text) {
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
      playNextSpeech(); // skip to next
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onended = () => playNextSpeech();
    audio.onerror = () => playNextSpeech();

    await audio.play();
  } catch (err) {
    console.error("TTS playback error:", err);
    playNextSpeech();
  }
}


  return (
  <>
    {/* VantaBackground should fill the entire viewport behind everything */}
    <VantaBackground 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none" // so it doesn't block clicks
      }}
    />

    <WeatherWidget />


    {/* Main content container with higher z-index */}
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

      <div
        style={{
          display: "flex",
          gap: 8,
          maxWidth: 600,
          width: "100%",
          justifyContent: "center",
        }}
      >
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
