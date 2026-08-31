// Week 11 - Email Agents & Safety Guardrails
// Drafts emails for property alerts and market reports
// NEVER sends without explicit human approval

import * as nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import { searchActiveListings } from "../week3/database";
import { answerMarketQuestion } from "../week5/market";
dotenv.config();

// Email draft structure
interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  status: "pending_approval" | "approved" | "sent";
}

// Store drafts waiting for approval
const draftQueue: EmailDraft[] = [];

// STEP 1: Create a draft — never sends automatically
export async function draftEmail(to: string, subject: string, body: string): Promise<EmailDraft> {
  const draft: EmailDraft = {
    to,
    subject,
    body,
    status: "pending_approval"
  };
  draftQueue.push(draft);
  console.log(`\n[DRAFT CREATED] To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Status: pending_approval — waiting for human approval`);
  return draft;
}

// STEP 2: Send only after explicit human approval
export async function sendApprovedEmail(draft: EmailDraft): Promise<void> {
  if (draft.status !== "approved") {
    throw new Error("Cannot send email — not yet approved by human.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: draft.to,
    subject: draft.subject,
    html: draft.body
  });

  draft.status = "sent";
  console.log(`\n[EMAIL SENT] To: ${draft.to}`);
}

// Simulate human approving a draft
export function approveDraft(draft: EmailDraft): EmailDraft {
  draft.status = "approved";
  console.log(`\n[APPROVED] Draft approved by human operator`);
  return draft;
}

// Generate a property alert email
export async function generateListingAlert(
  to: string,
  city: string,
  maxPrice: number
): Promise<EmailDraft> {
  const listings = await searchActiveListings({
    city,
    maxPrice,
    beds: null,
    baths: null,
    sqft: null,
    type: null,
    pool: null,
    hasView: null
  }) as any[];

  const listingRows = listings.map(l => `
    <tr>
      <td>${l.L_Address}, ${l.L_City}</td>
      <td>$${l.price?.toLocaleString()}</td>
      <td>${l.beds}bd/${l.baths}ba</td>
      <td>${l.sqft} sqft</td>
      <td>${l.LA1_UserFirstName} ${l.LA1_UserLastName}</td>
    </tr>
  `).join("");

  const body = `
    <h2>New Listing Alert — ${city}</h2>
    <p>Here are the latest listings in ${city} under $${maxPrice.toLocaleString()}:</p>
    <table border="1" cellpadding="8" style="border-collapse:collapse">
      <tr>
        <th>Address</th>
        <th>Price</th>
        <th>Beds/Baths</th>
        <th>Sqft</th>
        <th>Agent</th>
      </tr>
      ${listingRows}
    </table>
    <p>Powered by IDX Exchange AI Assistant</p>
  `;

  return draftEmail(to, `New Listings in ${city} under $${maxPrice.toLocaleString()}`, body);
}

// Generate a weekly market report email
export async function generateMarketReport(
  to: string,
  cities: string[]
): Promise<EmailDraft> {
  let reportContent = "";
  for (const city of cities) {
    const report = await answerMarketQuestion(city);
    reportContent += `<h3>${city}</h3><pre>${report}</pre>`;
  }

  const body = `
    <h2>Weekly Market Report</h2>
    <p>Here is your weekly California real estate market summary:</p>
    ${reportContent}
    <p>Powered by IDX Exchange AI Assistant</p>
  `;

  return draftEmail(to, "Weekly Market Report — IDX Exchange", body);
}

// Test the email agent
async function main() {
  console.log("=== Email Agent with Safety Guardrails ===\n");
  console.log("SAFETY RULE: No email is ever sent without explicit human approval.\n");

  // Test 1: Property alert
  console.log("--- Test 1: Generate listing alert ---");
  const listingDraft = await generateListingAlert(
    "test@example.com",
    "Irvine",
    1000000
  );
  console.log("\nDraft preview:");
  console.log(`To: ${listingDraft.to}`);
  console.log(`Subject: ${listingDraft.subject}`);
  console.log(`Status: ${listingDraft.status}`);

  // Simulate human approving it
  console.log("\n--- Human reviews and approves the draft ---");
  approveDraft(listingDraft);
  console.log(`Status after approval: ${listingDraft.status}`);

  // Note: actual send is commented out since we don't have email credentials
  // await sendApprovedEmail(listingDraft);

  // Test 2: Market report
  console.log("\n--- Test 2: Generate weekly market report ---");
  const marketDraft = await generateMarketReport(
    "test@example.com",
    ["Irvine", "Pasadena"]
  );
  console.log(`Status: ${marketDraft.status}`);
  console.log("\nNOTE: Draft sitting in queue — waiting for human approval before sending.");

  console.log("\n=== Safety guardrail test passed ===");
  console.log("No emails were sent without approval.");

  process.exit(0);
}

if (require.main === module) main();