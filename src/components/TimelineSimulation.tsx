
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  SimulationState,
  OccupancyGroup,
} from "@/types";
import { formatTime } from "@/utils/simulationUtils";
import {
  PlayCircle,
  PauseCircle,
  RotateCcw,
  ChevronRightCircle,
  Settings,
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

interface TimelineSimulationProps {
  tables: Record<number, Table>;
  occupancyGroups: OccupancyGroup[];
  endTime: number;
  shiftStart?: Date;
}

const TimelineSimulation = ({
  tables,
  occupancyGroups,
  endTime,
  shiftStart,
}: TimelineSimulationProps) => {
  const [state, setState] = useState<SimulationState>({
    tables,
    reservations: [],
    occupancyGroups,
    currentTime: 0,
    endTime,
    isPlaying: false,
    playbackSpeed: 1,
    tableFilter: "All",
  });

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Update tables when props change
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      tables,
      occupancyGroups,
      endTime,
      shiftStart,
    }));
  }, [tables, occupancyGroups, endTime, shiftStart]);

  // Setup animation loop
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

      // Stop when we reach the end
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
    setState((prev) => ({ ...prev, currentTime: 0, isPlaying: false }));
  };

  const handleSliderChange = (value: number[]) => {
    setState((prev) => ({ ...prev, currentTime: value[0] }));
  };

  const handleSkip = () => {
    setState((prev) => {
      // Find the next reservation start time after current time
      const nextTime = prev.occupancyGroups.find(
        (g) => g.start > prev.currentTime
      )?.start;

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

  // Filter tables based on current selection
  const filteredTables = Object.values(state.tables).filter((table) => {
    if (state.tableFilter === "All") return true;
    return table.max_capacity === parseInt(state.tableFilter);
  });

  // Sort tables by ID for consistent display
  filteredTables.sort((a, b) => a.table_id - b.table_id);

  // Calculate visible reservations for each table
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
    return currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
            Simulation progress
          </div>
        </div>
        
        <Slider
          className="mt-2"
          value={[state.currentTime]}
          max={state.endTime}
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
                  {/* Time indicators */}
                  {Array.from({ length: Math.ceil(state.endTime / 60) + 1 }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="absolute text-xs text-muted-foreground"
                        style={{ left: `${(i * 60 * 100) / state.endTime}%` }}
                      >
                        {formatTime(i * 60, shiftStart)}
                      </div>
                    )
                  )}
                  
                  {/* Current time indicator */}
                  <div
                    className="absolute top-0 h-full border-l-2 border-primary z-10 transition-all duration-100"
                    style={{
                      left: `${(state.currentTime * 100) / state.endTime}%`,
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
                    <div className="w-[150px] flex items-center">
                      <div className="mr-2 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {table.max_capacity}
                        </span>
                      </div>
                      <span className="font-medium">Table {table.table_id}</span>
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
                                  left: `${(reservation.start * 100) / state.endTime}%`,
                                  width: `${(reservation.duration * 100) / state.endTime}%`,
                                  backgroundColor: `hsl(${210 + (reservation.table_ids.length * 20)}, 100%, 70%)`,
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
                <Table className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medium text-lg mb-2">No Reservation Selected</h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Click on any reservation in the timeline to view its details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineSimulation;
