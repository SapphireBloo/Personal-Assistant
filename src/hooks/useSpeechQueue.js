import { useRef, useState } from "react";

export default function useSpeechQueue(ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechQueue = useRef([]);
  const speakingRef = useRef(false);
  const audioRef = useRef(new Audio());

  const speakIncrementally = async (text) => {
    speechQueue.current.push(text);
    if (!speakingRef.current) {
      playNextSpeech();
    }
  };

  const playNextSpeech = async () => {
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
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        console.error("TTS error", await response.text());
        playNextSpeech(); // Try to continue
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
  };

  return { speakIncrementally, isSpeaking, audioRef };
}
