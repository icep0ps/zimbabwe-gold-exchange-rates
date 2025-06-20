import CurrencyConverter from "~/components/currency-converter";
import CurrencyTrendSelector from "~/components/currency-trend-selector";
import ExchangeRateOverviewCard from "~/components/exchange-rate-overview-card";
import SiteFooter from "~/components/footer";
import NavigationBar from "~/components/navigation-bar";
import RatesDataTable from "~/components/rates-table";
import { getItems } from "~/lib/fetcher";
import type { Currency } from "~/lib/types";
import type { Route } from "./+types/home";
import FrequentlyAskedQuestions from "~/components/faq-section";

const USD_RATE_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}rates/current`;
const ALL_RATES_ENDPOINT = `${import.meta.env.VITE_API_BASE_URL}rates/current`;
const HISTORICAL_RATES_ENDPOINT = `${
  import.meta.env.VITE_API_BASE_URL
}rates/historical/`;
const ALL_CURRENCIES_NAMES = `${import.meta.env.VITE_API_BASE_URL}currencies`;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Zimbabwe Exchange Rates" },
    {
      name: "description",
      content: "Stay updated with the latest Zimbabwe exchange rates.",
    },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const targetCurrency = url.searchParams.get("targetCurrency") ?? "USD";

    let historicalRatesUrl = HISTORICAL_RATES_ENDPOINT + targetCurrency;

    if (startDate && endDate) {
      historicalRatesUrl += `?startDate=${startDate}&endDate=${endDate}`;
    } else if (startDate) {
      historicalRatesUrl += `?startDate=${startDate}`;
    } else if (endDate) {
      historicalRatesUrl += `?endDate=${endDate}`;
    }

    const [
      usdRateResponse,
      currentRatesResponse,
      chartRatesResponse,
      allCurrenciesResponse,
    ] = await Promise.all([
      getItems<unknown, Currency[]>(
        USD_RATE_ENDPOINT + `?targetCurrency=${targetCurrency}`
      ),
      getItems<unknown, Currency[]>(ALL_RATES_ENDPOINT),
      getItems<unknown, Currency[]>(historicalRatesUrl),
      getItems<unknown, { name: string }[]>(ALL_CURRENCIES_NAMES),
    ]);

    if (
      !usdRateResponse.success ||
      !usdRateResponse.data ||
      usdRateResponse.data.length === 0 ||
      !allCurrenciesResponse.success
    ) {
      console.error(
        "Loader Error: Failed to fetch USD exchange rate or data is empty."
      );
      return {
        officialRate: null,
        rates: [],
        currencies: [],
        chartRates: [],
        error: "Failed to load official USD rate. Please try again.",
      };
    }

    if (!currentRatesResponse.success || !chartRatesResponse.success) {
      console.warn(
        "Loader Warning: Some exchange rate data could not be loaded."
      );
      return {
        officialRate: usdRateResponse.data[0],
        rates: [],
        chartRates: [],
        error:
          "Failed to load all current exchange rates. Some data might be missing.",
      };
    }

    return {
      rates: currentRatesResponse.data,
      chartRates: chartRatesResponse.data,
      officialRate: usdRateResponse.data[0],
      currencies: allCurrenciesResponse.data,
    };
  } catch (error) {
    console.error(
      "Loader Error: An unexpected error occurred during data fetching:",
      error
    );
    return {
      officialRate: null,
      rates: [],
      currencies: [],
      chartRates: [],
      error: "An unexpected error occurred. Please refresh the page.",
    };
  }
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { officialRate, rates, chartRates, currencies, error } = loaderData;

  if (!officialRate) {
    return (
      <main className="w-full px-4 sm:px-6 md:px-8 lg:max-w-[1080px] lg:mx-auto space-y-10">
        <NavigationBar />
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-xl font-semibold text-red-600">
            {error || "Failed to load exchange rate data."}
          </h2>
        </div>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="w-full px-4 sm:px-6 md:px-8 lg:max-w-[1080px] lg:mx-auto space-y-10">
      <NavigationBar />
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
      <SiteFooter />
    </main>
  );
}
