import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import readline from "readline";
import { rates } from "../db/schema.js";
import { seedRatesToDatabase } from "../db/seeder.js";
import { scriptLogger } from "../utils.js";
import { runRateExtractionProcess } from "./get-latest-rate-script.js";
import { runBatchRateExtractionProcess } from "./get-rates-script.js";

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

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    reader.question(query, resolve);
  });
}

(async () => {
  try {
    const choice = await askQuestion(
      `Which rates do you want to retrieve? (Enter 1 or 2) \n\n` +
        `[1] Latest rates (most recent)\n` +
        `[2] Batch of rates (range of dates)\n\nYour choice: `,
    );

    if (choice === "1") {
      const result = await runRateExtractionProcess();
      if ("data" in result) {
        await seedRatesToDatabase(db, [result]);
        scriptLogger.info(
          `\nLatest rate inserted for ${new Date().toDateString()}.\n`,
        );
      } else {
        scriptLogger.error(`Failed to extract latest rate: ${result.message}`);
      }
      reader.close();
    } else if (choice === "2") {
      const startDateInput = await askQuestion(
        "Enter start date (YYYY-MM-DD): ",
      );
      const endDateInput = await askQuestion("Enter end date (YYYY-MM-DD): ");

      const startDate = new Date(startDateInput);
      const endDate = new Date(endDateInput);

      const results = await runBatchRateExtractionProcess(startDate, endDate);

      const errors = results.filter((r) => !r.success);
      const successfulData = results.filter((r) => r.success);

      if (errors.length > 0) {
        scriptLogger.error(`\nEncountered ${errors.length} error(s):`);
        errors.forEach((e) => scriptLogger.error(e.message));
      }

      if (successfulData.length > 0) {
        await seedRatesToDatabase(db, successfulData);
        scriptLogger.info(
          `\nSuccessfully inserted rates from ${startDate.toDateString()} to ${endDate.toDateString()}.\n`,
        );
      }

      reader.close();
    } else {
      scriptLogger.warn("Invalid input. Please enter either 1 or 2.");
      reader.close();
    }
  } catch (error) {
    scriptLogger.error(
      `An unexpected error occurred: ${(error as Error).message}`,
    );
    reader.close();
  }
})();
