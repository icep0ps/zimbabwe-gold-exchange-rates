import { InfoIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ChartAreaLinear from "./chart";
import type { Currency } from "~/lib/types";
import { currencies } from "country-data";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ExchangeRateOverviewCardProps {
  officialRate: Currency;
  chartRates: Currency[];
}

export default function ExchangeRateOverviewCard({
  officialRate,
  chartRates,
}: ExchangeRateOverviewCardProps) {
  const currentRateVal = Number.parseFloat(officialRate.mid_rate_zwg);
  const previousRateVal = Number.parseFloat(
    officialRate.previous_rate?.mid_rate_zwg ?? "0"
  );
  const rateChange = currentRateVal - previousRateVal;
  const ratePercentageChange = (rateChange / previousRateVal) * 100;

  const currentRate = currentRateVal;
  const change = rateChange.toFixed(5);
  const percentageChange = ratePercentageChange.toFixed(2);
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

  const currentDate = formatDate(officialRate.created_at);

  return (
    <Card className="bg-transparent border-none shadow-none col-span-1 lg:col-span-2">
      <CardHeader className="space-y-1 pb-2 px-0">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          {officialRate.currency} Exchange Rate
        </CardTitle>
        <CardDescription className="text-base text-gray-600 dark:text-gray-400 text-left">
          Official bank rate for 1{" "}
          {currencies[officialRate.currency.toString()]?.name ??
            officialRate.currency}{" "}
          equals
        </CardDescription>
        <section className="flex items-baseline gap-2 mt-2">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            {currentRate.toFixed(4)}{" "}
            <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
              ZWG
            </span>
          </h1>
          <h2
            className={cn(
              "text-lg font-semibold",
              isPositiveChange ? "text-green-600" : "text-red-600"
            )}
          >
            {changeSign}
            {change} ({changeSign}
            {percentageChange}%)
          </h2>
        </section>
        <CardDescription className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>
            {officialRate.currency} Rate: {officialRate.mid_rate}{" "}
            {officialRate.currency}
          </span>
          <span>•</span>
          <span>
            {currentDate}, {currentTime} GMT+2
          </span>
          <span>•</span>
          <span>Status:</span>
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
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs defaultValue="1d">
          <TabsList className="mb-3 h-8">
            <TabsTrigger value="1d" className="text-sm px-3 py-1">
              1D
            </TabsTrigger>
            <TabsTrigger value="5d" className="text-sm px-3 py-1">
              5D
            </TabsTrigger>
            <TabsTrigger value="1m" className="text-sm px-3 py-1">
              1M
            </TabsTrigger>
          </TabsList>
          <TabsContent value="1d">
            <ChartAreaLinear
              data={chartRates}
              dataKey="mid_rate_zwg"
              timeKey="created_at"
            />
          </TabsContent>
          <TabsContent value="5d">
            <ChartAreaLinear
              data={chartRates}
              dataKey="mid_rate_zwg"
              timeKey="created_at"
            />
          </TabsContent>
          <TabsContent value="1m">
            <ChartAreaLinear data={chartRates} dataKey="rate" timeKey="date" />
          </TabsContent>
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
