import CurrencyConverter from "~/components/currency-converter";
import CurrencyTrendSelector from "~/components/currency-trend-selector";
import ExchangeRateOverviewCard from "~/components/exchange-rate-overview-card";
import SiteFooter from "~/components/footer";
import NavigationBar from "~/components/navigation-bar";
import RatesDataTable from "~/components/rates-table";
import { getItems } from "~/lib/fetcher";
import type { Currency } from "~/lib/types";
import type { Route } from "./+types/home";
import { mockAllAvailableCurrencies, mockPrimaryBaseCurrency } from "./data";

const API_BASE_URL = "http://192.168.10.139:3000/api/v1/rates";
const USD_RATE_ENDPOINT = `${API_BASE_URL}/current`;
const ALL_RATES_ENDPOINT = `${API_BASE_URL}/current`;
const HISTORICAL_RATES_ENDPOINT = `${API_BASE_URL}/historical/`;

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

    const [usdRateResponse, currentRatesResponse, chartRatesResponse] =
      await Promise.all([
        getItems<unknown, Currency[]>(
          USD_RATE_ENDPOINT + `?targetCurrency=${targetCurrency}`
        ),
        getItems<unknown, Currency[]>(ALL_RATES_ENDPOINT),
        getItems<unknown, Currency[]>(historicalRatesUrl),
      ]);

    if (
      !usdRateResponse.success ||
      !usdRateResponse.data ||
      usdRateResponse.data.length === 0
    ) {
      console.error(
        "Loader Error: Failed to fetch USD exchange rate or data is empty."
      );
      return {
        officialRate: null,
        rates: [],
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
      officialRate: usdRateResponse.data[0],
      rates: currentRatesResponse.data,
      chartRates: chartRatesResponse.data,
    };
  } catch (error) {
    console.error(
      "Loader Error: An unexpected error occurred during data fetching:",
      error
    );
    return {
      officialRate: null,
      rates: [],
      chartRates: [],
      error: "An unexpected error occurred. Please refresh the page.",
    };
  }
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { officialRate, rates, chartRates, error } = loaderData;

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
            allAvailableCurrencies={mockAllAvailableCurrencies} // Pass allAvailableCurrencies
          />
        </div>
        <div className="hidden md:block col-span-1">
          <CurrencyTrendSelector allCurrencies={mockAllAvailableCurrencies} />
        </div>
      </section>
      <CurrencyConverter
        primaryBaseCurrency={mockPrimaryBaseCurrency}
        allAvailableCurrencies={mockAllAvailableCurrencies}
      />
      <RatesDataTable data={rates} />
      <SiteFooter />
    </main>
  );
}
