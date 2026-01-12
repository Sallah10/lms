// components/DateRangeFilter.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";
import { CalendarIcon, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => void;
  className?: string;
}

export function DateRangeFilter({
  onDateRangeChange,
  className,
}: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Helper function to update both state and parent
  const updateDates = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
    onDateRangeChange({
      start: start || null,
      end: end || null,
    });
  };

  const applyThisWeek = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    updateDates(start, end);
  };

  const applyLastWeek = () => {
    const today = new Date();
    const start = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
    const end = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });
    updateDates(start, end);
  };

  const clearFilters = () => {
    updateDates(undefined, undefined);
  };

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {/* Date Pickers */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-[140px] justify-start"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {startDate ? format(startDate, "MMM dd") : "Start date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => {
              const newStart = date || undefined;
              setStartDate(newStart);
              onDateRangeChange({
                start: newStart || null,
                end: endDate || null,
              });
            }}
            disabled={(date) => (endDate ? date > endDate : false)}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground">-</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-[140px] justify-start"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {endDate ? format(endDate, "MMM dd") : "End date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(date) => {
              const newEnd = date || undefined;
              setEndDate(newEnd);
              onDateRangeChange({
                start: startDate || null,
                end: newEnd || null,
              });
            }}
            disabled={(date) => (startDate ? date < startDate : false)}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {/* Quick Filter Buttons */}
      <Button variant="outline" size="sm" onClick={applyThisWeek}>
        This Week
      </Button>

      <Button variant="outline" size="sm" onClick={applyLastWeek}>
        Last Week
      </Button>

      {(startDate || endDate) && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <FilterX className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
