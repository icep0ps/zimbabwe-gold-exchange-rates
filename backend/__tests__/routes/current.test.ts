import { expect, test, describe } from "vitest";
import { app } from "../../src/index.ts";

const BASE_URL = "/api/v1/rates";

describe("Routes reponsed with 200", () => {
  test("GET /posts", async () => {
    const res = await app.request(BASE_URL + "/current");
    expect(res.status).toBe(200);
  });
});
