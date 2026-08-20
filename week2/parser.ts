// Week 2 - Natural Language Property Search Parser

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

const typeMap: Record<string, string> = {
  "condo": "Condominium",
  "townhome": "Townhouse",
  "townhouse": "Townhouse",
  "single family": "SingleFamilyResidence",
  "house": "SingleFamilyResidence",
  "land": "UnimprovedLand"
};

export async function parsePropertyQuery(query: string): Promise<PropertyFilters> {
  const cityMatch = query.match(/in ([A-Za-z\s]+?)(?:\s+under|\s+with|\s+at|\s+and|\s+for|\s*$)/i);
  const priceMatch = query.match(/under \$?([\d,.]+)(k|m)?/i);
  const bedsMatch = query.match(/(\d+)[\s-]*(bed|beds|bedroom|bedrooms)/i);
  const bathsMatch = query.match(/(\d+(?:\.5)?)[\s-]*(bath|baths|bathroom)/i);
  const sqftMatch = query.match(/(\d+)[\s,]*(sqft|sq ft|square feet)/i);
  const poolMatch = /pool/i.test(query);
  const viewMatch = /view/i.test(query);
  const typeKey = Object.keys(typeMap).find(k => query.toLowerCase().includes(k));

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

async function main() {
  const queries = [
    "Show me 3 bedroom condos in Irvine under $1.5M with a pool",
    "Find single family homes in San Diego under $800k with 2 bathrooms",
    "Houses in Newport Beach under $2M with a view",
    "2 bed townhome in Pasadena under $600k",
    "Find me land in Malibu",
    "3 bed 2 bath house in Los Angeles under $1M",
    "Condos in Santa Monica under $900k with a pool and view",
    "Single family home in Riverside under $500k with 4 bedrooms",
    "Townhome in Anaheim under $700k with 2.5 bathrooms",
    "2 bedroom condo in Long Beach under $400k"
  ];

  for (const query of queries) {
    console.log("\nQuery:", query);
    console.log("Filters:", await parsePropertyQuery(query));
  }
}

if (require.main === module) main();