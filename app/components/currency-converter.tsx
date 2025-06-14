"use client";

import type { Currency } from "~/lib/types";
import { type FC, useEffect, useState, type ChangeEvent } from "react";
import CurrencyInputSection from "./currency-converter-inputs";
import { calculateExchange } from "~/lib/utils";

interface CurrencyConverterProps {
  primaryBaseCurrency: Currency;
  allAvailableCurrencies: (Currency & { name: string })[];
}

const CurrencyConverter: FC<CurrencyConverterProps> = ({
  primaryBaseCurrency,
  allAvailableCurrencies,
}) => {
  const [secondarySelectedCurrency, setSecondarySelectedCurrency] =
    useState<Currency>(() => {
      return (
        allAvailableCurrencies.find((curr) => curr.currency.trim() === "USD") ||
        allAvailableCurrencies[0]
      );
    });

  const [primaryAmount, setPrimaryAmount] = useState<string>(() => {
    return primaryBaseCurrency.mid_zwl
      ? primaryBaseCurrency.mid_zwl.toFixed(2)
      : "1.00";
  });

  const [secondaryAmount, setSecondaryAmount] = useState<string>(() => {
    return calculateExchange("primary", primaryAmount, {
      primary: primaryBaseCurrency,
      secondary: secondarySelectedCurrency,
    });
  });

  useEffect(() => {
    setSecondaryAmount(
      calculateExchange("primary", primaryAmount, {
        primary: primaryBaseCurrency,
        secondary: secondarySelectedCurrency,
      })
    );
  }, [primaryAmount, secondarySelectedCurrency, primaryBaseCurrency]);

  const handlePrimaryAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPrimaryAmount(value);
  };

  const handleSecondaryAmountChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setSecondaryAmount(value);
    setPrimaryAmount(
      calculateExchange("secondary", value, {
        primary: primaryBaseCurrency,
        secondary: secondarySelectedCurrency,
      })
    );
  };

  return (
    <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start flex-wrap max-lg:justify-center relative gap-8">
      <div className="flex flex-col gap-5 pr-5 w-full lg:w-1/2 text-center lg:text-left max-lg:mb-8">
        <h1 className="text-3xl font-bold text-primary">
          Exchange Rate Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Effortlessly convert any supported currency into ZiG (Zimbabwe Gold),
          providing you with instant access to the value of ZiG against global
          supported currencies.
        </p>
      </div>
      <div className="flex flex-col justify-between items-start gap-5 max-w-96 w-full">
        <CurrencyInputSection
          inputId="zig-amount-input"
          fixedCurrencySymbol="ZiG"
          amount={primaryAmount}
          onAmountChange={handlePrimaryAmountChange}
          selectedCurrency={primaryBaseCurrency}
          onCurrencyChange={() => {}}
          allCurrencies={allAvailableCurrencies}
          inputPlaceholder="Enter ZiG amount"
        />

        <CurrencyInputSection
          inputId="foreign-amount-input"
          amount={secondaryAmount}
          onAmountChange={handleSecondaryAmountChange}
          selectedCurrency={secondarySelectedCurrency}
          onCurrencyChange={setSecondarySelectedCurrency}
          allCurrencies={allAvailableCurrencies}
          inputPlaceholder="Enter foreign currency amount"
        />
      </div>
    </div>
  );
};

export default CurrencyConverter;
