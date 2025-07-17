import { describe, expect, test, vi } from "vitest";
import {
  getDailyRatePdfDownloadURL,
  getMonthPageURL,
} from "../../src/rates/download-rates";
import { runBatchRateExtractionProcess } from "../../src/rates/script";

/**
 *
 * WARN: When testing getMonthPageURL and getDailyRatePdfDownloadURL use
 * dates from December 2024 only! Especially if you are testing
 * getting the range of rates at once e.g getting all rates from
 * the last 30 days. This is because I have supplied daily rates from November - January
 * for testing (unless you add other months which I would not encourage).
 *
 * */

describe("runBatchRateExtractionProcess", async () => {
  const startDate = new Date(2024, 11, 5);
  const endDate = new Date(2024, 11, 10);

  await runBatchRateExtractionProcess(
    startDate,
    endDate,
    runRateExtractionProcess,
  );

  const NUMBER_OF_FN_CALLS = runRateExtractionProcess.mock.calls.length;
  test("Each call is called with the correct target date", async () => {
    expect(runRateExtractionProcess.mock.calls[0][0]).toStrictEqual(
      new Date(2024, 11, 5),
    );
    expect(runRateExtractionProcess.mock.calls[1][0]).toStrictEqual(
      new Date(2024, 11, 6),
    );
    expect(runRateExtractionProcess.mock.calls[2][0]).toStrictEqual(
      new Date(2024, 11, 7),
    );
    expect(
      runRateExtractionProcess.mock.calls[NUMBER_OF_FN_CALLS - 1][0],
    ).toStrictEqual(new Date(2024, 11, 10));
  });

  test("Gets called the same number of times as the date ranges", async () => {
    expect(runRateExtractionProcess).toHaveBeenCalledTimes(6);
  });
});

const downloadFile = vi
  .fn()
  .mockImplementation(async (pdfDownloadLink: string) => {
    return await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve("Downloaded: ".concat(pdfDownloadLink));
      }, 3000);
    });
  });

const runRateExtractionProcess = vi
  .fn()
  .mockImplementation(async (targetDate: Date) => {
    const month = targetDate.getMonth() + 1;
    const year = targetDate.getFullYear();
    const day = targetDate.getDate();

    const monthPageUrl: string = await getMonthPageURL(month, year);
    const pdfDownloadLink = await getDailyRatePdfDownloadURL(monthPageUrl, day);
  });
