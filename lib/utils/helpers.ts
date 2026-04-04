import type { CleanDuty, GymSlot } from '../types';

/** Legacy storage may still have `bookedBy` (single user). */
export type GymSlotInput = GymSlot & { bookedBy?: string };

export const getGymBookedUserIds = (slot: GymSlotInput): string[] => {
  const fromList = slot.bookedUserIds?.filter(Boolean) ?? [];
  if (fromList.length > 0) {
    return [...new Set(fromList)];
  }
  if (slot.bookedBy) {
    return [slot.bookedBy];
  }
  return [];
};

export const gymSlotHasOpenSpot = (slot: GymSlotInput): boolean => {
  const cap = slot.capacity ?? 10;
  return getGymBookedUserIds(slot).length < cap;
};

/** Supports legacy stored duties that used a single `photoUrl`. */
export type CleanDutyWithLegacyPhotos = CleanDuty & { photoUrl?: string };

export const getCleanDutyPhotoUrls = (duty: CleanDutyWithLegacyPhotos): string[] => {
  if (duty.photoUrls && duty.photoUrls.length > 0) {
    return duty.photoUrls;
  }
  if (duty.photoUrl) {
    return [duty.photoUrl];
  }
  return [];
};

/** Kitchen photo submissions are removed this long after upload (`submittedAt`). */
export const KITCHEN_DUTY_SUBMISSION_TTL_MS = 24 * 60 * 60 * 1000;

export function isKitchenSubmissionExpired(duty: CleanDuty): boolean {
  if (!duty.submittedAt) return false;
  const submitted = new Date(duty.submittedAt as Date | string).getTime();
  if (Number.isNaN(submitted)) return false;
  return Date.now() - submitted >= KITCHEN_DUTY_SUBMISSION_TTL_MS;
}

// Generate ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Date Formatting
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (timeString: string): string => {
  return timeString;
};

export const formatDateTime = (
  dateString: string,
  timeString: string
): string => {
  return `${formatDate(dateString)} at ${timeString}`;
};

// Time calculation
export const getTimeInMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const addMinutes = (time: string, minutes: number): string => {
  let [hours, mins] = time.split(':').map(Number);
  mins += minutes;
  hours += Math.floor(mins / 60);
  mins = mins % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// Date comparison
export const isDateToday = (dateString: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
};

export const isDatePast = (dateString: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateString < today;
};

export const isDateFuture = (dateString: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateString > today;
};

// Time comparison
export const isTimePast = (dateString: string, timeString: string): boolean => {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (dateString < currentDate) return true;
  if (dateString === currentDate && timeString <= currentTime) return true;
  return false;
};

// Get date range
export const getNextNDays = (n: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Get day of week
export const getDayOfWeek = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Generate time slots
export const generateTimeSlots = (
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30
): string[] => {
  const slots: string[] = [];
  let current = getTimeInMinutes(startTime);
  const end = getTimeInMinutes(endTime);

  while (current < end) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    current += intervalMinutes;
  }

  return slots;
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
  return phoneRegex.test(phone);
};

// Get laundry days based on gender
export const getLaundryDays = (gender: 'male' | 'female'): number => {
  return gender === 'male' ? 4 : 3;
};

// Generate laundry schedule for a month
export const generateLaundrySchedule = (
  year: number,
  month: number,
  gender: 'male' | 'female'
): string[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const allowedDays = getLaundryDays(gender);
  const laundryDates: string[] = [];

  let dayCounter = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    if (dayCounter < allowedDays) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      laundryDates.push(dateStr);
      dayCounter++;
    } else {
      dayCounter = 0;
      if (dayCounter < allowedDays) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        laundryDates.push(dateStr);
        dayCounter++;
      }
    }
  }

  return laundryDates;
};
