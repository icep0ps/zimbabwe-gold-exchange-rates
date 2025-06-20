import type { PgDatabase } from "drizzle-orm/pg-core";
import type { ExtractedRates } from "../rates/extractRates.js";
import { type NewCurrency, currencies } from "./schema.js";

export async function seedRatesToDatabase(
  db: PgDatabase<any, any, any>,
  rates: ExtractedRates,
  createdAt: string,
): Promise<void> {
  console.log("Attempting to seed extracted rates into the database...");

  const dataToInsert: NewCurrency[] = [];

  for (const currency in rates) {
    if (Object.prototype.hasOwnProperty.call(rates, currency)) {
      const rateValues = rates[currency];

      const newRate: NewCurrency = {
        currency: currency,
        bid: rateValues.bid.toString(),
        ask: rateValues.ask.toString(),
        mid_rate: rateValues.mid_rate.toString(),
        bid_rate_zwg: rateValues.bid_zwl.toString(),
        ask_rate_zwg: rateValues.ask_zwl.toString(),
        mid_rate_zwg: rateValues.mid_zwl.toString(),
        created_at: createdAt,
      };
      dataToInsert.push(newRate);
    }
  }

  if (dataToInsert.length === 0) {
    console.log("No rates to seed. Skipping database insertion.");
    return;
  }

  try {
    await db.insert(currencies).values(dataToInsert);
    console.log(
      `Successfully seeded ${dataToInsert.length} currency rates into the database.`,
    );
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred during database seeding";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(`Error seeding rates to database: ${errorMessage}`);
  }
}
