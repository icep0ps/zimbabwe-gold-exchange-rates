import readline from "readline";
import db from "../db/index.js";
import { seedRatesToDatabase } from "../db/seeder.js";
import { getDaysBetweenDates, scriptLogger } from "../utils.js";
import { runRateExtractionProcess } from "./get-latest-rate-script.js";
import { runBatchRateExtractionProcess } from "./get-rates-script.js";
import sendPushNotifications from "./notifications.js";

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0]?.toLowerCase();

  if (mode) {
    if (mode === "latest" || mode === "latests") {
      await handleLatestRate();
    } else if (mode === "batch") {
      if (args.length < 3) {
        scriptLogger.error("Batch mode requires start and end dates.");
        console.log("Usage: npm run get-rates batch YYYY-MM-DD YYYY-MM-DD");
        process.exit(1);
      }
      const startDate = new Date(args[1]);
      const endDate = new Date(args[2]);
      await handleBatchRates(startDate, endDate, false);
    } else {
      scriptLogger.error(`Unknown command: "${mode}"`);
      console.log("Available commands: latest, batch");
      process.exit(1);
    }
  } else {
    await runInteractiveMode();
  }
}

/**
 * Fetches and seeds the most recent rate.
 */
async function handleLatestRate() {
  scriptLogger.info("Fetching the latest rate...");
  const result = await runRateExtractionProcess();

  if ("data" in result) {
    await seedRatesToDatabase(db, [result]);
    scriptLogger.info(
      `Latest rate inserted for ${new Date().toDateString()}.\n`,
    );
    sendPushNotifications();
  } else {
    scriptLogger.error(`Failed to extract latest rate: ${result.message}`);
  }
}

/**
 * Fetches and seeds rates for a given date range.
 * @param isInteractive - Skips confirmation prompts if false.
 */
async function handleBatchRates(
  startDate: Date,
  endDate: Date,
  isInteractive: boolean,
  reader?: readline.Interface,
) {
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    scriptLogger.error("Invalid date format. Please use YYYY-MM-DD.");
    return;
  }

  if (endDate < startDate) {
    scriptLogger.error("End date must be after start date.");
    return;
  }

  if (isInteractive) {
    const rangeInDays = getDaysBetweenDates(startDate, endDate);
    const MAX_DAYS_BEFORE_WARNING = 31;

    if (rangeInDays > MAX_DAYS_BEFORE_WARNING) {
      scriptLogger.warn(
        `You are about to retrieve rates for ${rangeInDays} days. This may take time.`,
      );
      const confirmation = await new Promise<string>((resolve) =>
        reader!.question("Proceed? (yes/no): ", resolve),
      );
      if (confirmation.toLowerCase() !== "yes") {
        scriptLogger.info("Script aborted by user.");
        return;
      }
    }
  }

  scriptLogger.info(
    `Fetching rates from ${startDate.toDateString()} to ${endDate.toDateString()}...`,
  );
  const results = await runBatchRateExtractionProcess(startDate, endDate);

  const failed = results.filter((r) => !r.success);
  const succeeded = results.filter((r) => r.success);

  if (failed.length > 0) {
    scriptLogger.error(`${failed.length} rate(s) failed to extract:`);
    failed.forEach((e, i) => scriptLogger.error(`  ${i + 1}. ${e.message}`));
  }

  if (succeeded.length > 0) {
    await seedRatesToDatabase(db, succeeded);
    scriptLogger.info(`Successfully inserted ${succeeded.length} rate(s).\n`);
  } else if (failed.length === 0) {
    scriptLogger.warn("No valid rates were retrieved for the given range.");
  }
}

/**
 * Runs the script with interactive prompts for the user.
 */
async function runInteractiveMode() {
  const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (query: string): Promise<string> => {
    return new Promise((resolve) => reader.question(query, resolve));
  };

  try {
    const choice = await askQuestion(
      `Which rates do you want to retrieve? (Enter 1 or 2)\n\n` +
        `  [1] Latest rates (most recent)\n` +
        `  [2] Batch of rates (range of dates)\n\nYour choice: `,
    );

    if (choice === "1") {
      await handleLatestRate();
    } else if (choice === "2") {
      const startDateInput = await askQuestion(
        "Enter start date (YYYY-MM-DD): ",
      );
      const endDateInput = await askQuestion("Enter end date (YYYY-MM-DD): ");
      await handleBatchRates(
        new Date(startDateInput),
        new Date(endDateInput),
        true,
        reader,
      );
    } else {
      scriptLogger.warn("Invalid selection. Please enter either 1 or 2.");
    }
  } catch (error) {
    scriptLogger.error(
      `An interactive error occurred: ${(error as Error).message}`,
    );
  } finally {
    reader.close();
  }
}

main().catch((error) => {
  scriptLogger.error(
    `An unexpected error occurred: ${(error as Error).message}`,
  );
  process.exit(1);
});
