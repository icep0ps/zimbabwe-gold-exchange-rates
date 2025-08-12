import type { ApiResponse } from "./types";
import { errorHandler, handleFetchResponse } from "./utils";

export async function getItems<T, U>(
  url: string,
  params?: Partial<T>
): Promise<ApiResponse<U>> {
  try {
    if (params) {
      const queryString = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return handleFetchResponse<ApiResponse<U>>(response);
  } catch (error) {
    return errorHandler(error);
  }
}
