"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/backend/lib/utils";
import { Button } from "@/frontend/components/ui/button";
import { Calendar } from "@/frontend/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/frontend/components/ui/popover";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  from?: string;
  to?: string;
}

export function DateRangePicker({
  className,
  from,
  to,
}: DateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = React.useState(false);
  const [numMonths, setNumMonths] = React.useState(2);

  // Responsive months logic
  React.useEffect(() => {
    const handleResize = () => {
      setNumMonths(window.innerWidth < 768 ? 1 : 2);
    };
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const initialDate: DateRange | undefined = React.useMemo(() => {
    const fromDate = from ? parseISO(from) : undefined;
    const toDate = to ? parseISO(to) : undefined;

    return {
      from: fromDate && isValid(fromDate) ? fromDate : undefined,
      to: toDate && isValid(toDate) ? toDate : undefined,
    };
  }, [from, to]);

  const [date, setDate] = React.useState<DateRange | undefined>(initialDate);

  React.useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  const handleSelect = (newDate: DateRange | undefined) => {
    setDate(newDate);

    // Only update URL if both dates are selected
    if (newDate?.from && newDate?.to) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", format(newDate.from, "yyyy-MM-dd"));
      params.set("to", format(newDate.to, "yyyy-MM-dd"));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      setIsOpen(false); // Close on selection
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-auto min-w-[280px] h-12 justify-start text-left font-bold rounded-2xl bg-white dark:bg-[#1a1a2e] border-border/50 dark:border-white/10 shadow-sm transition-all hover:border-primary/50 hover:shadow-md px-4 relative group",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-3 h-4.5 w-4.5 text-primary" />
            <span className="truncate pr-8">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "MMM dd, yyyy")} – {format(date.to, "MMM dd, yyyy")}
                  </>
                ) : (
                  format(date.from, "MMM dd, yyyy")
                )
              ) : (
                <span>Filter by date range...</span>
              )}
            </span>
            
            {date?.from && (
              <div 
                onClick={clearSelection}
                className="absolute right-3 p-1 rounded-full hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 rounded-3xl border-border/40 dark:border-white/10 shadow-2xl overflow-hidden" 
          align="start"
          sideOffset={8}
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={numMonths}
          />
          {numMonths === 1 && (
             <div className="p-3 border-t border-border/40 dark:border-white/10 bg-muted/20 flex justify-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Select start and end dates
                </p>
             </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
