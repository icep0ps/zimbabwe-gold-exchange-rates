import { format, subDays } from "date-fns";
import React from "react";
import CurrencyConverter from "~/components/currency-converter";
import CurrencyTrendSelector from "~/components/currency-trend-selector";
import ExchangeRateOverviewCard from "~/components/exchange-rate-overview-card";
import FrequentlyAskedQuestions from "~/components/faq-section";
import RatesDataTable from "~/components/rates-table";
import { getItems } from "~/lib/fetcher";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  Currency,
  Rate,
  RatesResponse,
} from "~/lib/types";
import type { Route } from "./+types/home";

const RATES_API_BASE = `${import.meta.env.VITE_API_BASE_URL}api/v1/rates`;

const HISTORICAL_RATES_ENDPOINT = `${RATES_API_BASE}/historical/`;

const ALL_CURRENCIES_NAMES = `${
  import.meta.env.VITE_API_BASE_URL
}api/v1/currencies`;

export function meta({ data }: Route.MetaArgs) {
  const title = "Zimbabwe Gold (ZiG) Exchange Rates | Official Bank Rate";
  const description =
    "Track the latest official Zimbabwe Gold (ZiG) exchange rates against USD, EUR, GBP, and ZAR. Daily updates from the Reserve Bank of Zimbabwe.";
  const url = "https://zimbabwegoldexchangerates.icep0ps.dev/";
  const image = "https://zimbabwegoldexchangerates.icep0ps.dev/og-image.png";

  return [
    { title },
    { name: "description", content: description },
    {
      name: "keywords",
      content:
        "Zimbabwe Gold, ZiG, Exchange Rates, RBZ, USD to ZiG, Zimbabwe Currency, Official Bank Rate",
    },
    { name: "robots", content: "index, follow" },
    { tagName: "link", rel: "canonical", href: url },

    // Open Graph / Facebook
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },

    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}

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

    // Fetch latest rates
    const usdParams = new URLSearchParams();
    usdParams.append("targetCurrency", targetCurrency);
    const usdRateUrl = `${RATES_API_BASE}/latest?${usdParams.toString()}`;
    const currentRatesUrl = `${RATES_API_BASE}/latest`;

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

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Zimbabwe Gold Exchange Rates",
      description:
        "Current official exchange rates for Zimbabwe Gold (ZiG) as published by the Reserve Bank of Zimbabwe.",
      mainEntity: {
        "@type": "ExchangeRateSpecification",
        currency: "ZWG",
        currentExchangeRate: {
          "@type": "UnitPriceSpecification",
          price: officialRate.mid_rate_zwg,
          priceCurrency: "ZWG",
          referenceQuantity: {
            "@type": "QuantitativeValue",
            value: "1",
            unitCode: officialRate.currency,
          },
        },
        datePublished: officialRate.created_at,
        provider: {
          "@type": "Organization",
          name: "Reserve Bank of Zimbabwe",
          url: "https://www.rbz.co.zw",
        },
      },
    };

    return {
      rates: (currentRatesResponse as ApiSuccessResponse<Rate[]>).data,
      chartRates: (chartRatesResponse as ApiSuccessResponse<Rate[]>).data,
      officialRate: officialRate,
      currencies: (allCurrenciesResponse as ApiSuccessResponse<Currency[]>)
        .data,
      jsonLd,
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

  const { officialRate, rates, chartRates, currencies, jsonLd } = loaderData;

  return (
    <React.Fragment>
       {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
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
      <RatesDataTable data={rates} enableDateSelection={false} />
      <FrequentlyAskedQuestions supportedCurrencies={currencies} />
    </React.Fragment>
  );
}
