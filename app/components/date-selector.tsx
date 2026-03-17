import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useQueryState } from "nuqs";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function DateSelector() {
  const [date, setDate] = useQueryState("date");

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Adjust for timezone offset to avoid "previous day" issue when formatting
      const offset = selectedDate.getTimezoneOffset();
      const adjustedDate = new Date(
        selectedDate.getTime() - offset * 60 * 1000
      );
      setDate(adjustedDate.toISOString().split("T")[0]);
    } else {
      setDate(null);
    }
  };

  const displayDate = date
    ? (() => {
        const [y, m, d] = date.split("-").map(Number);
        return new Date(y, m - 1, d);
      })()
    : undefined;

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayDate ? format(displayDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={displayDate}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            fromYear={2024}
            toYear={new Date().getFullYear()}
            captionLayout="dropdown-buttons"
          />
        </PopoverContent>
      </Popover>
      {date && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDate(null)}
          title="Clear date"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
