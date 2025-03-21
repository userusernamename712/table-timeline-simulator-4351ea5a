
import { Button } from "@/components/ui/button";
import TimelineSimulation from "@/components/TimelineSimulation";
import { RotateCcw, Filter } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OccupancyGroup, Table as TableType } from "@/types";
import { formatTime } from "@/utils/simulationUtils";

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
  const [activeTab, setActiveTab] = useState("timeline");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [reservationFilter, setReservationFilter] = useState<string>("all");

  // Group tables by max capacity
  const tableGroups = simulationData?.tables ? 
    Object.values(simulationData.tables).reduce((groups: Record<string, TableType[]>, table: TableType) => {
      const capacity = table.max_capacity;
      if (!groups[capacity]) {
        groups[capacity] = [];
      }
      groups[capacity].push(table);
      return groups;
    }, {}) : {};

  const sortedCapacities = Object.keys(tableGroups).sort((a, b) => parseInt(a) - parseInt(b));

  // Get unique capacities for filter dropdown
  const tableCapacities = sortedCapacities.map(cap => ({
    value: cap,
    label: `${cap} People`
  }));

  // Filter tables based on selection
  const getFilteredTables = () => {
    if (tableFilter === "all") {
      return Object.values(simulationData?.tables || {});
    }
    return Object.values(simulationData?.tables || {}).filter(
      (table: TableType) => table.max_capacity.toString() === tableFilter
    );
  };

  // Filter reservations based on selection
  const getFilteredReservations = () => {
    if (!simulationData?.occupancyGroups) return [];
    
    if (reservationFilter === "all") {
      return simulationData.occupancyGroups;
    }
    
    const size = parseInt(reservationFilter);
    return simulationData.occupancyGroups.filter((group: OccupancyGroup) => {
      // Calculate total capacity for this reservation by summing up the max capacities of assigned tables
      const tableCapacities = group.table_ids.map(id => {
        const table = simulationData.tables[id];
        return table ? table.max_capacity : 0;
      });
      
      const totalCapacity = tableCapacities.reduce((sum, capacity) => sum + capacity, 0);
      return totalCapacity === size;
    });
  };

  // Get unique party sizes for filter dropdown
  const getReservationSizes = () => {
    if (!simulationData?.occupancyGroups) return [];
    
    const sizes = new Set();
    simulationData.occupancyGroups.forEach((group: OccupancyGroup) => {
      const tableCapacities = group.table_ids.map(id => {
        const table = simulationData.tables[id];
        return table ? table.max_capacity : 0;
      });
      
      const totalCapacity = tableCapacities.reduce((sum, capacity) => sum + capacity, 0);
      sizes.add(totalCapacity);
    });
    
    return Array.from(sizes).sort((a: any, b: any) => a - b).map(size => ({
      value: size.toString(),
      label: `${size} People`
    }));
  };

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <TimelineSimulation
              tables={simulationData.tables}
              occupancyGroups={simulationData.occupancyGroups}
              endTime={simulationData.endTime}
              shiftStart={simulationData.shiftStart}
              firstCreationTime={simulationData.firstCreationTime}
              lastReservationTime={simulationData.lastReservationTime}
              onReset={onReset}
            />
          </TabsContent>

          <TabsContent value="tables" className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Restaurant Tables</CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={tableFilter}
                      onValueChange={setTableFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by capacity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Capacities</SelectItem>
                        {tableCapacities.map(cap => (
                          <SelectItem key={cap.value} value={cap.value}>
                            {cap.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  {tableFilter === "all" ? (
                    // Display tables grouped by capacity
                    sortedCapacities.map(capacity => (
                      <div key={capacity} className="space-y-3">
                        <h3 className="font-medium text-md">Tables for {capacity} People</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Table ID</TableHead>
                              <TableHead>Capacity</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableGroups[capacity].map((table: TableType) => (
                              <TableRow key={table.table_id}>
                                <TableCell>Table {table.table_id}</TableCell>
                                <TableCell>{table.max_capacity}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    table.occupied ? 
                                    "bg-red-100 text-red-800" : 
                                    "bg-green-100 text-green-800"
                                  }`}>
                                    {table.occupied ? "Occupied" : "Available"}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))
                  ) : (
                    // Display filtered tables
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Table ID</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredTables().map((table: TableType) => (
                          <TableRow key={table.table_id}>
                            <TableCell>Table {table.table_id}</TableCell>
                            <TableCell>{table.max_capacity}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                table.occupied ? 
                                "bg-red-100 text-red-800" : 
                                "bg-green-100 text-green-800"
                              }`}>
                                {table.occupied ? "Occupied" : "Available"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reservations" className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Reservations</CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={reservationFilter}
                      onValueChange={setReservationFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by party size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sizes</SelectItem>
                        {getReservationSizes().map((size: any) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tables</TableHead>
                      <TableHead>Party Size</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredReservations().map((reservation: OccupancyGroup, index: number) => {
                      const tables = reservation.table_ids;
                      const totalCapacity = tables.reduce((sum, id) => {
                        const table = simulationData.tables[id];
                        return sum + (table ? table.max_capacity : 0);
                      }, 0);
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {tables.map(id => (
                                <span key={id} className="px-2 py-1 bg-primary/10 rounded-md text-xs">
                                  Table {id}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{totalCapacity} people</TableCell>
                          <TableCell>
                            {formatTime(reservation.start, simulationData.shiftStart)}
                          </TableCell>
                          <TableCell>{reservation.duration} min</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SimulationView;
