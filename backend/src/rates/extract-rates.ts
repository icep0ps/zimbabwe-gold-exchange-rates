import PDFParser from "pdf2json";

interface PDFTextNode {
  x: number;
  y: number;
  w: number;
  h?: number;
  R: Array<{
    T: string;
    S?: number;
    TS?: number[];
  }>;
}

interface PDFDataPage {
  Texts: PDFTextNode[];
}

/**
 * Interface representing the top-level structure of pdf2json's parsed output.
 * Focused on 'Pages' as it's the primary property used.
 */
interface PDFData {
  Pages: PDFDataPage[];
}

/**
 * Interface representing the structure of the extracted exchange rates.
 */
export interface ExtractedRates {
  [currencyPair: string]: {
    bid: number;
    ask: number;
    mid_rate: number;
    bid_zwl: number;
    ask_zwl: number;
    mid_zwl: number;
  };
}

/**
 * Extracts exchange rates from a PDF file.
 * @param {string} pdfPath - The full path to the PDF file to be parsed.
 * @returns {Promise<ExtractedRates>} A promise that resolves to an object containing the extracted rates.
 */
export async function readRatesPdf(pdfPath: string): Promise<ExtractedRates> {
  console.log("Extracting rates from PDF...");

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: { parserError: Error }) => {
      console.error("PDF Parser Error:", errData.parserError.message);
      reject(new Error(`Failed to parse PDF: ${errData.parserError.message}`));
    });

    // Event listener when PDF data is ready
    pdfParser.on("pdfParser_dataReady", (pdfData: PDFData) => {
      try {
        const rates: ExtractedRates = extractRatesFromPdf(pdfData);
        resolve(rates);
      } catch (error: unknown) {
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        reject(new Error(`Error processing PDF data: ${errorMessage}`));
      }
    });

    pdfParser.loadPDF(pdfPath);
  });
}

/**
 * Parses the raw PDF data to extract currency exchange rates.
 * This function expects data in the format provided by pdf2json.
 * @param {PDFData} pdfData - The data object obtained from pdf2json, containing page information.
 * @returns {ExtractedRates} An object where keys are currency pairs (e.g., "USD/ZWL") and values are
 * objects containing their corresponding bid, ask, and mid rates in two currencies.
 * @throws {Error} If the structure of the PDF data does not allow for proper extraction,
 * specifically if there's a mismatch between the number of currencies found
 * and the number of rate groups.
 */
export function extractRatesFromPdf(pdfData: PDFData): ExtractedRates {
  console.log("Generating rates from PDF data...");
  const rates: ExtractedRates = {};
  const texts = pdfData.Pages?.[0]?.Texts || [];

  // Regular expressions for filtering and cleaning data nodes from the PDF
  const currencyRegex = /^[A-Z]{3}(%2F[A-Z]+)?$/; // Matches currency codes like "USD" or "EUR%2FGBP"
  const bidAskIgnoreRegex = /\b(?:BID|ASK|ZWG)\b/i; // Ignores text nodes containing "BID", "ASK", or "ZWG" (case-insensitive)
  const whitespaceRegex = /%20/; // Matches URL-encoded whitespace

  // 1. Extract and clean currency names from the text nodes
  const currencies: string[] = texts
    .filter(
      (node: PDFTextNode) =>
        node.R?.[0]?.T && !whitespaceRegex.test(node.R[0].T),
    )
    .map((node: PDFTextNode) => node.R[0].T)
    .filter(
      (text: string) =>
        currencyRegex.test(text) && !bidAskIgnoreRegex.test(text),
    )
    .map((currency: string) => currency.replace("%2F", "/"));

  // 2. Extract and clean numerical rate values from the text nodes
  const ungroupedRates: number[] = texts
    .map((node: PDFTextNode) => {
      const textValue = node.R?.[0]?.T;
      if (textValue) {
        const value = Number(textValue.replace(/%2C/g, ""));
        return value;
      }
      return NaN;
    })
    .filter(
      (item: number) => typeof item === "number" && !isNaN(item) && item !== 0,
    );

  // 3. Group rates based on the number of currencies found
  // This assumes that each currency has a consistent number of associated rate values (e.g., 6 values per currency).
  let groupedRates: number[][] = [];

  // Handle case where no currencies are found to avoid division by zero
  if (currencies.length === 0) {
    throw new Error("No currencies found in the PDF. Unable to extract rates.");
  }

  const ratesPerCurrency: number = ungroupedRates.length / currencies.length;

  // Validate if the rates can be evenly divided among the currencies
  if (!Number.isInteger(ratesPerCurrency) || ratesPerCurrency === 0) {
    throw new Error(
      "Error: Rates per currency are not consistent or no rates found. PDF structure might have changed.",
    );
  }

  // Slice the ungrouped rates into groups, each corresponding to a currency
  for (let i = 0; i < ungroupedRates.length; i += ratesPerCurrency) {
    groupedRates.push(ungroupedRates.slice(i, i + ratesPerCurrency));
  }

  // 4. Validate the number of grouped rates matches the number of currencies and assign them
  if (groupedRates.length !== currencies.length) {
    throw new Error(
      `Error extracting data from PDF: Number of rates groups (${groupedRates.length}) does not match number of currencies (${currencies.length}).`,
    );
  }

  currencies.forEach((currency: string, index: number) => {
    const rateArray: number[] = groupedRates[index];
    if (rateArray.length >= 6) {
      rates[currency] = {
        bid: rateArray[0],
        ask: rateArray[1],
        mid_rate: rateArray[2],
        bid_zwl: rateArray[3],
        ask_zwl: rateArray[4],
        mid_zwl: rateArray[5],
      };
    } else {
      console.warn(
        `Warning: Not enough rate values found for currency: ${currency}. Expected 6, got ${rateArray.length}. Skipping this currency.`,
      );
    }
  });

  return rates;
}
