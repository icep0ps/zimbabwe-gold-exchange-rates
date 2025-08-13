"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "./ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import { useMemo } from "react";

interface ChartAreaLinearProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  timeKey: string;
}

export default function ChartAreaLinear({
  data,
  dataKey,
  timeKey,
}: ChartAreaLinearProps) {
  const numberOfRates = data.length;
  const fourteenDays = 14;

  const processedData = useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn("ChartAreaLinear: 'data' prop is not an array.", data);
      return [];
    }

    return data
      .map((item, index) => {
        const value = parseFloat(item[dataKey]);

        if (isNaN(value)) {
          console.warn(
            `ChartAreaLinear: Skipping data point at index ${index} due to invalid value for '${dataKey}':`,
            item[dataKey]
          );
          return null;
        }
        return { ...item, [dataKey]: value };
      })
      .filter(Boolean);
  }, [data, dataKey]);

  const chartConfig: ChartConfig = useMemo(
    () => ({
      [dataKey]: {
        label: "Exchange Rate (ZWG)",
        color: "hsl(var(--chart-1))",
      },
    }),
    [dataKey]
  );

  const formatXAxisDateTick = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const formatYAxisRateTick = (value: number) => {
    if (typeof value !== "number" || isNaN(value)) {
      return "";
    }
    return value.toFixed(3);
  };

  return (
    <Card className="border-0 bg-transparent shadow-none w-full">
      <CardContent className="p-0">
        <ChartContainer config={chartConfig} className="p-0 max-h-52 w-full">
          <AreaChart
            accessibilityLayer
            data={processedData}
            margin={{
              top: 5,
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              interval={numberOfRates >= fourteenDays ? 2 : 0}
              dataKey={timeKey}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={formatXAxisDateTick}
            />
            <YAxis
              dataKey={dataKey}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tickFormatter={formatYAxisRateTick}
            />

            <ChartTooltip
              cursor={{ strokeDasharray: "5,5" }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    if (isNaN(date.getTime())) {
                      return label;
                    }
                    return date.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    });
                  }}
                />
              }
            />

            <defs>
              <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.8} stopColor={"#22c55e"} />
                <stop offset="55%" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <Area
              dataKey={dataKey}
              type="linear"
              fill="url(#fillRate)"
              fillOpacity={0.4}
              stroke={"#22c55e"}
              strokeWidth={1}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
