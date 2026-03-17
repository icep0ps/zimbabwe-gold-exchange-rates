import { Hono } from "hono";
import db from "../db/index.js";
import { pushSubscriptions } from "../db/schema.js";

export const notifactionsRoute = new Hono();

notifactionsRoute.post("/subscribe", async (c) => {
  const sub = await c.req.json();

  await db.insert(pushSubscriptions).values({
    endpoint: sub.endpoint,
    expirationTime: sub.expirationTime,
    auth: sub.keys.auth,
    p256dh: sub.keys.p256dh,
  });

  c.status(201);
  return c.text("Successfully Subscribed to notifactions");
});
