export type Rate = {
  currency: string;
  bid: string;
  ask: string;
  mid_rate: string;
  bid_rate_zwg: string;
  ask_rate_zwg: string;
  mid_rate_zwg: string;
  created_at: string;
  previous_rate?: Rate | null;
};

export interface Currency {
  name: string;
}

export interface ConversionContext {
  primary: Rate;
  secondary: Rate;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  timestamp: string;
}

interface SuccessRatesResponse {
  officialRate: Rate | null;
  rates: Rate[];
  currencies: Currency[];
  chartRates: Rate[];
  jsonLd?: any; // Add jsonLd since it's used in HomePage
}

interface ErrorRatesResponse {
  error: string;
}

export type RatesResponse = SuccessRatesResponse | ErrorRatesResponse;
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
