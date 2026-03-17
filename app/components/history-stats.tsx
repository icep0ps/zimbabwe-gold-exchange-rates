import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { Rate } from "~/lib/types";
import { cn } from "~/lib/utils";

interface HistoryStatsProps {
  rates: Rate[];
}

export function HistoryStats({ rates }: HistoryStatsProps) {
  if (!rates || rates.length === 0) return null;

  // Calculate trends
  const ratesWithTrend = rates.map((rate) => {
    const current = parseFloat(rate.mid_rate_zwg);
    const previous = rate.previous_rate
      ? parseFloat(rate.previous_rate.mid_rate_zwg)
      : current;
    const change = current - previous;
    const percentage = previous !== 0 ? (change / previous) * 100 : 0;
    return { ...rate, change, percentage, previous, current };
  });

  const topGainer = [...ratesWithTrend].sort(
    (a, b) => b.percentage - a.percentage
  )[0];
  const topLoser = [...ratesWithTrend].sort(
    (a, b) => a.percentage - b.percentage
  )[0];

  // Find highest rate (Strongest against ZiG)
  const strongest = [...rates].sort(
    (a, b) => parseFloat(b.mid_rate_zwg) - parseFloat(a.mid_rate_zwg)
  )[0];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <StatsCard
        title="Highest Appreciation"
        description="The currency that gained the most value against the ZiG over the last 24 hours."
        rate={topGainer}
        type="gainer"
      />
      <StatsCard
        title="Highest Depreciation"
        description="The currency that lost the most value against the ZiG over the last 24 hours."
        rate={topLoser}
        type="loser"
      />
      <StatsCard
        title="Peak Market Valuation"
        description="The currency with the highest nominal exchange rate relative to the ZiG."
        rate={strongest}
        type="neutral"
        showTrend={false}
      />
    </div>
  );
}

function StatsCard({
  title,
  description,
  rate,
  type,
  showTrend = true,
}: {
  title: string;
  description: string;
  rate: any;
  type: "gainer" | "loser" | "neutral";
  showTrend?: boolean;
}) {
  if (!rate) return null;

  const isPositive = rate.change > 0;
  const isNegative = rate.change < 0;

  return (
    <Card className="p-2.5">
      <div className="flex flex-row items-center justify-between space-y-0">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {type === "gainer" && <TrendingUp className="h-4 w-4 text-green-500" />}
        {type === "loser" && <TrendingDown className="h-4 w-4 text-red-500" />}
        {type === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-bold">{rate.currency}</h4>
          {showTrend && (
            <span
              className={cn(
                "text-xs font-medium flex items-center",
                isPositive
                  ? "text-green-500"
                  : isNegative
                  ? "text-red-500"
                  : "text-muted-foreground"
              )}
            >
              {isPositive ? "+" : ""}{rate.percentage.toFixed(2)}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          1 {rate.currency} = {parseFloat(rate.mid_rate_zwg).toFixed(4)} ZiG
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground leading-tight pt-1">
        {description}
      </p>
    </Card>
  );
}