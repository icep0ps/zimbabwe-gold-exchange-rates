import React, { type ChangeEvent, useEffect, useState } from "react";
import type { Currency } from "~/lib/types";
import { Input } from "./ui/input";

interface CurrencyInputSectionProps {
  amount: string;
  onAmountChange: (event: ChangeEvent<HTMLInputElement>) => void;
  selectedCurrency: Currency;
  onCurrencyChange: (newCurrency: Currency) => void;
  allCurrencies: (Currency & { name: string })[];
  fixedCurrencySymbol?: string;
  inputId?: string;
  inputPlaceholder?: string;
}

const CurrencyInputSection: React.FC<CurrencyInputSectionProps> = ({
  amount,
  onAmountChange,
  selectedCurrency,
  onCurrencyChange,
  allCurrencies,
  fixedCurrencySymbol,
  inputId = "currency-amount-input",
  inputPlaceholder = "0.00",
}) => {
  const [dropdownValue, setDropdownValue] = useState<string>(
    selectedCurrency.currency
  );

  const [recentlyUsedCurrencies, setRecentlyUsedCurrencies] = useState<
    Currency[]
  >(allCurrencies.slice(0, 3));

  useEffect(() => {
    setDropdownValue(selectedCurrency.currency);
  }, [selectedCurrency.currency]);

  const handleCurrencySelection = (value: string) => {
    const foundCurrency = allCurrencies.find(
      (curr) => curr.currency.trim() === value.trim()
    );

    if (foundCurrency) {
      onCurrencyChange(foundCurrency);
      setRecentlyUsedCurrencies((prev) => {
        const filteredPrev = prev.filter(
          (curr) => curr.currency !== foundCurrency.currency
        );
        return [foundCurrency, ...filteredPrev].slice(0, 3);
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-background">
      <span className="w-full bg-background border-input border rounded-lg py-3 px-2 flex focus-within:border-accent">
        <span className="bg-border p-2 rounded-lg text-sm mr-3 font-medium">
          {fixedCurrencySymbol || selectedCurrency.currency}
        </span>
        <Input
          min={0}
          id={inputId}
          type="text"
          value={amount}
          placeholder={inputPlaceholder}
          onChange={onAmountChange}
          className="w-full bg-background outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </span>

      {!fixedCurrencySymbol && (
        <select
          id={`currency-select-${inputId}`}
          onChange={(e) => handleCurrencySelection(e.target.value)}
          value={dropdownValue}
          className="px-3 py-2 outline-none rounded-lg bg-background border-input border appearance-none
                     focus:border-accent transition-colors cursor-pointer"
        >
          {allCurrencies.map((curr) => (
            <option
              value={curr.currency}
              className="bg-background text-foreground"
              key={curr.currency}
            >
              {curr.name} ({curr.currency})
            </option>
          ))}
        </select>
      )}

      {recentlyUsedCurrencies.length > 0 && !fixedCurrencySymbol && (
        <div className="grid gap-2 w-full grid-cols-3" id="recently-selected">
          {recentlyUsedCurrencies.map((recentCurr) => (
            <Input
              type="button"
              key={recentCurr.currency}
              value={recentCurr.currency}
              onClick={() => handleCurrencySelection(recentCurr.currency)}
              className={`flex-grow-0 cursor-pointer text-sm py-1.5 px-3 rounded-md border
                          ${
                            recentCurr.currency === selectedCurrency.currency
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-secondary"
                          }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencyInputSection;
