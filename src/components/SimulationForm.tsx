
import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import RestaurantSelector from "@/components/RestaurantSelector";
import DateSelector from "@/components/DateSelector";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Play } from "lucide-react";
import { format } from "date-fns";
import { UploadedData, SimulationOptions } from "@/types";
import { prepareSimulationData } from "@/utils/simulationUtils";

interface SimulationFormProps {
  uploadedData: UploadedData;
  simulationOptions: SimulationOptions;
  selectedDate: Date | undefined;
  onFileUploaded: (data: any[], fileType: "maps" | "reservations") => void;
  onDateChange: (date: Date | undefined) => void;
  onMealShiftChange: (shift: string) => void;
  onRestaurantChange: (id: string) => void;
  onStartSimulation: (simulationData: any) => void;
}

const SimulationForm = ({
  uploadedData,
  simulationOptions,
  selectedDate,
  onFileUploaded,
  onDateChange,
  onMealShiftChange,
  onRestaurantChange,
  onStartSimulation,
}: SimulationFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const startSimulation = () => {
    if (!uploadedData.maps || !uploadedData.reservations) {
      toast.error("Please upload both maps and reservations data");
      return;
    }

    if (!simulationOptions.date) {
      toast.error("Please select a date");
      return;
    }

    setIsLoading(true);

    try {
      const data = prepareSimulationData(
        uploadedData.maps,
        uploadedData.reservations,
        simulationOptions
      );
      
      onStartSimulation(data);
      toast.success("Simulation data prepared successfully");
    } catch (error) {
      console.error("Error preparing simulation data:", error);
      toast.error("Error preparing simulation data. Please check your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUpload
          label="Upload Maps Data"
          fileType="maps"
          onFileUploaded={onFileUploaded}
        />
        <FileUpload
          label="Upload Reservations Data"
          fileType="reservations"
          onFileUploaded={onFileUploaded}
        />
      </div>

      <Separator className="my-8" />

      <div className="space-y-6">
        <RestaurantSelector
          value={simulationOptions.restaurantId}
          onChange={onRestaurantChange}
        />
        
        <DateSelector
          date={selectedDate}
          onDateChange={onDateChange}
          mealShift={simulationOptions.mealShift}
          onMealShiftChange={onMealShiftChange}
        />
      </div>

      <div className="flex justify-center mt-8">
        <Button
          onClick={startSimulation}
          disabled={
            !uploadedData.maps ||
            !uploadedData.reservations ||
            !simulationOptions.date ||
            isLoading
          }
          className="shadow-md hover:shadow-lg transition-all px-8 py-6 animate-pulse"
        >
          <Play className="mr-2 h-5 w-5" />
          {isLoading ? "Preparing Simulation..." : "Start Simulation"}
        </Button>
      </div>
    </div>
  );
};

export default SimulationForm;
