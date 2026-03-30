'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, getNextNDays, generateId } from '@/lib/utils/helpers';
import { GameClubSession } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GameClubPage() {
  const { currentUser } = useAuth();
  const { bookGameClub, cancelGameClub, getUserGameClubSessions } = useSchedule();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  // Get next 30 days
  const availableDates = useMemo(() => getNextNDays(30), []);

  // Get user's game club sessions
  const userSessions = useMemo(() => {
    return getUserGameClubSessions(currentUser.id).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [getUserGameClubSessions, currentUser.id]);

  // Calculate end time
  const endTime = useMemo(() => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + durationHours;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }, [startTime, durationHours]);

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newSession: GameClubSession = {
        id: generateId(),
        userId: currentUser.id,
        date: selectedDate,
        startTime,
        endTime,
        durationHours,
        createdAt: new Date(),
      };

      bookGameClub(newSession);

      // Reset form
      setStartTime('09:00');
      setDurationHours(1);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error booking game club:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSession = (sessionId: string) => {
    cancelGameClub(sessionId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Game Club Booking</h1>
        <p className="text-gray-600 mt-2">
          Book your temporary game club session. No permanent registration required.
        </p>
      </div>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>Book Game Club Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBookSession} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDate(date)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours)
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((hours) => (
                    <option key={hours} value={hours}>
                      {hours} {hours === 1 ? 'hour' : 'hours'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* End Time Display */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-sm text-gray-600">
                End Time: <span className="font-semibold text-gray-900">{endTime}</span>
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Booking...' : 'Book Session'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* User Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Game Club Sessions</h2>
        {userSessions.length > 0 ? (
          <div className="space-y-4">
            {userSessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">{formatDate(session.date)}</p>
                      <p className="font-semibold text-gray-900">
                        {session.startTime} - {session.endTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duration: {session.durationHours} {session.durationHours === 1 ? 'hour' : 'hours'}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelSession(session.id)}
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
                <p className="text-gray-600">No game club sessions booked yet</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
