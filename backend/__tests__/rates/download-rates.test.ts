import { expect, test, describe, assert, vi } from "vitest";
import {
  getDailyRatePdfDownloadURL,
  getMonthPageURL,
} from "../../src/rates/download-rates.ts";

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

describe("getMonthPageURL", () => {
  test("retruns string", async () => {
    const url = await getMonthPageURL(2, 2017);
    assert.isString(url);
  });

  test("retruns url", async () => {
    const url = await getMonthPageURL(2, 2017);
    assert.match(url, URL_REGEX, "getMonthPageURL should return a url");
  });

  test("returned url includes year", async () => {
    const year = 2017;
    const url = await getMonthPageURL(2, year);
    expect(url).toEqual(expect.stringContaining(year.toString()));
  });

  test("returned url includes month", async () => {
    const month = "february";
    const url = await getMonthPageURL(2, 2017);
    expect(url).toEqual(expect.stringContaining(month));
  });
});

describe("getDailyRatePdfDownloadURL", () => {
  test("returned url includes day", async () => {
    const day = 10;
    const url = await getDailyRatePdfDownloadURL(
      "https://www.rbz.co.zw/index.php/research/markets/exchange-rates/13-daily-exchange-rates/266-february-2017",
      day,
    );
    expect(url).toEqual(expect.stringContaining(day.toString()));
  });

  test("returns url", async () => {
    const url = await getDailyRatePdfDownloadURL(
      "https://www.rbz.co.zw/index.php/research/markets/exchange-rates/13-daily-exchange-rates/266-february-2017",
      10,
    );
    assert.match(url, URL_REGEX, "getMonthPageURL should return a url");
  });

  test("returns string", async () => {
    const url = await getDailyRatePdfDownloadURL(
      "https://www.rbz.co.zw/index.php/research/markets/exchange-rates/13-daily-exchange-rates/266-february-2017",
      10,
    );
    assert.isString(url);
  });

  test("return PDF URL", async () => {
    const url = await getDailyRatePdfDownloadURL(
      "https://www.rbz.co.zw/index.php/research/markets/exchange-rates/13-daily-exchange-rates/266-february-2017",
      10,
    );
    expect(url).toEqual(expect.stringContaining(".pdf"));
  });
});
