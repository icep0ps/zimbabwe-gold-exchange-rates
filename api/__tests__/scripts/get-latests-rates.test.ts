import { describe, expect, test, assert } from "vitest";
import {
  runRateExtractionProcess,
  SuccessExtractionResponse,
} from "../../src/scripts/get-latest-rate-script.ts";

/**
 *
 * WARN: When testing use dates from December 2024 only! Especially if you are testing
 * getting the range of rates at once e.g getting all rates from
 * the last 30 days. This is because I have supplied daily rates from November - January
 * for testing (unless you add other months which I would not encourage).
 *
 * */

describe("runRateExtractionProcess", async () => {
  const startDate = new Date(2024, 11, 5);

  const result = (await runRateExtractionProcess(
    startDate,
  )) as SuccessExtractionResponse;

  test("Returns successfull extraction", async () => {
    expect(result.success).toBeTruthy();
  });

  test("Returns data that is not empty", async () => {
    assert.isNotEmpty(result.data);
  });

  test("Returns created at date that matches the startDate", async () => {
    const year = startDate.getFullYear();
    const month = (startDate.getMonth() + 1).toString().padStart(2, "0");
    const day = startDate.getDate().toString().padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    expect(result.data["USD"].created_at).toEqual(formattedDate);
    expect(result.data["USD"].created_at).not.toEqual("2025-12-11");
  });
});
