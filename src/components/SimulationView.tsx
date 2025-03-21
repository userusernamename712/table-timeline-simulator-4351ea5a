
import { Button } from "@/components/ui/button";
import TimelineSimulation from "@/components/TimelineSimulation";
import { RotateCcw, Filter, Info } from "lucide-react";
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
import { OccupancyGroup, Table as TableType, OccupancyEntry } from "@/types";
import { formatTime, formatDateTime } from "@/utils/simulationUtils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [maxCapacityFilter, setMaxCapacityFilter] = useState<string>("all");
  const [minCapacityFilter, setMinCapacityFilter] = useState<string>("all");
  const [reservationFilter, setReservationFilter] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

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

  // Get unique min capacities from tables
  const getMinCapacities = () => {
    if (!simulationData?.tables) return [];
    
    const minCapacities = new Set<number>();
    Object.values(simulationData.tables).forEach((table: TableType) => {
      if (table.min_capacity) {
        minCapacities.add(table.min_capacity);
      }
    });
    
    return Array.from(minCapacities).sort((a, b) => a - b).map(cap => ({
      value: cap.toString(),
      label: `${cap} People`
    }));
  };

  // Filter tables based on selection
  const getFilteredTables = () => {
    if (!simulationData?.tables) return [];
    
    return Object.values(simulationData.tables).filter((table: TableType) => {
      // Filter by max capacity
      if (maxCapacityFilter !== 'all' && table.max_capacity.toString() !== maxCapacityFilter) {
        return false;
      }
      
      // Filter by min capacity
      if (minCapacityFilter !== 'all') {
        const minRequired = parseInt(minCapacityFilter);
        // Check if table's min capacity is at least the required min
        if (!table.min_capacity || table.min_capacity < minRequired) {
          return false;
        }
      }
      
      return true;
    });
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

  // Handle table selection
  const handleTableClick = (tableId: number) => {
    if (selectedTable === tableId) {
      setSelectedTable(null);
    } else {
      setSelectedTable(tableId);
    }
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle>Restaurant Tables</CardTitle>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Max capacity:</span>
                      <Select
                        value={maxCapacityFilter}
                        onValueChange={setMaxCapacityFilter}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Max capacity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Capacities</SelectItem>
                          {tableCapacities.map(cap => (
                            <SelectItem key={`max-${cap.value}`} value={cap.value}>
                              {cap.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Min capacity:</span>
                      <Select
                        value={minCapacityFilter}
                        onValueChange={setMinCapacityFilter}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Min capacity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Min Capacities</SelectItem>
                          {getMinCapacities().map(cap => (
                            <SelectItem key={`min-${cap.value}`} value={cap.value}>
                              {cap.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Table ID</TableHead>
                          <TableHead>Min Capacity</TableHead>
                          <TableHead>Max Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredTables().map((table: TableType) => (
                          <React.Fragment key={table.table_id}>
                            <TableRow 
                              className={selectedTable === table.table_id ? "bg-muted" : ""}
                              onClick={() => handleTableClick(table.table_id)}
                            >
                              <TableCell>Table {table.table_id}</TableCell>
                              <TableCell>{table.min_capacity || "-"}</TableCell>
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
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTableClick(table.table_id);
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Info className="h-4 w-4" />
                                  Details
                                </Button>
                              </TableCell>
                            </TableRow>
                            
                            {selectedTable === table.table_id && table.occupancy_log && table.occupancy_log.length > 0 && (
                              <TableRow className="bg-muted/30">
                                <TableCell colSpan={5} className="p-0">
                                  <div className="p-4">
                                    <h4 className="font-medium mb-2">Occupancy Log for Table {table.table_id}</h4>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Start Time</TableHead>
                                          <TableHead>End Time</TableHead>
                                          <TableHead>Duration</TableHead>
                                          <TableHead>Created At</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {table.occupancy_log.map((entry: OccupancyEntry, index: number) => (
                                          <TableRow key={index}>
                                            <TableCell>{formatTime(entry.start_time, simulationData.shiftStart)}</TableCell>
                                            <TableCell>{formatTime(entry.end_time, simulationData.shiftStart)}</TableCell>
                                            <TableCell>{entry.end_time - entry.start_time} min</TableCell>
                                            <TableCell>{formatDateTime(entry.creation_datetime)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
