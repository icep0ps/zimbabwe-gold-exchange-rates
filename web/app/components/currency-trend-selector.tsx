import CurrencyButtons from "./currency-buttons";
import type { Currency } from "~/lib/types";

interface CurrencyTrendSelectorProps {
  allCurrencies: Currency[];
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
        <CurrencyButtons currencies={top5Currencies} />
      </div>
    </aside>
  );
}
