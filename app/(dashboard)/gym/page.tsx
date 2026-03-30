'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, getNextNDays } from '@/lib/utils/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GymSlotCard from '@/components/gym/GymSlotCard';

export default function GymPage() {
  const { currentUser } = useAuth();
  const { gymSlots, bookGym, cancelGym, getUserGymBookings } = useSchedule();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!currentUser) return null;

  // Get next 14 days
  const availableDates = useMemo(() => getNextNDays(14), []);

  // Filter slots for selected date
  const filteredSlots = useMemo(() => {
    return gymSlots.filter((slot) => slot.date === selectedDate);
  }, [gymSlots, selectedDate]);

  // Get user's bookings
  const userBookings = useMemo(() => {
    return getUserGymBookings(currentUser.id);
  }, [getUserGymBookings, currentUser.id]);

  const handleBookSlot = (slotId: string) => {
    const slot = gymSlots.find((s) => s.id === slotId);
    if (slot && !slot.bookedBy) {
      bookGym({ ...slot, bookedBy: currentUser.id });
    }
  };

  const handleCancelSlot = (slotId: string) => {
    cancelGym(slotId, currentUser.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gym Scheduling</h1>
        <p className="text-gray-600 mt-2">
          Book your gym session. Each slot is 1 hour long.
        </p>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Available Slots */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Available Slots - {formatDate(selectedDate)}
        </h2>
        {filteredSlots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSlots.map((slot) => (
              <GymSlotCard
                key={slot.id}
                slot={slot}
                isBooked={slot.bookedBy !== undefined}
                isUserBooked={slot.bookedBy === currentUser.id}
                onBook={() => handleBookSlot(slot.id)}
                onCancel={() => handleCancelSlot(slot.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-8">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No gym slots available for this date</p>
                <p className="text-sm text-gray-500">Try selecting a different date</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Bookings */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Gym Sessions</h2>
        {userBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {formatDate(booking.date)}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {booking.startTime} - {booking.endTime}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => handleCancelSlot(booking.id)}
                    >
                      Cancel Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-8">
              <div className="text-center py-8">
                <p className="text-gray-600">No gym bookings yet</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
