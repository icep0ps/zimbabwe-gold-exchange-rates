import { Hono } from "hono";
import { currentRoute } from "./current.js";
import { histroricalRoute } from "./historical.js";

export const ratesRoute = new Hono();

ratesRoute.route("/current", currentRoute);
ratesRoute.route("/historical", histroricalRoute);
