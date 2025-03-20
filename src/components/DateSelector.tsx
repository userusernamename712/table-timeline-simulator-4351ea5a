
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
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
              className="rounded-md"
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
