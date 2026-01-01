import { format, subDays, subMonths } from "date-fns";
import { Download } from "lucide-react";
import React from "react";
import { useQueryState } from "nuqs";
import { Button } from "~/components/ui/button";
import { HistoryRatesDataTable } from "~/components/history-rates-table";
import { HistoryStats } from "~/components/history-stats";
import { getItems } from "~/lib/fetcher";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  Currency,
  Rate,
  RatesResponse,
} from "~/lib/types";
import type { Route } from "./+types/history";

const RATES_API_BASE = `${import.meta.env.VITE_API_BASE_URL}api/v1/rates`;

const HISTORICAL_RATES_ENDPOINT = `${RATES_API_BASE}/historical/`;

const ALL_CURRENCIES_NAMES = `${
  import.meta.env.VITE_API_BASE_URL
}api/v1/currencies`;

export function meta({ data }: Route.MetaArgs) {
  const title =
    "Historical Zimbabwe Gold (ZiG) Exchange Rates | Zimbabwe Bank Rates";
  const description =
    "Browse historical exchange rates for Zimbabwe Gold (ZiG) against major currencies like USD, EUR, GBP, and ZAR. Analyze past trends and data.";
  const url = "https://zimbabwegoldexchangerates.icep0ps.dev/history";

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index, follow" },
    { tagName: "link", rel: "canonical", href: url },

    // Open Graph / Facebook
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },

    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}

export async function loader({
  request,
  context,
}: Route.LoaderArgs): Promise<RatesResponse & { referenceDate?: string }> {
  try {
    const url = new URL(request.url);
    const dateFourteenDaysAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");

    const startDate = url.searchParams.get("startDate") ?? dateFourteenDaysAgo;
    const endDate = url.searchParams.get("endDate") ?? undefined;
    const targetCurrency = url.searchParams.get("targetCurrency") ?? "USD";
    const date = url.searchParams.get("date");

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    let usdRateUrl: string;
    let currentRatesUrl: string;

    if (date) {
      const usdParams = new URLSearchParams();
      usdParams.append("targetCurrency", targetCurrency);
      usdRateUrl = `${RATES_API_BASE}/${date}?${usdParams.toString()}`;
      currentRatesUrl = `${RATES_API_BASE}/${date}`;
    } else {
      const usdParams = new URLSearchParams();
      usdParams.append("targetCurrency", targetCurrency);
      usdRateUrl = `${RATES_API_BASE}/latest?${usdParams.toString()}`;
      currentRatesUrl = `${RATES_API_BASE}/latest`;
    }

    const historicalRatesUrl =
      HISTORICAL_RATES_ENDPOINT +
      targetCurrency +
      (queryParams.toString() ? `?${queryParams}` : "");

    const [
      usdRateResponse,
      currentRatesResponse,
      chartRatesResponse,
      allCurrenciesResponse,
    ] = await Promise.all([
      getItems<unknown, Rate[]>(usdRateUrl),
      getItems<unknown, Rate[]>(currentRatesUrl),
      getItems<unknown, Rate[]>(historicalRatesUrl),
      getItems<unknown, Currency[]>(ALL_CURRENCIES_NAMES),
    ]);

    const failedResponses = [
      { name: "USD rate", response: usdRateResponse },
      { name: "Current rates", response: currentRatesResponse },
      { name: "Chart rates", response: chartRatesResponse },
      { name: "Currency list", response: allCurrenciesResponse },
    ].filter(({ response }) => !response.success);

    if (failedResponses.length > 0) {
      const isDateSearchNotFound =
        date &&
        failedResponses.every(
          (r) =>
            (r.name === "USD rate" || r.name === "Current rates") &&
            (r.response as ApiErrorResponse).message?.includes("404")
        );

      if (isDateSearchNotFound) {
        return {
          rates: [],
          officialRate: null,
          chartRates:
            (chartRatesResponse as ApiSuccessResponse<Rate[]>).data || [],
          currencies:
            (allCurrenciesResponse as ApiSuccessResponse<Currency[]>).data || [],
          referenceDate: date || undefined,
        };
      }

      const messages = failedResponses.map(
        ({ name, response }) =>
          `${name} fetch failed: ${
            (response as ApiErrorResponse).message || "Unknown error"
          }`
      );

      return {
        error:
          messages.join(" | ") + " Please refresh the page or try again later.",
      };
    }

    const officialRate = (usdRateResponse as ApiSuccessResponse<Rate[]>).data[0];

    return {
      rates: (currentRatesResponse as ApiSuccessResponse<Rate[]>).data,
      chartRates: (chartRatesResponse as ApiSuccessResponse<Rate[]>).data,
      officialRate: officialRate,
      currencies: (allCurrenciesResponse as ApiSuccessResponse<Currency[]>)
        .data,
      referenceDate: date || undefined,
    };
  } catch (error) {
    console.error("Loader Error: An unexpected error occurred:", error);
    return {
      error:
        "An unexpected error occurred. Please refresh the page or try again later.",
    };
  }
}

function HistoryPageHeader({
  rates,
  referenceDate,
}: {
  rates: Rate[];
  referenceDate?: string;
}) {
  const handleExport = () => {
    if (!rates.length) return;

    const headers = [
      "Currency",
      "Mid Rate (ZiG)",
      "Bid (ZiG)",
      "Ask (ZiG)",
      "Date",
    ];
    const csvContent = [
      headers.join(","),
      ...rates.map((rate) =>
        [
          rate.currency,
          rate.mid_rate_zwg,
          rate.bid_rate_zwg,
          rate.ask_rate_zwg,
          rate.created_at,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const fileName = `zig-exchange-rates-${referenceDate || "latest"}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 items-start">
      <div className="flex flex-col sm:flex-row justify-between gap-6 items-start w-full">
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl font-bold text-primary text-center sm:text-left">
            Historical Exchange Rates
          </h1>
          <p className="text-base text-muted-foreground text-center sm:text-left leading-relaxed max-w-2xl">
            Our comprehensive archive provides detailed historical exchange rate
            data as published by the Reserve Bank of Zimbabwe, allowing for
            in-depth analysis and trend monitoring.
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          className="h-8 shrink-0"
          onClick={handleExport}
        >
          <Download className="mr-2 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}

export default function HistoryPage({ loaderData }: Route.ComponentProps) {
  if ("error" in loaderData) {
    return (
      <React.Fragment>
        <div className="flex flex-col items-center justify-center h-96 gap-5">
          <h1 className="text-4xl font-bold text-primary text-center">
            Something went wrong
          </h1>
          <p className="text-center">
            {loaderData.error || "Failed to load exchange rate data."}
          </p>
        </div>
      </React.Fragment>
    );
  }

  const { rates, referenceDate } = loaderData;

  return (
    <div className="space-y-10 pb-10 pt-10">
      <section className="space-y-2">
        <HistoryPageHeader rates={rates} referenceDate={referenceDate} />
      </section>

      <section className="space-y-8">
        <HistoryStats rates={rates} />

        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Reference Date
          </h2>
          <p className="text-sm text-muted-foreground">
            Select a specific date to update the analysis below.
          </p>
        </div>

        <HistoryRatesDataTable data={rates} />
      </section>
    </div>
  );
}
