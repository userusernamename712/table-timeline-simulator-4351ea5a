
import { Button } from "@/components/ui/button";
import TimelineSimulation from "@/components/TimelineSimulation";
import { RotateCcw, Filter, Clock, Users } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  const [minCapacityFilter, setMinCapacityFilter] = useState<string>("");
  const [maxCapacityFilter, setMaxCapacityFilter] = useState<string>("");
  const [reservationFilter, setReservationFilter] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedReservations, setSelectedReservations] = useState<string[]>([]);

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
    let filteredTables = Object.values(simulationData?.tables || {});
    
    // Filter by dropdown selection
    if (tableFilter !== "all") {
      filteredTables = filteredTables.filter(
        (table: TableType) => table.max_capacity.toString() === tableFilter
      );
    }
    
    // Filter by min capacity
    if (minCapacityFilter) {
      const minValue = parseInt(minCapacityFilter);
      if (!isNaN(minValue)) {
        filteredTables = filteredTables.filter(
          (table: TableType) => table.max_capacity >= minValue
        );
      }
    }
    
    // Filter by max capacity
    if (maxCapacityFilter) {
      const maxValue = parseInt(maxCapacityFilter);
      if (!isNaN(maxValue)) {
        filteredTables = filteredTables.filter(
          (table: TableType) => table.max_capacity <= maxValue
        );
      }
    }
    
    return filteredTables;
  };

  // Filter reservations based on selection
  const getFilteredReservations = () => {
    if (!simulationData?.occupancyGroups) return [];
    
    let filtered = simulationData.occupancyGroups;
    
    // Filter by party size
    if (reservationFilter !== "all") {
      const size = parseInt(reservationFilter);
      filtered = filtered.filter((group: OccupancyGroup) => {
        // Calculate total capacity for this reservation by summing up the max capacities of assigned tables
        const tableCapacities = group.table_ids.map(id => {
          const table = simulationData.tables[id];
          return table ? table.max_capacity : 0;
        });
        
        const totalCapacity = tableCapacities.reduce((sum, capacity) => sum + capacity, 0);
        return totalCapacity === size;
      });
    }
    
    return filtered;
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
  
  // Generate a unique key for each reservation
  const getReservationKey = (reservation: OccupancyGroup) => {
    return `${reservation.start}-${reservation.table_ids.join('-')}-${reservation.reservation.getTime()}`;
  };
  
  // Handle table selection
  const handleTableSelection = (tableId: number) => {
    setSelectedTable(selectedTable === tableId ? null : tableId);
  };
  
  // Handle reservation selection
  const handleReservationSelection = (reservationKey: string) => {
    setSelectedReservations(prev => {
      if (prev.includes(reservationKey)) {
        return prev.filter(key => key !== reservationKey);
      } else {
        return [...prev, reservationKey];
      }
    });
  };
  
  // Toggle all reservations selection
  const toggleAllReservations = () => {
    if (selectedReservations.length > 0) {
      setSelectedReservations([]);
    } else {
      const allKeys = getFilteredReservations().map(res => getReservationKey(res));
      setSelectedReservations(allKeys);
    }
  };
  
  // Get table occupancy log
  const getTableOccupancyLog = (tableId: number) => {
    const table = simulationData?.tables?.[tableId];
    return table?.occupancy_log || [];
  };
  
  // Highlight reservations in timeline
  const highlightReservationsInTimeline = () => {
    if (selectedReservations.length > 0) {
      setActiveTab("timeline");
      // The TimelineSimulation component will handle the highlighting
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
              highlightedReservations={selectedReservations}
            />
          </TabsContent>

          <TabsContent value="tables" className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-4">
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
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="min-capacity" className="text-sm whitespace-nowrap">Min Capacity:</Label>
                      <Input
                        id="min-capacity"
                        type="number"
                        className="w-20 h-8"
                        value={minCapacityFilter}
                        onChange={e => setMinCapacityFilter(e.target.value)}
                        min="1"
                        placeholder="Min"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor="max-capacity" className="text-sm whitespace-nowrap">Max Capacity:</Label>
                      <Input
                        id="max-capacity"
                        type="number"
                        className="w-20 h-8"
                        value={maxCapacityFilter}
                        onChange={e => setMaxCapacityFilter(e.target.value)}
                        min="1"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  {selectedTable !== null ? (
                    // Display occupancy log for selected table
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-md">Occupancy Log for Table {selectedTable}</h3>
                        <Button variant="outline" size="sm" onClick={() => setSelectedTable(null)}>
                          Back to Tables
                        </Button>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Creation Time</TableHead>
                            <TableHead>Reservation Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getTableOccupancyLog(selectedTable).map((entry, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{formatTime(entry.start_time, simulationData.shiftStart)}</TableCell>
                              <TableCell>{formatTime(entry.end_time, simulationData.shiftStart)}</TableCell>
                              <TableCell>{new Date(entry.creation_datetime).toLocaleString()}</TableCell>
                              <TableCell>{new Date(entry.reservation_datetime).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          {getTableOccupancyLog(selectedTable).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                No occupancy records for this table
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : tableFilter === "all" && !minCapacityFilter && !maxCapacityFilter ? (
                    // Display tables grouped by capacity
                    sortedCapacities.map(capacity => (
                      <div key={capacity} className="space-y-3">
                        <h3 className="font-medium text-md">Tables for {capacity} People</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40px]"></TableHead>
                              <TableHead>Table ID</TableHead>
                              <TableHead>Capacity</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableGroups[capacity].map((table: TableType) => (
                              <TableRow 
                                key={table.table_id} 
                                className="cursor-pointer hover:bg-muted"
                                onClick={() => handleTableSelection(table.table_id)}
                              >
                                <TableCell>
                                  <div className="h-4 w-4 rounded-full border border-primary flex items-center justify-center">
                                    {selectedTable === table.table_id && <div className="h-2 w-2 rounded-full bg-primary" />}
                                  </div>
                                </TableCell>
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
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead>Table ID</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredTables().map((table: TableType) => (
                          <TableRow 
                            key={table.table_id} 
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => handleTableSelection(table.table_id)}
                          >
                            <TableCell>
                              <div className="h-4 w-4 rounded-full border border-primary flex items-center justify-center">
                                {selectedTable === table.table_id && <div className="h-2 w-2 rounded-full bg-primary" />}
                              </div>
                            </TableCell>
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
                        {getFilteredTables().length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                              No tables match the current filters
                            </TableCell>
                          </TableRow>
                        )}
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
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
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
                    
                    {selectedReservations.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={highlightReservationsInTimeline}
                        className="ml-2"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        View in Timeline
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <div 
                          className="h-4 w-4 rounded border border-primary cursor-pointer flex items-center justify-center"
                          onClick={toggleAllReservations}
                        >
                          {selectedReservations.length > 0 && 
                           selectedReservations.length === getFilteredReservations().length && 
                           <div className="h-2 w-2 rounded bg-primary" />}
                        </div>
                      </TableHead>
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
                      
                      const reservationKey = getReservationKey(reservation);
                      const isSelected = selectedReservations.includes(reservationKey);
                      
                      return (
                        <TableRow 
                          key={index}
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleReservationSelection(reservationKey)}
                        >
                          <TableCell>
                            <div className="h-4 w-4 rounded border border-primary flex items-center justify-center">
                              {isSelected && <div className="h-2 w-2 rounded bg-primary" />}
                            </div>
                          </TableCell>
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
                    {getFilteredReservations().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No reservations match the current filters
                        </TableCell>
                      </TableRow>
                    )}
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
