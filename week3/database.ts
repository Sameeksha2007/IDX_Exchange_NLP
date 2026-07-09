// Week 3 - MLS Database Integration
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

// Database connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "idx_exchange",
  waitForConnections: true,
  connectionLimit: 10,
});

// Filter interface matching Week 2 parser output
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

// Search active listings from rets_property
export async function searchActiveListings(filters: PropertyFilters, page = 1, limit = 5) {
  const offset = (page - 1) * limit;

  let sql = `
    SELECT
      L_ListingID,
      L_Address,
      L_City,
      L_Zip,
      L_SystemPrice AS price,
      L_Keyword2 AS beds,
      LM_Dec_3 AS baths,
      LM_Int2_3 AS sqft,
      L_Type_ AS type,
      L_Status AS status,
      YearBuilt,
      AssociationFee,
      DaysOnMarket,
      PoolPrivateYN,
      ViewYN,
      LA1_UserFirstName,
      LA1_UserLastName
    FROM rets_property
    WHERE L_Status = 'Active'
  `;

  const params: any[] = [];

  if (filters.city) { sql += " AND L_City = ?"; params.push(filters.city); }
  if (filters.maxPrice) { sql += " AND L_SystemPrice <= ?"; params.push(filters.maxPrice); }
  if (filters.beds) { sql += " AND L_Keyword2 >= ?"; params.push(filters.beds); }
  if (filters.baths) { sql += " AND LM_Dec_3 >= ?"; params.push(filters.baths); }
  if (filters.sqft) { sql += " AND LM_Int2_3 >= ?"; params.push(filters.sqft); }
  if (filters.type) { sql += " AND L_Type_ = ?"; params.push(filters.type); }
  if (filters.pool) { sql += " AND PoolPrivateYN = ?"; params.push(filters.pool); }
  if (filters.hasView) { sql += " AND ViewYN = ?"; params.push(filters.hasView); }

  sql += ` ORDER BY L_SystemPrice ASC LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Get sold comps from california_sold
export async function getSoldComps(city: string, months = 12) {
  const sql = `
    SELECT
      UnparsedAddress,
      City,
      CloseDate,
      ClosePrice,
      DaysOnMarket,
      BedroomsTotal,
      BathroomsTotalInteger,
      LivingArea,
      PropertySubType
    FROM california_sold
    WHERE City = ?
    AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    AND PropertyType = 'Residential'
    ORDER BY CloseDate DESC
    LIMIT 10
  `;
  const [rows] = await pool.execute(sql, [city, months]);
  return rows;
}

// Test both functions
async function main() {
  console.log("--- Searching active listings in Irvine under $1.5M ---");
  const listings = await searchActiveListings({
    city: "Irvine",
    maxPrice: 1500000,
    beds: 3,
    baths: null,
    sqft: null,
    type: null,
    pool: null,
    hasView: null
  });
  console.log(listings);

  console.log("\n--- Sold comps in Irvine (last 12 months) ---");
  const comps = await getSoldComps("Irvine", 12);
  console.log(comps);

  process.exit(0);
}

main();