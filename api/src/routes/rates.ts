import { Hono } from "hono";
import { latestRoute } from "./latest.js";
import { dateRoute } from "./date.js";
import { historicalRoute } from "./historical.js";

export const ratesRoute = new Hono();

ratesRoute.route("/latest", latestRoute);
ratesRoute.route("/", dateRoute); // Mounts /:date
ratesRoute.route("/historical", historicalRoute);