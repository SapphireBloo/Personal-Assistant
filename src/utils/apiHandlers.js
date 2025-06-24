import { auth, db } from "../firebase";
import { addDoc, collection } from "firebase/firestore";
import {
  addToFirebaseTodo,
  fetchFirebaseTodos,
  deleteFirebaseTodoByText,
} from "./firebaseTodo";
import { loadMemory, saveMemory } from "./memoryUtils";

/**
 * Checks if the user's input contains time-related keywords.
 */
function containsTimeKeyword(text) {
  const keywords = [
    "tonight",
    "tomorrow",
    "yesterday",
    "next week",
    "this weekend",
    "today",
    "in the morning",
    "in the evening",
    "at midnight",
    "noon",
    "later",
    "soon",
    "next",
    "schedule",
    "when does",
    "what time",
    "date",
    "time",
    "when",
  ];
  return keywords.some((kw) => text.toLowerCase().includes(kw));
}

/**
 * Gets a context string with local date/time.
 */
function getTimeContextString() {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateString = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `The current local time is ${timeString}, and the date is ${dateString}.`;
}

/**
 * Main handler for user input — supports to-do commands, chat streaming, memory, and names.
 */
export async function handleUserInput({
  userText,
  chatHistory,
  voiceEnabled,
  speakFn,
  setAssistantText,
  setChatHistory,
  CEREBRAS_API_KEY,
  userProfile, // { userName, assistantName }
}) {
  try {
    const lower = userText.toLowerCase();
    const currentUser = auth.currentUser;

    // 📌 TO-DO COMMANDS
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
            ? `Here are your tasks: ${todos.map((t) => t.text).join(", ")}.`
            : "You have no tasks.";
        setAssistantText(reply);
        if (voiceEnabled) await speakFn(reply);
        return;
      }

      if (lower.startsWith("delete")) {
        const task = userText.replace(/delete (to[- ]?do)?/i, "").trim();
        const success = await deleteFirebaseTodoByText(currentUser.uid, task);
        const reply = success
          ? `Deleted "${task}".`
          : `Couldn't find "${task}".`;
        setAssistantText(reply);
        if (voiceEnabled) await speakFn(reply);
        return;
      }
    }

    // 🤖 OTHERWISE — CEREBRAS STREAMING WITH MEMORY + TIME + NAME CONTEXT
    setAssistantText("");
    let fullAssistantText = "";

    let memoryContext = [];
    if (currentUser) {
      const memory = await loadMemory(currentUser.uid);
      memoryContext = memory.facts.map((fact) => ({
        role: "system",
        content: fact,
      }));
    }

    // Inject name context
    if (userProfile?.userName || userProfile?.assistantName) {
      const systemPrompt = `
You are a helpful AI assistant named "${userProfile.assistantName || "Assistant"}".
You are chatting with a user named "${userProfile.userName || "User"}".
Always address the user by their name during the conversation when appropriate.
Respond in a friendly and conversational tone.
      `.trim();

      memoryContext.unshift({
        role: "system",
        content: systemPrompt,
      });
    }

    // ⏰ Add local date/time context if needed
    if (containsTimeKeyword(userText)) {
      memoryContext.unshift({
        role: "system",
        content: getTimeContextString(),
      });
    }

    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-4-scout-17b-16e-instruct",
        messages: [
          ...memoryContext,
          ...chatHistory,
          { role: "user", content: userText },
        ],
        stream: true,
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let phrase = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n").filter(Boolean);

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.replace("data: ", "");
        try {
          const json = JSON.parse(jsonStr);
          const token = json.choices?.[0]?.delta?.content;
          if (token) {
            setAssistantText((prev) => prev + token);
            fullAssistantText += token;
            phrase += token;

            if (/[.!?]\s$/.test(phrase) || phrase.length > 80) {
              if (voiceEnabled) await speakFn(phrase.trim());
              phrase = "";
            }
          }
        } catch (err) {
          console.warn("Skipping invalid JSON:", jsonStr);
        }
      }

      buffer = "";
    }

    if (phrase && voiceEnabled) await speakFn(phrase.trim());

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

      // 🧠 Save memory (last 20 facts)
      const newFact = `${userProfile?.userName || "User"} said: "${userText}". ${userProfile?.assistantName || "Assistant"} replied: "${fullAssistantText.trim()}"`;
      const memory = await loadMemory(currentUser.uid);
      const updated = [...memory.facts.slice(-19), newFact];
      await saveMemory(currentUser.uid, { facts: updated });
    }
  } catch (error) {
    console.error("❌ handleUserInput error:", error);
    setAssistantText("Sorry, I had trouble understanding that.");
  }
}
