import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApiErrorResponse, ConversionContext } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateExchange = (
  source: "primary" | "secondary",
  amountStr: string,
  context: ConversionContext
): string => {
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amountStr.trim() === "") {
    return "0.00";
  }

  const { primary, secondary } = context;

  let convertedAmount: number;

  if (source === "primary") {
    if (secondary.mid_zwl && secondary.mid_zwl > 0) {
      convertedAmount = amount / secondary.mid_zwl;
    } else {
      convertedAmount = 0;
    }
  } else {
    if (secondary.mid_zwl) {
      convertedAmount = amount * secondary.mid_zwl;
    } else {
      convertedAmount = 0;
    }
  }

  return convertedAmount.toFixed(2);
};

export function errorHandler(error: any): ApiErrorResponse {
  if (error instanceof Error) {
    if (error.message.startsWith("HTTP error! Status:")) {
      return {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    if (error.message === "Failed to fetch") {
      return {
        success: false,
        message:
          "Could not connect to the server. Please check your internet connection or try again later.",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      message: `Request failed: ${error.message}`,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: false,
    timestamp: new Date().toISOString(),
    message: "An unexpected error occurred.",
  };
}

export async function handleFetchResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json().catch(() => ({
      status: "error", // Default status if JSON parsing fails
      message: [`HTTP error! Status: ${response.status}`],
      errors: [],
      code: response.status,
    }));

    // Throwing an Error (or HttpError if implemented) with the structured message
    throw new Error(
      Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message
    );
  }

  const data = (await response.json()) as T;
  return JSON.parse(JSON.stringify(data));
}
