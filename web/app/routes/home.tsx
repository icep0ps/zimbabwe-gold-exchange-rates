import { format, subDays } from "date-fns";
import React from "react";
import CurrencyConverter from "~/components/currency-converter";
import CurrencyTrendSelector from "~/components/currency-trend-selector";
import ExchangeRateOverviewCard from "~/components/exchange-rate-overview-card";
import FrequentlyAskedQuestions from "~/components/faq-section";
import RatesDataTable from "~/components/rates-table";
import { getItems } from "~/lib/fetcher";
import { logger } from "~/lib/logger.server";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  Currency,
  Rate,
  RatesResponse,
} from "~/lib/types";
import type { Route } from "./+types/home";

const USD_RATE_ENDPOINT = `${
  import.meta.env.VITE_API_SERVICE_URL
}api/v1/rates/current`;

const ALL_RATES_ENDPOINT = `${
  import.meta.env.VITE_API_SERVICE_URL
}api/v1/rates/current`;

const HISTORICAL_RATES_ENDPOINT = `${
  import.meta.env.VITE_API_SERVICE_URL
}api/v1/rates/historical/`;

const ALL_CURRENCIES_NAMES = `${
  import.meta.env.VITE_API_SERVICE_URL
}api/v1/currencies`;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Zimbabwe Gold Exchange Rates" },
    {
      name: "description",
      content: "Stay updated with the latest Zimbabwe Gold exchange rates.",
    },
  ];
}

export const unstable_middleware: Route.unstable_MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    console.log([USD_RATE_ENDPOINT, ALL_RATES_ENDPOINT, import.meta.env]);
    const requestId = crypto.randomUUID();

    const start = performance.now();
    const response = await next();
    const duration = performance.now() - start;

    const log = {
      method: request.method,
      path: request.url,
      request: {
        headers: request.headers,
      },
      response: {
        headers: response.headers,
        status: response.status,
        body: response.body,
      },
      duration,
    };

    logger.info(
      `[${requestId}] Response ${response.status} (${duration}ms)`,
      log
    );
    return response;
  },
];

export async function loader({
  request,
  context,
}: Route.LoaderArgs): Promise<RatesResponse> {
  try {
    const url = new URL(request.url);
    const dateFourteenDaysAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");

    const startDate = url.searchParams.get("startDate") ?? dateFourteenDaysAgo;
    const endDate = url.searchParams.get("endDate") ?? undefined;
    const targetCurrency = url.searchParams.get("targetCurrency") ?? "USD";

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

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
      getItems<unknown, Rate[]>(
        `${USD_RATE_ENDPOINT}?targetCurrency=${targetCurrency}`
      ),
      getItems<unknown, Rate[]>(ALL_RATES_ENDPOINT),
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

    return {
      rates: (currentRatesResponse as ApiSuccessResponse<Rate[]>).data,
      chartRates: (chartRatesResponse as ApiSuccessResponse<Rate[]>).data,
      officialRate: (usdRateResponse as ApiSuccessResponse<Rate[]>).data[0],
      currencies: (allCurrenciesResponse as ApiSuccessResponse<Currency[]>)
        .data,
    };
  } catch (error) {
    console.error("Loader Error: An unexpected error occurred:", error);
    return {
      error:
        "An unexpected error occurred. Please refresh the page or try again later.",
    };
  }
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  if ("error" in loaderData) {
    return (
      <React.Fragment>
        <div className="flex flex-col items-center justify-center h-96 gap-5">
          <h1 className="text-4xl font-bold text-primary text-center">
            Somthing went wrong
          </h1>
          <p className="text-center">
            {loaderData.error || "Failed to load exchange rate data."}
          </p>
        </div>
      </React.Fragment>
    );
  }

  const { officialRate, rates, chartRates, currencies } = loaderData;

  return (
    <React.Fragment>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="col-span-1 md:col-span-2">
          <ExchangeRateOverviewCard
            officialRate={officialRate}
            chartRates={chartRates}
            allAvailableCurrencies={currencies}
          />
        </div>
        <div className="hidden md:block col-span-1">
          <CurrencyTrendSelector allCurrencies={currencies} />
        </div>
      </section>
      <CurrencyConverter
        primaryBaseCurrency={officialRate}
        allAvailableCurrencies={rates}
      />
      <RatesDataTable data={rates} />
      <FrequentlyAskedQuestions supportedCurrencies={currencies} />
    </React.Fragment>
  );
}
