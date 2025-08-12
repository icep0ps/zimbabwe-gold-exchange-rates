import { desc, eq } from "drizzle-orm";
import webpush, {
  type PushSubscription as WebPushSubscription,
} from "web-push";
import db from "../db/index.js";
import { pushSubscriptions, rates } from "../db/schema.js";

export default async function sendPushNotifications() {
  const latestUsdRate = await db.query.rates.findFirst({
    where: eq(rates.currency, "USD"),
    orderBy: [desc(rates.created_at)],
  });

  if (!latestUsdRate) {
    console.log("No USD rate found in the database.");
    return;
  }

  const payload = JSON.stringify({
    title: "USD to ZWG Rate Updated",
    body: `Official rate: 1 USD = ${latestUsdRate.mid_rate_zwg} ZWG`,
  });

  const subscriptions = await db.select().from(pushSubscriptions);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const subscription: WebPushSubscription = {
        endpoint: sub.endpoint,
        expirationTime: sub.expirationTime
          ? sub.expirationTime.getTime()
          : null,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      };

      try {
        await webpush.sendNotification(subscription, payload);
        return { success: true };
      } catch (error: any) {
        console.error("Push error:", error);

        if (error.statusCode === 410 || error.statusCode === 404) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, sub.endpoint));
          console.log("Removed invalid subscription:", sub.endpoint);
        }

        return { success: false, error };
      }
    }),
  );

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const failCount = results.filter((r) => r.status === "rejected").length;

  console.log(`Push complete: ${successCount} sent, ${failCount} failed`);
}
