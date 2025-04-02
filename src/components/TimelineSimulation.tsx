
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  SimulationState,
  OccupancyGroup,
} from "@/types";
import { formatTime, formatDateTime } from "@/utils/simulationUtils";
import {
  PlayCircle,
  PauseCircle,
  RotateCcw,
  ChevronRightCircle,
  Settings,
  Utensils,
  Map,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReservationDetails from "./ReservationDetails";
import { Badge } from "@/components/ui/badge";

interface TimelineSimulationProps {
  tables: Record<number, Table>;
  occupancyGroups: OccupancyGroup[];
  endTime: number;
  shiftStart?: Date;
  firstCreationTime?: number;
  lastReservationTime?: number;
  onReset: () => void;
}

const TimelineSimulation = ({
  tables,
  occupancyGroups,
  endTime,
  shiftStart,
  firstCreationTime = 0,
  lastReservationTime,
  onReset,
}: TimelineSimulationProps) => {
  const [state, setState] = useState<SimulationState>({
    tables,
    reservations: [],
    occupancyGroups,
    currentTime: firstCreationTime || 0,
    endTime: lastReservationTime || endTime,
    isPlaying: false,
    playbackSpeed: 1,
    tableFilter: "All",
  });

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      tables,
      occupancyGroups,
      endTime: lastReservationTime || endTime,
      currentTime: firstCreationTime || 0,
      shiftStart,
    }));
  }, [tables, occupancyGroups, endTime, shiftStart, firstCreationTime, lastReservationTime]);

  useEffect(() => {
    if (state.isPlaying) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isPlaying, state.playbackSpeed]);

  const updateTime = (timestamp: number) => {
    const elapsed = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    setState((prev) => {
      const newTime = prev.currentTime + (elapsed * prev.playbackSpeed) / 1000;

      if (newTime >= prev.endTime) {
        return { ...prev, currentTime: prev.endTime, isPlaying: false };
      }

      return { ...prev, currentTime: newTime };
    });

    animationFrameRef.current = requestAnimationFrame(updateTime);
  };

  const handlePlayPause = () => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleReset = () => {
    setState((prev) => ({ ...prev, currentTime: firstCreationTime || 0, isPlaying: false }));
  };

  const handleFullReset = () => {
    onReset();
  };

  const handleSliderChange = (value: number[]) => {
    setState((prev) => ({ ...prev, currentTime: value[0] }));
  };

  const handleSkip = () => {
    setState((prev) => {
      const nextTime = prev.occupancyGroups.find(
        (g) => g.creation_rel !== undefined && g.creation_rel > prev.currentTime
      )?.creation_rel;

      if (nextTime !== undefined) {
        return { ...prev, currentTime: nextTime };
      }
      return prev;
    });
  };

  const handleSpeedChange = (value: string) => {
    setState((prev) => ({ ...prev, playbackSpeed: parseFloat(value) }));
  };

  const handleTableFilterChange = (value: string) => {
    setState((prev) => ({ ...prev, tableFilter: value }));
  };

  const handleReservationClick = (reservation: OccupancyGroup) => {
    setState((prev) => ({ 
      ...prev, 
      selectedReservation: 
        prev.selectedReservation?.start === reservation.start && 
        prev.selectedReservation?.reservation === reservation.reservation
          ? undefined
          : reservation
    }));
  };

  const filteredTables = Object.values(state.tables).filter((table) => {
    if (state.tableFilter === "All") return true;
    return table.max_capacity === parseInt(state.tableFilter);
  });

  filteredTables.sort((a, b) => a.table_id - b.table_id);

  const getVisibleReservations = (tableId: number) => {
    return state.occupancyGroups.filter(
      (group) =>
        group.table_ids.includes(tableId) &&
        group.creation_rel !== undefined &&
        group.creation_rel <= state.currentTime
    );
  };

  const getCurrentTime = () => {
    if (!shiftStart) return "Loading...";
    const currentDate = new Date(shiftStart);
    currentDate.setMinutes(currentDate.getMinutes() + state.currentTime);
    return currentDate.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get active zones (zones with at least one table that has reservations)
  const getActiveZones = () => {
    const activeZones = new Set<string>();
    
    // Loop through all visible occupancy groups
    state.occupancyGroups.forEach(group => {
      if (group.creation_rel !== undefined && group.creation_rel <= state.currentTime) {
        // For each table in this reservation, get the zone
        group.table_ids.forEach(tableId => {
          const table = state.tables[tableId];
          if (table && table.zone_id) {
            activeZones.add(table.zone_id);
          }
        });
      }
    });
    
    return Array.from(activeZones).sort();
  };

  const stats = state.occupancyGroups.reduce(
    (acc, group) => {
      if (group.creation_rel !== undefined && group.creation_rel <= state.currentTime) {
        if (group.totalCapacity > group.partySize) {
          acc.imperfect += 1;
          acc.totalGap += (group.totalCapacity - group.partySize);
        } else {
          acc.perfect += 1;
        }
      }
      return acc;
    },
    { perfect: 0, imperfect: 0, totalGap: 0 }
  );
  
  const activeZones = getActiveZones();

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlayPause}
            className="glass-card border-border/30 shadow-sm"
          >
            {state.isPlaying ? (
              <PauseCircle className="h-5 w-5 text-primary" />
            ) : (
              <PlayCircle className="h-5 w-5 text-primary" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="glass-card border-border/30 shadow-sm"
          >
            <RotateCcw className="h-4 w-4 text-primary" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleSkip}
            className="glass-card border-border/30 shadow-sm"
          >
            <ChevronRightCircle className="h-5 w-5 text-primary" />
          </Button>
          
          <Select
            value={state.playbackSpeed.toString()}
            onValueChange={handleSpeedChange}
          >
            <SelectTrigger className="w-[110px] glass-card border-border/30 shadow-sm h-9">
              <div className="flex items-center gap-2">
                <Settings className="h-3 w-3 text-muted-foreground" />
                <SelectValue placeholder="Speed" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-lg border border-border/50">
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
              <SelectItem value="5">5x</SelectItem>
              <SelectItem value="10">10x</SelectItem>
              <SelectItem value="100">100x</SelectItem>
              <SelectItem value="1000">1000x</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="font-medium text-sm">
            <span className="text-muted-foreground mr-1">Filter tables:</span>
          </div>
          <Select
            value={state.tableFilter}
            onValueChange={handleTableFilterChange}
          >
            <SelectTrigger className="w-[100px] glass-card border-border/30 shadow-sm h-9">
              <SelectValue placeholder="All Tables" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-lg border border-border/50">
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="2">2 pax</SelectItem>
              <SelectItem value="4">4 pax</SelectItem>
              <SelectItem value="6">6 pax</SelectItem>
              <SelectItem value="8">8 pax</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="glass-card p-4 shadow-md mb-4 border-border/30">
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-medium">
            Current Time: <span className="text-primary">{getCurrentTime()}</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Simulation showing reservations created up to this time
          </div>
        </div>
        
        <Slider
          className="mt-2"
          value={[state.currentTime]}
          max={state.endTime}
          min={firstCreationTime || 0}
          step={1}
          onValueChange={handleSliderChange}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div 
            ref={timelineRef}
            className="glass-card p-4 shadow-md border-border/30 h-[500px] overflow-auto"
          >
            <div className="min-w-[800px]">
              <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-2 border-b mb-2 flex">
                <div className="w-[150px] font-medium">Table</div>
                <div className="flex-1 relative">
                  {Array.from({ length: Math.ceil(endTime / 60) + 1 }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="absolute text-xs text-muted-foreground"
                        style={{ left: `${(i * 60 * 100) / endTime}%` }}
                      >
                        {formatTime(i * 60, shiftStart)}
                      </div>
                    )
                  )}
                  
                  <div
                    className="absolute top-0 h-full border-l-2 border-primary z-10 transition-all duration-100"
                    style={{
                      left: `${(state.currentTime * 100) / endTime}%`,
                    }}
                  >
                    <div className="bg-primary text-white px-1 py-0.5 rounded text-xs whitespace-nowrap">
                      {formatTime(state.currentTime, shiftStart)}
                    </div>
                  </div>
                </div>
              </div>
              
              {filteredTables.map((table) => {
                const visibleReservations = getVisibleReservations(table.table_id);
                
                return (
                  <div
                    key={table.table_id}
                    className="timeline-row flex px-4 py-3 border-b border-border/30"
                  >
                    <div className="w-[150px] flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {table.max_capacity}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Table {table.table_id}</span>
                        <Badge variant="outline" className="text-xs">Zone {table.zone_id}</Badge>
                      </div>
                    </div>
                    
                    <div className="flex-1 relative min-h-[30px]">
                      {visibleReservations.map((reservation) => (
                        <TooltipProvider key={`${reservation.start}-${reservation.table_ids.join('-')}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`absolute h-6 rounded-md reservation-block ${
                                  state.selectedReservation?.start === reservation.start &&
                                  state.selectedReservation?.reservation.getTime() === reservation.reservation.getTime()
                                    ? "ring-2 ring-primary"
                                    : ""
                                }`}
                                style={{
                                  left: `${(reservation.start * 100) / endTime}%`,
                                  width: `${(reservation.duration * 100) / endTime}%`,
                                  backgroundColor: reservation.totalCapacity > reservation.partySize 
                                    ? 'hsl(0, 100%, 60%)' // red
                                    : 'hsl(120, 50%, 50%)' // green
                                  
                                }}
                                onClick={() => handleReservationClick(reservation)}
                              >
                                <div className="px-2 text-xs truncate h-full flex items-center text-primary-foreground">
                                  {formatTime(reservation.start, shiftStart)} - {formatTime(reservation.start + reservation.duration, shiftStart)}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white/90 backdrop-blur-md border border-border/50">
                              <div className="text-xs">
                                <div>Time: {formatTime(reservation.start, shiftStart)} - {formatTime(reservation.start + reservation.duration, shiftStart)}</div>
                                <div>Duration: {reservation.duration} minutes</div>
                                <div>Tables: {reservation.table_ids.join(", ")}</div>
                                <div>Created: {formatDateTime(reservation.creation)}</div>
                                <div>Status Long: {reservation.status_long}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div>
          {state.selectedReservation ? (
            <ReservationDetails
              reservation={state.selectedReservation}
              shiftStart={shiftStart}
            />
          ) : (
            <div className="glass-card border-border/30 shadow-md p-8 flex flex-col items-center justify-center h-[300px] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Utensils className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medium text-lg mb-2">No Reservation Selected</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Click on any reservation in the timeline to view its details
              </p>
              <Button onClick={handleFullReset} variant="outline" className="mt-4">
                <RotateCcw className="mr-2 h-4 w-4" />
                New Simulation
              </Button>
            </div>
          )}

          <div className="glass-card p-4 shadow-md mt-4 border-border/30">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium"> 
                  <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: 'hsl(120, 50%, 50%)' }}></span> 
                  Perfect matches
                </span>
                <span className="font-medium text-primary">{stats.perfect}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: 'hsl(0, 100%, 60%)' }}></span> 
                  Imperfect matches
                </span>
                <span className="font-medium text-primary">{stats.imperfect}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total capacity gap</span>
                <span className="font-medium text-primary">{stats.totalGap}</span>
              </div>
            </div>
          </div>

          {/* Active Zones List */}
          <div className="glass-card p-4 shadow-md mt-4 border-border/30">
            <div className="flex items-center mb-2">
              <Map className="h-4 w-4 mr-2 text-primary" />
              <h4 className="font-medium">Active Zones</h4>
            </div>
            
            {activeZones.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {activeZones.map(zone => (
                  <Badge key={zone} className="bg-primary/10 text-primary hover:bg-primary/20">
                    Zone {zone}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active zones at this time</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineSimulation;
