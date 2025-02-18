"use client";

import { currency } from "@/types";
import ConverterModule from "./components/converterModule";
import { FC, useEffect, useState } from "react";
import { convert } from "@/lib/utils";

type Props = {
  rate: currency;
  rates: currency[];
};

const CurrencyConverter: FC<Props> = (props) => {
  const [secondaryCurrency, setSecondaryCurrency] = useState<currency>(
    props.rates.filter((currency) => currency.currency.trim() === "USD")[0],
  );

  const [primaryAmout, setPriamaryAmount] = useState<string>(
    secondaryCurrency.mid_zwl.toString(),
  );

  const [secondaryAmount, setSecondaryAmount] = useState<string>(
    Number(props.rate.ask).toFixed(2).toString(),
  );

  useEffect(() => {
    setSecondaryAmount(
      convert("primary", primaryAmout, {
        primary: props.rate,
        secondary: secondaryCurrency,
      }),
    );
  }, [secondaryCurrency.currency]);

  return (
    <div className="flex justify-between items-center flex-wrap max-lg:justify-center relative">
      <div className="flex flex-col gap-5 pr-5 w-1/2 max-lg:w-full max-lg:mb-10">
        <h1 className="text-3xl font-bold text-primary max-sm:text-center">
          Exchange rate calculator
        </h1>
        <p className="max-lg:text-sm max-sm:text-center">
          Effortlessly convert any supported currency into ZiG (Zimbabwe Gold),
          providing you with instant access to the value of ZiG against global
          supported currencies.
        </p>
      </div>

      <div className="flex flex-col justify-between items-start gap-5 max-w-96 w-full">
        <span className="w-full focus-within:border-accent border rounded-lg py-3 px-2 flex ">
          <span className="bg-border p-2 rounded-lg text-sm mr-3">ZiG</span>
          <input
            min={"0"}
            type="number"
            id="currency"
            value={primaryAmout}
            className="bg-background outline-none w-full"
            onChange={(event) => {
              setPriamaryAmount(parseFloat(event.target.value).toString());
              setSecondaryAmount(
                convert("primary", event.target.value, {
                  primary: props.rate,
                  secondary: secondaryCurrency,
                }),
              );
            }}
          />
        </span>

        <ConverterModule
          currency={{
            value: secondaryCurrency.currency,
            setCurrency: setSecondaryCurrency,
          }}
          amount={{
            value: secondaryAmount,
            setAmount: (event) => {
              setSecondaryAmount(event.target.value);
              setPriamaryAmount(
                convert("secondary", event.target.value, {
                  primary: props.rate,
                  secondary: secondaryCurrency,
                }),
              );
            },
          }}
          rates={props.rates as (currency & { name: string })[]}
        />
      </div>
    </div>
  );
};

export default CurrencyConverter;
