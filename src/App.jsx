import React, { useState, useEffect, useRef } from "react";

const ELEVENLABS_API_KEY = "sk_b193185ff7e46dcc02ddff6ee5f634ef75973617bd8caefa";
const OPENAI_API_KEY = "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";
const ELEVENLABS_VOICE_ID = "7p1Ofvcwsv7UBPoFNcpI"; // Default voice

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

    // Create or reuse AudioContext & Analyser only once per component lifecycle
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }

    // Connect source if speaking and not connected yet
    if (isSpeaking && audioRef.current && !sourceRef.current) {
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch {
        // Already connected or context suspended
      }
    }

    // The main drawing loop:
    const draw = () => {
      animationId.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      if (isSpeaking && audioRef.current && !audioRef.current.paused) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        let avg = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;

        const glowRadius = baseRadius + avg / 2;

        // Outer glowing ring reacting to audio
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

        // Inner static ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#0f52ba";
        ctx.lineWidth = 6;
        ctx.shadowColor = "#0f52ba";
        ctx.shadowBlur = 10;
        ctx.stroke();

      } else {
        // Idle animation: wavy, pulsing ring
        wavePhase.current += 0.05;

        // Pulse radius oscillates between 70 and 90
        const pulse = baseRadius + 10 * Math.sin(wavePhase.current * 2);

        const points = 64;
        const waveAmplitude = 10; // wave height
        const waveFrequency = 6;  // number of waves around circle

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

        // Gradient stroke for wavy ring
        const gradient = ctx.createRadialGradient(centerX, centerY, pulse * 0.7, centerX, centerY, pulse + waveAmplitude);
        gradient.addColorStop(0, "rgba(15,82,186, 0.8)");
        gradient.addColorStop(1, "rgba(15,82,186, 0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 12;
        ctx.shadowColor = "rgba(15,82,186, 0.7)";
        ctx.shadowBlur = 20;
        ctx.stroke();

        // Inner static ring
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
      // Only close audio context if component unmounts entirely (optional)
      // audioContextRef.current?.close();
      ctx.clearRect(0, 0, width, height);
    };
  }, [isSpeaking, audioRef]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      style={{ display: "block", margin: "40px auto" }}
    />
  );
}


export default function App() {
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [assistantText, setAssistantText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typedText, setTypedText] = useState("");
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

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
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await aiResponse.json();
      const reply = data.choices[0].message.content.trim();
      setAssistantText(reply);
      await speakWithElevenLabs(reply);
    } catch (error) {
      console.error("Error:", error);
      setAssistantText("Sorry, I had trouble understanding that.");
    }
  }

  async function speakWithElevenLabs(text) {
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

      if (!response.ok) throw new Error("ElevenLabs TTS request failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsSpeaking(true);
        audioRef.current.onended = () => setIsSpeaking(false);
      }
    } catch (error) {
      console.error("ElevenLabs error:", error);
      setIsSpeaking(false);
    }
  }

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#000",
        color: "#e0e0e0",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1>🎙️ Voice Assistant</h1>

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
  );
}
