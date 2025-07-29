import { and, desc, eq, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Hono } from "hono";
import db from "../db/index.js";
import { rates } from "../db/schema.js";
import { formatDate } from "../utils.js";

export const currentRoute = new Hono();

currentRoute.get("/", async (c) => {
  const previousRate = alias(rates, "previous_rate");
  const { targetCurrency } = c.req.query();
  const upperTargetCurrency = targetCurrency
    ? targetCurrency.toUpperCase()
    : null;

  const todayDateString = formatDate(new Date());

  let dateUsedForRates = todayDateString;

  const todayRatesCondition = upperTargetCurrency
    ? and(
        eq(rates.created_at, todayDateString),
        eq(rates.currency, upperTargetCurrency),
      )
    : eq(rates.created_at, todayDateString);

  let currentRates = await db
    .select({ ...getTableColumns(rates), previous_rate: previousRate })
    .from(rates)
    .where(todayRatesCondition)
    .leftJoin(previousRate, eq(previousRate.id, rates.previous_rate));

  if (currentRates.length === 0) {
    const latestDateQueryCondition = upperTargetCurrency
      ? eq(rates.currency, upperTargetCurrency)
      : undefined;

    const latestRateEntry = await db
      .select({ created_at: rates.created_at })
      .from(rates)
      .where(latestDateQueryCondition)
      .orderBy(desc(rates.created_at))
      .limit(1);

    if (latestRateEntry.length > 0) {
      dateUsedForRates = latestRateEntry[0].created_at;

      const fallbackRatesCondition = upperTargetCurrency
        ? and(
            eq(rates.created_at, dateUsedForRates),
            eq(rates.currency, upperTargetCurrency),
          )
        : eq(rates.created_at, dateUsedForRates);

      currentRates = await db
        .select({ ...getTableColumns(rates), previous_rate: previousRate })
        .from(rates)
        .where(fallbackRatesCondition)
        .leftJoin(previousRate, eq(previousRate.id, rates.previous_rate));
    }
  }

  if (currentRates.length === 0) {
    return c.notFound();
  }

  return c.json({
    success: true,
    data: currentRates,
    is_fallback: dateUsedForRates !== todayDateString,
  });
});
