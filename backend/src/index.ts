import { serve } from "@hono/node-server";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { Hono } from "hono";
import { logger } from "hono/logger";
import db from "./db/index.js";
import { currencies } from "./db/schema.js";
import { formatDate, getPreviousDateString } from "./utils.js";

const app = new Hono();
app.use(logger());

app.get("/api/v1/rates/current", async (c) => {
  try {
    const { targetCurrency } = c.req.query();
    const upperTargetCurrency = targetCurrency
      ? targetCurrency.toUpperCase()
      : null;

    const todayDateString = formatDate(new Date());

    let ratesToReturn = [];
    let dateUsedForRates = todayDateString;

    const todayRatesCondition = upperTargetCurrency
      ? and(
          eq(currencies.created_at, todayDateString),
          eq(currencies.currency, upperTargetCurrency),
        )
      : eq(currencies.created_at, todayDateString);

    let currentRates = await db
      .select()
      .from(currencies)
      .where(todayRatesCondition);

    if (currentRates.length === 0) {
      const latestDateQueryCondition = upperTargetCurrency
        ? eq(currencies.currency, upperTargetCurrency)
        : undefined;

      const latestRateEntry = await db
        .select({ created_at: currencies.created_at })
        .from(currencies)
        .where(latestDateQueryCondition)
        .orderBy(desc(currencies.created_at))
        .limit(1);

      if (latestRateEntry.length > 0) {
        dateUsedForRates = latestRateEntry[0].created_at;

        const fallbackRatesCondition = upperTargetCurrency
          ? and(
              eq(currencies.created_at, dateUsedForRates),
              eq(currencies.currency, upperTargetCurrency),
            )
          : eq(currencies.created_at, dateUsedForRates);

        currentRates = await db
          .select()
          .from(currencies)
          .where(fallbackRatesCondition);
      }
    }

    if (currentRates.length === 0) {
      return c.json(
        {
          success: false,
          message:
            "No rates found for the specified criteria, even after checking historical data.",
          timestamp: new Date().toISOString(),
        },
        404,
      );
    }

    ratesToReturn = currentRates;

    const previousDateStringForComparison =
      getPreviousDateString(dateUsedForRates);

    const previousRatesWhereCondition = upperTargetCurrency
      ? and(
          eq(currencies.created_at, previousDateStringForComparison),
          eq(currencies.currency, upperTargetCurrency),
        )
      : eq(currencies.created_at, previousDateStringForComparison);

    const previousRatesRaw = await db
      .select()
      .from(currencies)
      .where(previousRatesWhereCondition);

    const previousRatesMap = new Map();
    previousRatesRaw.forEach((rate) => {
      previousRatesMap.set(rate.currency, rate);
    });

    const combinedRates = ratesToReturn.map((currentRate) => {
      const previousRate = previousRatesMap.get(currentRate.currency);
      return {
        ...currentRate,
        previous_rate: previousRate || null,
      };
    });

    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: combinedRates,
      is_fallback: dateUsedForRates !== todayDateString,
    });
  } catch (error) {
    console.error("Error fetching current rates:", error);
    return c.json(
      {
        success: false,
        message: "An internal server error occurred.",
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});

app.get("/api/v1/rates/historical/:targetCurrency", async (c) => {
  try {
    const targetCurrency = c.req.param("targetCurrency").toUpperCase();
    const { startDate, endDate } = c.req.query();

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate) {
      if (!dateRegex.test(startDate)) {
        return c.json(
          {
            success: false,
            message:
              "Invalid date format for 'startDate'. Expected YYYY-MM-DD.",
            timestamp: new Date().toISOString(),
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
            timestamp: new Date().toISOString(),
          },
          400,
        );
      }
    }

    const historicalRates = await db
      .select()
      .from(currencies)
      .where(
        and(
          eq(currencies.currency, targetCurrency),
          startDate ? gte(currencies.created_at, startDate) : undefined,
          endDate ? lte(currencies.created_at, endDate) : undefined,
        ),
      )
      .orderBy(currencies.created_at);

    if (historicalRates.length === 0) {
      return c.json(
        {
          success: false,
          message: `No historical rates found for ${targetCurrency}`,
          timestamp: new Date().toISOString(),
        },
        404,
      );
    }

    const uniqueDates = historicalRates.map((rate) => rate.created_at);
    const previousDateStringsToQuery = new Set<string>();

    uniqueDates.forEach((dateString) => {
      previousDateStringsToQuery.add(getPreviousDateString(dateString));
    });

    const allPreviousRatesRaw = await db
      .select()
      .from(currencies)
      .where(
        and(
          eq(currencies.currency, targetCurrency),

          previousDateStringsToQuery.size > 0
            ? inArray(
                currencies.created_at,
                Array.from(previousDateStringsToQuery),
              )
            : undefined,
        ),
      );

    const previousRatesMap = new Map();
    allPreviousRatesRaw.forEach((rate) => {
      previousRatesMap.set(rate.created_at, rate);
    });

    const combinedHistoricalRates = historicalRates.map(
      (currentHistoricalRate) => {
        const currentRateDate = currentHistoricalRate.created_at;
        const previousDayDate = getPreviousDateString(currentRateDate);
        const previousRate = previousRatesMap.get(previousDayDate);

        return {
          ...currentHistoricalRate,
          previous_rate: previousRate || null,
        };
      },
    );

    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: combinedHistoricalRates,
    });
  } catch (error) {
    console.error("Error fetching historical rates:", error);
    return c.json(
      {
        success: false,
        message:
          "An internal server error occurred while fetching historical rates.",
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});

app.get("/api/v1/currencies", async (c) => {
  try {
    const allCurrencies = await db
      .selectDistinct({ name: currencies.currency })
      .from(currencies);

    return c.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        data: allCurrencies,
      },
      200,
    );
  } catch (error) {
    console.error("Error fetching currencies rates:", error);
    return c.json(
      {
        success: false,
        message:
          "An internal server error occurred while fetching historical rates.",
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
