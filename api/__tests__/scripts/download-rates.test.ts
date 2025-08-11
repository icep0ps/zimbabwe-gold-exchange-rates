import * as cheerio from "cheerio";
import fs from "fs";
import { assert, describe, expect, test } from "vitest";
import {
  getDailyRatePdfDownloadURL,
  getDailyRatePdfDownloadURLFromHTML,
  getMonthPageURL,
} from "../../src/scripts/download-rates.ts";

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

describe("getDailyRatePdfDownloadURLFromHTML", () => {
  const buffer = fs.readFileSync(
    `${process.cwd()}/__tests__/scripts/pages/missing-daily-exchange-rates.html`,
  );

  test("to return a string if tartgetDay is 8", () => {
    const $ = cheerio.loadBuffer(buffer);
    const foundPdfUrl: string | undefined = getDailyRatePdfDownloadURLFromHTML(
      $,
      8,
    );

    assert.isString(foundPdfUrl);
  }, 5000);

  test("to return a undefined if tartgetDay is 24", () => {
    const $ = cheerio.loadBuffer(buffer);
    const foundPdfUrl: string | undefined = getDailyRatePdfDownloadURLFromHTML(
      $,
      24,
    );

    assert.isUndefined(foundPdfUrl);
  }, 5000);

  test("to return a string if tartgetDay is 18", () => {
    const $ = cheerio.loadBuffer(buffer);
    const foundPdfUrl: string | undefined = getDailyRatePdfDownloadURLFromHTML(
      $,
      18,
    );

    assert.isString(foundPdfUrl);
  }, 5000);
});

describe("getMonthPageURL", () => {
  describe("from 2017", async () => {
    const year = 2017;
    const monthNumber = 2;
    const url = await getMonthPageURL(monthNumber, year);

    test("retruns string", async () => {
      assert.isString(url);
    });

    test("retruns url", async () => {
      assert.match(url, URL_REGEX, "getMonthPageURL should return a url");
    });

    test("returned url includes year", async () => {
      expect(url).toEqual(expect.stringContaining(year.toString()));
    });

    test("returned url includes month", async () => {
      const month = "february";
      expect(url).toEqual(expect.stringContaining(month));
    });
  });

  describe("from 2025", async () => {
    const year = 2025;
    const monthNumber = 2;
    const url = await getMonthPageURL(monthNumber, year);

    test("retruns string", async () => {
      assert.isString(url);
    });

    test("retruns url", async () => {
      assert.match(url, URL_REGEX, "getMonthPageURL should return a url");
    });

    test("returned url includes year", async () => {
      expect(url).toEqual(expect.stringContaining(year.toString()));
    });

    test("returned url includes month", async () => {
      const month = "february";
      expect(url).toEqual(expect.stringContaining(month));
    });
  });
});

describe("getDailyRatePdfDownloadURL", () => {
  test("returns exact url", async () => {
    const day = 10;
    const url = await getDailyRatePdfDownloadURL(
      "https://www.rbz.co.zw/index.php/research/markets/exchange-rates/13-daily-exchange-rates/266-february-2017",
      day,
    );
    expect(url).toEqual(
      "https://www.rbz.co.zw/documents/Exchange_Rates/2024/December/RATES_10_DECEMBER_2024.pdf",
    );
  });

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
