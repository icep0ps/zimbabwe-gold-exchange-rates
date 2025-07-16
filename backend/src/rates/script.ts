import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import path from "path";
import { Pool } from "pg";
import { rates } from "../db/schema.js";
import { seedRatesToDatabase } from "../db/seeder.js";
import { downloadRatesForDate } from "./download-rates.js";
import { type ExtractedRates, readRatesPdf } from "./extract-rates.js";

export const PROJECT_ROOT_DIR: string = process.cwd();
const PDF_SAVE_DIR: string = path.join(PROJECT_ROOT_DIR, "src", "rates");
const PDF_FILE_NAME: string = "rates.pdf";
const FULL_PDF_PATH: string = path.join(PDF_SAVE_DIR, PDF_FILE_NAME);

const pool = new Pool({
  ssl: false,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT as string),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool, { schema: { rates } });

/**
 * Orchestrates the entire process of downloading the exchange rates PDF for a specific date
 * and then extracting and seeding the rates into the database.
 * This function now uses the shared database pool.
 * @param {Date} [targetDate=new Date()] - The specific date for which to download the rates. Defaults to today.
 * @returns {Promise<ExtractedRates | void>} A promise that resolves with the extracted rates
 * or voids if an error occurs.
 */
async function runRateExtractionProcess(
  targetDate: Date = new Date(),
): Promise<ExtractedRates | void> {
  console.log(
    `Starting the extraction process for: ${targetDate.toDateString()}`,
  );
  console.log(`PDF will be saved to: ${FULL_PDF_PATH}`);

  try {
    console.log(
      `\n[${targetDate.toDateString()}] Attempting to download exchange rates PDF...`,
    );
    await downloadRatesForDate(targetDate, PROJECT_ROOT_DIR, PDF_FILE_NAME);
    console.log(`[${targetDate.toDateString()}] PDF download complete.`);

    console.log(
      `\n[${targetDate.toDateString()}] Attempting to extract rates from the downloaded PDF...`,
    );
    const extractedRates: ExtractedRates = await readRatesPdf(FULL_PDF_PATH);
    console.log(`[${targetDate.toDateString()}] Rates extraction complete.`);

    // Format the date to "YYYY-MM-DD"
    const year = targetDate.getFullYear();
    const month = (targetDate.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed
    const day = targetDate.getDate().toString().padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    console.log(
      `\n[${targetDate.toDateString()}] Attempting to seed rates for ${formattedDate} into the database...`,
    );
    await seedRatesToDatabase(db, extractedRates, formattedDate);
    console.log(`[${targetDate.toDateString()}] Database seeding complete.`);

    console.log(
      `\n--- Extracted Exchange Rates (and seeded) for ${targetDate.toDateString()} ---`,
    );
    console.log(JSON.stringify(extractedRates, null, 2));
    console.log(
      `\nProcess completed successfully for ${targetDate.toDateString()}!`,
    );

    return extractedRates;
  } catch (error: unknown) {
    console.error(
      `\n[${targetDate.toDateString()}] An error occurred during the rate extraction process:`,
    );
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("An unexpected error occurred.");
    }
    throw error;
  }
}

// Example usage:
// To run for today's date (default):
//runRateExtractionProcess();

// To run for a specific date, e.g., new Date(2025, 2, 2) = Sun Mar 02 2025:
runRateExtractionProcess(new Date(2025, 2, 2));
