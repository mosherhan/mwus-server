export interface Message {
  role: "user" | "assistant";
  content: string;
}

const MEMORY_KEY = "makewithus_chat_memory";
const MAX_MESSAGES = 10;

export function getMemory(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveMemory(messages: Message[]) {
  if (typeof window === "undefined") return;
  const trimmed = messages.slice(-MAX_MESSAGES);
  localStorage.setItem(MEMORY_KEY, JSON.stringify(trimmed));
}

export function clearMemory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MEMORY_KEY);
}