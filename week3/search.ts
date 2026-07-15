// Week 3 Deliverable - Full search pipeline
// Takes plain English → parses it → queries database → returns results

import { parsePropertyQuery } from "../week2/parser";
import { searchActiveListings, getSoldComps } from "./database";

async function main() {
  const queries = [
    "Find 3 bedroom condos in Irvine under $1.5M",
    "Single family homes in San Diego under $800k",
    "Homes in Anaheim under $700k with 2 beds"
  ];

  for (const query of queries) {
    console.log("\n=====================================");
    console.log("Query:", query);
    
    // Step 1: parse the plain English query
    const filters = await parsePropertyQuery(query);
    console.log("Parsed filters:", filters);

    // Step 2: search the database
    const listings = await searchActiveListings(filters);
    console.log(`Found ${(listings as any[]).length} listings:`);
    
    // Step 3: format and display results
    (listings as any[]).forEach((l, i) => {
      console.log(`\n${i + 1}. ${l.L_Address}, ${l.L_City}`);
      console.log(`   Price: $${l.price?.toLocaleString()}`);
      console.log(`   Beds: ${l.beds} | Baths: ${l.baths} | Sqft: ${l.sqft}`);
      console.log(`   Type: ${l.type} | Days on market: ${l.DaysOnMarket}`);
      console.log(`   Agent: ${l.LA1_UserFirstName} ${l.LA1_UserLastName}`);
    });

    // Step 4: show sold comps for same city
    if (filters.city) {
      const comps = await getSoldComps(filters.city, 12);
      console.log(`\nRecently sold in ${filters.city}:`);
      (comps as any[]).forEach((c, i) => {
        console.log(`${i + 1}. ${c.UnparsedAddress} — $${c.ClosePrice?.toLocaleString()} | ${c.DaysOnMarket} days on market`);
      });
    }
  }

  process.exit(0);
}

main();