'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, getNextNDays, getTimeInMinutes, addMinutes, isDateToday, isTimePast } from '@/lib/utils/helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUsers } from '@/lib/utils/storage';

export default function LaundryPage() {
  const { currentUser, isAdmin } = useAuth();
  const { laundrySlots, bookLaundry, cancelLaundry, getUserLaundryBookings } = useSchedule();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedLaundery, setSelectedLaundery] = useState<number>(1);
  const [durationHours, setDurationHours] = useState<number>(1);

  if (!currentUser) return null;

  // Load all users once (for names in "Booked by"/queue).
  const allUsers = useMemo(() => getUsers(), []);

  const resolveUser = (userId?: string) => {
    if (!userId) return undefined;
    return allUsers.find((u) => u.id === userId);
  };

  // Get next 14 days
  const availableDates = useMemo(() => {
    const dates = getNextNDays(14);
    if (isAdmin) return dates;

    return dates.filter((date) => {
      const day = new Date(date).getDay(); // 0 Sun, 1 Mon, ... 6 Sat
      const allowedGender = day === 0 || day === 1 || day === 3 || day === 5 ? 'male' : 'female';
      return allowedGender === currentUser.gender;
    });
  }, [currentUser.gender, isAdmin]);

  useEffect(() => {
    if (availableDates.length === 0) return;
    if (!availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Filter slots for current user's gender and selected date
  const filteredSlots = useMemo(() => {
    return laundrySlots.filter(
      (slot) =>
        slot.date === selectedDate &&
        (isAdmin || slot.gender === currentUser.gender) &&
        slot.launderyNumber === selectedLaundery &&
        (!isDateToday(selectedDate) || !isTimePast(slot.date, slot.startTime))
    );
  }, [laundrySlots, selectedDate, selectedLaundery, currentUser.gender, isAdmin]);

  // Get user's bookings
  const userBookings = useMemo(() => {
    return getUserLaundryBookings(currentUser.id);
  }, [getUserLaundryBookings, currentUser.id]);

  const getRequiredSlots = (slotId: string) => {
    const baseSlot = laundrySlots.find((s) => s.id === slotId);
    if (!baseSlot) return [];

    const range = [];
    for (let i = 0; i < durationHours; i++) {
      const slotStart = addMinutes(baseSlot.startTime, i * 60);
      const slotEnd = addMinutes(slotStart, 60);
      const match = laundrySlots.find(
        (s) =>
          s.date === baseSlot.date &&
          s.gender === baseSlot.gender &&
          s.launderyNumber === baseSlot.launderyNumber &&
          s.startTime === slotStart &&
          s.endTime === slotEnd
      );
      if (!match) return [];
      range.push(match);
    }
    return range;
  };

  const timelineWindows = useMemo(() => {
    const sorted = filteredSlots
      .slice()
      .sort((a, b) => getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime));

    const windows: { id: string; startTime: string; endTime: string; range: typeof filteredSlots }[] = [];

    // Build non-overlapping windows based on selected duration.
    for (let i = 0; i < sorted.length; i += durationHours) {
      const base = sorted[i];
      if (!base) continue;

      const range = [];
      let valid = true;
      for (let j = 0; j < durationHours; j++) {
        const targetStart = addMinutes(base.startTime, j * 60);
        const targetEnd = addMinutes(targetStart, 60);
        const match = sorted.find(
          (s) => s.startTime === targetStart && s.endTime === targetEnd
        );
        if (!match) {
          valid = false;
          break;
        }
        range.push(match);
      }

      if (valid && range.length === durationHours) {
        windows.push({
          id: base.id,
          startTime: base.startTime,
          endTime: addMinutes(base.startTime, durationHours * 60),
          range,
        });
      }
    }

    return windows;
  }, [filteredSlots, durationHours, laundrySlots]);

  const slotSummary = useMemo(() => {
    const available = timelineWindows.filter((w) => w.range.every((s) => !s.bookedBy)).length;
    const mine = timelineWindows.filter((w) => w.range.every((s) => s.bookedBy === currentUser.id)).length;
    const occupied = timelineWindows.length - available - mine;
    return { total: timelineWindows.length, available, mine, occupied };
  }, [timelineWindows, currentUser.id]);

  const handleBookSlot = (slotId: string) => {
    const requiredSlots = getRequiredSlots(slotId);
    if (requiredSlots.length !== durationHours) return;

    const allFree = requiredSlots.every((s) => !s.bookedBy);

    if (allFree) {
      requiredSlots.forEach((s) => {
        bookLaundry({
          ...s,
          bookedBy: currentUser.id,
        });
      });
      return;
    }

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
        <h1 className="text-3xl font-bold text-gray-900">
          {isAdmin ? 'Laundry Monitoring' : 'Laundry Scheduling'}
        </h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isAdmin ? 'Monitor Laundry Details' : 'Select Laundry Details'}
          </CardTitle>
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

            {!isAdmin && (
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
            )}
          </div>
          {isAdmin && (
            <p className="mt-4 text-sm text-gray-600">
              Admin view is read-only. You can monitor who booked and who is next in queue.
            </p>
          )}
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
            {!isAdmin && <Badge className="bg-blue-600 hover:bg-blue-600">Your bookings: {slotSummary.mine}</Badge>}
            <Badge variant="outline">Occupied: {slotSummary.occupied}</Badge>
            {isAdmin && <Badge variant="outline">Admin monitoring mode</Badge>}
          </div>
        </div>
        {timelineWindows.length > 0 ? (
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-600 mb-3">
                Timeline for <span className="font-semibold">Laundry #{selectedLaundery}</span> on{' '}
                <span className="font-semibold">{formatDate(selectedDate)}</span>
              </div>
              <div className="divide-y border rounded-lg bg-white">
                {timelineWindows.map((window) => {
                    const isRangeFullyFree = window.range.every((s) => !s.bookedBy);
                    const isUserBooked = window.range.every((s) => s.bookedBy === currentUser.id);
                    const queueMode = !isRangeFullyFree && !isUserBooked;
                    const firstOccupied = window.range.find((s) => s.bookedBy);
                    const bookedByUser = resolveUser(firstOccupied?.bookedBy);
                    const nextInQueueUser = resolveUser(firstOccupied?.bookingQueue?.[0]);
                    const laneLabel = window.range[0]?.gender ? window.range[0].gender.toUpperCase() : '';
                    return (
                      <div
                        key={window.id}
                        className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 ${
                          isUserBooked
                            ? 'bg-blue-50/70'
                            : queueMode
                            ? 'bg-gray-50/70'
                            : 'bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="min-w-[96px]">
                            <p className="font-semibold text-gray-900">
                              {window.startTime} - {window.endTime}
                            </p>
                            <p className="text-xs text-gray-500">
                              Laundry #{selectedLaundery} {isAdmin ? `• ${laneLabel}` : ''}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block w-2.5 h-2.5 rounded-full ${
                                  isUserBooked
                                    ? 'bg-blue-600'
                                    : queueMode
                                    ? 'bg-gray-400'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              <span className="text-sm font-medium text-gray-800">
                                {isUserBooked ? 'Your booking' : queueMode ? 'Queued / Booked' : 'Available'}
                              </span>
                            </div>
                            <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                              {bookedByUser && (
                                <p>
                                  Booked by:{' '}
                                  <span className="font-medium text-gray-800">
                                    {bookedByUser?.name} {bookedByUser?.surname}
                                  </span>{' '}
                                  <span className="text-gray-500">(Room {bookedByUser?.roomNumber})</span>
                                </p>
                              )}
                              {nextInQueueUser && (
                                <p>
                                  Next turn:{' '}
                                  <span className="font-medium text-gray-800">
                                    {nextInQueueUser.name} {nextInQueueUser.surname}
                                  </span>
                                  <span className="text-gray-500"> (Room {nextInQueueUser.roomNumber})</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 md:justify-end">
                          {!isAdmin && !isUserBooked && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleBookSlot(window.id)}
                            >
                              {queueMode ? `Join queue ${durationHours}h` : `Book ${durationHours}h`}
                            </Button>
                          )}
                          {!isAdmin && isUserBooked && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleCancelSlot(window.id)}
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
                <p className="text-gray-600 mb-4">
                  No {durationHours}-hour windows found for this laundry on this date
                </p>
                <p className="text-sm text-gray-500">
                  Try another duration, date, or laundry machine.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Bookings */}
      {!isAdmin && (
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
      )}
    </div>
  );
}
