import path from "path";
import fs from "fs";
import "dotenv/config";
import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { monthlyExchangeRatesURLs } from "../db/schema.js";
import { scriptLogger } from "../utils.js";

// PUPPETEER IMPORTS
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";

// Enable stealth mode to evade detection
puppeteer.use(StealthPlugin());

const RBZ_BASE_URL: string = "https://www.rbz.co.zw";
const EXCHANGE_RATES_PATH: string = "/index.php/research/markets/exchange-rates";
const FULL_EXCHANGE_RATES_URL: string = `${RBZ_BASE_URL}${EXCHANGE_RATES_PATH}`;

const monthNames: { [key: string]: number } = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/**
 * Helper to initialize a robust browser instance
 */
async function getBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: true, // Set to false if debugging locally
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // Fixes memory issues in Docker
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
  });
}

export async function getMonthPageURL(
  targetMonth: number,
  targetYear: number,
): Promise<string> {
  const MONTHLY_RATE_PAGE_ID = `${targetMonth}-${targetYear}`;
  
  // 1. Check DB first
  const [monthlyRatesUrl] = await db
    .select()
    .from(monthlyExchangeRatesURLs)
    .where(eq(monthlyExchangeRatesURLs.id, MONTHLY_RATE_PAGE_ID))
    .limit(1);

  if (monthlyRatesUrl) {
    return monthlyRatesUrl.url;
  }

  // 2. If not in DB, Scrape via Puppeteer
  scriptLogger.info(`Scraping URL for ${MONTHLY_RATE_PAGE_ID} using Puppeteer...`);
  
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Set a realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate with a generous timeout
    await page.goto(FULL_EXCHANGE_RATES_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Evaluate page content to find the specific month link
    const foundUrl = await page.evaluate((tMonth, tYear, baseUrl, mNames) => {
      const links = Array.from(document.querySelectorAll("div.page-header h2 a"));
      
      for (const link of links) {
        const text = link.textContent?.trim() || "";
        const [monthNameStr, yearStr] = text.split(" ");
        const mName = monthNameStr.toLowerCase();
        
        // Check if month name exists in our map and matches target
        // @ts-ignore - passing mNames object into evaluate context
        if (mNames[mName] === tMonth && parseInt(yearStr) === tYear) {
          let href = link.getAttribute("href");
          if (href && !href.startsWith("http")) {
            href = baseUrl + href;
          }
          return href;
        }
      }
      return null;
    }, targetMonth, targetYear, RBZ_BASE_URL, monthNames);

    if (foundUrl) {
      await db.insert(monthlyExchangeRatesURLs).values({
        id: MONTHLY_RATE_PAGE_ID,
        url: foundUrl,
      });
      scriptLogger.info(`Found and saved URL: ${foundUrl}`);
      return foundUrl;
    } else {
      throw new Error(`Could not find URL for ${MONTHLY_RATE_PAGE_ID} on the main page.`);
    }

  } catch (error) {
    throw error;
  } finally {
    await browser.close();
  }
}

export async function downloadRatesForDate(
  targetDate: Date,
  projectRootDir: string,
  fileName: string = "rates.pdf",
): Promise<void> {
  scriptLogger.info(`Starting download process for date: ${targetDate.toDateString()}...`);
  
  const month = targetDate.getMonth() + 1;
  const year = targetDate.getFullYear();
  const day = targetDate.getDate();

  let browser: Browser | null = null;

  try {
    const monthPageUrl: string = await getMonthPageURL(month, year);
    const outputPath: string = path.join(projectRootDir, "src", "rates", fileName);
    
    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    browser = await getBrowser();
    const page = await browser.newPage();
    
    // Enable request interception to grab the PDF stream directly
    await page.setRequestInterception(true);
    
    page.on('request', (req) => {
        // Allow all requests to proceed
        req.continue(); 
    });

    scriptLogger.info(`Navigating to month page: ${monthPageUrl}`);
    await page.goto(monthPageUrl, { waitUntil: "networkidle2", timeout: 60000 });

    // Find the PDF Link for the specific Day
    const pdfUrl = await page.evaluate((targetDay) => {
      const rows = Array.from(document.querySelectorAll("article.item-page tr"));
      
      for (const row of rows) {
        const firstCell = row.querySelector("td:first-child");
        if (firstCell) {
            const dayText = firstCell.textContent?.trim();
            if (dayText && parseInt(dayText) === targetDay) {
                const pdfAnchor = row.querySelector("td:nth-child(2) a[href$='.pdf']");
                return pdfAnchor ? pdfAnchor.getAttribute("href") : null;
            }
        }
      }
      return null;
    }, day);

    if (!pdfUrl) {
       throw new Error(`No PDF link found for Day ${day} on page ${monthPageUrl}`);
    }

    const fullPdfUrl = pdfUrl.startsWith("http") ? pdfUrl : `${RBZ_BASE_URL}${pdfUrl}`;
    scriptLogger.info(`Found PDF URL: ${fullPdfUrl}`);

    // Download the PDF using page.evaluate to fetch binary data in the browser context
    // This uses the browser's cookies and headers automatically
    const pdfBufferArray = await page.evaluate(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch PDF inside browser");
        const buffer = await response.arrayBuffer();
        return Array.from(new Uint8Array(buffer));
    }, fullPdfUrl);

    fs.writeFileSync(outputPath, new Uint8Array(pdfBufferArray));
    scriptLogger.info(`Successfully downloaded PDF to ${outputPath}`);

  } catch (error: any) {
    throw new Error(`Error downloading rates: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
}