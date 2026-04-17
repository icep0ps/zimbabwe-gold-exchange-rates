import { format, parseISO, isValid } from "date-fns";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { Link } from "react-router";
import { HistoryStats } from "~/components/history-stats";
import RatesDataTable from "~/components/rates-table";
import { Button } from "~/components/ui/button";
import { getItems } from "~/lib/fetcher";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  Currency,
  Rate,
  RatesResponse,
} from "~/lib/types";
import type { Route } from "./+types/rates.$date";

const RATES_API_BASE = `${import.meta.env.VITE_API_BASE_URL}api/v1/rates`;
const ALL_CURRENCIES_NAMES = `${import.meta.env.VITE_API_BASE_URL}api/v1/currencies`;

function formatDisplayDate(dateStr: string) {
  try {
    const parsed = parseISO(dateStr);
    if (!isValid(parsed)) return dateStr;
    return format(parsed, "MMMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function meta({ params }: Route.MetaArgs) {
  const date = params.date;
  const displayDate = formatDisplayDate(date);
  const title = `ZiG Exchange Rates — ${displayDate} | Zimbabwe Bank Rates`;
  const description = `Official Zimbabwe Gold (ZiG) exchange rates published by the Reserve Bank of Zimbabwe on ${displayDate}. View USD, EUR, GBP, ZAR, and more.`;
  const url = `https://zimbabwegoldexchangerates.icep0ps.dev/rates/${date}`;
  const image = "https://zimbabwegoldexchangerates.icep0ps.dev/og-image.png";

  return [
    { title },
    { name: "description", content: description },
    {
      name: "keywords",
      content: `ZiG exchange rate ${displayDate}, Zimbabwe Gold ${date}, RBZ rates ${displayDate}, Zimbabwe currency ${date}`,
    },
    { name: "robots", content: "index, follow" },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<RatesResponse> {
  const { date } = params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Invalid date format. Please use YYYY-MM-DD." };
  }

  try {
    const [ratesResponse, currenciesResponse] = await Promise.all([
      getItems<unknown, Rate[]>(`${RATES_API_BASE}/${date}`),
      getItems<unknown, Currency[]>(ALL_CURRENCIES_NAMES),
    ]);

    if (!ratesResponse.success) {
      const err = ratesResponse as ApiErrorResponse;
      const is404 =
        err.message?.includes("404") ||
        err.message?.toLowerCase().includes("not found");
      return {
        error: is404
          ? `No exchange rate data found for ${formatDisplayDate(date)}. The RBZ may not have published rates on this date.`
          : err.message || "Failed to load exchange rates.",
      };
    }

    const rates = (ratesResponse as ApiSuccessResponse<Rate[]>).data;
    const currencies = currenciesResponse.success
      ? (currenciesResponse as ApiSuccessResponse<Currency[]>).data
      : [];

    const usdRate = rates.find((r) => r.currency === "USD") ?? rates[0] ?? null;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `Zimbabwe Gold Exchange Rates — ${formatDisplayDate(date)}`,
      description: `Official ZiG exchange rates published by the Reserve Bank of Zimbabwe on ${formatDisplayDate(date)}.`,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://zimbabwegoldexchangerates.icep0ps.dev/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Historical Rates",
            item: "https://zimbabwegoldexchangerates.icep0ps.dev/history",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: formatDisplayDate(date),
            item: `https://zimbabwegoldexchangerates.icep0ps.dev/rates/${date}`,
          },
        ],
      },
      ...(usdRate && {
        mainEntity: {
          "@type": "ExchangeRateSpecification",
          currency: "ZWG",
          currentExchangeRate: {
            "@type": "UnitPriceSpecification",
            price: usdRate.mid_rate_zwg,
            priceCurrency: "ZWG",
            referenceQuantity: {
              "@type": "QuantitativeValue",
              value: "1",
              unitCode: usdRate.currency,
            },
          },
          datePublished: date,
          provider: {
            "@type": "Organization",
            name: "Reserve Bank of Zimbabwe",
            url: "https://www.rbz.co.zw",
          },
        },
      }),
    };

    return {
      rates,
      chartRates: [],
      officialRate: usdRate,
      currencies,
      jsonLd,
    };
  } catch {
    return {
      error: "An unexpected error occurred. Please try again later.",
    };
  }
}

export default function DayRatesPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const date = params.date;
  const displayDate = formatDisplayDate(date);

  if ("error" in loaderData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-5 py-24">
        <h1 className="text-4xl font-bold text-primary text-center">
          No Data Found
        </h1>
        <p className="text-center text-muted-foreground">{loaderData.error}</p>
        <Button asChild variant="outline">
          <Link to="/history">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Link>
        </Button>
      </div>
    );
  }

  const { rates, jsonLd } = loaderData;

  return (
    <div className="space-y-10 pb-10 pt-10">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <section className="flex flex-col sm:flex-row justify-between gap-4 items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-primary">{displayDate}</h1>
          <p className="text-base text-muted-foreground">
            Official exchange rates published by the Reserve Bank of Zimbabwe.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/history">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Link>
        </Button>
      </section>

      <HistoryStats rates={rates} />

      <RatesDataTable data={rates} enableDateSelection={false} hideHeader />
    </div>
  );
}
