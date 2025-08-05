import { currencies } from "country-data";
import {
  differenceInCalendarMonths,
  differenceInDays,
  format,
  subDays,
  subMonths,
} from "date-fns";
import { InfoIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useMemo } from "react";
import type { Rate } from "~/lib/types";
import { cn } from "~/lib/utils";
import ChartAreaLinear from "./chart";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

function formatIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ExchangeRateOverviewCardProps {
  officialRate: Rate;
  chartRates: Rate[];
  allAvailableCurrencies: { name: string }[];
}

const TOP_CURRENCIES_FILTER = ["USD", "EUR", "GBP", "ZAR", "CAD"];

export default function ExchangeRateOverviewCard({
  officialRate,
  chartRates,
  allAvailableCurrencies,
}: ExchangeRateOverviewCardProps) {
  const [startDateParam, setStartDate] = useQueryState("startDate", {
    shallow: false,
  });
  const [endDateParam, setEndDate] = useQueryState("endDate");
  const [targetCurrencyParam, setTargetCurrency] = useQueryState(
    "targetCurrency",
    {
      defaultValue: officialRate.currency,
      shallow: false,
    }
  );

  const currentRateVal = Number.parseFloat(officialRate.mid_rate_zwg);
  const previousRateVal = Number.parseFloat(
    officialRate.previous_rate?.mid_rate_zwg ?? "0"
  );
  const rateChange = currentRateVal - previousRateVal;

  let ratePercentageChange;
  if (previousRateVal === 0) {
    ratePercentageChange = null;
  } else {
    ratePercentageChange = (rateChange / previousRateVal) * 100;
  }

  const currentRate = currentRateVal;
  const change = rateChange.toFixed(5);
  const percentageChange =
    ratePercentageChange === null ? "N/A" : ratePercentageChange.toFixed(2);
  const changeSign = rateChange >= 0 ? "+" : "";
  const isPositiveChange = rateChange >= 0;

  const currentTime = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Harare",
  });

  const currentZimbabweDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Harare",
  });

  const isToday = officialRate.created_at === currentZimbabweDate;

  const rateLastUpdated = formatDate(officialRate.created_at);

  const topCurrenciesForSelect = useMemo(() => {
    return allAvailableCurrencies.filter((c) =>
      TOP_CURRENCIES_FILTER.includes(c.name)
    );
  }, [allAvailableCurrencies]);

  const handleCurrencyChange = (currency: string) => {
    setTargetCurrency(currency);
  };

  const handleTabChange = (value: string) => {
    const today = new Date();
    let calculatedStartDate: Date;

    switch (value) {
      case "7d":
        calculatedStartDate = subDays(today, 7);
        break;
      case "14d":
        calculatedStartDate = subDays(today, 14);
        break;
      case "1m":
        calculatedStartDate = subMonths(today, 1);
        break;
      default:
        calculatedStartDate = subDays(today, 7);
        break;
    }
    const calculatedEndDate = new Date();

    setStartDate(formatIsoDate(calculatedStartDate));
    setEndDate(formatIsoDate(calculatedEndDate));
  };

  const defaultTabValue = useMemo(() => {
    const today = new Date();
    const normalizedToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (startDateParam && endDateParam) {
      const parsedStartDate = new Date(startDateParam);
      const parsedEndDate = new Date(endDateParam);

      if (parsedEndDate.toDateString() === normalizedToday.toDateString()) {
        const diffDays = differenceInDays(parsedEndDate, parsedStartDate);
        const diffMonths = differenceInCalendarMonths(
          parsedEndDate,
          parsedStartDate
        );

        if (diffDays === 7) {
          return "7d";
        }
        if (diffDays === 14) {
          return "14d";
        }
        if (diffMonths === 1 && diffDays >= 28 && diffDays <= 31) {
          return "1m";
        }
      }
    }
    return "14d";
  }, [startDateParam, endDateParam]);

  return (
    <Card className="bg-transparent border-none shadow-none col-span-1 lg:col-span-2">
      <CardHeader className="space-y-1 pb-2 px-0">
        <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
          {officialRate.currency} Exchange Rate
        </CardTitle>
        <CardDescription className="text-base text-gray-600 dark:text-gray-400 text-left">
          Official bank rate for 1{" "}
          {currencies[officialRate.currency.toString()]?.name ??
            officialRate.currency}{" "}
        </CardDescription>
        <section className="flex items-baseline gap-2 ">
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
            {currentRate.toFixed(4)}{" "}
            <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
              Zimbabwe Gold (ZWG)
            </span>
          </h1>
          <h2
            className={cn(
              "text-lg font-semibold",
              isPositiveChange ? "text-green-600" : "text-red-600"
            )}
          >
            {previousRateVal !== 0 && `${changeSign}${change} `}
            {percentageChange !== "N/A" &&
              `(${changeSign}${percentageChange}%)`}
          </h2>
        </section>
        <CardDescription className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-2 ">
          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
            <span>
              <span className="font-bold">{officialRate.currency} Rate: </span>
              {officialRate.mid_rate} {officialRate.currency}
            </span>

            <span className="hidden sm:inline">•</span>

            <span>
              <span className="font-bold">Last updated: </span>
              {rateLastUpdated}, {currentTime} GMT+2
            </span>

            <span className="hidden sm:inline">•</span>

            <div className="flex items-center gap-1">
              <span className="font-bold">Status:</span>
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-0.5 text-xs font-semibold",
                  isToday
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
                )}
              >
                <span className="relative flex h-2 w-2 mr-1">
                  {isToday && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  )}
                  <span
                    className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      isToday ? "bg-green-500" : "bg-yellow-500"
                    )}
                  ></span>
                </span>
                {isToday ? "Updated" : "Outdated"}
              </Badge>
            </div>
          </div>{" "}
          <div className="md:hidden w-full mt-2">
            <Select
              value={targetCurrencyParam || officialRate.currency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Currencies</SelectLabel>
                  {topCurrenciesForSelect.map((currency, index) => (
                    <SelectItem
                      key={`${currency.name}-dropdown`}
                      value={currency.name}
                    >
                      {currency.name} - {currencies[currency.name]?.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs
          defaultValue={defaultTabValue}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="7d" className="text-sm px-3 py-1">
              7D
            </TabsTrigger>
            <TabsTrigger value="14d" className="text-sm px-3 py-1">
              14D
            </TabsTrigger>
            <TabsTrigger value="1m" className="text-sm px-3 py-1">
              1M
            </TabsTrigger>
          </TabsList>
          {chartRates && chartRates.length > 0 ? (
            <>
              <TabsContent value="7d">
                <ChartAreaLinear
                  data={chartRates}
                  dataKey="mid_rate_zwg"
                  timeKey="created_at"
                />
              </TabsContent>
              <TabsContent value="14d">
                <ChartAreaLinear
                  data={chartRates}
                  dataKey="mid_rate_zwg"
                  timeKey="created_at"
                />
              </TabsContent>
              <TabsContent value="1m">
                <ChartAreaLinear
                  data={chartRates}
                  dataKey="mid_rate_zwg"
                  timeKey="created_at"
                />
              </TabsContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p>No chart information available for this period.</p>
            </div>
          )}
        </Tabs>
      </CardContent>
      <CardFooter className="w-full p-0 border">
        <p className="space-y-2 text-xs md:text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg w-full leading-relaxed">
          <Badge
            variant="outline"
            className="flex items-center justify-center bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800 "
          >
            <span className="flex gap-2 font-semibold  items-center justify-center">
              <InfoIcon className="h-3 w-3 flex-shrink-0" /> Disclaimer
            </span>
          </Badge>
          We use the mid-market rate for our bank rate and converter. This is
          for informational purposes only. These values represent the daily
          average of the Bid and Ask rates published by{" "}
          <a
            href="https://www.rbz.co.zw/index.php/research/markets/exchange-rates"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            The Reserve Bank of Zimbabwe
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
