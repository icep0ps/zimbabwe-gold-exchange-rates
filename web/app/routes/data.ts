import type { Currency } from "~/lib/types";

// Data for a 1-day (daily) view, showing hourly fluctuations with more ups and downs
export const dailyChartData = [
  { time: "09:00", rate: 107.3 }, // Start a bit lower
  { time: "10:00", rate: 107.38 },
  { time: "11:00", rate: 107.32 },
  { time: "12:00", rate: 107.45 },
  { time: "13:00", rate: 107.39 },
  { time: "14:00", rate: 107.51 }, // Peak
  { time: "15:00", rate: 107.46 },
  { time: "16:00", rate: 107.41 },
  { time: "17:00", rate: 107.375 }, // Closing around the given rate
  { time: "18:00", rate: 107.35 },
];

// Data for a 5-day (weekly) view, showing more distinct daily closing rates
// Current date: Wednesday, June 11, 2025
export const weeklyChartData = [
  { date: "Jun 07", rate: 106.85 }, // Friday
  { date: "Jun 08", rate: 106.9 }, // Saturday (or previous close if weekend, slightly up)
  { date: "Jun 09", rate: 106.78 }, // Sunday (or previous close, slightly down)
  { date: "Jun 10", rate: 107.15 }, // Monday (significant jump)
  { date: "Jun 11", rate: 107.375 }, // Today (Wednesday, June 11, 2025)
];

// Data for a 1-month view, showing a longer-term trend with more distinct fluctuations
// Dates leading up to June 11, 2025
export const monthlyChartData = [
  { date: "May 13", rate: 105.5 },
  { date: "May 14", rate: 105.75 },
  { date: "May 15", rate: 105.6 },
  { date: "May 16", rate: 105.9 },
  { date: "May 17", rate: 106.1 },
  { date: "May 20", rate: 105.85 }, // Dip
  { date: "May 21", rate: 106.05 },
  { date: "May 22", rate: 106.2 },
  { date: "May 23", rate: 106.45 },
  { date: "May 24", rate: 106.7 },
  { date: "May 27", rate: 106.5 }, // Slight dip
  { date: "May 28", rate: 106.8 },
  { date: "May 29", rate: 107.0 },
  { date: "May 30", rate: 106.92 },
  { date: "May 31", rate: 107.15 },
  { date: "Jun 03", rate: 107.05 },
  { date: "Jun 04", rate: 107.25 },
  { date: "Jun 05", rate: 107.18 },
  { date: "Jun 06", rate: 107.3 },
  { date: "Jun 07", rate: 107.45 }, // Higher peak
  { date: "Jun 10", rate: 107.2 }, // Notable dip before today
  { date: "Jun 11", rate: 107.375 }, // Current date
];

export const mockPrimaryBaseCurrency: Currency = {
  currency: "ZWG", // Zimbabwe Gold symbol
  name: "Zimbabwe Gold",
  ask: 1.0,
  bid: 1.0,
  mid_zwl: 1.0,
};

export const mockAllAvailableCurrencies: (Currency & { name: string })[] = [
  {
    currency: "USD",
    name: "United States Dollar",
    ask: 107.5,
    bid: 107.2,
    mid_zwl: 107.35,
  },
  {
    currency: "GBP",
    name: "British Pound Sterling",
    ask: 136.2,
    bid: 135.8,
    mid_zwl: 136.0,
  },
  {
    currency: "EUR",
    name: "Euro",
    ask: 116.5,
    bid: 116.1,
    mid_zwl: 116.3,
  },
  {
    currency: "ZAR",
    name: "South African Rand",
    ask: 5.95,
    bid: 5.85,
    mid_zwl: 5.9,
  },
  {
    currency: "AUD",
    name: "Australian Dollar",
    ask: 71.0,
    bid: 70.5,
    mid_zwl: 70.75,
  },
  {
    currency: "CAD",
    name: "Canadian Dollar",
    ask: 78.5,
    bid: 78.0,
    mid_zwl: 78.25,
  },
  {
    currency: "JPY",
    name: "Japanese Yen",
    ask: 0.7,
    bid: 0.69,
    mid_zwl: 0.695,
  },
  {
    currency: "CNY",
    name: "Chinese Yuan",
    ask: 14.8,
    bid: 14.7,
    mid_zwl: 14.75,
  },
  {
    currency: "ZWG",
    name: "Zimbabwe Gold",
    ask: 1.0,
    bid: 1.0,
    mid_zwl: 1.0,
  },
];
