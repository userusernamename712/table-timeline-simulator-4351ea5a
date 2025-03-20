
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OccupancyGroup } from "@/types";
import { formatTime, formatDateTime } from "@/utils/simulationUtils";
import { Clock, Users, Calendar, Table } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReservationDetailsProps {
  reservation: OccupancyGroup;
  shiftStart?: Date;
}

const ReservationDetails = ({ reservation, shiftStart }: ReservationDetailsProps) => {
  const startTime = formatTime(reservation.start, shiftStart);
  const endTime = formatTime(reservation.start + reservation.duration, shiftStart);
  const advanceHours = Math.floor((reservation.advance || 0) / 60);
  const advanceMinutes = Math.round((reservation.advance || 0) % 60);
  
  return (
    <Card className="w-full animate-scale-in glass-card shadow-lg border-border/30">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">Reservation Details</CardTitle>
          <Badge variant="outline" className="text-sm px-2 py-0 h-5 bg-primary/5">
            {advanceHours > 0 ? `${advanceHours}h ${advanceMinutes}m advance` : `${advanceMinutes}m advance`}
          </Badge>
        </div>
        <CardDescription>
          Created on {formatDateTime(reservation.creation)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Time</p>
              <p className="font-medium">{startTime} - {endTime}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Duration</p>
              <p className="font-medium">{reservation.duration} minutes</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border/30 pt-4">
          <div className="flex items-start gap-2 text-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Table className="h-4 w-4 text-primary" />
            </div>
            <div className="w-full">
              <p className="text-muted-foreground text-xs">Assigned Tables</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {reservation.table_ids.map((id) => (
                  <Badge key={id} variant="secondary" className="font-medium">
                    Table {id}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border/30 pt-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Reservation Time</p>
              <p className="font-medium">{formatDateTime(reservation.reservation)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReservationDetails;
