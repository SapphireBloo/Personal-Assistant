import { useEffect, useRef } from "react";

export default function useSpeechRecognition({
  onResult,
  onError,
  onStart,
  onEnd,
  enabled = true,
}) {
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (onError) onError(event.error);
    };

    recognition.onstart = () => {
      if (onStart) onStart();
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [enabled, onResult, onError, onStart, onEnd]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  return { startListening };
}
