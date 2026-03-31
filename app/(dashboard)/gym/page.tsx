'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, getNextNDays, getTimeInMinutes, addMinutes } from '@/lib/utils/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import GymSlotCard from '@/components/gym/GymSlotCard';
import { Badge } from '@/components/ui/badge';
import { getUsers } from '@/lib/utils/storage';

export default function GymPage() {
  const { currentUser } = useAuth();
  const { gymSlots, bookGym, cancelGym, getUserGymBookings } = useSchedule();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [durationHours, setDurationHours] = useState<number>(1);

  if (!currentUser) return null;

  const allUsers = useMemo(() => getUsers(), []);

  const resolveUserName = (userId?: string): string | undefined => {
    if (!userId) return undefined;
    const user = allUsers.find((u) => u.id === userId);
    return user ? `${user.name} ${user.surname}` : undefined;
  };

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

  const slotSummary = useMemo(() => {
    const available = filteredSlots.filter((slot) => !slot.bookedBy).length;
    const mine = filteredSlots.filter((slot) => slot.bookedBy === currentUser.id).length;
    const occupied = filteredSlots.length - available - mine;
    return { total: filteredSlots.length, available, mine, occupied };
  }, [filteredSlots, currentUser.id]);

  const handleBookSlot = (slotId: string) => {
    const baseSlot = gymSlots.find((s) => s.id === slotId);
    if (!baseSlot) return;

    const requiredSlots = [];
    for (let i = 0; i < durationHours; i++) {
      const slotStart = addMinutes(baseSlot.startTime, i * 60);
      const slotEnd = addMinutes(slotStart, 60);
      const slotForHour = gymSlots.find(
        (s) =>
          s.date === baseSlot.date &&
          s.startTime === slotStart &&
          s.endTime === slotEnd
      );
      if (!slotForHour) {
        return;
      }
      requiredSlots.push(slotForHour);
    }

    const allFree = requiredSlots.every((s) => !s.bookedBy);

    if (allFree) {
      requiredSlots.forEach((s) =>
        bookGym({
          ...s,
          bookedBy: currentUser.id,
        })
      );
      return;
    }

    requiredSlots.forEach((s) => {
      const existingQueue = s.bookingQueue ?? [];
      if (s.bookedBy && s.bookedBy !== currentUser.id && !existingQueue.includes(currentUser.id)) {
        bookGym({
          ...s,
          bookingQueue: [...existingQueue, currentUser.id],
        });
      }
    });
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
          <div className="space-y-2">
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

          <div className="mt-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (hours)
            </label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-48"
            >
              {[1, 2, 3].map((h) => (
                <option key={h} value={h}>
                  {h} {h === 1 ? 'hour' : 'hours'}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Available Slots */}
      <div>
        <div className="flex flex-col gap-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Available Slots - {formatDate(selectedDate)}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Total: {slotSummary.total}</Badge>
            <Badge className="bg-emerald-600 hover:bg-emerald-600">Available: {slotSummary.available}</Badge>
            <Badge className="bg-blue-600 hover:bg-blue-600">Your sessions: {slotSummary.mine}</Badge>
            <Badge variant="outline">Occupied: {slotSummary.occupied}</Badge>
          </div>
        </div>
        {filteredSlots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSlots.map((slot) => {
              const bookedByName = resolveUserName(slot.bookedBy);
              const nextInQueueName = resolveUserName(slot.bookingQueue?.[0]);
              return (
                <GymSlotCard
                  key={slot.id}
                  slot={slot}
                  isBooked={slot.bookedBy !== undefined}
                  isUserBooked={slot.bookedBy === currentUser.id}
                  bookedByName={bookedByName}
                  nextInQueueName={nextInQueueName}
                  onBook={() => handleBookSlot(slot.id)}
                  onCancel={() => handleCancelSlot(slot.id)}
                />
              );
            })}
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
