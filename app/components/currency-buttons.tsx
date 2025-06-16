import { useQueryState } from "nuqs";
import type { Currency } from "~/lib/types";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";

interface CurrencyButtonsProps {
  currencies: Currency[];
}

export default function CurrencyButtons({ currencies }: CurrencyButtonsProps) {
  const [selectedCurrency, setSelectedCurrency] = useQueryState(
    "targetCurrency",
    {
      defaultValue: "USD",
      shallow: false,
    }
  );

  const handleCurrencySelect = (currency: Currency) => {
    setSelectedCurrency(currency.currency);
  };

  return (
    <>
      {currencies.map((curr) => (
        <Button
          key={curr.currency}
          onClick={() => handleCurrencySelect(curr)}
          className={cn(
            "flex items-center gap-2 p-3 w-full max-w-[150px] lg:max-w-none text-left",
            selectedCurrency === curr.currency
              ? "bg-primary text-primary-foreground border border-primary-dark"
              : "bg-card text-secondary-foreground hover:bg-secondary/80 border"
          )}
        >
          {curr.currency}
          <span className="hidden sm:inline-block text-sm">
            ({curr.currency})
          </span>
        </Button>
      ))}
    </>
  );
}
