import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { logger } from "./utils.js";

export { app };

serve(
  {
    fetch: app.fetch,
    port: process.env.NODE_ENV === "test" ? 3333 : 3001,
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}`);
  },
);
