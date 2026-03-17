import { getDaysBetweenDates, logger } from "../utils.js";
import { runRateExtractionProcess } from "./get-latest-rate-script.js";

/**
 * Used to get a batch of rates from RBZ and seeds them to the database
 * @param startDate
 * @param endDate
 * @param cb
 */

export async function runBatchRateExtractionProcess(
  startDate: Date,
  endDate: Date = new Date(),
  cb: typeof runRateExtractionProcess = runRateExtractionProcess,
) {
  const dates: Date[] = [];
  const results: Awaited<ReturnType<typeof runRateExtractionProcess>>[] = [];

  /*
  NOTE: Be careful with time zones and time-of-day differences.

  If startDate and endDate are not normalized to midnight (00:00:00),
  the day count calculation can be off by 1. For example, a start date
  at 00:00 and an end date at 12:00 may yield one less day when using
  Math.floor, because the partial final day is truncated.

  To avoid this, reset both dates to midnight with:
    setHours(0, 0, 0, 0)
  before computing the difference.
*/

  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(0, 0, 0, 0);

  const NUBER_OF_DAYS_TO_ADD = getDaysBetweenDates(startDate, endDate) + 1;

  for (let i = 0; i < NUBER_OF_DAYS_TO_ADD; i++) {
    const startDateCopy = new Date(startDate);
    startDateCopy.setUTCDate(startDate.getUTCDate() + i);
    dates.push(startDateCopy);
  }

  const starterPromise = Promise.resolve<ReturnType<
    typeof runRateExtractionProcess
  > | null>(null);
  await dates.reduce(
    (p, c) =>
      p.then((res) => {
        if (res) {
          results.push(res);
        }

        return cb(c);
      }),
    starterPromise,
  );
  return results;
}
