import { Suspense } from "react";
import CurrencyButtons from "./currency-buttons";
import type { Currency } from "~/lib/types";

interface CurrencyTrendSelectorProps {
  allCurrencies: { name: string }[];
}

const TOP_CURRENCIES_FILTER = ["USD", "EUR", "GBP", "ZAR", "CAD"];

export default function CurrencyTrendSelector({
  allCurrencies,
}: CurrencyTrendSelectorProps) {
  const top5Currencies = allCurrencies.filter((c) =>
    TOP_CURRENCIES_FILTER.includes(c.name)
  );

  return (
    <aside className="text-card-foreground p-6 w-full flex flex-col items-center">
      <h3 className="font-semibold mb-4 text-primary text-center lg:text-left">
        Select a currency to view exchange rate trends:
      </h3>
      <div className="flex flex-wrap lg:flex-col gap-3 w-full justify-center lg:justify-start">
        <Suspense fallback={<CurrencyButtonsSkeleton />}>
          <CurrencyButtons currencies={top5Currencies} />
        </Suspense>
      </div>
    </aside>
  );
}

function CurrencyButtonsSkeleton() {
  return (
    <>
      {TOP_CURRENCIES_FILTER.map((currency) => (
        <div
          key={currency}
          className="flex items-center gap-2 p-3 w-full max-w-[150px] lg:max-w-none bg-muted animate-pulse rounded-md h-10"
        />
      ))}
    </>
  );
}
