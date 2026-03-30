'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { isDateFuture, formatDate, formatDateTime } from '@/lib/utils/helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CalendarClock,
  WashingMachine,
  Dumbbell,
  Sparkles,
  Gamepad2,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const {
    laundrySlots,
    gymSlots,
    cleanDuties,
    gameClubSessions,
    getUserLaundryBookings,
    getUserGymBookings,
    getUserCleanDuties,
    getUserGameClubSessions,
  } = useSchedule();

  if (!currentUser) return null;

  const upcomingLaundry = getUserLaundryBookings(currentUser.id)
    .filter((slot) => isDateFuture(slot.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 1);

  const upcomingGym = getUserGymBookings(currentUser.id)
    .filter((slot) => isDateFuture(slot.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 1);

  const upcomingDuties = getUserCleanDuties(currentUser.id)
    .filter((duty) => isDateFuture(duty.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 1);

  const upcomingGameClub = getUserGameClubSessions(currentUser.id)
    .filter((session) => isDateFuture(session.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 1);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              Game Club Sessions
            </CardTitle>
            <Gamepad2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {getUserGameClubSessions(currentUser.id).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Booked hours</p>
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
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href="/laundry" className="inline-flex items-center gap-2">View All Slots <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No upcoming laundry bookings</p>
                <Button asChild>
                  <Link href="/laundry" className="inline-flex items-center gap-2">Book Laundry <ArrowRight className="h-4 w-4" /></Link>
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
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href="/gym" className="inline-flex items-center gap-2">View All Slots <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No upcoming gym bookings</p>
                <Button asChild>
                  <Link href="/gym" className="inline-flex items-center gap-2">Book Gym <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clean Duty */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-blue-600" /> Next Clean Duty
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
                  <Link href="/clean-duty" className="inline-flex items-center gap-2">View Duties <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No upcoming clean duties</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game Club */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gamepad2 className="h-5 w-5 text-blue-600" /> Next Game Club Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingGameClub.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Game Club</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatDate(upcomingGameClub[0].date)}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {upcomingGameClub[0].startTime} - {upcomingGameClub[0].endTime}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Duration: {upcomingGameClub[0].durationHours} hours
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href="/game-club" className="inline-flex items-center gap-2">View Sessions <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No upcoming game club sessions</p>
                <Button asChild>
                  <Link href="/game-club" className="inline-flex items-center gap-2">Book Game Club <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
