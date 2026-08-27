// Week 10 - WhatsApp Communication Layer
// Connects the orchestrator to WhatsApp as the main interface

import { orchestrate } from "../week9/orchestrator";

// Format a result for WhatsApp display
function formatForWhatsApp(response: string): string {
  // WhatsApp has a 4096 character limit per message
  if (response.length > 4000) {
    return response.substring(0, 4000) + "\n\n... (truncated)";
  }
  return response;
}

// Simulate sending a typing indicator
async function sendTypingIndicator(userId: string): Promise<void> {
  console.log(`[WhatsApp] Typing indicator sent to ${userId}...`);
  await new Promise(resolve => setTimeout(resolve, 500));
}

// Main WhatsApp message handler
export async function onWhatsAppMessage(message: string, userId: string): Promise<string> {
  // show typing indicator while processing
  await sendTypingIndicator(userId);

  try {
    const result = await orchestrate(message, userId);
    const formatted = formatForWhatsApp(result);
    console.log(`[WhatsApp] Response sent to ${userId}`);
    return formatted;
  } catch (err) {
    console.error("Orchestration error:", err);
    return "Sorry, I hit an issue. Please try again.";
  }
}

// Simulate a WhatsApp conversation
async function main() {
  const userId = "whatsapp:+15555550123";

  const messages = [
    "Hi",
    "Find 3 bedroom homes in Irvine under $1M",
    "What is the market like in Pasadena?",
    "Find condos in San Diego and tell me if prices are rising",
    "What does HOA mean?"
  ];

  console.log("=== WhatsApp Conversation Simulation ===\n");

  for (const message of messages) {
    console.log(`\n[User ${userId}]: ${message}`);
    console.log("─".repeat(50));
    const response = await onWhatsAppMessage(message, userId);
    console.log(`[Agent]: ${response}`);
    console.log("─".repeat(50));
  }

  process.exit(0);
}

if (require.main === module) main();