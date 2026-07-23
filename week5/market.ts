// Week 5 - Market Statistics Agent
// Answers questions like "Is now a good time to buy in San Diego?"

import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "idx_exchange",
  waitForConnections: true,
  connectionLimit: 10,
});

// Get full market summary for a city
export async function getCityMarketSummary(city: string) {
  const sql = `
    SELECT
      City,
      COUNT(*) AS sold_count,
      ROUND(AVG(ClosePrice), 0) AS avg_close_price,
      ROUND(AVG(ClosePrice / NULLIF(LivingArea, 0)), 0) AS avg_price_per_sqft,
      ROUND(AVG(DaysOnMarket), 1) AS avg_days_on_market,
      ROUND(AVG(ClosePrice / NULLIF(ListPrice, 0)) * 100, 1) AS list_to_close_pct
    FROM california_sold
    WHERE City = ?
    AND PropertyType = 'Residential'
    AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    AND LivingArea > 0
    GROUP BY City
  `;
  const [rows] = await pool.execute(sql, [city]);
  return (rows as any[])[0] || null;
}

// Get month by month price trend for a city
export async function getPriceTrend(city: string, months = 12) {
  const sql = `
    SELECT
      DATE_FORMAT(CloseDate, '%Y-%m') AS month,
      COUNT(*) AS sales,
      ROUND(AVG(ClosePrice), 0) AS avg_price,
      ROUND(AVG(DaysOnMarket), 1) AS avg_dom
    FROM california_sold
    WHERE City = ?
    AND PropertyType = 'Residential'
    AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
    GROUP BY DATE_FORMAT(CloseDate, '%Y-%m')
    ORDER BY month ASC
  `;
  const [rows] = await pool.execute(sql, [city, months]);
  return rows as any[];
}

// Compare active listings vs sold volume
export async function getInventoryComparison(city: string) {
  const [activeRows] = await pool.execute(
    `SELECT COUNT(*) AS active_count FROM rets_property WHERE L_City = ? AND L_Status = 'Active'`,
    [city]
  );
  const [soldRows] = await pool.execute(
    `SELECT COUNT(*) AS sold_count FROM california_sold WHERE City = ? AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)`,
    [city]
  );
  return {
    active: (activeRows as any[])[0].active_count,
    sold_last_12_months: (soldRows as any[])[0].sold_count
  };
}

// Answer a market question about a city
export async function answerMarketQuestion(city: string) {
  const summary = await getCityMarketSummary(city);
  const trend = await getPriceTrend(city, 6);
  const inventory = await getInventoryComparison(city);

  if (!summary) {
    return `No market data found for ${city}.`;
  }

  // figure out if prices are going up or down
  let priceDirection = "stable";
  if (trend.length >= 2) {
    const first = trend[0].avg_price;
    const last = trend[trend.length - 1].avg_price;
    const change = ((last - first) / first) * 100;
    if (change > 3) priceDirection = "rising";
    if (change < -3) priceDirection = "falling";
  }

  return `
Market Report: ${city}
========================
Homes sold (last 12 months): ${summary.sold_count}
Average close price: $${summary.avg_close_price?.toLocaleString()}
Average price per sqft: $${summary.avg_price_per_sqft}
Average days on market: ${summary.avg_days_on_market} days
List to close ratio: ${summary.list_to_close_pct}%

Inventory:
Active listings: ${inventory.active}
Sold last 12 months: ${inventory.sold_last_12_months}

Price trend (last 6 months): ${priceDirection}

${summary.list_to_close_pct >= 100 
  ? "Sellers market — homes are selling at or above asking price." 
  : "Buyers market — homes are selling below asking price."}
`;
}

// Test it
async function main() {
  const cities = ["Irvine", "San Diego", "Pasadena"];

  for (const city of cities) {
    console.log(await answerMarketQuestion(city));
  }

  process.exit(0);
}

main();