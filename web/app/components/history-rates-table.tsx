import type { ColumnDef } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "~/components/data-table/data-table";
import { DataTableToolbar } from "~/components/data-table/data-table-toolbar";
import { DateSelector } from "~/components/date-selector";
import type { Rate } from "~/lib/types";
import { cn } from "~/lib/utils";
import { currencies } from "country-data";
import { CalendarIcon, TrendingDown, TrendingUp } from "lucide-react";

interface HistoryRatesDataTableProps {
  data: Rate[];
}

export function HistoryRatesDataTable({ data }: HistoryRatesDataTableProps) {
  const [columnFilters, setColumnFilters] = useState<any[]>([]);
  const [sorting, setSorting] = useState<any[]>([]);

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

  const columns: ColumnDef<Rate>[] = [
    {
      accessorKey: "currency",
      header: "Currency",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.currency}</div>
          <div className="text-sm text-muted-foreground">
            {currencies[row.original.currency.toString()]?.name ?? "Unknown"}
          </div>
        </div>
      ),
      enableSorting: true,
      enableHiding: false,
      meta: {
        label: "Currency",
        variant: "text",
      },
    },
    // ZiG Rates Group
    {
      id: "zig_rates",
      header: () => <div className="text-center font-semibold">ZiG Rates</div>,
      columns: [
        {
          accessorKey: "mid_rate_zwg",
          header: "Mid Rate",
          cell: ({ row }) => {
            const trend = calculateTrend(
              row.original.mid_rate_zwg,
              row.original.previous_rate?.mid_rate_zwg
            );
            return (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="font-medium">
                    {Number.parseFloat(row.original.mid_rate_zwg).toFixed(4)}
                  </span>
                </div>
                {trend && (trend.isUp || trend.isDown) && (
                  <div>
                    <span className="flex items-center gap-1">
                      <div className={cn("p-1")}>
                        {trend.isUp ? (
                          <TrendingUp className="w-3 h-3 text-red-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-green-600" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          trend.isUp ? "text-red-600" : "text-green-600"
                        )}
                      >
                        {trend.isUp ? "+" : ""}
                        {trend.percentageChange.toFixed(2)}%
                      </span>
                    </span>
                    <p className="text-muted-foreground text-xs pl-3">
                      FROM: {row.original.previous_rate?.mid_rate_zwg}
                    </p>
                  </div>
                )}
              </div>
            );
          },
          meta: { label: "Mid Rate (ZiG)", variant: "number" },
        },
        {
          accessorKey: "bid_rate_zwg",
          header: "Bid",
          cell: ({ row }) =>
            Number.parseFloat(row.original.bid_rate_zwg).toFixed(4),
          meta: { label: "Bid (ZiG)", variant: "number" },
        },
        {
          accessorKey: "ask_rate_zwg",
          header: "Ask",
          cell: ({ row }) =>
            Number.parseFloat(row.original.ask_rate_zwg).toFixed(4),
          meta: { label: "Ask (ZiG)", variant: "number" },
        },
      ],
    },
    // Original Rates Group
    {
      id: "original_rates",
      header: () => (
        <div className="text-center font-semibold">Original Rates</div>
      ),
      columns: [
        {
          accessorKey: "mid_rate",
          header: "Mid Rate",
          cell: ({ row }) => Number.parseFloat(row.original.mid_rate).toFixed(4),
          meta: { label: "Mid Rate (Original)", variant: "number" },
        },
        {
          accessorKey: "bid",
          header: "Bid",
          cell: ({ row }) => Number.parseFloat(row.original.bid).toFixed(4),
          meta: { label: "Bid (Original)", variant: "number" },
        },
        {
          accessorKey: "ask",
          header: "Ask",
          cell: ({ row }) => Number.parseFloat(row.original.ask).toFixed(4),
          meta: { label: "Ask (Original)", variant: "number" },
        },
      ],
    },
    {
      accessorKey: "created_at",
      header: "Date Recorded",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className="text-sm">
            {new Date(row.original.created_at).toLocaleDateString("en-GB")}
          </span>
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: false, // Remove redundant date filter
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <DateSelector />
      </DataTableToolbar>
    </DataTable>
  );
}