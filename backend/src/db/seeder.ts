import { and, desc, eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { SuccessExtractionResponse } from "../scripts/get-latest-rate-script.js";
import { getPreviousDateString, scriptLogger } from "../utils.js";
import { type NewRate, rates as ratesTable } from "./schema.js";

export async function seedRatesToDatabase(
  db: PgDatabase<any, any, any>,
  data: Omit<SuccessExtractionResponse, "success">[],
): Promise<void> {
  scriptLogger.info("Starting database seeding for extracted rates");

  const dataToInsert = await addIdsOnRates(data, db);

  if (!dataToInsert || dataToInsert.length === 0) {
    scriptLogger.error("No rates to seed. Skipping database insertion.");
    return;
  }

  try {
    const oldestRate = dataToInsert[0];
    const dateBeforeOldestRate = getPreviousDateString(
      oldestRate.created_at as string,
    );

    const [oldestRatesPreviousRate] = await db
      .select()
      .from(ratesTable)
      .where(
        and(
          eq(ratesTable.currency, oldestRate.currency),
          eq(ratesTable.created_at, dateBeforeOldestRate),
        ),
      )
      .limit(1);

    const dataToInsertWithPrevousRates: NewRate[] = [];

    scriptLogger.info("Adding previous rates");
    dataToInsert.reduce((previousRate, currentRate) => {
      const rateWithId = {
        ...currentRate,
        previous_rate: previousRate?.id ?? null,
      };

      dataToInsertWithPrevousRates.push(rateWithId);
      return rateWithId;
    }, oldestRatesPreviousRate);

    await db.insert(ratesTable).values(dataToInsertWithPrevousRates);
    scriptLogger.info(
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

async function addIdsOnRates(
  rates: Omit<SuccessExtractionResponse, "success">[],
  db: PgDatabase<any, any, any>,
) {
  scriptLogger.info("Adding ID's to extracted rates");
  const dataToInsert: Omit<NewRate, "previous_rate">[] = [];
  try {
    const [lastestRate] = await db
      .select()
      .from(ratesTable)
      .orderBy(desc(ratesTable.id))
      .limit(1);

    let lastestRateId = lastestRate?.id ?? 1;

    rates.forEach((rate) => {
      const rates = rate.data;

      for (const currency in rates) {
        if (Object.prototype.hasOwnProperty.call(rates, currency)) {
          const rateValues = rates[currency];

          const newRate = {
            id: lastestRateId++,
            currency: currency,
            bid: rateValues.bid.toString(),
            ask: rateValues.ask.toString(),
            mid_rate: rateValues.mid_rate.toString(),
            bid_rate_zwg: rateValues.bid_zwl.toString(),
            ask_rate_zwg: rateValues.ask_zwl.toString(),
            mid_rate_zwg: rateValues.mid_zwl.toString(),
            created_at: rateValues.created_at.toString(),
          };

          dataToInsert.push(newRate);
        }
      }
    });

    scriptLogger.info("Successfully added ID's");
    return dataToInsert;
  } catch (error) {
    scriptLogger.error("something went wrong while trying to add id's");
  }
}
