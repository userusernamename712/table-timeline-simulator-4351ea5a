
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building } from "lucide-react";
import { RESTAURANT_IDS } from "@/utils/simulationUtils";

interface RestaurantSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const formatRestaurantName = (id: string): string => {
  return id
    .replace("restaurante-", "")
    .replace("restauerante-", "") // Handle typo in original data
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const RestaurantSelector = ({ value, onChange }: RestaurantSelectorProps) => {
  return (
    <div className="animate-slide-up">
      <div className="mb-2 text-sm font-medium">Restaurant</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full glass-card border border-border/50 shadow-sm">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select restaurant" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-white/90 backdrop-blur-lg border border-border/50">
          {RESTAURANT_IDS.map((id) => (
            <SelectItem
              key={id}
              value={id}
              className="transition-colors duration-200 focus:bg-primary/10 focus:text-foreground"
            >
              {formatRestaurantName(id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RestaurantSelector;
