// PURPOSE: Read the user's last message and decide what they want.
// Returns one of 4 intents that route.ts uses to shape the AI reply.

export type Intent = "info" | "pricing" | "service" | "lead";

// Each intent has a list of trigger keywords.
// We check if the user's message contains any of them.
const INTENT_PATTERNS: Record<Intent, string[]> = {
  
  info: [
    "what is", "who are", "about", "tell me", "explain",
    "how does", "what do you", "your company", "makewithus",
    "portfolio", "projects", "examples", "case study"
  ],

  pricing: [
    "price", "cost", "how much", "pricing", "fee", "charge",
    "plan", "starter", "pro", "budget", "afford", "expensive",
    "cheap", "rate", "quote", "₹", "$", "payment", "subscription"
  ],

  service: [
 
  "shopify", "shopify store", "ecommerce", "online store", "shop", "store setup", "shopify development",
  "ai", "artificial intelligence", "chatbot", "automation", "ai solution", "machine learning", "ai app",
  "saas", "software as a service", "product development", "startup product", "web app", "platform", "dashboard",
  "full stack", "web development", "frontend", "backend", "website", "web app", "api", "system development"
],

  lead: [
    "get started", "start", "contact", "reach out", "hire",
    "work with", "interested", "book", "schedule", "call",
    "want to", "let's go", "sign up", "ready", "when can",
    "how do i begin", "next step"
  ]
};

export function detectIntent(message: string): Intent {
  // Lowercase so "Price" and "price" both match
  const lower = message.toLowerCase();

  // Check lead first — highest priority.
  // If someone says "I want to get started", that's more important than anything else.
  for (const keyword of INTENT_PATTERNS.lead) {
    if (lower.includes(keyword)) return "lead";
  }

  // Then pricing — second priority
  for (const keyword of INTENT_PATTERNS.pricing) {
    if (lower.includes(keyword)) return "pricing";
  }

  // Then specific service interest
  for (const keyword of INTENT_PATTERNS.service) {
    if (lower.includes(keyword)) return "service";
  }

  // Default: treat as general info question
  return "info";
}

// Returns a behavior instruction added to the AI system prompt
// based on what the user intends to do.
export function getIntentInstruction(intent: Intent): string {
  switch (intent) {
    case "lead":
      // User is ready — push them to take action
      return `The user seems ready to take action.
Summarize what you understand about their need in 1-2 lines.
Then say you can help them get started and ask for their name and what they need.
End with: "Want me to connect you directly with our team on WhatsApp?"`;

    case "pricing":
      // User wants to know cost — give clear, structured answer
      return `The user is asking about pricing.
Give a clear, brief answer about our plans (Starter ₹50/month, Pro ₹150/month).
Mention the annual discount.
End with: "Which plan sounds right for you?" or "Want a custom quote?"`;

    case "service":
      // User is interested in a service — guide them with a follow-up question
      return `The user is interested in a specific service.
Briefly confirm you offer it.
Then ask ONE guiding question to understand their need better.
Example: "Are you looking for something simple or something custom?"
Do NOT just list all features — guide them forward.`;

    case "info":
    default:
      // General info — answer and keep conversation going
      return `The user wants general information.
Answer clearly and concisely.
End with a follow-up question to keep them engaged.
Example: "Is there a specific service you're looking for?"`;
  }
}