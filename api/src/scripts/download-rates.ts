import axios, { type AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import "dotenv/config";
import { eq } from "drizzle-orm";
import fs from "fs";
import { type IncomingMessage } from "http";
import https, { Agent } from "https";
import path from "path";
import db from "../db/index.js";
import { monthlyExchangeRatesURLs } from "../db/schema.js";
import { scriptLogger } from "../utils.js";

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
  const MONTHLY_RATE_PAGE_ID = `${targetMonth}-${targetYear}`;
  try {
    scriptLogger.info(
      `Searching for ${MONTHLY_RATE_PAGE_ID} page URL from Database`,
    );

    let foundMonthUrl: string | undefined;

    const [monthlyRatesUrl] = await db
      .select()
      .from(monthlyExchangeRatesURLs)
      .where(eq(monthlyExchangeRatesURLs.id, MONTHLY_RATE_PAGE_ID))
      .limit(1);

    if (!monthlyRatesUrl) {
      scriptLogger.warn(
        `Could not find ${MONTHLY_RATE_PAGE_ID} page URL from Database`,
      );
      scriptLogger.info(
        `Searching for ${MONTHLY_RATE_PAGE_ID} page URL from: ${FULL_EXCHANGE_RATES_URL}`,
      );

      let $: cheerio.CheerioAPI;
      if (
        process.env.NODE_ENV === "production" ||
        process.env.NODE_ENV === "development"
      ) {
        const response: AxiosResponse<string> = await axios.post(
          FULL_EXCHANGE_RATES_URL,
          "filter-search=&month=&year=&limit=0&view=archive&option=com_content&limitstart=0",
          {
            httpsAgent: agent,
          },
        );

        $ = cheerio.load(response.data);
      } else {
        const buffer = fs.readFileSync(
          `${process.cwd()}/__tests__/scripts/pages/exchange-rates.html`,
        );
        $ = cheerio.loadBuffer(buffer);
      }

      const monthLinks = $("div.page-header h2");

      monthLinks.each((_, element) => {
        const linkElement = $(element).clone().children().filter("a");

        if (linkElement) {
          const link = linkElement.attr("href");
          const [monthName, year] = linkElement.text().trim().split(" ");
          const monthNumber = monthNames[monthName.toLocaleLowerCase()];
          if (monthNumber === targetMonth && parseInt(year) === targetYear) {
            foundMonthUrl = `${RBZ_BASE_URL}${link}`;
            return false;
          }
        }
      });

      if (foundMonthUrl) {
        const [newPageUrl] = await db
          .insert(monthlyExchangeRatesURLs)
          .values({
            id: MONTHLY_RATE_PAGE_ID,
            url: foundMonthUrl,
          })
          .returning({ id: monthlyExchangeRatesURLs.id });
        if (newPageUrl)
          scriptLogger.info(
            `Successfully added monthly rate page url for ${MONTHLY_RATE_PAGE_ID}`,
          );
      } else {
        throw Error(
          `Could not find the exchange rates URL for ${MONTHLY_RATE_PAGE_ID}. It might be on a paginated page not yet fetched, or the selector is outdated.`,
        );
      }
    } else {
      foundMonthUrl = monthlyRatesUrl.url;
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
  scriptLogger.info(`Navigating to monthly rates page: ${monthPageUrl}`);
  try {
    let $: cheerio.CheerioAPI;
    if (
      process.env.ENV === "production" ||
      process.env.NODE_ENV === "development"
    ) {
      const response: AxiosResponse<string> = await axios.get(monthPageUrl, {
        httpsAgent: agent,
      });

      $ = cheerio.load(response.data);
    } else {
      const buffer = fs.readFileSync(
        `${process.cwd()}/__tests__/scripts/pages/daily-exchange-rates.html`,
      );
      $ = cheerio.loadBuffer(buffer);
    }

    let foundPdfUrl: string | undefined = getDailyRatePdfDownloadURLFromHTML(
      $,
      targetDay,
    );

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
  scriptLogger.warn(`Downloading file from: ${fileUrl} to: ${outputPath}`);
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
          scriptLogger.info("Rates PDF download completed.");
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
  scriptLogger.info(
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

    if (!fs.existsSync(outputPath)) {
      await downloadFile(pdfDownloadUrl, outputPath);
    }
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

export function getDailyRatePdfDownloadURLFromHTML(
  $: cheerio.CheerioAPI,
  targetDay: number,
  retriesLeft: number = 3,
) {
  if (retriesLeft < 0) {
    return undefined;
  }

  const link = $("tbody tr")
    .filter(function (_, el) {
      const $row = $(el);
      const dayCellText = $row.find("td:nth-child(1)").text().trim();
      const pdfLinkElement = $row.find("td:nth-child(2) a[href$='.pdf']");

      if (dayCellText && pdfLinkElement.length > 0) {
        const dayInTable = parseInt(dayCellText, 10);
        return dayInTable === targetDay;
      }
      return false;
    })
    .find("td:nth-child(2) a[href$='.pdf']")
    .attr("href");

  if (link) {
    if (
      process.env.ENV === "production" ||
      process.env.NODE_ENV === "development"
    ) {
      return `${RBZ_BASE_URL}${link}`;
    }
    return link;
  }

  targetDay--;
  retriesLeft--;

  return getDailyRatePdfDownloadURLFromHTML($, targetDay, retriesLeft);
}

/**
 * Gets all the {@link https://www.rbz.co.zw/index.php/research/markets/exchange-rates|RBZ Exachange rates Page}
 * and saves it on the device. (SHOULD ONLY BE USED WHEN SEEDING DATABASE)
 */
export async function downloadMonthyRatesHTMLPage() {
  const outputPath: string = path.join(
    process.cwd(),
    "src",
    "scripts",
    "monthly-exchange-rates.html",
  );

  if (
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "development"
  ) {
    const response: AxiosResponse<string> = await axios.post(
      FULL_EXCHANGE_RATES_URL,
      "filter-search=&month=&year=&limit=0&view=archive&option=com_content&limitstart=0",
      {
        httpsAgent: agent,
      },
    );

    if (response.status === 200) fs.writeFileSync(outputPath, response.data);
    else
      throw Error(`Failed to get monthly rates page: ${response.statusText}`);
  }

  const buffer = fs.readFileSync(outputPath);
  const $ = cheerio.loadBuffer(buffer);
  const monthLinks = $("div.page-header h2");

  const monthLinksToInsert = monthLinks
    .map((_, element) => {
      const linkElement = $(element).clone().children().filter("a");
      const link = linkElement.attr("href");

      if (link) {
        const [monthName, year] = linkElement.text().trim().split(" ");
        const monthNumber = monthNames[monthName.toLocaleLowerCase()];
        return {
          id: `${monthNumber}-${year}`,
          url: `${RBZ_BASE_URL}${link}`,
        };
      }
    })
    .toArray();

  const uniqueMonths = monthLinksToInsert.filter(
    (value, index, self) => index === self.findIndex((t) => t.id === value.id),
  );

  const res = await db
    .insert(monthlyExchangeRatesURLs)
    .values(uniqueMonths)
    .returning({ id: monthlyExchangeRatesURLs.id });

  scriptLogger.info(
    `Successfully created ${res.length} monthly rates page urls in database!`,
  );
}
