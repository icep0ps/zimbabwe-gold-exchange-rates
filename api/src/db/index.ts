import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import path from "path";
import pg from "pg";
import { rates } from "./schema.js";

const DATABSE_DIR = path.resolve(path.dirname(process.cwd()), "../../databse/");

dotenv.config({
  path: [
    path.join(DATABSE_DIR, ".env"),
    path.join(DATABSE_DIR, ".env.production"),
  ],
});

export const pool = new pg.Pool({
  ssl: false,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT as string) || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool, { schema: { rates } });
export default db;
