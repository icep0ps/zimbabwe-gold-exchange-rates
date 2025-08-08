import readline from "readline";
import db from "../db/index.js";
import { seedRatesToDatabase } from "../db/seeder.js";
import { getDaysBetweenDates, scriptLogger } from "../utils.js";
import { runRateExtractionProcess } from "./get-latest-rate-script.js";
import { runBatchRateExtractionProcess } from "./get-rates-script.js";

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => reader.question(query, resolve));
}

async function getChoiceFromArgsOrPrompt(): Promise<"1" | "2" | null> {
  const args = process.argv.slice(2);
  const firstArg = args[0]?.toLowerCase();

  if (firstArg === "latest") return "1";
  if (firstArg === "batch") return "2";

  const choice = await askQuestion(
    `Which rates do you want to retrieve? (Enter 1 or 2)\n\n` +
      `[1] Latest rates (most recent)\n` +
      `[2] Batch of rates (range of dates)\n\nYour choice: `,
  );

  return choice === "1" || choice === "2" ? choice : null;
}

async function run() {
  try {
    const args = process.argv.slice(2);
    const choice = await getChoiceFromArgsOrPrompt();

    if (choice === "1") {
      const result = await runRateExtractionProcess();

      if ("data" in result) {
        await seedRatesToDatabase(db, [result]);
        scriptLogger.info(
          `Latest rate inserted for ${new Date().toDateString()}.\n`,
        );
      } else {
        scriptLogger.error(`Failed to extract latest rate: ${result.message}`);
      }
    } else if (choice === "2") {
      let startDate: Date;
      let endDate: Date;

      if (args.length >= 3) {
        startDate = new Date(args[1]);
        endDate = new Date(args[2]);
      } else {
        const startDateInput = await askQuestion(
          "Enter start date (YYYY-MM-DD): ",
        );
        const endDateInput = await askQuestion("Enter end date (YYYY-MM-DD): ");
        startDate = new Date(startDateInput);
        endDate = new Date(endDateInput);
      }

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        scriptLogger.error("Invalid date format. Please use YYYY-MM-DD.");
        return;
      }

      if (endDate < startDate) {
        scriptLogger.error("End date must be after start date.");
        return;
      }

      const rangeInDays = getDaysBetweenDates(startDate, endDate);
      const MAX_DAYS_BEFORE_WARNING = 31;

      if (rangeInDays > MAX_DAYS_BEFORE_WARNING && args.length < 3) {
        scriptLogger.warn(
          `You are about to retrieve rates for ${rangeInDays} days. This may take time.`,
        );
        const confirmation = await askQuestion("Proceed? (yes/no): ");
        if (confirmation.toLowerCase() !== "yes") {
          scriptLogger.info("Script aborted by user.");
          return;
        }
      }

      scriptLogger.info("Fetching rates...");
      const results = await runBatchRateExtractionProcess(startDate, endDate);

      const failed = results.filter((r) => !r.success);
      const succeeded = results.filter((r) => r.success);

      if (failed.length > 0) {
        scriptLogger.error(`${failed.length} rate(s) failed to extract:`);
        failed.forEach((e, i) =>
          scriptLogger.error(`  ${i + 1}. ${e.message}`),
        );
      }

      if (succeeded.length > 0) {
        await seedRatesToDatabase(db, succeeded);
        scriptLogger.info(
          `Successfully inserted ${succeeded.length} rate(s) from ${startDate.toDateString()} to ${endDate.toDateString()}.\n`,
        );
      } else {
        scriptLogger.warn("No valid rates were retrieved.");
      }
    } else {
      scriptLogger.warn("Invalid selection. Please enter either 1 or 2.");
    }
  } catch (error) {
    scriptLogger.error(
      `An unexpected error occurred: ${(error as Error).message}`,
    );
  } finally {
    reader.close();
  }
}

run();
