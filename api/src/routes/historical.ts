import { and, desc, eq, getTableColumns, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Hono } from "hono";
import db from "../db/index.js";
import { rates } from "../db/schema.js";
import { formatDate, getDaysBetweenDates } from "../date-utils.js";

export const historicalRoute = new Hono();

historicalRoute.get("/:targetCurrency", async (c) => {
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

  const fetchRange = (start?: string, end?: string) =>
    db
      .select({ ...getTableColumns(rates), previous_rate: previousRate })
      .from(rates)
      .where(
        and(
          eq(rates.currency, targetCurrency),
          start ? gte(rates.created_at, start) : undefined,
          end ? lte(rates.created_at, end) : undefined,
        ),
      )
      .leftJoin(previousRate, eq(previousRate.id, rates.id))
      .orderBy(rates.created_at);

  let historicalRates = await fetchRange(startDate, endDate);
  let isFallback = false;

  // If ingestion has lagged (e.g. the scraper stopped running) the requested
  // window can legitimately have no rows even though older data exists.
  // Fall back to the same window length anchored to the most recently
  // inserted rate instead of surfacing that as a hard error.
  if (historicalRates.length === 0 && startDate) {
    const latestEntry = await db
      .select({ created_at: rates.created_at })
      .from(rates)
      .where(eq(rates.currency, targetCurrency))
      .orderBy(desc(rates.created_at))
      .limit(1);

    if (latestEntry.length > 0) {
      const latestDate = latestEntry[0].created_at;
      const spanDays = getDaysBetweenDates(
        new Date(startDate),
        new Date(endDate ?? formatDate(new Date())),
      );

      const fallbackEnd = latestDate;
      const fallbackStartDate = new Date(latestDate);
      fallbackStartDate.setDate(fallbackStartDate.getDate() - spanDays);
      const fallbackStart = formatDate(fallbackStartDate);

      historicalRates = await fetchRange(fallbackStart, fallbackEnd);
      isFallback = historicalRates.length > 0;
    }
  }

  if (historicalRates.length === 0) {
    return c.notFound();
  }

  return c.json({
    success: true,
    data: historicalRates,
    is_fallback: isFallback,
  });
});
