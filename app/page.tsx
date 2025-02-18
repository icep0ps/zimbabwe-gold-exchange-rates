"use server";

import Rates from "@/components/rates";
import Faq from "@/components/faq/faq";
import Hero from "@/components/hero/hero";
import Footer from "@/components/footer/footer";
import { RatesTable } from "@/components/ratesTable/table";
import { Currencies } from "currencies-map";
import CurrencyConverter from "@/components/converter/converter";
import Database from "@/services/database/database.mjs";
import { currency } from "@/types";

const getOfficalRate = async () => {
  const rates = await Database.get.offical("USD").catch((error) => {
    throw new Error(error.message);
  });

  if (rates[0] === undefined) throw new Error("Could not find offical rate");

  return rates[0] as currency;
};

const getRates = async () => {
  const rates = await Database.get.rates().catch((error) => {
    throw new Error(error.message);
  });

  return rates
    .map((rate) => {
      return {
        ...rate,
        name:
          Currencies.names.get(rate.currency.trim()) === undefined
            ? rate.currency
            : Currencies.names.get(rate.currency.trim()),
      };
    })
    .sort((a, b) => {
      if (a.name && b.name) {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
          return -1;
        }
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        }
      }

      return 0;
    }) as currency[];
};

export default async function Home() {
  const rate = await getOfficalRate();
  const rates = await getRates();

  return (
    <section className="flex flex-col w-full relative gap-10 p-5">
      <Hero rate={rate} />
      <CurrencyConverter rate={rate} rates={rates} />
      <Rates data={rates} />
      <RatesTable data={rates} />
      <Faq rates={rates} />
      <Footer />
    </section>
  );
}
