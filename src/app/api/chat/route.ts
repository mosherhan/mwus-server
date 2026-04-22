import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://localhost:11434/api/chat";
// const MODEL = "llama3";
const MODEL = "mistral:latest";

const SYSTEM_PROMPT = `You are the official AI assistant for MakeWithUs — a platform that builds websites and apps that grow businesses.

ABOUT MAKEWITHUS:
- We build custom websites, ai powered solutions, and full stack development for entrepreneurs and businesses
- Services: Shopify Development, AI Powered Solution, App Development, SAAS-Development, Full Stack Development
- Pricing: Starter Plan ₹50/month, Pro Plan ₹150/month (annual discounts available)
- Contact: WhatsApp us directly at https://wa.me/6395428620 for quick queries
- We serve startups, small businesses, and established companies

STRICT RULES — follow every rule below:
1. Answer ONLY questions related to MakeWithUs services, pricing, process, or general business/website advice
2. Keep every answer under 25 words — short, sharp, and actionable
3. Use plain text only — no asterisks, no bullet dashes, no markdown symbols like * or - or **
4. For pricing, always mention the plan names and direct them to contact us
5. If asked anything unrelated to MakeWithUs or business, say: "I can only help with MakeWithUs services and your business needs. Want to know about our plans or get started?"
6. Always end with a short call to action like: "Want to get started? WhatsApp us!" or "Shall I connect you with our team?"
7. Be warm, confident, and professional — like a helpful sales rep`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Ollama not running. Run: ollama serve && ollama pull llama3" },
        { status: 503 }
      );
    }

    // const data = await response.json();
    // const reply = data?.message?.content;
    const reader = response.body?.getReader();
const decoder = new TextDecoder();

let fullText = "";

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split("\n").filter(Boolean);

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.message?.content) {
        fullText += parsed.message.content;
      }
    } catch {}
  }
}

// NOW detect intent (after response is ready)
const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";

let intent = "normal";

if (
  lastUserMsg.includes("price") ||
  lastUserMsg.includes("cost") ||
  lastUserMsg.includes("plan") ||
  lastUserMsg.includes("start") ||
  lastUserMsg.includes("contact") ||
  lastUserMsg.includes("build") ||
  lastUserMsg.includes("website") ||
  lastUserMsg.includes("app")
) {
  intent = "lead";
}

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split("\n").filter(Boolean);

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.message?.content) {
        fullText += parsed.message.content;
      }
    } catch {}
  }
}

return NextResponse.json({
  reply: fullText,
  intent,
});

    if (!reply) {
      return NextResponse.json({ error: "No response from Ollama" }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const isRefused = error instanceof Error && error.message.includes("ECONNREFUSED");
    if (isRefused) {
      return NextResponse.json(
        { error: "Ollama not reachable. Run: ollama serve" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}