'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, getNextNDays } from '@/lib/utils/helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LaundrySlotCard from '@/components/laundry/LaundrySlotCard';

export default function LaundryPage() {
  const { currentUser } = useAuth();
  const { laundrySlots, bookLaundry, cancelLaundry, getUserLaundryBookings } = useSchedule();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedLaundery, setSelectedLaundery] = useState<number>(1);

  if (!currentUser) return null;

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

  const handleBookSlot = (slotId: string) => {
    const slot = laundrySlots.find((s) => s.id === slotId);
    if (slot) {
      bookLaundry({ ...slot, bookedBy: currentUser.id });
    }
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
            <div>
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

            <div>
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
          </div>
        </CardContent>
      </Card>

      {/* Available Slots */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Available Slots - {formatDate(selectedDate)}
        </h2>
        {filteredSlots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSlots.map((slot) => (
              <LaundrySlotCard
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
                <p className="text-gray-600 mb-4">No available slots for the selected criteria</p>
                <p className="text-sm text-gray-500">Try selecting a different date or laundery</p>
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
