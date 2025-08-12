import "dotenv/config";
import path from "path";
import { scriptLogger } from "../utils.js";
import { downloadRatesForDate } from "./download-rates.js";
import { type ExtractedRates, readRatesPdf } from "./extract-rates.js";

export const PROJECT_ROOT_DIR: string = process.cwd();
export const PDF_SAVE_DIR: string = path.join(PROJECT_ROOT_DIR, "src", "rates");

export interface SuccessExtractionResponse {
  success: true;
  data: ExtractedRates;
}

interface FailedExtractionResponse {
  success: false;
  message: string;
}

type ExtractionResponse = SuccessExtractionResponse | FailedExtractionResponse;

const SCRIPT_DATE =
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "production"
    ? new Date()
    : new Date(2024, 11, 15);

/**
 * Orchestrates the entire process of downloading the exchange rates PDF for a specific date
 * and then extracting and seeding the rates into the database.
 * This function now uses the shared database pool.
 * @param {Date} [targetDate=new Date()] - The specific date for which to download the rates. Defaults to today.
 * @param {number} timeout
 * or voids if an error occurs. To run for a specific date, e.g., new Date(2025, 2, 2) = Sun Mar 02 2025
 */

export async function runRateExtractionProcess(
  targetDate: Date = SCRIPT_DATE,
  timeout: number = 20_000,
): Promise<ExtractionResponse> {
  scriptLogger.warn(`Script running in ${process.env.NODE_ENV} mode`);

  const timeoutFn = setTimeout(() => {
    throw new Error(
      `Script timed out trying to get rates from date ${targetDate}`,
    );
  }, timeout);

  const PDF_FILE_NAME: string = `${targetDate.toLocaleDateString()}.pdf`;
  const FULL_PDF_PATH: string = path.join(PDF_SAVE_DIR, PDF_FILE_NAME);

  const year = targetDate.getFullYear();
  const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
  const day = targetDate.getDate().toString().padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;

  try {
    await downloadRatesForDate(targetDate, PROJECT_ROOT_DIR, PDF_FILE_NAME);

    const extractedRates: ExtractedRates = await readRatesPdf(
      FULL_PDF_PATH,
      formattedDate,
    );
    clearTimeout(timeoutFn);
    return { success: true, data: extractedRates };
  } catch (error: unknown) {
    clearTimeout(timeoutFn);
    let errorMessage = `\n[${targetDate.toDateString()}] An error occurred during the rate extraction process: ${error}`;

    if (error instanceof Error) {
      errorMessage = `\n[${targetDate.toDateString()}] An error occurred during the rate extraction process: ${error.message}`;
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}
