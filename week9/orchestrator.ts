// Week 9 - Multi-Agent Orchestration

import { parsePropertyQuery } from "../week2/parser";
import { searchActiveListings } from "../week3/database";
import { handleConversation } from "../week4/conversation";
import { answerMarketQuestion } from "../week5/market";

type Intent = "search" | "market" | "knowledge" | "mixed" | "unknown";

async function classifyIntent(message: string): Promise<Intent> {
  const msg = message.toLowerCase();
  const searchWords = ["find", "show", "search", "looking for", "homes", "listings", "condo", "house", "bedroom"];
  const marketWords = ["market", "price trend", "average price", "days on market", "good time to buy", "rising", "falling", "stats"];
  const knowledgeWords = ["what is", "what does", "explain", "define", "meaning", "dom", "escrow", "hoa", "comps"];

  const isSearch = searchWords.some(w => msg.includes(w));
  const isMarket = marketWords.some(w => msg.includes(w));
  const isKnowledge = knowledgeWords.some(w => msg.includes(w));

  if (isSearch && isMarket) return "mixed";
  if (isSearch) return "search";
  if (isMarket) return "market";
  if (isKnowledge) return "knowledge";
  return "unknown";
}

function formatListings(listings: any[]): string {
  if (!listings || listings.length === 0) return "No listings found.";
  return listings.map((l, i) =>
    `${i + 1}. ${l.L_Address}, ${l.L_City}\n   $${l.price?.toLocaleString()} | ${l.beds}bd/${l.baths}ba | ${l.sqft} sqft\n   Agent: ${l.LA1_UserFirstName} ${l.LA1_UserLastName}`
  ).join("\n\n");
}

function extractCity(message: string, fallback = "Irvine"): string {
  const match = message.match(/in ([A-Za-z\s]+?)(?:\s+under|\s+with|\s+and|\s*\?|$)/i);
  const city = match?.[1]?.trim();
  if (city && city.split(" ").length <= 3) return city;
  return fallback;
}

export async function orchestrate(message: string, userId: string): Promise<string> {
  const intent = await classifyIntent(message);
  console.log(`Intent detected: ${intent}`);

  switch (intent) {
    case "search": {
      const filters = await parsePropertyQuery(message);
      const listings = await searchActiveListings(filters) as any[];
      return `Found ${listings.length} listings:\n\n${formatListings(listings)}`;
    }

    case "market": {
      const city = extractCity(message);
      return await answerMarketQuestion(city);
    }

    case "knowledge": {
  const msg = message.toLowerCase();
  if (msg.includes("hoa")) {
    return "HOA stands for Homeowners Association — an organization that makes and enforces rules for properties in a subdivision. Members pay monthly fees used for upkeep of common areas and shared amenities like pools, gyms, and landscaping.";
  }
  if (msg.includes("dom") || msg.includes("days on market")) {
    return "DOM (Days on Market) is the number of days a property has been listed for sale. A low DOM indicates high demand. A high DOM may indicate the property is overpriced or needs work.";
  }
  if (msg.includes("list-to-close") || msg.includes("list to close")) {
    return "List-to-close ratio is the percentage of the list price that a property actually sold for. Above 100% means the home sold above asking price — a sellers market. Below 100% means it sold below asking — a buyers market.";
  }
  if (msg.includes("escrow")) {
    return "Escrow is a neutral third party that holds funds and documents during a real estate transaction until all conditions are met by both buyer and seller.";
  }
  if (msg.includes("comp") || msg.includes("comparable")) {
    return "Comps (Comparables) are recently sold properties similar in size, location, and condition used to determine a property's market value.";
  }
  return "Try asking about HOA, DOM, list-to-close ratio, escrow, or comps.";
}

    case "mixed": {
      const filters = await parsePropertyQuery(message);
      const city = filters.city || extractCity(message);

      const [listings, marketData] = await Promise.all([
        searchActiveListings(filters) as Promise<any[]>,
        answerMarketQuestion(city)
      ]);

      return `LISTINGS:\n${formatListings(listings)}\n\nMARKET DATA:\n${marketData}`;
    }

    case "unknown":
    default: {
      const greetings = ["hello", "hi", "hey", "help"];
      if (greetings.some(g => message.toLowerCase().trim() === g)) {
        return "Hi! I can help you find properties, check market stats, or answer real estate questions. What are you looking for?";
      }
      return await handleConversation(userId, message);
    }
  }
}

async function main() {
  const tests = [
    { msg: "Find 3 bedroom condos in Irvine under $1.5M", userId: "user1" },
    { msg: "What is the market like in Pasadena?", userId: "user2" },
    { msg: "Find affordable homes in San Diego and tell me if prices are rising", userId: "user3" },
    { msg: "What does DOM mean?", userId: "user4" },
    { msg: "Hello", userId: "user5" },
  ];

  for (const test of tests) {
    console.log("\n=====================================");
    console.log(`User: ${test.msg}`);
    const response = await orchestrate(test.msg, test.userId);
    console.log(`Agent: ${response}`);
  }

  process.exit(0);
}

if (require.main === module) main();