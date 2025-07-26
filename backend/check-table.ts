import { Client } from "pg";
import { process.env } from "./process.env.js";

async function checkTableExistence(): Promise<void> {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });

  try {
    await client.connect();
    const res = await client.query<{ table_existence: boolean }>(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'rates'
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
