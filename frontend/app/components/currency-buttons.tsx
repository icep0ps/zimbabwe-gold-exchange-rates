import { useQueryState } from "nuqs";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { currencies as currencyData } from "country-data";

interface CurrencyButtonsProps {
  currencies: { name: string }[];
}

export default function CurrencyButtons({ currencies }: CurrencyButtonsProps) {
  const [selectedCurrency, setSelectedCurrency] = useQueryState(
    "targetCurrency",
    {
      defaultValue: "USD",
      shallow: false,
    }
  );

  const handleCurrencySelect = (currency: { name: string }) => {
    setSelectedCurrency(currency.name);
  };

  return (
    <>
      {currencies.map((curr) => (
        <Button
          key={curr.name}
          onClick={() => handleCurrencySelect(curr)}
          className={cn(
            "flex items-center gap-2 p-3 w-full max-w-[150px] lg:max-w-none text-left",
            selectedCurrency === curr.name
              ? "bg-primary text-primary-foreground border border-primary-dark"
              : "bg-card text-secondary-foreground hover:bg-secondary/80 border"
          )}
        >
          {curr.name}
          <span className="hidden sm:inline-block text-sm">
            ({currencyData[curr.name]?.name})
          </span>
        </Button>
      ))}
    </>
  );
}
