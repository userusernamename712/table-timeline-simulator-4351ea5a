
import { Table, Reservation, OccupancyGroup, OccupancyEntry } from "@/types";

export const RESTAURANT_IDS = [
  "restaurante-saona-blasco-ibanez",
  "restaurante-turqueta",
  "restaurante-saona-ciscar",
  "restaurante-saona-santa-barbara",
  "restauerante-saonalaeliana",
  "restaurante-saonacasinodeagricultura",
  "restaurante-saona-epicentre-sagunto",
  "restaurante-saona-viveros",
];

export const CONFIRMED_RESERVATION_STATUSES = [
  "Sentada", 
  "Cuenta solicitada", 
  "Liberada", 
  "Llegada", 
  "Confirmada", 
  "Re-Confirmada"
];

export const MEAL_SHIFTS = ["Comida", "Cena"];

export function parseCsv(csvString: string): any[] {
  const lines = csvString.split(/\r?\n/);
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    if (!line.trim()) return null;
    
    const values = line.split(',');
    const obj: Record<string, any> = {};
    
    headers.forEach((header, i) => {
      obj[header.trim()] = values[i] ? values[i].trim() : '';
    });
    
    return obj;
  }).filter(Boolean);
}

export function parseTables(tableString: string): number[] {
  if (!tableString) return [];
  
  try {
    // Check if it's a comma-separated list
    if (tableString.includes(',')) {
      return tableString.split(',')
        .map(part => parseInt(part.trim(), 10))
        .filter(num => !isNaN(num));
    }
    
    // Check if it's a single number
    const num = parseInt(tableString.trim(), 10);
    return isNaN(num) ? [] : [num];
  } catch (e) {
    console.error("Error parsing table IDs:", e);
    return [];
  }
}

export function prepareSimulationData(
  mapData: any[],
  reservationsData: any[],
  options: { date: string; mealShift: string; restaurantId: string }
): {
  tables: Record<number, Table>;
  reservations: Reservation[];
  occupancyGroups: OccupancyGroup[];
  minTime: number;
  endTime: number;
  shiftStart: Date;
} {
  // Filter data by the selected options
  const filteredReservations = reservationsData.filter(
    r => r.date === options.date &&
         r.meal_shift === options.mealShift &&
         r.restaurant === options.restaurantId &&
         CONFIRMED_RESERVATION_STATUSES.includes(r.status_long)
  );
  
  const filteredMapData = mapData.filter(
    m => m.restaurant_name === options.restaurantId && m.date === options.date
  );

  if (filteredReservations.length === 0 || filteredMapData.length === 0) {
    throw new Error("No data available for the selected criteria");
  }

  // Process tables from map data
  const tables: Record<number, Table> = {};
  filteredMapData.forEach(row => {
    try {
      const tablesData = JSON.parse(row.tables.replace(/'/g, '"'));
      tablesData.forEach((table: any) => {
        const tableId = parseInt(table.id_table, 10);
        tables[tableId] = {
          table_id: tableId,
          max_capacity: parseInt(table.max, 10),
          occupied: false,
          occupancy_log: []
        };
      });
    } catch (e) {
      console.error("Error parsing tables data:", e);
    }
  });

  // Calculate the minimum start time for the shift
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const arrivalTimes = filteredReservations.map(r => timeToMinutes(r.time));
  const minTime = Math.min(...arrivalTimes);

  // Process reservations
  const reservations: Reservation[] = filteredReservations.map(row => {
    const arrivalTime = timeToMinutes(row.time) - minTime;
    const tableIds = parseTables(row.tables);
    const partySize = parseInt(row.for, 10);
    const duration = parseInt(row.duration, 10) || 90; // Default duration of 90 minutes if not specified
    
    // Parse creation datetime
    let creationDatetime = new Date(`${row.date_add} ${row.time_add}`);
    
    // Parse reservation datetime
    const reservationDatetime = new Date(`${row.date} ${row.time}`);
    
    // Ensure creation time is not after reservation time
    if (creationDatetime > reservationDatetime) {
      creationDatetime = new Date(reservationDatetime.getTime() - 1000); // 1 second before
    }
    
    return {
      arrival_time: arrivalTime,
      table_ids: tableIds,
      party_size: partySize,
      duration: duration,
      creation_datetime: creationDatetime,
      reservation_datetime: reservationDatetime
    };
  });

  // Simulate the reservation process to generate occupancy logs
  const shiftStart = new Date(`${options.date} 00:00:00`);
  shiftStart.setMinutes(minTime);
  
  reservations.forEach(reservation => {
    const startTime = reservation.arrival_time;
    const endTime = startTime + reservation.duration;
    
    reservation.table_ids.forEach(tableId => {
      if (tables[tableId]) {
        tables[tableId].occupancy_log.push({
          start_time: startTime,
          end_time: endTime,
          creation_datetime: reservation.creation_datetime,
          reservation_datetime: reservation.reservation_datetime
        });
      }
    });
  });

  // Group occupancy logs
  const occupancyGroupsMap = new Map<string, OccupancyGroup>();
  
  Object.values(tables).forEach(table => {
    table.occupancy_log.forEach((log: OccupancyEntry) => {
      const key = `${log.start_time}-${log.end_time}-${log.creation_datetime.getTime()}-${log.reservation_datetime.getTime()}`;
      
      if (!occupancyGroupsMap.has(key)) {
        occupancyGroupsMap.set(key, {
          table_ids: [table.table_id],
          start: log.start_time,
          duration: log.end_time - log.start_time,
          creation: log.creation_datetime,
          reservation: log.reservation_datetime
        });
      } else {
        occupancyGroupsMap.get(key)!.table_ids.push(table.table_id);
      }
    });
  });
  
  // Convert map to array and calculate advance times
  const occupancyGroups = Array.from(occupancyGroupsMap.values());
  
  occupancyGroups.forEach(group => {
    // Calculate advance in minutes
    group.advance = (group.reservation.getTime() - group.creation.getTime()) / (60 * 1000);
    // Calculate creation time relative to shift start
    group.creation_rel = (group.creation.getTime() - shiftStart.getTime()) / (60 * 1000);
  });
  
  // Sort by creation time
  occupancyGroups.sort((a, b) => a.creation.getTime() - b.creation.getTime());
  
  // Calculate end time for the simulation
  const maxArrivalTime = Math.max(...reservations.map(r => r.arrival_time));
  const maxDuration = Math.max(...reservations.map(r => r.duration));
  const endTime = maxArrivalTime + maxDuration + 10;

  return {
    tables,
    reservations,
    occupancyGroups,
    minTime,
    endTime,
    shiftStart
  };
}

export const formatTime = (minutes: number, shiftStart?: Date): string => {
  if (!shiftStart) return "00:00";
  
  const date = new Date(shiftStart);
  date.setMinutes(date.getMinutes() + minutes);
  
  return date.toTimeString().substring(0, 5);
};

export const formatDateTime = (date: Date): string => {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};
