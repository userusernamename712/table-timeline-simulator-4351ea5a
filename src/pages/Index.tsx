
import { useState } from "react";
import { toast } from "sonner";
import SimulationForm from "@/components/SimulationForm";
import SimulationView from "@/components/SimulationView";
import { UploadedData, SimulationOptions } from "@/types";
import { format } from "date-fns";

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

  const handleStartSimulation = (data: any) => {
    setSimulationData(data);
    setShowSimulation(true);
  };

  const handleReset = () => {
    setShowSimulation(false);
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
          <SimulationForm 
            uploadedData={uploadedData}
            simulationOptions={simulationOptions}
            selectedDate={selectedDate}
            onFileUploaded={handleFileUploaded}
            onDateChange={handleDateChange}
            onMealShiftChange={handleMealShiftChange}
            onRestaurantChange={handleRestaurantChange}
            onStartSimulation={handleStartSimulation}
          />
        ) : (
          <SimulationView 
            simulationData={simulationData}
            simulationOptions={simulationOptions}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
