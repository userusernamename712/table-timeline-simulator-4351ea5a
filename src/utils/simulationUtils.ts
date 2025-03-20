
import { Table, Reservation, OccupancyGroup, OccupancyEntry } from "@/types";
import Papa from "papaparse";

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
  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    trimHeaders: true
  });

  if (result.errors.length > 0) {
    console.error("CSV Parsing errors:", result.errors);
  }

  return result.data;
}

export function parseTables(tableString: string): number[] {
  if (!tableString) return [];

  try {
    if (typeof tableString === 'string') {
      return tableString.split(',')
        .map(part => part.trim())
        .filter(part => /^\d+$/.test(part))
        .map(part => parseInt(part, 10));
    } else if (typeof tableString === 'number' && !isNaN(tableString)) {
      return [tableString];
    }
  } catch (e) {
    console.error("Error parsing table IDs:", e);
  }

  return [];
}

const pythonToJsJson = (pythonJson: string): string => {
  return pythonJson
    .replace(/: None/g, ': null')
    .replace(/None,/g, 'null,')
    .replace(/: True/g, ': true')
    .replace(/: False/g, ': false')
    .replace(/'/g, '"');
};

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
  firstCreationTime: number;
  lastReservationTime: number;
} {
  const filteredReservations = reservationsData.filter(
     r => r.date === options.date && r.meal_shift === options.mealShift && r.restaurant === options.restaurantId && CONFIRMED_RESERVATION_STATUSES.includes(r.status_long)
  );

  const mealShiftForMap = options.mealShift === "Comida" ? 1 : 2;

  const filteredMapData = mapData.filter(
    m => m.restaurant_name === options.restaurantId && m.date === options.date && m.meal == mealShiftForMap
  );

  if (filteredReservations.length === 0 || filteredMapData.length === 0) {
    throw new Error("No data available for the selected criteria");
  }

  const tables: Record<number, Table> = {};
  filteredMapData.forEach(row => {
    try {
      const tablesData = JSON.parse(pythonToJsJson(row.tables));
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

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const arrivalTimes = filteredReservations.map(r => timeToMinutes(r.time));
  const minTime = Math.min(...arrivalTimes);

  const reservations: Reservation[] = filteredReservations.map(row => {
    const arrivalTime = timeToMinutes(row.time) - minTime;
    const tableIds = parseTables(row.tables);
    const partySize = parseInt(row.for, 10);
    const duration = parseInt(row.duration, 10) || 90;
    let creationDatetime = new Date(`${row.date_add} ${row.time_add}`);
    const reservationDatetime = new Date(`${row.date} ${row.time}`);

    if (creationDatetime > reservationDatetime) {
      creationDatetime = new Date(reservationDatetime.getTime() - 1000);
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

  const occupancyGroups = Array.from(occupancyGroupsMap.values());
  occupancyGroups.forEach(group => {
    group.advance = (group.reservation.getTime() - group.creation.getTime()) / (60 * 1000);
    group.creation_rel = (group.creation.getTime() - shiftStart.getTime()) / (60 * 1000);
  });
  occupancyGroups.sort((a, b) => a.creation.getTime() - b.creation.getTime());
  
  // Find the earliest creation time and latest reservation time
  const firstCreationTime = Math.min(...occupancyGroups.map(g => g.creation_rel || 0));
  
  // Calculating the last reservation time relative to shift start
  const lastReservationTime = Math.max(
    ...occupancyGroups.map(g => {
      const reservationTimeRel = (g.reservation.getTime() - shiftStart.getTime()) / (60 * 1000);
      return reservationTimeRel;
    })
  );

  const maxArrivalTime = Math.max(...reservations.map(r => r.arrival_time));
  const maxDuration = Math.max(...reservations.map(r => r.duration));
  const endTime = maxArrivalTime + maxDuration + 10;

  return {
    tables,
    reservations,
    occupancyGroups,
    minTime,
    endTime,
    shiftStart,
    firstCreationTime,
    lastReservationTime
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
