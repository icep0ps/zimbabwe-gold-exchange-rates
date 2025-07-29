import { Hono } from "hono";
import db from "../db/index.js";
import { rates } from "../db/schema.js";
import { logger } from "../utils.js";

export const currenciesRoute = new Hono();

currenciesRoute.get("/", async (c) => {
  try {
    const allCurrencies = await db
      .selectDistinct({ name: rates.currency })
      .from(rates);

    return c.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        data: allCurrencies,
      },
      200,
    );
  } catch (error) {
    logger.error("Error fetching current rates:", error);
    return c.json(
      {
        success: false,
        message: "An internal server error occurred.",
      },
      500,
    );
  }
});
