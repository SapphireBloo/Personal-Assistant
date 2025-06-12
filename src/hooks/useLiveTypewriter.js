import { useState, useEffect, useRef } from "react";

export default function useLiveTypewriter(speed = 20) {
  const [displayedText, setDisplayedText] = useState("");
  const queueRef = useRef([]);
  const typingRef = useRef(false);

  useEffect(() => {
    if (typingRef.current) return;

    typingRef.current = true;

    const interval = setInterval(() => {
      if (queueRef.current.length === 0) {
        typingRef.current = false;
        clearInterval(interval);
        return;
      }

      const nextChar = queueRef.current.shift();
      setDisplayedText((prev) => prev + nextChar);
    }, speed);

    return () => clearInterval(interval);
  }, [displayedText, speed]);

  const pushText = (text) => {
    queueRef.current.push(...text);
    if (!typingRef.current) {
      typingRef.current = true;
      setDisplayedText((prev) => prev); // Trigger re-run
    }
  };

  const clear = () => {
    queueRef.current = [];
    setDisplayedText("");
  };

  return { displayedText, pushText, clear };
}
