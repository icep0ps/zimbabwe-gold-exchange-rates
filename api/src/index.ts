import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import webpush from "web-push";
import { currenciesRoute } from "./routes/currencies.js";
import { notifactionsRoute } from "./routes/notifications.js";
import { ratesRoute } from "./routes/rates.js";
import { logger } from "./utils.js";

export const app = new Hono();

webpush.setVapidDetails(
  "mailto:icep0ps@gmail.com",
  process.env.PUBLIC_PUSH_NOTIFICATION_VAPID_KEY as string,
  process.env.PRIVATE_PUSH_NOTIFICATION_VAPID_KEY as string,
);

app.use(async (c, next) => {
  const start = performance.now();
  await next();
  const end = performance.now();

  const duration = `${(end - start).toFixed(2)} ms`;

  const log = {
    method: c.req.method,
    path: c.req.path,
    request: {
      headers: {
        "content-type": c.req.header("content-type") ?? "N/A",
        "user-agent": c.req.header("user-agent") ?? "N/A",
        host: c.req.header("Host"),
      },
      queryParams: c.req.query(),
    },
    response: {
      headers: {
        "content-type": c.res.headers.get("content-type") ?? "N/A",
      },
      status: c.res.status,
      body: c.res.body,
    },
    duration,
  };

  if (c.res.status == 404) {
    logger.warn(
      `[Client Error] ${c.req.method} ${c.req.path} - Status: ${c.res.status} - ${duration}`,
      log,
    );
    return c.json(
      {
        success: false,
        message:
          "No rates found for the specified criteria, even after checking historical data.",
      },
      404,
    );
  } else {
    logger.info(
      `[OK] ${c.req.method} ${c.req.path} - Status: ${c.res.status} - ${duration}`,
      log,
    );
  }
});

app.onError((err, c) => {
  const log = {
    method: c.req.method,
    path: c.req.path,
    request: {
      headers: {
        "content-type": c.req.header("content-type") ?? "N/A",
        "user-agent": c.req.header("user-agent") ?? "N/A",
        host: c.req.header("Host"),
      },
      queryParams: c.req.query(),
    },
    response: {
      status: 500,
    },
    error: err,
  };

  logger.error(
    `[Server Error] ${c.req.method} ${c.req.path} - ${err.message}`,
    log,
  );

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

serve(
  {
    fetch: app.fetch,
    port: process.env.NODE_ENV === "test" ? 3333 : 3001,
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}`);
  },
);
