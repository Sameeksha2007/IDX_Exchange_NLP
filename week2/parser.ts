// Week 2 - Natural Language Property Search Parser

// This is what the parser outputs - structured filters
interface PropertyFilters {
  city: string | null;
  maxPrice: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  type: string | null;
  pool: string | null;
  hasView: string | null;
}

// Maps common words to database values
const typeMap: Record<string, string> = {
  "condo": "Condominium",
  "townhome": "Townhouse",
  "townhouse": "Townhouse",
  "single family": "SingleFamilyResidence",
  "house": "SingleFamilyResidence",
  "land": "UnimprovedLand"
};

// The main parser function
export async function parsePropertyQuery(query: string): Promise<PropertyFilters> {

  // Extract city - looks for "in CityName"
  const cityMatch = query.match(/in ([A-Za-z\s]+?)(?:\s+under|\s+with|\s+at|\s+for|$)/i);

  // Extract max price - looks for "under $1.5M" or "under $500k"
  const priceMatch = query.match(/under \$?([\d,.]+)(k|m)?/i);

  // Extract bedrooms - looks for "3 bed" or "3 bedroom"
  const bedsMatch = query.match(/(\d+)[\s-]*(bed|beds|bedroom|bedrooms)/i);

  // Extract bathrooms - looks for "2 bath" or "2.5 bathroom"
  const bathsMatch = query.match(/(\d+(?:\.5)?)[\s-]*(bath|baths|bathroom)/i);

  // Extract square footage - looks for "1800 sqft"
  const sqftMatch = query.match(/(\d+)[\s,]*(sqft|sq ft|square feet)/i);

  // Check for pool and view
  const poolMatch = /pool/i.test(query);
  const viewMatch = /view/i.test(query);

  // Find property type
  const typeKey = Object.keys(typeMap).find(k => query.toLowerCase().includes(k));

  // Convert price to a number
  let maxPrice = null;
  if (priceMatch) {
    maxPrice = Number(priceMatch[1].replace(/,/g, ""));
    if (priceMatch[2]?.toLowerCase() === "k") maxPrice *= 1000;
    if (priceMatch[2]?.toLowerCase() === "m") maxPrice *= 1_000_000;
  }

  return {
    city: cityMatch?.[1]?.trim() || null,
    maxPrice,
    beds: bedsMatch ? Number(bedsMatch[1]) : null,
    baths: bathsMatch ? Number(bathsMatch[1]) : null,
    sqft: sqftMatch ? Number(sqftMatch[1]) : null,
    type: typeKey ? typeMap[typeKey] : null,
    pool: poolMatch ? "True" : null,
    hasView: viewMatch ? "True" : null,
  };
}

// Test the parser
async function main() {
  const queries = [
    "Show me 3 bedroom condos in Irvine under $1.5M with a pool",
    "Find single family homes in San Diego under $800k with 2 bathrooms",
    "Houses in Newport Beach under $2M with a view",
    "2 bed townhome in Pasadena under $600k",
    "Find me land in Malibu"
  ];

  for (const query of queries) {
    console.log("\nQuery:", query);
    console.log("Filters:", await parsePropertyQuery(query));
  }
}

main();