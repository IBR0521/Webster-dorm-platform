import type { CleanDuty, GymSlot, LaundrySlot } from '@/lib/types';
import { generateId, getNextNDays } from '@/lib/utils/helpers';

export const FACTORY_GYM_CAPACITY = 10;

function getLaundryGenderForDate(date: string): 'male' | 'female' {
  const day = new Date(date).getDay();
  return day === 1 || day === 3 || day === 5 || day === 0 ? 'male' : 'female';
}

export function createFreshSchedule(): {
  laundrySlots: LaundrySlot[];
  gymSlots: GymSlot[];
  cleanDuties: CleanDuty[];
} {
  const laundryDates = getNextNDays(30);
  const newLaundrySlots: LaundrySlot[] = [];

  laundryDates.forEach((date) => {
    const allowedGender = getLaundryGenderForDate(date);
    for (let launderyNum = 1; launderyNum <= 8; launderyNum++) {
      for (let slotStart = 6; slotStart < 22; slotStart += 1) {
        const startTime = `${String(slotStart).padStart(2, '0')}:00`;
        const endTime = `${String(slotStart + 1).padStart(2, '0')}:00`;
        newLaundrySlots.push({
          id: generateId(),
          launderyNumber: launderyNum,
          startTime,
          endTime,
          date,
          gender: allowedGender,
          capacity: 1,
          bookingQueue: [],
        });
      }
    }
  });

  const newGymSlots: GymSlot[] = [];
  laundryDates.forEach((date) => {
    for (let slotStart = 6; slotStart < 22; slotStart += 1) {
      const startTime = `${String(slotStart).padStart(2, '0')}:00`;
      const endTime = `${String(slotStart + 1).padStart(2, '0')}:00`;
      newGymSlots.push({
        id: generateId(),
        startTime,
        endTime,
        date,
        capacity: FACTORY_GYM_CAPACITY,
        bookingQueue: [],
      });
    }
  });

  const newCleanDuties: CleanDuty[] = [];
  laundryDates.slice(0, 30).forEach((date) => {
    for (let floor = 1; floor <= 4; floor++) {
      newCleanDuties.push({
        id: generateId(),
        assignedRoom: `Floor ${floor} Kitchen`,
        kitchenFloor: floor,
        assignedUsers: [],
        date,
        status: 'pending',
      });
    }
  });

  return {
    laundrySlots: newLaundrySlots,
    gymSlots: newGymSlots,
    cleanDuties: newCleanDuties,
  };
}
