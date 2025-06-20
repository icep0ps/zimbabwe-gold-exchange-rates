import fs from "fs";
import "dotenv/config";
import https, { Agent } from "https";
import { type IncomingMessage } from "http";
import * as cheerio from "cheerio";
import axios, { type AxiosResponse } from "axios";
import path from "path";

const agent: Agent = new https.Agent({
  rejectUnauthorized: false,
});

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const RBZ_BASE_URL: string = "https://www.rbz.co.zw";
const EXCHANGE_RATES_PATH: string =
  "/index.php/research/markets/exchange-rates";
const FULL_EXCHANGE_RATES_URL: string = `${RBZ_BASE_URL}${EXCHANGE_RATES_PATH}`;

// Helper to convert month name to number
const monthNames: { [key: string]: number } = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

/**
 * Fetches the URL for a specific month's exchange rates page on the RBZ website.
 * @param {number} targetMonth - The month (1-12) to find.
 * @param {number} targetYear - The year to find.
 * @returns {Promise<string>} The full URL to the specified month's exchange rates page.
 * @throws {Error} If the URL for the specified month cannot be found.
 */
export async function getMonthPageURL(
  targetMonth: number,
  targetYear: number,
): Promise<string> {
  console.log(
    `Searching for ${targetMonth}/${targetYear} page URL from: ${FULL_EXCHANGE_RATES_URL}`,
  );
  try {
    const response: AxiosResponse<string> = await axios.get(
      FULL_EXCHANGE_RATES_URL,
      {
        httpsAgent: agent,
      },
    );
    const $: cheerio.CheerioAPI = cheerio.load(response.data);

    // Select all links within h2 tags inside div.row0, which are typically monthly links
    const monthLinks = $("div.row0 > div.page-header > h2 > a");

    let foundMonthUrl: string | undefined;

    monthLinks.each((_, element) => {
      const linkText = $(element).text().trim(); // e.g., "June 2025"
      const partialUrl = $(element).attr("href");

      if (partialUrl) {
        // Simple regex to extract month name and year from the link text
        const match = linkText.match(/([a-zA-Z]+)\s+(\d{4})/);
        if (match && match.length >= 3) {
          const monthName = match[1].toLowerCase();
          const year = parseInt(match[2], 10);
          const monthNumber = monthNames[monthName];

          if (monthNumber === targetMonth && year === targetYear) {
            foundMonthUrl = `${RBZ_BASE_URL}${partialUrl}`;
            return false; // Break out of .each loop
          }
        }
      }
    });

    if (!foundMonthUrl) {
      throw new Error(
        `Could not find the exchange rates URL for ${targetMonth}/${targetYear}. It might be on a paginated page not yet fetched, or the selector is outdated.`,
      );
    }

    return foundMonthUrl;
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (axios.isAxiosError(error)) {
      errorMessage = error.message;
      if (error.response) {
        errorMessage += ` (Status: ${error.response.status})`;
      }
    }
    throw new Error(`Error navigating to exchange rates page: ${errorMessage}`);
  }
}

/**
 * Fetches the download URL for a specific day's exchange rates PDF from a given monthly rates page.
 * @param {string} monthPageUrl - The URL of the specific month's exchange rates page.
 * @param {number} targetDay - The day of the month to find.
 * @returns {Promise<string>} The full URL to the specified day's rates PDF.
 * @throws {Error} If the PDF URL for the specified day cannot be found.
 */
