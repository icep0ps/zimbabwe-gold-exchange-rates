import {
  date,
  decimal,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";

export const currencies = pgTable(
  "currencies",
  {
    currency: varchar("currency", { length: 255 }).notNull(),
    bid: decimal("bid").notNull(),
    ask: decimal("ask").notNull(),
    mid_rate: decimal("mid_rate").notNull(),
    bid_rate_zwg: decimal("bid_rate_zwg").notNull(),
    ask_rate_zwg: decimal("ask_rate_zwg").notNull(),
    mid_rate_zwg: decimal("mid_rate_zwg").notNull(),
    created_at: date("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => {
    return [
      {
        currencyCreatedAtPK: primaryKey({
          columns: [table.currency, table.created_at],
        }),
      },
    ];
  },
);

export type NewCurrency = typeof currencies.$inferInsert;
