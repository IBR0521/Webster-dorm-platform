'use client';

import { LaundrySlot } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock3, WashingMachine } from 'lucide-react';

interface LaundrySlotCardProps {
  slot: LaundrySlot;
  isBooked: boolean;
  isUserBooked: boolean;
  bookedByName?: string;
  nextInQueueName?: string;
  onBook: () => void;
  onCancel: () => void;
}

export default function LaundrySlotCard({
  slot,
  isBooked,
  isUserBooked,
  bookedByName,
  nextInQueueName,
  onBook,
  onCancel,
}: LaundrySlotCardProps) {
  const status = isUserBooked ? 'your-booking' : isBooked ? 'booked' : 'available';

  return (
    <Card
      className={`transition-all ${
        isUserBooked
          ? 'border-blue-200 bg-blue-50/70'
          : isBooked
          ? 'border-gray-200 bg-gray-50/70'
          : 'border-emerald-200 bg-emerald-50/40 hover:shadow-sm'
      }`}
    >
      <CardContent className="pt-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Laundry #{slot.launderyNumber}</p>
              <p className="font-semibold text-gray-900 mt-1 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-gray-500" />
              {slot.startTime} - {slot.endTime}
            </p>
            </div>
            {status === 'available' && <Badge className="bg-emerald-600 hover:bg-emerald-600">Available</Badge>}
            {status === 'booked' && <Badge variant="secondary">Booked</Badge>}
            {status === 'your-booking' && <Badge className="bg-blue-600 hover:bg-blue-600">Your Booking</Badge>}
          </div>

          <div className="rounded-lg border border-gray-200/80 bg-white/70 p-3">
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <WashingMachine className="h-4 w-4" />
              Slot status
            </p>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {isUserBooked ? 'Reserved by you' : isBooked ? 'Reserved by another student' : 'Ready to book'}
            </p>
            {(bookedByName || nextInQueueName) && (
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                {bookedByName && <p>Booked by: <span className="font-medium text-gray-800">{bookedByName}</span></p>}
                {nextInQueueName && <p>Next turn: <span className="font-medium text-gray-800">{nextInQueueName}</span></p>}
              </div>
            )}
          </div>

          {!isBooked && !isUserBooked && (
            <Button
              onClick={onBook}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Book Slot
            </Button>
          )}

          {isUserBooked && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              Cancel
            </Button>
          )}

          {isBooked && !isUserBooked && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">Not available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
