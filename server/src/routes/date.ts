import { and, eq, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Hono } from "hono";
import db from "../db/index.js";
import { rates } from "../db/schema.js";

export const dateRoute = new Hono();

dateRoute.get("/:date", async (c) => {
  const previousRate = alias(rates, "previous_rate");
  const date = c.req.param("date");
  const { targetCurrency } = c.req.query();
  const upperTargetCurrency = targetCurrency
    ? targetCurrency.toUpperCase()
    : null;

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json(
      {
        success: false,
        message: "Invalid date format. Expected YYYY-MM-DD.",
      },
      400,
    );
  }

  const queryCondition = upperTargetCurrency
    ? and(
        eq(rates.created_at, date),
        eq(rates.currency, upperTargetCurrency),
      )
    : eq(rates.created_at, date);

  const dailyRates = await db
    .select({ ...getTableColumns(rates), previous_rate: previousRate })
    .from(rates)
    .where(queryCondition)
    .leftJoin(previousRate, eq(previousRate.id, rates.previous_rate));

  if (dailyRates.length === 0) {
    return c.notFound();
  }

  return c.json({
    success: true,
    data: dailyRates,
  });
});