export async function getDailyRatePdfDownloadURL(
  monthPageUrl: string,
  targetDay: number,
): Promise<string> {
  console.log(`Navigating to monthly rates page: ${monthPageUrl}`);
  try {
    const response: AxiosResponse<string> = await axios.get(monthPageUrl, {
      httpsAgent: agent,
    });
    const $: cheerio.CheerioAPI = cheerio.load(response.data);

    let foundPdfUrl: string | undefined;

    // Iterate over each table row in the tbody
    $("tbody tr").each((_, rowElement) => {
      const $row = $(rowElement);
      const dayCellText = $row.find("td:nth-child(1)").text().trim(); // Get text from the first <td> (e.g., "02")
      const pdfLinkElement = $row.find("td:nth-child(2) a[href$='.pdf']"); // Get the PDF link from the second <td>

      if (dayCellText && pdfLinkElement.length > 0) {
        const dayInTable = parseInt(dayCellText, 10);

        if (dayInTable === targetDay) {
          const partialUrl = pdfLinkElement.attr("href");
          if (partialUrl) {
            foundPdfUrl = `${RBZ_BASE_URL}${partialUrl}`;
            return false; // Break out of .each loop
          }
        }
      }
    });

    if (!foundPdfUrl) {
      throw new Error(
        `Could not find the PDF download URL for day ${targetDay} on page ${monthPageUrl}. Selector might be outdated or the link format changed.`,
      );
    }

    return foundPdfUrl;
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (axios.isAxiosError(error)) {
      errorMessage = error.message;
      if (error.response) {
        errorMessage += ` (Status: ${error.response.status})`;
      }
    }
    throw new Error(
      `Error navigating to monthly PDF page or finding PDF link: ${errorMessage}`,
    );
  }
}
/**
 * Downloads a file from a given URL to a specified local path.
 * @param {string} fileUrl - The URL of the file to download.
 * @param {string} outputPath - The full path including filename where the file should be saved.
 * @returns {Promise<void>} A promise that resolves when the download is complete.
 * @throws {Error} If there's an error during the download process.
 */
export async function downloadFile(
  fileUrl: string,
  outputPath: string,
): Promise<void> {
  console.log(`Downloading file from: ${fileUrl} to: ${outputPath}`);
  const outputDir: string = path.dirname(outputPath);
  await fs.promises.mkdir(outputDir, { recursive: true });

  const writer: fs.WriteStream = fs.createWriteStream(outputPath);

  return new Promise<void>((resolve, reject) => {
    https
      .get(fileUrl, (response: IncomingMessage) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to get '${fileUrl}' (${response.statusCode} ${response.statusMessage || "Unknown Status"})`,
            ),
          );
          return;
        }

        response.pipe(writer);

        writer.on("finish", () => {
          writer.close();
          console.log("Download completed.");
          resolve();
        });

        writer.on("error", (err: Error) => {
          fs.unlink(outputPath, () => {});
          reject(new Error(`File write error: ${err.message}`));
        });
      })
      .on("error", (err: Error) => {
        fs.unlink(outputPath, () => {});
        reject(new Error(`HTTP request error: ${err.message}`));
      });
  });
}

/**
 * Orchestrates the process of finding and downloading the exchange rates PDF for a specific date.
 * @param {Date} targetDate - The specific date for which to download the rates.
 * @param {string} projectRootDir - The root directory of your project, used to construct the full save path.
 * @param {string} [fileName="rates.pdf"] - The name of the PDF file (e.g., 'rates.pdf').
 * @returns {Promise<void>} A promise that resolves when the PDF is downloaded.
 * @throws {Error} If any step in the process (getting URLs, downloading) fails.
 */
export async function downloadRatesForDate(
  targetDate: Date,
  projectRootDir: string,
  fileName: string = "rates.pdf",
): Promise<void> {
  console.log(
    `Starting PDF download process for date: ${targetDate.toDateString()}...`,
  );
  try {
    const month = targetDate.getMonth() + 1; // getMonth() is 0-indexed
    const year = targetDate.getFullYear();
    const day = targetDate.getDate();

    const monthPageUrl: string = await getMonthPageURL(month, year);
    const pdfDownloadUrl: string = await getDailyRatePdfDownloadURL(
      monthPageUrl,
      day,
    );
    const outputPath: string = path.join(
      projectRootDir,
      "src",
      "rates",
      fileName,
    );

    await downloadFile(pdfDownloadUrl, outputPath);
    console.log(
      `Rates PDF for ${targetDate.toDateString()} downloaded successfully to: ${outputPath}`,
    );
  } catch (error: unknown) {
    let errorMessage =
      "An unknown error occurred during PDF download orchestration";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(
      `Error during PDF download orchestration for ${targetDate.toDateString()}: ${errorMessage}`,
    );
  }
}

// Example usage:
// To download rates for June 16, 2025:
// downloadRatesForDate(new Date('2025-06-16'), __dirname);
