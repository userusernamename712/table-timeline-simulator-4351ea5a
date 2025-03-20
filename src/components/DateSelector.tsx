
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MEAL_SHIFTS } from "@/utils/simulationUtils";
import { useState, useEffect } from "react";

interface DateSelectorProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  mealShift: string;
  onMealShiftChange: (shift: string) => void;
}

const DateSelector = ({
  date,
  onDateChange,
  mealShift,
  onMealShiftChange,
}: DateSelectorProps) => {
  const [calendarYear, setCalendarYear] = useState<number>(date?.getFullYear() || new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<Date>(date || new Date());
  
  // Generate array of years (5 years before and after current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  // Update the calendar month when date changes
  useEffect(() => {
    if (date) {
      setCalendarMonth(date);
    }
  }, [date]);

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year);
    setCalendarYear(newYear);
    
    // Update the calendar month with the new year
    const newDate = new Date(calendarMonth);
    newDate.setFullYear(newYear);
    setCalendarMonth(newDate);
    
    // If a date is already selected, update it to the new year
    if (date) {
      const updatedDate = new Date(date);
      updatedDate.setFullYear(newYear);
      onDateChange(updatedDate);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
      <div>
        <div className="mb-2 text-sm font-medium">Date</div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full glass-card border border-border/50 shadow-sm justify-start text-left font-normal"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {date ? (
                  format(date, "PPP")
                ) : (
                  <span className="text-muted-foreground">Select date</span>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-white/90 backdrop-blur-lg border border-border/50"
            align="start"
          >
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-sm font-medium">Year</span>
              <Select value={calendarYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8 w-[100px]">
                  <SelectValue placeholder={calendarYear.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              initialFocus
              className="rounded-md pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium">Meal Shift</div>
        <Select value={mealShift} onValueChange={onMealShiftChange}>
          <SelectTrigger className="w-full glass-card border border-border/50 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select shift" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white/90 backdrop-blur-lg border border-border/50">
            {MEAL_SHIFTS.map((shift) => (
              <SelectItem
                key={shift}
                value={shift}
                className="transition-colors duration-200 focus:bg-primary/10 focus:text-foreground"
              >
                {shift}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default DateSelector;
