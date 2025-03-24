
export interface Table {
  table_id: number;
  max_capacity: number;
  min_capacity?: number;
  occupied: boolean;
  occupancy_log: OccupancyEntry[];
}

export interface OccupancyEntry {
  start_time: number;
  end_time: number;
  creation_datetime: Date;
  reservation_datetime: Date;
  status_long: string;
  party_size: number;
  provenance: string;
}

export interface Reservation {
  arrival_time: number;
  table_ids: number[];
  party_size: number;
  duration: number;
  creation_datetime: Date;
  reservation_datetime: Date;
  status_long: string;
  provenance: string;
}

export interface OccupancyGroup {
  table_ids: number[];
  start: number;
  duration: number;
  creation: Date;
  reservation: Date;
  advance?: number;
  creation_rel?: number;
  status_long: string;
  partySize: number;
  provenance: string;
  totalCapacity?: number;
}

export interface SimulationState {
  tables: Record<number, Table>;
  reservations: Reservation[];
  occupancyGroups: OccupancyGroup[];
  shiftStart?: Date;
  shiftEnd?: Date;
  currentTime: number;
  endTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  selectedReservation?: OccupancyGroup;
  tableFilter: string;
}

export interface UploadedData {
  reservations: any[] | null;
  maps: any[] | null;
}

export interface SimulationOptions {
  date: string;
  mealShift: string;
  restaurantId: string;
}
