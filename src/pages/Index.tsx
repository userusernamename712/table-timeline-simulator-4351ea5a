
import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import RestaurantSelector from "@/components/RestaurantSelector";
import DateSelector from "@/components/DateSelector";
import TimelineSimulation from "@/components/TimelineSimulation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Play, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { UploadedData, SimulationOptions } from "@/types";
import { prepareSimulationData } from "@/utils/simulationUtils";

const Index = () => {
  const [uploadedData, setUploadedData] = useState<UploadedData>({
    reservations: null,
    maps: null,
  });
  
  const [simulationOptions, setSimulationOptions] = useState<SimulationOptions>({
    date: "",
    mealShift: "Comida",
    restaurantId: "restaurante-saona-blasco-ibanez",
  });
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const [simulationData, setSimulationData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  const handleFileUploaded = (data: any[], fileType: "maps" | "reservations") => {
    setUploadedData((prev) => ({
      ...prev,
      [fileType]: data,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setSimulationOptions((prev) => ({
        ...prev,
        date: format(date, "yyyy-MM-dd"),
      }));
    } else {
      setSimulationOptions((prev) => ({
        ...prev,
        date: "",
      }));
    }
  };

  const handleMealShiftChange = (shift: string) => {
    setSimulationOptions((prev) => ({
      ...prev,
      mealShift: shift,
    }));
  };

  const handleRestaurantChange = (id: string) => {
    setSimulationOptions((prev) => ({
      ...prev,
      restaurantId: id,
    }));
  };

  const handleReset = () => {
    setShowSimulation(false);
  };

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
      
      setSimulationData(data);
      setShowSimulation(true);
      toast.success("Simulation data prepared successfully");
    } catch (error) {
      console.error("Error preparing simulation data:", error);
      toast.error("Error preparing simulation data. Please check your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="container mx-auto py-8 max-w-6xl px-4">
        <div className="text-center mb-12 animate-slide-down">
          <h1 className="text-3xl font-bold tracking-tight">Table Timeline Simulator</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Upload restaurant data, select parameters, and visualize table occupancy throughout the day
          </p>
        </div>

        {!showSimulation ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload
                label="Upload Maps Data"
                fileType="maps"
                onFileUploaded={handleFileUploaded}
              />
              <FileUpload
                label="Upload Reservations Data"
                fileType="reservations"
                onFileUploaded={handleFileUploaded}
              />
            </div>

            <Separator className="my-8" />

            <div className="space-y-6">
              <RestaurantSelector
                value={simulationOptions.restaurantId}
                onChange={handleRestaurantChange}
              />
              
              <DateSelector
                date={selectedDate}
                onDateChange={handleDateChange}
                mealShift={simulationOptions.mealShift}
                onMealShiftChange={handleMealShiftChange}
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
        ) : (
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
              
              <Button variant="outline" onClick={handleReset} className="gap-2">
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
                onReset={handleReset}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
