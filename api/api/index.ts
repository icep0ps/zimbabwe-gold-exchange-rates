import { handle } from "hono/vercel";
import { app } from "../src/index.js";

export const config = { runtime: "nodejs" };
export default handle(app);
