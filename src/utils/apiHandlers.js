import { auth, db } from "../firebase";
import { addDoc, collection } from "firebase/firestore";
import {
  addToFirebaseTodo,
  fetchFirebaseTodos,
  deleteFirebaseTodoByText,
} from "./firebaseTodo"; // Make sure this path matches your actual file

export async function handleUserInput({
  userText,
  chatHistory,
  voiceEnabled,
  speakFn,
  setAssistantText,
  setChatHistory,
  CEREBRAS_API_KEY,
}) {
  try {
    const lower = userText.toLowerCase();
    const currentUser = auth.currentUser;

  if (currentUser && /\bto[- ]?do\b/i.test(lower)) {
  if (lower.startsWith("add")) {
    const cleaned = userText
      .toLowerCase()
      .match(/add\s(.+?)(\s(to|into)?\s(my)?\s?to[- ]?do(\slist)?)?$/i);

    const task =
      cleaned?.[1]?.trim() || userText.replace(/add\s?/i, "").trim();

    await addToFirebaseTodo(currentUser.uid, task);
    const reply = `I've added "${task}" to your to-do list.`;
    setAssistantText(reply);
    if (voiceEnabled) await speakFn(reply);
    return;
  }


      if (lower.includes("list")) {
        const todos = await fetchFirebaseTodos(currentUser.uid);
        const reply =
          todos.length > 0
            ? `Here's your to-do list: ${todos.map((t) => t.text).join(", ")}.`
            : "Your to-do list is empty.";
        setAssistantText(reply);
        if (voiceEnabled) await speakFn(reply);
        return;
      }

      if (lower.startsWith("delete")) {
        const task = userText.replace(/delete (to-?do)?/i, "").trim();
        const success = await deleteFirebaseTodoByText(currentUser.uid, task);
        const reply = success
          ? `I deleted "${task}" from your list.`
          : `I couldn't find "${task}" in your list.`;
        setAssistantText(reply);
        if (voiceEnabled) await speakFn(reply);
        return;
      }

      // You could expand this with "mark as done", etc.
    }

    // === Otherwise, stream from Cerebras ===
    setAssistantText("");
    let fullAssistantText = "";
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-4-scout-17b-16e-instruct",
        messages: [...chatHistory, { role: "user", content: userText }],
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
              fullAssistantText += token;
              phraseBuffer += token;

              if (/[.!?]\s$/.test(phraseBuffer) || phraseBuffer.length > 80) {
                if (voiceEnabled) {
                  await speakFn(phraseBuffer.trim());
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
      await speakFn(phraseBuffer.trim());
    }

    const now = Date.now();
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userText, timestamp: now },
      { role: "assistant", content: fullAssistantText.trim(), timestamp: now },
    ]);

    if (currentUser) {
      await addDoc(collection(db, "chats"), {
        uid: currentUser.uid,
        userMessage: userText,
        assistantMessage: fullAssistantText.trim(),
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error("Streaming error:", error);
    setAssistantText((prev) => (prev.trim() ? prev : "Sorry, I had trouble understanding that."));
  }
}
