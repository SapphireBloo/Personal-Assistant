import React, { useRef, useEffect } from "react";
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

    if (audioRef.current && !sourceRef.current) {
  try {
    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
  } catch (err) {
    console.warn("Audio source already connected or error:", err);
  }
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

export default VoiceVisualizer;
