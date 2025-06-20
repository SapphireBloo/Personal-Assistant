// components/VoiceVisualizer.jsx
import React, { useRef, useEffect } from "react";

function VoiceVisualizer({ audioRef, isSpeaking }) {
  const canvasRef = useRef(null);
  const animationId = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef({ assistant: null, music: null });
  const wavePhase = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = 80;

    // Setup audio context and analyser
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }

    // Connect assistant audio if not already
    if (audioRef.current && !sourceRef.current.assistant) {
      try {
        sourceRef.current.assistant = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.assistant.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.warn("Assistant audio source already connected or failed:", err);
      }
    }

    // Connect background music if available
    const bgMusic = document.getElementById("bg-music");
    if (bgMusic && !sourceRef.current.music) {
      try {
        sourceRef.current.music = audioContextRef.current.createMediaElementSource(bgMusic);
        sourceRef.current.music.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.warn("Music source already connected or failed:", err);
      }
    }

    const draw = () => {
      animationId.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avg = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
      const radius = baseRadius + avg / 2;

      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.6, centerX, centerY, radius);
      gradient.addColorStop(0, "rgba(15,82,186, 0.8)");
      gradient.addColorStop(1, "rgba(15,82,186, 0)");

      // Outer pulse ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 12;
      ctx.shadowColor = "rgba(15,82,186, 0.7)";
      ctx.shadowBlur = 20;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#0f52ba";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#0f52ba";
      ctx.shadowBlur = 10;
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId.current);
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

export default VoiceVisualizer;
