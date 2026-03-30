'use client';

import { LaundrySlot } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LaundrySlotCardProps {
  slot: LaundrySlot;
  isBooked: boolean;
  isUserBooked: boolean;
  onBook: () => void;
  onCancel: () => void;
}

export default function LaundrySlotCard({
  slot,
  isBooked,
  isUserBooked,
  onBook,
  onCancel,
}: LaundrySlotCardProps) {
  return (
    <Card className={isUserBooked ? 'border-blue-300 bg-blue-50' : isBooked ? 'bg-gray-50' : ''}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Laundery #{slot.launderyNumber}</p>
            <p className="font-semibold text-gray-900 mt-1">
              {slot.startTime} - {slot.endTime}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                isUserBooked ? 'bg-blue-600' : isBooked ? 'bg-gray-400' : 'bg-green-500'
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {isUserBooked ? 'Your Booking' : isBooked ? 'Booked' : 'Available'}
            </span>
          </div>

          {!isBooked && !isUserBooked && (
            <Button
              onClick={onBook}
              className="w-full bg-green-600 hover:bg-green-700"
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
