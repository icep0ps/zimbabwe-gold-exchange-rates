import { InfoIcon } from "lucide-react";
import ChartAreaLinear from "./chart";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";

interface ChartDataPoint {
  time?: string;
  date?: string;
  rate: number;
}

interface ExchangeRateCardProps {
  title: string;
  description: string;
  currentRate: string | number;
  rateCurrency: string;
  change: string;
  changePercentage: string;
  usdRateInfo: string;
  lastUpdated: string;
  status: "Updated" | "Stale" | "Error";
  dailyChartData: ChartDataPoint[];
  weeklyChartData: ChartDataPoint[];
  monthlyChartData: ChartDataPoint[];
}

export function ExchangeRateCard({
  title,
  description,
  currentRate,
  rateCurrency,
  change,
  changePercentage,
  usdRateInfo,
  lastUpdated,
  status,
  dailyChartData,
  weeklyChartData,
  monthlyChartData,
}: ExchangeRateCardProps) {
  const isPositiveChange = parseFloat(change) >= 0;

  return (
    <Card className="bg-transparent border-none shadow-none col-start-1 col-end-3">
      <CardHeader className="space-y-1 pb-2 px-0">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <p className="text-base text-muted-foreground text-left max-lg:text-center">
          {description}
        </p>
        <section className="flex items-baseline gap-1.5">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {currentRate}{" "}
            <span className="text-base font-medium text-muted-foreground">
              {rateCurrency}
            </span>
          </h1>
          <h2
            className={`text-base font-semibold ${
              isPositiveChange ? "text-green-600" : "text-red-600"
            }`}
          >
            {change} ({changePercentage})
          </h2>
        </section>
        <CardDescription className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>{usdRateInfo}</span>
          <span>•</span>
          <span>{lastUpdated}</span>
          <span>•</span>
          <span>Status:</span>
          <Badge
            variant="outline"
            className={`px-2 py-0.5 text-xs font-semibold ${
              status === "Updated"
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" // Example for other statuses
            }`}
          >
            {status === "Updated" && (
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
            {status}
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
              data={dailyChartData}
              dataKey="rate"
              timeKey="time"
            />
          </TabsContent>
          <TabsContent value="5d">
            <ChartAreaLinear
              data={weeklyChartData}
              dataKey="rate"
              timeKey="date"
            />
          </TabsContent>
          <TabsContent value="1m">
            <ChartAreaLinear
              data={monthlyChartData}
              dataKey="rate"
              timeKey="date"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="w-full p-0">
        <p className="space-y-2 text-xs md:text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg w-full leading-relaxed">
          <Badge
            variant={"outline"}
            className="flex items-center justify-center"
          >
            <span className="flex gap-2 font-semibold text-foreground items-center justify-center">
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
