import { Client } from "pg";
import { env } from "./env.js";

async function checkTableExistence(): Promise<void> {
  const client = new Client({
    host: env.POSTGRES_HOST,
    port: parseInt(env.POSTGRES_PORT),
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
  });

  try {
    await client.connect();
    const res = await client.query<{ table_existence: boolean }>(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'currencies'
            ) AS table_existence;
        `);
    const tableExists = res.rows[0].table_existence;
    console.log(tableExists ? 1 : 0);
  } catch (err: any) {
    console.error(`Error checking table existence: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkTableExistence();
