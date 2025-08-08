import { CalendarIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "~/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
  TableHeader,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { currencies } from "country-data";
import type { Rate } from "~/lib/types";

interface Props {
  data: Rate[];
}

export default function RatesDataTable({ data }: Props) {
  const sortedData = [...data].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const calculateTrend = (current: string, previous?: string) => {
    if (!previous) return null;

    const currentVal = Number.parseFloat(current);
    const previousVal = Number.parseFloat(previous);
    const change = currentVal - previousVal;
    const percentageChange = (change / previousVal) * 100;

    return {
      change,
      percentageChange,
      isUp: change > 0,
      isDown: change < 0,
    };
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 scroll-mt-20" id="exchange-rates">
        <h2 className="text-3xl font-bold text-primary text-center sm:text-left">
          All Exchange Rates
        </h2>
        <p className="text-base text-muted-foreground text-center sm:text-left leading-relaxed">
          Our tables are meticulously updated with the latest information posted
          by the Reserve Bank of Zimbabwe, ensuring you have access to reliable
          and up-to-date data.
        </p>
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <Badge variant="outline" className="text-xs">
            {sortedData.length} currencies
          </Badge>
          <Badge variant="outline" className="text-xs">
            Last updated:{" "}
            {sortedData[0]
              ? new Date(sortedData[0].created_at).toLocaleDateString("en-GB")
              : "N/A"}
          </Badge>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Currency</TableHead>
                <TableHead className="text-center font-semibold" colSpan={3}>
                  ZWG Rates
                </TableHead>
                <TableHead className="text-center font-semibold" colSpan={3}>
                  Original Rates
                </TableHead>
                <TableHead className="font-semibold">Date Recorded</TableHead>
              </TableRow>
              <TableRow className="bg-muted/25">
                <TableHead></TableHead>
                <TableHead className="text-sm font-medium">Mid Rate</TableHead>
                <TableHead className="text-sm font-medium">Bid</TableHead>
                <TableHead className="text-sm font-medium">Ask</TableHead>
                <TableHead className="text-sm font-medium">Mid Rate</TableHead>
                <TableHead className="text-sm font-medium">Bid</TableHead>
                <TableHead className="text-sm font-medium">Ask</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((currency, index) => (
                <TableRow
                  key={`${currency.currency}-${currency.created_at}-desktop-${index}`}
                  className={cn(
                    index % 2 === 0 ? "bg-background" : "bg-muted/25"
                  )}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{currency.currency}</div>
                      <div className="text-sm text-muted-foreground">
                        {currencies[currency.currency.toString()]?.name ??
                          "Unknown"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {Number.parseFloat(currency.mid_rate_zwg).toFixed(4)}
                        </span>
                      </div>
                      {(() => {
                        const trend = calculateTrend(
                          currency.mid_rate_zwg,
                          currency.previous_rate?.mid_rate_zwg
                        );
                        if (!trend || (!trend.isUp && !trend.isDown))
                          return null;

                        return (
                          <div>
                            <span className="flex items-center gap-1">
                              <div className={cn("p-1")}>
                                {trend.isUp ? (
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  trend.isUp ? "text-green-600" : "text-red-600"
                                )}
                              >
                                {trend.isUp ? "+" : ""}
                                {trend.percentageChange.toFixed(2)}%
                              </span>
                            </span>
                            <p className="text-muted-foreground text-xs pl-3">
                              FROM: {currency.previous_rate?.mid_rate_zwg}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {Number.parseFloat(currency.bid_rate_zwg).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    {Number.parseFloat(currency.ask_rate_zwg).toFixed(4)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {Number.parseFloat(currency.mid_rate).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    {Number.parseFloat(currency.bid).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    {Number.parseFloat(currency.ask).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="size-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(currency.created_at).toLocaleDateString(
                          "en-GB"
                        )}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="grid grid-cols-1 gap-4">
          {sortedData.map((currency, index) => (
            <Card
              key={`${currency.currency}-${currency.created_at}-mobile-${index}`}
              className="shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {currency.currency}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currencies[currency.currency.toString()]?.name ??
                        "Unknown"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(currency.created_at).toLocaleDateString("en-GB")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue="zwg" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="zwg">ZWG Rates</TabsTrigger>
                    <TabsTrigger value="original">Original Rates</TabsTrigger>
                  </TabsList>
                  <TabsContent value="zwg" className="space-y-3 mt-4 p-0">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Mid Rate
                        </div>
                        <div className="font-semibold text-sm mb-1">
                          {Number.parseFloat(currency.mid_rate_zwg).toFixed(4)}
                        </div>
                        {(() => {
                          const trend = calculateTrend(
                            currency.mid_rate_zwg,
                            currency.previous_rate?.mid_rate_zwg
                          );
                          if (!trend || (!trend.isUp && !trend.isDown))
                            return null;

                          return (
                            <div className="flex items-center justify-center gap-1">
                              <div className={cn("p-0.5")}>
                                {trend.isUp ? (
                                  <TrendingUp className="w-2.5 h-2.5 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-2.5 h-2.5 text-red-600" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-xs",
                                  trend.isUp ? "text-green-600" : "text-red-600"
                                )}
                              >
                                {trend.isUp ? "+" : ""}
                                {trend.percentageChange.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Bid
                        </div>
                        <div className="text-sm">
                          {Number.parseFloat(currency.bid_rate_zwg).toFixed(4)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Ask
                        </div>
                        <div className="text-sm">
                          {Number.parseFloat(currency.ask_rate_zwg).toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="original" className="space-y-3 mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Mid Rate
                        </div>
                        <div className="font-semibold text-sm">
                          {Number.parseFloat(currency.mid_rate).toFixed(4)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Bid
                        </div>
                        <div className="text-sm">
                          {Number.parseFloat(currency.bid).toFixed(4)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          Ask
                        </div>
                        <div className="text-sm">
                          {Number.parseFloat(currency.ask).toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
