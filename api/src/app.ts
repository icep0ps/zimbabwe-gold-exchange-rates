import { Hono } from "hono";
import { cors } from "hono/cors";
import { currenciesRoute } from "./routes/currencies.js";
import { notifactionsRoute } from "./routes/notifications.js";
import { ratesRoute } from "./routes/rates.js";

export const app = new Hono();

app.use(async (c, next) => {
  const start = performance.now();
  await next();
  const duration = `${(performance.now() - start).toFixed(2)} ms`;

  if (c.res.status === 404) {
    return c.json(
      {
        success: false,
        message:
          "No rates found for the specified criteria, even after checking historical data.",
      },
      404,
    );
  }

  console.log(
    `[${c.res.status}] ${c.req.method} ${c.req.path} - ${duration}`,
  );
});

app.onError((err, c) => {
  console.error(`[Error] ${c.req.method} ${c.req.path} - ${err.message}`);
  return c.json(
    {
      success: false,
      message: "An internal server error occurred.",
    },
    500,
  );
});

app.use(cors());
app.route("/api/v1/rates", ratesRoute);
app.route("/api/v1/currencies", currenciesRoute);
app.route("/notifications", notifactionsRoute);
