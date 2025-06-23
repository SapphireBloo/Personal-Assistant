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
    const baseRadius = 60;
    const numPoints = 64;

    // Setup audio context and analyser
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }

    // Connect assistant audio
    if (audioRef.current && !sourceRef.current.assistant) {
      try {
        sourceRef.current.assistant = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.assistant.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.warn("Assistant audio source already connected or failed:", err);
      }
    }

    // Connect background music
    const bgMusic = document.getElementById("bg-music");
    if (bgMusic && !sourceRef.current.music) {
      try {
        sourceRef.current.music = audioContextRef.current.createMediaElementSource(bgMusic);
        sourceRef.current.music.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.warn("Music audio source already connected or failed:", err);
      }
    }

    const draw = () => {
      animationId.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const avg = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;

      wavePhase.current += 0.05;
      const dynamicRadius = baseRadius + avg * 0.2;

      // Create wavy orb shape
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const offset = Math.sin(angle * 4 + wavePhase.current) * (avg / 6);
        const radius = dynamicRadius + offset;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        dynamicRadius * 0.4,
        centerX,
        centerY,
        dynamicRadius
      );
      gradient.addColorStop(0, "rgba(15,82,186,0.9)");
      gradient.addColorStop(1, "rgba(15,82,186,0.2)");

      ctx.fillStyle = gradient;
      ctx.shadowColor = "rgba(15,82,186, 0.9)";
      ctx.shadowBlur = 30;
      ctx.fill();
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
