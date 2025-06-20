"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "./ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import { useMemo } from "react"; // Ensure useMemo is imported

interface ChartAreaLinearProps {
  data: Array<Record<string, any>>;
  dataKey: string; // Expected to be "mid_rate_zwg"
  timeKey: string; // Expected to be "created_at"
}

export default function ChartAreaLinear({
  data,
  dataKey,
  timeKey,
}: ChartAreaLinearProps) {
  // --- Data Pre-processing ---
  // Use useMemo to process the data, ensuring 'dataKey' values are numbers.
  // This helps prevent 'NaN' errors in Recharts.
  const processedData = useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn("ChartAreaLinear: 'data' prop is not an array.", data);
      return [];
    }

    return data
      .map((item, index) => {
        // Attempt to parse the value for the specified dataKey
        const value = parseFloat(item[dataKey]);

        // If the parsed value is NaN, log a warning and return null for this item
        // It will be filtered out next.
        if (isNaN(value)) {
          console.warn(
            `ChartAreaLinear: Skipping data point at index ${index} due to invalid value for '${dataKey}':`,
            item[dataKey]
          );
          return null; // Mark for removal
        }
        // Return a new object with the dataKey value as a number
        return { ...item, [dataKey]: value };
      })
      .filter(Boolean); // Filter out any nulls (invalid data points)
  }, [data, dataKey]); // Re-process if the original data or dataKey changes

  // --- Chart Configuration ---
  const chartConfig: ChartConfig = useMemo(
    () => ({
      [dataKey]: {
        label: "Exchange Rate (ZWG)", // More descriptive label
        color: "hsl(var(--chart-1))",
      },
    }),
    [dataKey]
  );

  // --- X-Axis Tick Formatter ---
  // Function to format X-Axis ticks from "YYYY-MM-DD" to "DD Mon"
  const formatXAxisDateTick = (value: string) => {
    const date = new Date(value);
    // Check for invalid date to prevent errors
    if (isNaN(date.getTime())) {
      // console.warn("ChartAreaLinear: Invalid date value for X-Axis tick:", value);
      return value; // Return original value if invalid
    }
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  // --- Y-Axis Tick Formatter ---
  // Function to format Y-Axis ticks to 3 decimal places
  const formatYAxisRateTick = (value: number) => {
    // Ensure value is a number before toFixed
    if (typeof value !== "number" || isNaN(value)) {
      return ""; // Or some other placeholder for invalid numbers
    }
    return value.toFixed(3);
  };

  return (
    <Card className="border-0 bg-transparent shadow-none w-full">
      <CardContent className="p-0">
        <ChartContainer config={chartConfig} className="p-0 max-h-52 w-full">
          <AreaChart
            accessibilityLayer
            data={processedData} // Use the processed and validated data here
            margin={{
              top: 5,
              right: 0,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={timeKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatXAxisDateTick}
            />
            <YAxis
              dataKey={dataKey} // This will be "mid_rate_zwg"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={["dataMin - 0.05", "dataMax + 0.05"]} // Adjust domain slightly
              tickFormatter={formatYAxisRateTick}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />

            <defs>
              <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopOpacity={0.8} stopColor={"#22c55e"} />
                <stop offset="55%" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <Area
              dataKey={dataKey} // This will plot "mid_rate_zwg"
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
