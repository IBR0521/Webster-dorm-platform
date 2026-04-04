'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import {
  isDateFuture,
  isDateToday,
  isTimePast,
  formatDate,
  getGymBookedUserIds,
} from '@/lib/utils/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUsers } from '@/lib/utils/storage';
import {
  CalendarClock,
  WashingMachine,
  Dumbbell,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, isAdmin } = useAuth();
  const [nowTick, setNowTick] = useState(Date.now());
  const {
    laundrySlots,
    gymSlots,
    getUserLaundryBookings,
    getUserGymBookings,
    getUserCleanDuties,
  } = useSchedule();

  if (!currentUser) return null;

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getCountdown = (date: string, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const target = new Date(date);
    target.setHours(hours, minutes, 0, 0);

    const diffMs = target.getTime() - nowTick;
    if (diffMs <= 0) return 'Starting now';

    const totalMins = Math.ceil(diffMs / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;

    if (h > 0) return `Starts in ${h}h ${m}m`;
    return `Starts in ${m}m`;
  };

  const upcomingLaundry = getUserLaundryBookings(currentUser.id)
    .filter(
      (slot) => isDateFuture(slot.date) || (isDateToday(slot.date) && !isTimePast(slot.date, slot.startTime))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 1);

  const upcomingGym = getUserGymBookings(currentUser.id)
    .filter(
      (slot) => isDateFuture(slot.date) || (isDateToday(slot.date) && !isTimePast(slot.date, slot.startTime))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 1);

  const upcomingDuties = getUserCleanDuties(currentUser.id)
    .filter((duty) => isDateFuture(duty.date) || isDateToday(duty.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 1);

  const allUsers = useMemo(() => getUsers().filter((u) => !u.isAdmin), []);

  if (isAdmin) {
    const upcomingLaundryAll = laundrySlots
      .filter(
        (slot) => !!slot.bookedBy && (isDateFuture(slot.date) || (isDateToday(slot.date) && !isTimePast(slot.date, slot.startTime)))
      )
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()
      )
      .slice(0, 1);

    const upcomingGymAll = gymSlots
      .filter(
        (slot) =>
          getGymBookedUserIds(slot).length > 0 &&
          (isDateFuture(slot.date) ||
            (isDateToday(slot.date) && !isTimePast(slot.date, slot.startTime)))
      )
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()
      )
      .slice(0, 1);

    const resolveUser = (userId?: string) => allUsers.find((u) => u.id === userId);
    const totalQueues =
      laundrySlots.reduce((acc, slot) => acc + (slot.bookingQueue?.length ?? 0), 0) +
      gymSlots.reduce((acc, slot) => acc + (slot.bookingQueue?.length ?? 0), 0);

    return (
      <div className="space-y-8">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-6 md:p-8">
          <p className="text-xs uppercase tracking-wider text-blue-700 font-medium">Admin Overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Monitoring resident schedules and queues
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Students</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold tracking-tight">{allUsers.length}</div><p className="text-xs text-gray-500 mt-1">Registered residents</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Active Laundry Slots</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold tracking-tight">{laundrySlots.filter((s) => !!s.bookedBy).length}</div><p className="text-xs text-gray-500 mt-1">Currently booked</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Active Gym Slots</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold tracking-tight">{gymSlots.filter((s) => getGymBookedUserIds(s).length > 0).length}</div><p className="text-xs text-gray-500 mt-1">Hours with at least one booking</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Queue Waiting</CardTitle></CardHeader><CardContent><div className="text-2xl font-semibold tracking-tight">{totalQueues}</div><p className="text-xs text-gray-500 mt-1">Laundry + gym waiting list</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Next Laundry Turn</CardTitle></CardHeader>
            <CardContent>
              {upcomingLaundryAll.length > 0 ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <p>{formatDate(upcomingLaundryAll[0].date)} • {upcomingLaundryAll[0].startTime} - {upcomingLaundryAll[0].endTime}</p>
                  <p>Booked by: <span className="font-medium">{resolveUser(upcomingLaundryAll[0].bookedBy)?.name} {resolveUser(upcomingLaundryAll[0].bookedBy)?.surname}</span></p>
                  <p>Next turn: {resolveUser(upcomingLaundryAll[0].bookingQueue?.[0]) ? `${resolveUser(upcomingLaundryAll[0].bookingQueue?.[0])?.name} ${resolveUser(upcomingLaundryAll[0].bookingQueue?.[0])?.surname}` : 'No queue'}</p>
                </div>
              ) : <p className="text-sm text-gray-600">No upcoming laundry bookings</p>}
              <Button asChild variant="outline" className="w-full mt-4"><Link href="/dashboard/laundry">Open Laundry Monitoring</Link></Button>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Next Gym Turn</CardTitle></CardHeader>
            <CardContent>
              {upcomingGymAll.length > 0 ? (
                <div className="space-y-2 text-sm text-gray-700">
                  <p>{formatDate(upcomingGymAll[0].date)} • {upcomingGymAll[0].startTime} - {upcomingGymAll[0].endTime}</p>
                  <p>
                    Occupancy:{' '}
                    <span className="font-medium">
                      {getGymBookedUserIds(upcomingGymAll[0]).length}/{upcomingGymAll[0].capacity}
                    </span>
                    {getGymBookedUserIds(upcomingGymAll[0])[0] && (
                      <>
                        {' '}
                        · e.g.{' '}
                        <span className="font-medium">
                          {resolveUser(getGymBookedUserIds(upcomingGymAll[0])[0])?.name}{' '}
                          {resolveUser(getGymBookedUserIds(upcomingGymAll[0])[0])?.surname}
                        </span>
                      </>
                    )}
                  </p>
                  <p>Next in queue: {resolveUser(upcomingGymAll[0].bookingQueue?.[0]) ? `${resolveUser(upcomingGymAll[0].bookingQueue?.[0])?.name} ${resolveUser(upcomingGymAll[0].bookingQueue?.[0])?.surname}` : 'No queue'}</p>
                </div>
              ) : <p className="text-sm text-gray-600">No upcoming gym bookings</p>}
              <Button asChild variant="outline" className="w-full mt-4"><Link href="/dashboard/gym">Open Gym Monitoring</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-blue-700 font-medium">Resident Overview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Welcome back, {currentUser.name}
        </h1>
        <p className="text-gray-600 mt-2 flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Room {currentUser.roomNumber}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Laundry Bookings
            </CardTitle>
            <WashingMachine className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {getUserLaundryBookings(currentUser.id).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total bookings</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Gym Sessions
            </CardTitle>
            <Dumbbell className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {getUserGymBookings(currentUser.id).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total bookings</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clean Duties
            </CardTitle>
            <Sparkles className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {getUserCleanDuties(currentUser.id).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Assigned duties</p>
          </CardContent>
        </Card>

      </div>

      {/* Upcoming Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Laundry */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <WashingMachine className="h-5 w-5 text-blue-600" /> Next Laundry Slot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingLaundry.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Laundry #{upcomingLaundry[0].launderyNumber}</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatDate(upcomingLaundry[0].date)}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {upcomingLaundry[0].startTime} - {upcomingLaundry[0].endTime}
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    {getCountdown(upcomingLaundry[0].date, upcomingLaundry[0].startTime)}
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href="/dashboard/laundry" className="inline-flex items-center gap-2">View All Slots <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No upcoming laundry bookings</p>
                <Button asChild>
                  <Link href="/dashboard/laundry" className="inline-flex items-center gap-2">Book Laundry <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gym */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="h-5 w-5 text-blue-600" /> Next Gym Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingGym.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Gym Slot</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatDate(upcomingGym[0].date)}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {upcomingGym[0].startTime} - {upcomingGym[0].endTime}
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    {getCountdown(upcomingGym[0].date, upcomingGym[0].startTime)}
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href="/dashboard/gym" className="inline-flex items-center gap-2">View All Slots <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No upcoming gym bookings</p>
                <Button asChild>
                  <Link href="/dashboard/gym" className="inline-flex items-center gap-2">Book Gym <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clean Duty */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-blue-600" /> Next Kitchen Duty
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDuties.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">{upcomingDuties[0].assignedRoom}</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatDate(upcomingDuties[0].date)}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                    upcomingDuties[0].status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : upcomingDuties[0].status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {upcomingDuties[0].status.charAt(0).toUpperCase() + upcomingDuties[0].status.slice(1)}
                  </span>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href="/dashboard/clean-duty" className="inline-flex items-center gap-2">View Kitchen Tasks <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No upcoming kitchen duties</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
