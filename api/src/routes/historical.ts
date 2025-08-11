import { and, eq, getTableColumns, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Hono } from "hono";
import db from "../db/index.js";
import { rates } from "../db/schema.js";

export const histroricalRoute = new Hono();

histroricalRoute.get("/:targetCurrency", async (c) => {
  const previousRate = alias(rates, "previous_rate");
  const targetCurrency = c.req.param("targetCurrency").toUpperCase();
  const { startDate, endDate } = c.req.query();

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (startDate) {
    if (!dateRegex.test(startDate)) {
      return c.json(
        {
          success: false,
          message: "Invalid date format for 'startDate'. Expected YYYY-MM-DD.",
        },
        400,
      );
    }
  }

  if (endDate) {
    if (!dateRegex.test(endDate)) {
      return c.json(
        {
          success: false,
          message: "Invalid date format for 'endDate'. Expected YYYY-MM-DD.",
        },
        400,
      );
    }
  }

  const historicalRates = await db
    .select({ ...getTableColumns(rates), previous_rate: previousRate })
    .from(rates)
    .where(
      and(
        eq(rates.currency, targetCurrency),
        startDate ? gte(rates.created_at, startDate) : undefined,
        endDate ? lte(rates.created_at, endDate) : undefined,
      ),
    )
    .leftJoin(previousRate, eq(previousRate.id, rates.id))
    .orderBy(rates.created_at);

  if (historicalRates.length === 0) {
    return c.notFound();
  }

  return c.json({
    success: true,
    data: historicalRates,
  });
});
