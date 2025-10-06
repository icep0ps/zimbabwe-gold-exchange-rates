"use client";

import { useEffect, useState, type ChangeEvent, type FC } from "react";
import type { Rate } from "~/lib/types";
import { calculateExchange } from "~/lib/utils";
import CurrencyInputSection from "./currency-converter-inputs";

interface CurrencyConverterProps {
  primaryBaseCurrency: Rate;
  allAvailableCurrencies: Rate[];
}

const CurrencyConverter: FC<CurrencyConverterProps> = ({
  primaryBaseCurrency,
  allAvailableCurrencies,
}) => {
  const [secondarySelectedCurrency, setSecondarySelectedCurrency] =
    useState<Rate>(() => {
      return (
        allAvailableCurrencies.find((curr) => curr.currency.trim() === "USD") ||
        allAvailableCurrencies[0]
      );
    });
  const [primaryAmount, setPrimaryAmount] = useState<string>(() => {
    return primaryBaseCurrency.mid_rate_zwg
      ? parseFloat(primaryBaseCurrency.mid_rate_zwg).toFixed(2)
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
  }, [secondarySelectedCurrency]);

  const handlePrimaryAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPrimaryAmount(value);
    setSecondaryAmount(
      calculateExchange("primary", value, {
        primary: primaryBaseCurrency,
        secondary: secondarySelectedCurrency,
      })
    );
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
        <p className="text-muted-foreground">
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
          allRates={allAvailableCurrencies}
          inputPlaceholder="Enter ZiG amount"
        />

        <CurrencyInputSection
          inputId="foreign-amount-input"
          amount={secondaryAmount}
          onAmountChange={handleSecondaryAmountChange}
          selectedCurrency={secondarySelectedCurrency}
          onCurrencyChange={setSecondarySelectedCurrency}
          allRates={allAvailableCurrencies}
          inputPlaceholder="Enter foreign currency amount"
        />
      </div>
    </div>
  );
};

export default CurrencyConverter;
