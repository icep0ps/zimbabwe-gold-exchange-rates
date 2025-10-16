import axios, { type AxiosResponse, type AxiosRequestHeaders } from "axios";
import * as cheerio from "cheerio";
import "dotenv/config";
import { eq } from "drizzle-orm";
import fs from "fs";
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

const options = {
  timeout: 10000,
};

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

const userAgents: string[] = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
];

function getRandomUserAgent(): string {
  const randomIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomIndex];
}

/**
 * Generates a realistic, dynamic set of HTTP headers for a request.
 * @param url The target URL to help set appropriate 'Referer' and 'Sec-Fetch-Site' headers.
 * @returns An AxiosRequestHeaders object.
 */
function generateHumanHeaders(url: string): AxiosRequestHeaders {
  const userAgent = getRandomUserAgent();
  const languages = ["en-US,en;q=0.9", "en-GB,en;q=0.8", "fr-FR,fr;q=0.7"];
  const acceptLanguage =
    languages[Math.floor(Math.random() * languages.length)];

  let origin: string | null = null;
  try {
    origin = new URL(url).origin;
  } catch (e) {
    scriptLogger.warn(`Invalid URL for header generation: ${url}`);
  }

  const headers = {
    "User-Agent": userAgent,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": acceptLanguage,
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    ...(origin && { Referer: origin }),
    Pragma: "no-cache",
    "Cache-Control": "no-cache",
  };

  return headers as unknown as AxiosRequestHeaders;
}

async function retryAxiosRequest<T>(
  request: () => Promise<AxiosResponse<T>>,
  maxRetries: number = 5,
): Promise<AxiosResponse<T>> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === "EAI_AGAIN") {
        if (i < maxRetries - 1) {
          const backoffTime = 1000 * 2 ** i + Math.random() * 1000;
          scriptLogger.warn(
            `DNS lookup failed (EAI_AGAIN), retrying in ${Math.round(
              backoffTime / 1000,
            )} seconds... (Attempt ${i + 1}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        } else {
          scriptLogger.error(
            `DNS lookup failed after ${maxRetries} attempts.`,
          );
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries reached for network request.");
}

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
        const response: AxiosResponse<string> = await retryAxiosRequest(() =>
          axios.post(
            FULL_EXCHANGE_RATES_URL,
            "filter-search=&month=&year=&limit=0&view=archive&option=com_content&limitstart=0",
            {
              httpsAgent: agent,
              headers: generateHumanHeaders(FULL_EXCHANGE_RATES_URL),
              timeout: options.timeout,
            },
          ),
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
      process.env.NODE_ENV === "production" ||
      process.env.NODE_ENV === "development"
    ) {
      const response: AxiosResponse<string> = await retryAxiosRequest(() =>
        axios.get(monthPageUrl, {
          httpsAgent: agent,
          headers: generateHumanHeaders(monthPageUrl),
          timeout: options.timeout,
        }),
      );

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

    if (foundPdfUrl && !foundPdfUrl.startsWith("http")) {
      foundPdfUrl = `${RBZ_BASE_URL}${foundPdfUrl}`;
    }

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
 * Downloads a file from a given URL to a specified local path using axios.
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

  try {
    const response: AxiosResponse<any> = await retryAxiosRequest(() =>
      axios.get(fileUrl, {
        responseType: "stream",
        httpsAgent: agent,
        headers: generateHumanHeaders(fileUrl),
        timeout: options.timeout,
      }),
    );

    if (response.status !== 200) {
      throw new Error(
        `Failed to get '${fileUrl}' (${response.status} ${response.statusText})`,
      );
    }

    const writer: fs.WriteStream = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    return new Promise<void>((resolve, reject) => {
      writer.on("finish", () => {
        writer.close();
        scriptLogger.info("Rates PDF download completed.");
        resolve();
      });

      writer.on("error", (err: Error) => {
        fs.unlink(outputPath, () => {});
        reject(new Error(`File write error: ${err.message}`));
      });

      response.data.on("error", (err: Error) => {
        fs.unlink(outputPath, () => {});
        reject(new Error(`Download stream error: ${err.message}`));
      });
    });
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred during download";
    if (axios.isAxiosError(error)) {
      errorMessage = error.message;
      if (error.response) {
        errorMessage += ` (Status: ${error.response.status})`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(`Error downloading file: ${errorMessage}`);
  }
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

    if (process.env.NODE_ENV === "development" && fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
      scriptLogger.warn(
        `Deleted existing PDF in development mode: ${outputPath}`,
      );
    }

    if (!fs.existsSync(outputPath)) {
      await downloadFile(pdfDownloadUrl, outputPath);
    } else {
      scriptLogger.info(
        `Rates PDF already exists at: ${outputPath}. Skipping download.`,
      );
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

/**
 * Extracts the PDF download URL for a specific day from the RBZ exchange rates page.
 * It retries for previous days if the target day is not found.
 *
 * @param {cheerio.CheerioAPI} $ - The Cheerio API instance loaded with the page HTML.
 * @param {number} targetDay - The day of the month to find the rate for.
 * @param {number} [retriesLeft=4] - The number of previous days to check.
 * @returns {string | undefined} The full URL to the PDF or undefined if not found.
 */
export function getDailyRatePdfDownloadURLFromHTML(
  $: cheerio.CheerioAPI,
  targetDay: number,
  retriesLeft: number = 4,
): string | undefined {
  // Base case for recursion: if we've run out of days or retries, stop.
  if (targetDay < 1 || retriesLeft < 0) {
    return undefined;
  }

  const row = $("article.item-page tr").filter(function () {
    const dayCellText = $(this).find("td:first-child").text().trim();

    // Ensure the cell has text before trying to parse it
    if (dayCellText) {
      const dayInTable = parseInt(dayCellText, 10);
      return dayInTable === targetDay;
    }
    return false;
  });

  // Find the PDF link within the matched row
  const link = row.find("td:nth-child(2) a[href$='.pdf']").attr("href");

  if (link) {
    return link;
  }

  // If no link is found for the targetDay, recursively call the function
  // for the previous day with one less retry.
  return getDailyRatePdfDownloadURLFromHTML($, targetDay - 1, retriesLeft - 1);
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
    const response: AxiosResponse<string> = await retryAxiosRequest(() =>
      axios.post(
        FULL_EXCHANGE_RATES_URL,
        "filter-search=&month=&year=&limit=0&view=archive&option=com_content&limitstart=0",
        {
          httpsAgent: agent,
          headers: generateHumanHeaders(FULL_EXCHANGE_RATES_URL),
          timeout: options.timeout,
        },
      ),
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
    .toArray()
    .filter((item) => item !== undefined) as { id: string; url: string }[];

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
