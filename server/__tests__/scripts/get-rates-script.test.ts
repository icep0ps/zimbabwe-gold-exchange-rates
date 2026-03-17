import { assert, describe, expect, test, vi } from "vitest";
import { runRateExtractionProcess } from "../../src/scripts/get-latest-rate-script.ts";
import { runBatchRateExtractionProcess } from "../../src/scripts/get-rates-script.ts";
import { getDaysBetweenDates } from "../../src/utils.ts";

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
  const startDate = new Date("2024-12-05");
  const endDate = new Date("2024-12-10");

  vi.mock("../../src/scripts/get-latest-rate-script.ts", { spy: true });

  const results = await runBatchRateExtractionProcess(
    startDate,
    endDate,
    runRateExtractionProcess,
  );

  test("return array of data that is not empty", async () => {
    assert.isNotEmpty(results);
  });

  test("return array with the same number of items as the date ranges", async () => {
    expect(results.length).toBe(getDaysBetweenDates(startDate, endDate));
  });

  test("Gets called the same number of times as the date ranges", async () => {
    expect(runRateExtractionProcess).toHaveBeenCalledTimes(
      getDaysBetweenDates(startDate, endDate),
    );
  });

  test("Each call is called with the correct target date", async () => {
    expect(runRateExtractionProcess).toHaveBeenNthCalledWith(
      1,
      new Date("2024-12-05"),
    );
    expect(runRateExtractionProcess).toHaveBeenLastCalledWith(
      new Date("2024-12-10"),
    );
  });
});
