import { describe, expect, test } from "vitest";
import { app } from "../../src/index.ts";
import { formatDate, getDaysBetweenDates } from "../../src/utils.ts";

const ENDPOINT = "/api/v1/rates/historical";

describe.skip("historical/:targetCurrency", async () => {
  const startDate = new Date(2025, 6, 10);
  const searchParams = new URLSearchParams({
    startDate: formatDate(startDate),
  }).toString();

  const res = await app.request(
    ENDPOINT.concat("/USD").concat("?").concat(searchParams),
  );
  const apiResponse = await res.json();

  test("returns success response", async () => {
    expect(apiResponse).toHaveProperty("success");
    expect(apiResponse).toHaveProperty("data");
  });

  test("returns correct number of rates depending on the dates range", async () => {
    expect(apiResponse.data.length).toBe(
      getDaysBetweenDates(startDate, new Date()) - 1,
    );
  });
});
