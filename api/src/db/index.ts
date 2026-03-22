import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { rates } from "./schema.js";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { rates } });
export default db;
