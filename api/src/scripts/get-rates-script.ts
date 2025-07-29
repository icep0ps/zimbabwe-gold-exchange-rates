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
  const NUBER_OF_DAYS_TO_ADD = getDaysBetweenDates(startDate, endDate);

  for (let i = 0; i <= NUBER_OF_DAYS_TO_ADD; i++) {
    const startDateCopy = new Date(startDate);
    if (i > 0) {
      startDateCopy.setDate(startDate.getDate() + i);
    }
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
