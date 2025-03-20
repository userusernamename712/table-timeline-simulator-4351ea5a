
import { Button } from "@/components/ui/button";
import TimelineSimulation from "@/components/TimelineSimulation";
import { RotateCcw } from "lucide-react";

interface SimulationViewProps {
  simulationData: any;
  simulationOptions: {
    date: string;
    mealShift: string;
    restaurantId: string;
  };
  onReset: () => void;
}

const SimulationView = ({
  simulationData,
  simulationOptions,
  onReset,
}: SimulationViewProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            Simulation for {simulationOptions.date} ({simulationOptions.mealShift})
          </h2>
          <p className="text-sm text-muted-foreground">
            Restaurant: {simulationOptions.restaurantId.replace("restaurante-", "").split("-").join(" ")}
          </p>
        </div>
        
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
      
      {simulationData && (
        <TimelineSimulation
          tables={simulationData.tables}
          occupancyGroups={simulationData.occupancyGroups}
          endTime={simulationData.endTime}
          shiftStart={simulationData.shiftStart}
          firstCreationTime={simulationData.firstCreationTime}
          lastReservationTime={simulationData.lastReservationTime}
          onReset={onReset}
        />
      )}
    </div>
  );
};

export default SimulationView;
