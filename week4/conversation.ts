// Week 4 - Conversational Property Search Agent
// Remembers what user said and asks follow-up questions

import { searchActiveListings } from "../week3/database";

// What we remember about each user's search
interface UserSession {
  city?: string;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  type?: string;
  pool?: string;
  lastResults?: any[];
  conversationStep: number;
}

// Store sessions in memory (one per user)
const sessions = new Map<string, UserSession>();

// Get or create a session for a user
function getSession(userId: string): UserSession {
  if (!sessions.has(userId)) {
    sessions.set(userId, { conversationStep: 0 });
  }
  return sessions.get(userId)!;
}

// Update a user's session with new info
function updateSession(userId: string, updates: Partial<UserSession>) {
  const session = getSession(userId);
  sessions.set(userId, { ...session, ...updates });
}

// Clear a user's session
function clearSession(userId: string) {
  sessions.delete(userId);
}

// Main conversation handler
export async function handleConversation(userId: string, message: string): Promise<string> {
  const session = getSession(userId);
  const msg = message.toLowerCase();

  // User wants to start over
  if (msg.includes("start over") || msg.includes("reset") || msg.includes("new search")) {
    clearSession(userId);
    return "Starting fresh! What city are you looking in?";
  }

  // Step 0 - no city yet, ask for it
  if (!session.city) {
    // try to extract city from message
    const cityMatch = message.match(/in ([A-Za-z\s]+?)(?:\s+under|\s+with|$)/i);
if (!cityMatch) {
  // treat the whole message as a city only if it's short (1-3 words)
  const words = message.trim().split(" ");
  if (words.length <= 3) {
    updateSession(userId, { city: message.trim(), conversationStep: 1 });
    return `Got it, searching in ${message.trim()}. What's your budget? (e.g. under $1M)`;
  }
  return "What city are you looking in?";
}
    if (cityMatch) {
      updateSession(userId, { city: cityMatch[1].trim(), conversationStep: 1 });
      return `Got it, searching in ${cityMatch[1].trim()}. What's your budget? (e.g. under $1M)`;
    }
    return "What city are you looking in?";
  }

  // Step 1 - no price yet, ask for it
  if (!session.maxPrice) {
    const priceMatch = message.match(/under \$?([\d,.]+)(k|m)?/i) ||
                       message.match(/\$?([\d,.]+)(k|m)?/i);
    if (priceMatch) {
      let price = Number(priceMatch[1].replace(/,/g, ""));
      if (priceMatch[2]?.toLowerCase() === "k") price *= 1000;
      if (priceMatch[2]?.toLowerCase() === "m") price *= 1_000_000;
      updateSession(userId, { maxPrice: price, conversationStep: 2 });
      return `Budget set to $${price.toLocaleString()}. How many bedrooms do you need?`;
    }
    return "What's your budget? (e.g. under $1M or $800k)";
  }

  // Step 2 - no beds yet, ask for it
  if (!session.beds) {
    const bedsMatch = message.match(/(\d+)/);
    if (bedsMatch) {
      updateSession(userId, { beds: Number(bedsMatch[1]), conversationStep: 3 });
      return `Got it, ${bedsMatch[1]} bedrooms. Any preference on property type? (condo, house, townhome) Or say 'search' to see results now.`;
    }
    return "How many bedrooms are you looking for?";
  }

  // Step 3 - property type or search now
  if (msg.includes("search") || msg.includes("show") || msg.includes("find")) {
    // run the search with what we have
    const listings = await searchActiveListings({
      city: session.city,
      maxPrice: session.maxPrice || null,
      beds: session.beds || null,
      baths: null,
      sqft: null,
      type: session.type || null,
      pool: null,
      hasView: null
    }) as any[];

    updateSession(userId, { lastResults: listings });

    if (listings.length === 0) {
      return `No listings found in ${session.city} with those filters. Try a higher budget or fewer bedrooms.`;
    }

    let response = `Found ${listings.length} listings in ${session.city}:\n\n`;
    listings.forEach((l, i) => {
      response += `${i + 1}. ${l.L_Address}, ${l.L_City}\n`;
      response += `   $${l.price?.toLocaleString()} | ${l.beds}bd/${l.baths}ba | ${l.sqft} sqft\n`;
      response += `   Agent: ${l.LA1_UserFirstName} ${l.LA1_UserLastName}\n\n`;
    });
    return response;
  }

  // check for property type
  const typeMap: Record<string, string> = {
    "condo": "Condominium",
    "house": "SingleFamilyResidence",
    "townhome": "Townhouse",
    "townhouse": "Townhouse"
  };
  const typeKey = Object.keys(typeMap).find(k => msg.includes(k));
  if (typeKey) {
    updateSession(userId, { type: typeMap[typeKey] });
    return `Got it, looking for ${typeKey}s. Say 'search' to see results.`;
  }

  return "Say 'search' to see results, or tell me more preferences like property type.";
}

// Simulate a conversation
async function main() {
  const userId = "user123";

  const conversation = [
    "I want to find a home",
    "Irvine",
    "under $1.2M",
    "3 bedrooms",
    "condo",
    "search"
  ];

  console.log("=== Simulated Conversation ===\n");
  for (const message of conversation) {
    console.log(`User: ${message}`);
    const response = await handleConversation(userId, message);
    console.log(`Agent: ${response}\n`);
  }

  process.exit(0);
}

main();