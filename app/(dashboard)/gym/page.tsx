'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { isDatabaseEnabled } from '@/lib/config/client';
import {
  formatDate,
  getLocalTodayDateString,
  getNextNDays,
  getTimeInMinutes,
  addMinutes,
  buildNonOverlappingTimelineWindows,
  mergeConsecutiveUserGymBookings,
  isDateToday,
  isTimePast,
  getGymBookedUserIds,
  gymSlotHasOpenSpot,
} from '@/lib/utils/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserDirectory } from '@/hooks/use-user-directory';

export default function GymPage() {
  const { currentUser, isAdmin } = useAuth();
  const {
    gymSlots,
    bookGym,
    cancelGym,
    submitGymBook,
    submitGymCancel,
  } = useSchedule();
  const [selectedDate, setSelectedDate] = useState<string>(getLocalTodayDateString());
  const [durationHours, setDurationHours] = useState<number>(1);

  if (!currentUser) return null;

  const { users: allUsers } = useUserDirectory();

  const resolveUser = (userId?: string) => {
    if (!userId) return undefined;
    return allUsers.find((u) => u.id === userId);
  };

  // Get next 14 days
  const availableDates = useMemo(() => getNextNDays(14), []);

  // Filter slots for selected date
  const filteredSlots = useMemo(() => {
    return gymSlots.filter(
      (slot) =>
        slot.date === selectedDate &&
        (!isDateToday(selectedDate) || !isTimePast(slot.date, slot.startTime))
    );
  }, [gymSlots, selectedDate]);

  /** Contiguous multi-hour bookings → one row each (e.g. 13:00–16:00). */
  const groupedGymSessions = useMemo(
    () => mergeConsecutiveUserGymBookings(gymSlots, currentUser.id),
    [gymSlots, currentUser.id]
  );

  const getRequiredSlots = (slotId: string) => {
    const baseSlot = gymSlots.find((s) => s.id === slotId);
    if (!baseSlot) return [];

    const range = [];
    for (let i = 0; i < durationHours; i++) {
      const slotStart = addMinutes(baseSlot.startTime, i * 60);
      const slotEnd = addMinutes(slotStart, 60);
      const match = gymSlots.find(
        (s) =>
          s.date === baseSlot.date &&
          s.startTime === slotStart &&
          s.endTime === slotEnd
      );
      if (!match) return [];
      range.push(match);
    }
    return range;
  };

  const timelineWindows = useMemo(
    () => buildNonOverlappingTimelineWindows(filteredSlots, durationHours),
    [filteredSlots, durationHours]
  );

  const slotSummary = useMemo(() => {
    let available = 0;
    let mine = 0;
    let fullOrQueue = 0;
    for (const w of timelineWindows) {
      const isMine = w.range.every((s) => getGymBookedUserIds(s).includes(currentUser.id));
      const allHaveOpenSpot = w.range.every((s) => gymSlotHasOpenSpot(s));
      if (isMine) mine += 1;
      else if (allHaveOpenSpot) available += 1;
      else fullOrQueue += 1;
    }
    return {
      total: timelineWindows.length,
      available,
      mine,
      occupied: fullOrQueue,
    };
  }, [timelineWindows, currentUser.id]);

  const handleBookSlot = async (slotId: string) => {
    const requiredSlots = getRequiredSlots(slotId);
    if (requiredSlots.length !== durationHours) return;

    if (isDatabaseEnabled()) {
      await submitGymBook(requiredSlots.map((s) => s.id));
      return;
    }

    const allCanJoin = requiredSlots.every((s) => {
      const ids = getGymBookedUserIds(s);
      const cap = s.capacity ?? 10;
      return ids.length < cap && !ids.includes(currentUser.id);
    });

    if (allCanJoin) {
      requiredSlots.forEach((s) => {
        const ids = getGymBookedUserIds(s);
        bookGym({
          ...s,
          bookedUserIds: [...ids, currentUser.id],
        });
      });
      return;
    }

    requiredSlots.forEach((s) => {
      const ids = getGymBookedUserIds(s);
      const existingQueue = s.bookingQueue ?? [];
      const cap = s.capacity ?? 10;
      const full = ids.length >= cap;
      if (full && !ids.includes(currentUser.id) && !existingQueue.includes(currentUser.id)) {
        bookGym({
          ...s,
          bookingQueue: [...existingQueue, currentUser.id],
        });
      }
    });
  };

  const handleCancelSlot = async (slotId: string) => {
    if (isDatabaseEnabled()) {
      const requiredSlots = getRequiredSlots(slotId);
      if (requiredSlots.length === durationHours) {
        await submitGymCancel(requiredSlots.map((s) => s.id));
      } else {
        await submitGymCancel([slotId]);
      }
      return;
    }
    const requiredSlots = getRequiredSlots(slotId);
    if (requiredSlots.length === durationHours) {
      requiredSlots.forEach((s) => cancelGym(s.id, currentUser.id));
    } else {
      cancelGym(slotId, currentUser.id);
    }
  };

  const handleCancelGroupedSession = async (slotIds: string[]) => {
    if (slotIds.length === 0) return;
    if (isDatabaseEnabled()) {
      await submitGymCancel(slotIds);
      return;
    }
    slotIds.forEach((id) => cancelGym(id, currentUser.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isAdmin ? 'Gym Monitoring' : 'Gym Scheduling'}
        </h1>
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

          {!isAdmin && (
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
          )}
          {isAdmin && (
            <p className="mt-4 text-sm text-gray-600">
              Admin view is read-only. You can monitor current bookings and next turn.
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
            {!isAdmin && <Badge className="bg-blue-600 hover:bg-blue-600">Your sessions: {slotSummary.mine}</Badge>}
            <Badge variant="outline">Occupied: {slotSummary.occupied}</Badge>
            {isAdmin && <Badge variant="outline">Admin monitoring mode</Badge>}
          </div>
        </div>
        {timelineWindows.length > 0 ? (
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-600 mb-3">
                Timeline on <span className="font-semibold">{formatDate(selectedDate)}</span>
              </div>
              <div className="divide-y border rounded-lg bg-white">
                {timelineWindows.map((window) => {
                  const hasSpotsEverywhere = window.range.every((s) => gymSlotHasOpenSpot(s));
                  const isUserBooked = window.range.every((s) =>
                    getGymBookedUserIds(s).includes(currentUser.id)
                  );
                  const queueMode = !hasSpotsEverywhere && !isUserBooked;
                  const primarySlot = window.range[0];
                  const primaryIds = getGymBookedUserIds(primarySlot);
                  const sampleBookedUser = resolveUser(primaryIds[0]);
                  const nextInQueueUser = resolveUser(primarySlot.bookingQueue?.[0]);
                  const occupancyLabel =
                    primaryIds.length > 0
                      ? `${primaryIds.length}/${primarySlot.capacity ?? 10} booked`
                      : null;

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
                          <p className="text-xs text-gray-500">Gym</p>
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
                              {isUserBooked
                                ? 'Your session'
                                : queueMode
                                  ? 'Full — join queue'
                                  : 'Spots open'}
                            </span>
                          </div>
                          <div className="mt-1 space-y-0.5 text-xs text-gray-600">
                            {occupancyLabel && (
                              <p>
                                <span className="font-medium text-gray-800">{occupancyLabel}</span>
                                {sampleBookedUser && (
                                  <>
                                    {' '}
                                    <span className="text-gray-500">
                                      (e.g. {sampleBookedUser.name} {sampleBookedUser.surname}, Room{' '}
                                      {sampleBookedUser.roomNumber}
                                      {primaryIds.length > 1 ? ` +${primaryIds.length - 1} more` : ''})
                                    </span>
                                  </>
                                )}
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
                  No {durationHours}-hour windows found for this date
                </p>
                <p className="text-sm text-gray-500">Try another duration or date</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Bookings */}
      {!isAdmin && (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Gym Sessions</h2>
        {groupedGymSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {groupedGymSessions.map((session) => (
              <Card key={session.slotIds.join('-')}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {formatDate(session.date)}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {session.startTime} - {session.endTime}
                    </p>
                    {session.slotIds.length > 1 && (
                      <p className="text-xs text-gray-500">
                        {session.slotIds.length} consecutive hours
                      </p>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => handleCancelGroupedSession(session.slotIds)}
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
      )}
    </div>
  );
}
