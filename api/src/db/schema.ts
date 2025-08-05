import { relations } from "drizzle-orm";
import {
  date,
  decimal,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const rates = pgTable(
  "rates",
  {
    id: serial("id").primaryKey(),
    currency: varchar("currency", { length: 255 }).notNull(),
    bid: decimal("bid").notNull(),
    ask: decimal("ask").notNull(),
    mid_rate: decimal("mid_rate").notNull(),
    bid_rate_zwg: decimal("bid_rate_zwg").notNull(),
    ask_rate_zwg: decimal("ask_rate_zwg").notNull(),
    mid_rate_zwg: decimal("mid_rate_zwg").notNull(),
    created_at: date("created_at", { mode: "string" }).defaultNow().notNull(),
    previous_rate: integer("previous_rate"),
  },
  (table) => {
    return [unique().on(table.currency, table.created_at)];
  },
);

export const monthlyExchangeRatesURLs = pgTable("monthly_exchange_rates_urls", {
  id: varchar("id").primaryKey().unique(),
  url: text("url").notNull(),
});

export const ratesRelation = relations(rates, ({ one }) => ({
  rate: one(rates, {
    fields: [rates.previous_rate],
    references: [rates.id],
  }),
}));

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  endpoint: text("endpoint").notNull(),
  expirationTime: timestamp("expiration_time", {
    mode: "date",
    withTimezone: false,
  }),
  auth: text("auth").notNull(),
  p256dh: text("p256dh").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export type Rate = typeof rates.$inferSelect;
export type NewRate = typeof rates.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferInsert;
export type NewPushSubscription = typeof pushSubscriptions.$inferSelect;
