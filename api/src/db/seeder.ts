import { desc, eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { SuccessExtractionResponse } from "../scripts/get-latest-rate-script.js";
import { scriptLogger } from "../utils.js";
import { type NewRate, rates as ratesTable, type Rate } from "./schema.js";

type RateDataWithoutId = Omit<NewRate, "id">;

/**
 * Transforms the raw extracted rate data into a flattened array ready for insertion.
 *
 * @param data - The raw extracted rate data.
 * @returns A flattened array of rates ready for processing.
 */
function flattenExtractedRates(
  data: Omit<SuccessExtractionResponse, "success">[],
): RateDataWithoutId[] {
  const dataToInsert: RateDataWithoutId[] = [];

  data.forEach((rate) => {
    const rates = rate.data;

    for (const currency in rates) {
      if (Object.prototype.hasOwnProperty.call(rates, currency)) {
        const rateValues = rates[currency];

        const newRate: RateDataWithoutId = {
          currency: currency,
          bid: rateValues.bid.toString(),
          ask: rateValues.ask.toString(),
          mid_rate: rateValues.mid_rate.toString(),
          bid_rate_zwg: rateValues.bid_zwl.toString(),
          ask_rate_zwg: rateValues.ask_zwl.toString(),
          mid_rate_zwg: rateValues.mid_zwl.toString(),
          created_at: rateValues.created_at.toString(),
          previous_rate: null, // Initialized to null, will be set later
        };

        dataToInsert.push(newRate);
      }
    }
  });

  return dataToInsert;
}

/**
 * Seeds the extracted currency rates into the database, handling the 'previous_rate' relationship.
 *
 * @param db - The Drizzle database instance.
 * @param data - The extracted rate data to be seeded.
 * @returns A promise that resolves when the seeding is complete.
 * @throws {Error} If any error occurs during database interaction or seeding.
 */
export async function seedRatesToDatabase(
  db: PgDatabase<any, any, any>,
  data: Omit<SuccessExtractionResponse, "success">[],
): Promise<void> {
  scriptLogger.info("Starting database seeding for extracted rates");

  const ratesToProcess = flattenExtractedRates(data);

  if (ratesToProcess.length === 0) {
    scriptLogger.error("No rates to seed. Skipping database insertion.");
    return;
  }

  try {
    const insertedRates = await db
      .insert(ratesTable)
      .values(ratesToProcess)
      .returning();

    scriptLogger.info(
      `Inserted ${insertedRates.length} new rates. Starting relationship linking.`,
    );

    const insertedRatesByCurrency: Record<string, Rate[]> = {};
    for (const rate of insertedRates) {
      const currency = rate.currency;
      if (!insertedRatesByCurrency[currency]) {
        insertedRatesByCurrency[currency] = [];
      }
      insertedRatesByCurrency[currency].push(rate);
    }

    for (const currency in insertedRatesByCurrency) {
      insertedRatesByCurrency[currency].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateA.getTime() - dateB.getTime();
      });

      const currencyRates = insertedRatesByCurrency[currency];

      const [lastExistingRate] = await db
        .select()
        .from(ratesTable)
        .where(eq(ratesTable.currency, currency))
        .orderBy(desc(ratesTable.created_at), desc(ratesTable.id))
        .limit(1);

      let previousRateId: number | null = lastExistingRate?.id ?? null;
      let updates = [];

      for (const currentRate of currencyRates) {
        if (previousRateId !== null && currentRate.id !== previousRateId) {
          updates.push(
            db
              .update(ratesTable)
              .set({ previous_rate: previousRateId })
              .where(eq(ratesTable.id, currentRate.id)),
          );
        }
        previousRateId = currentRate.id;
      }

      if (updates.length > 0) {
        await db.transaction(async () => {
          await Promise.all(updates);
        });
        scriptLogger.info(
          `Successfully linked ${updates.length} previous rates for ${currency}.`,
        );
      }
    }

    scriptLogger.info(
      `Successfully seeded and linked ${insertedRates.length} currency rates into the database.`,
    );
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred during database seeding";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(`Error seeding rates to database: ${errorMessage}`);
  }
}
