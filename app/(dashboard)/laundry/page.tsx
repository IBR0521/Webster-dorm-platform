'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, getNextNDays, getTimeInMinutes, addMinutes } from '@/lib/utils/helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUsers } from '@/lib/utils/storage';

export default function LaundryPage() {
  const { currentUser } = useAuth();
  const { laundrySlots, bookLaundry, cancelLaundry, getUserLaundryBookings } = useSchedule();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedLaundery, setSelectedLaundery] = useState<number>(1);
  const [durationHours, setDurationHours] = useState<number>(1);

  if (!currentUser) return null;

  // Load all users once (for names in "Booked by"/queue).
  const allUsers = useMemo(() => getUsers(), []);

  const resolveUserName = (userId?: string): string | undefined => {
    if (!userId) return undefined;
    const user = allUsers.find((u) => u.id === userId);
    return user ? `${user.name} ${user.surname}` : undefined;
  };

  // Get next 14 days
  const availableDates = useMemo(() => getNextNDays(14), []);

  // Filter slots for current user's gender and selected date
  const filteredSlots = useMemo(() => {
    return laundrySlots.filter(
      (slot) =>
        slot.date === selectedDate &&
        slot.gender === currentUser.gender &&
        slot.launderyNumber === selectedLaundery
    );
  }, [laundrySlots, selectedDate, selectedLaundery, currentUser.gender]);

  // Get user's bookings
  const userBookings = useMemo(() => {
    return getUserLaundryBookings(currentUser.id);
  }, [getUserLaundryBookings, currentUser.id]);

  const slotSummary = useMemo(() => {
    const available = filteredSlots.filter((slot) => !slot.bookedBy).length;
    const mine = filteredSlots.filter((slot) => slot.bookedBy === currentUser.id).length;
    const occupied = filteredSlots.length - available - mine;
    return { total: filteredSlots.length, available, mine, occupied };
  }, [filteredSlots, currentUser.id]);

  const handleBookSlot = (slotId: string) => {
    const baseSlot = laundrySlots.find((s) => s.id === slotId);
    if (!baseSlot) return;

    // Build the list of contiguous 1-hour slots for the selected duration
    const startMinutes = getTimeInMinutes(baseSlot.startTime);
    const requiredSlots = [];
    for (let i = 0; i < durationHours; i++) {
      const slotStart = addMinutes(baseSlot.startTime, i * 60);
      const slotEnd = addMinutes(slotStart, 60);
      const slotForHour = laundrySlots.find(
        (s) =>
          s.date === baseSlot.date &&
          s.gender === baseSlot.gender &&
          s.launderyNumber === baseSlot.launderyNumber &&
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
        bookLaundry({
          ...s,
          bookedBy: currentUser.id,
        })
      );
      return;
    }

    // If not all are free, join the queue for each required slot instead.
    requiredSlots.forEach((s) => {
      const existingQueue = s.bookingQueue ?? [];
      if (s.bookedBy && s.bookedBy !== currentUser.id && !existingQueue.includes(currentUser.id)) {
        bookLaundry({
          ...s,
          bookingQueue: [...existingQueue, currentUser.id],
        });
      }
    });
  };

  const handleCancelSlot = (slotId: string) => {
    cancelLaundry(slotId, currentUser.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Laundry Scheduling</h1>
        <p className="text-gray-600 mt-2">
          Book your laundry slot. Available for {currentUser.gender === 'male' ? '4 days' : '3 days'} per month.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Laundry Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Laundery</label>
              <select
                value={selectedLaundery}
                onChange={(e) => setSelectedLaundery(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Laundery #{num}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hours)
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3].map((h) => (
                  <option key={h} value={h}>
                    {h} {h === 1 ? 'hour' : 'hours'}
                  </option>
                ))}
              </select>
            </div>
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
            <Badge className="bg-blue-600 hover:bg-blue-600">Your bookings: {slotSummary.mine}</Badge>
            <Badge variant="outline">Occupied: {slotSummary.occupied}</Badge>
          </div>
        </div>
        {filteredSlots.length > 0 ? (
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-600 mb-3">
                Timeline for <span className="font-semibold">Laundry #{selectedLaundery}</span> on{' '}
                <span className="font-semibold">{formatDate(selectedDate)}</span>
              </div>
              <div className="divide-y border rounded-lg bg-white">
                {filteredSlots
                  .slice()
                  .sort((a, b) => getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime))
                  .map((slot) => {
                    const bookedByName = resolveUserName(slot.bookedBy);
                    const nextInQueueName = resolveUserName(slot.bookingQueue?.[0]);
                    const isBooked = !!slot.bookedBy;
                    const isUserBooked = slot.bookedBy === currentUser.id;
                    return (
                      <div
                        key={slot.id}
                        className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 ${
                          isUserBooked
                            ? 'bg-blue-50/70'
                            : isBooked
                            ? 'bg-gray-50/70'
                            : 'bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="min-w-[96px]">
                            <p className="font-semibold text-gray-900">
                              {slot.startTime} - {slot.endTime}
                            </p>
                            <p className="text-xs text-gray-500">Laundry #{slot.launderyNumber}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block w-2.5 h-2.5 rounded-full ${
                                  isUserBooked
                                    ? 'bg-blue-600'
                                    : isBooked
                                    ? 'bg-gray-400'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              <span className="text-sm font-medium text-gray-800">
                                {isUserBooked ? 'Your booking' : isBooked ? 'Booked' : 'Available'}
                              </span>
                            </div>
                            <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                              {bookedByName && (
                                <p>
                                  Booked by:{' '}
                                  <span className="font-medium text-gray-800">{bookedByName}</span>
                                </p>
                              )}
                              {nextInQueueName && (
                                <p>
                                  Next turn:{' '}
                                  <span className="font-medium text-gray-800">
                                    {nextInQueueName}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 md:justify-end">
                          {!isBooked && !isUserBooked && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleBookSlot(slot.id)}
                            >
                              Book {durationHours}h
                            </Button>
                          )}
                          {isUserBooked && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleCancelSlot(slot.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-8">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No slots found for this laundry on this date</p>
                <p className="text-sm text-gray-500">
                  Try selecting a different date or laundry machine.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Bookings */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Bookings</h2>
        {userBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">
                      Laundery #{booking.launderyNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(booking.date)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.startTime} - {booking.endTime}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => handleCancelSlot(booking.id)}
                    >
                      Cancel Booking
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
                <p className="text-gray-600">No active bookings yet</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
