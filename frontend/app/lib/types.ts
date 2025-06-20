export type Currency = {
  currency: string;
  bid: string;
  ask: string;
  mid_rate: string;
  bid_rate_zwg: string;
  ask_rate_zwg: string;
  mid_rate_zwg: string;
  created_at: string;
  previous_rate?: Currency | null;
};

export interface ConversionContext {
  primary: Currency;
  secondary: Currency;
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

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
