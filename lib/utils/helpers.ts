import type { CleanDuty, GymSlot, LaundrySlot } from '../types';

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

/** One card per contiguous block (e.g. 13–14, 14–15, 15–16 → 13:00–16:00). */
export function mergeConsecutiveUserGymBookings(
  gymSlots: GymSlot[],
  userId: string
): { date: string; startTime: string; endTime: string; slotIds: string[] }[] {
  const mine = gymSlots.filter((s) => getGymBookedUserIds(s as GymSlotInput).includes(userId));
  const byDate = new Map<string, GymSlot[]>();
  for (const s of mine) {
    const list = byDate.get(s.date) ?? [];
    list.push(s);
    byDate.set(s.date, list);
  }
  const merged: { date: string; startTime: string; endTime: string; slotIds: string[] }[] = [];
  for (const [, slots] of byDate) {
    slots.sort((a, b) => getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime));
    let run: GymSlot[] = [];
    const flush = () => {
      if (run.length === 0) return;
      merged.push({
        date: run[0].date,
        startTime: run[0].startTime,
        endTime: run[run.length - 1].endTime,
        slotIds: run.map((x) => x.id),
      });
      run = [];
    };
    for (const s of slots) {
      if (run.length === 0) {
        run = [s];
        continue;
      }
      const last = run[run.length - 1];
      if (last.endTime === s.startTime) {
        run.push(s);
      } else {
        flush();
        run = [s];
      }
    }
    flush();
  }
  merged.sort(
    (a, b) => a.date.localeCompare(b.date) || getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime)
  );
  return merged;
}

/** Contiguous laundry hours you hold as booker (same machine + gender + date). */
export function mergeConsecutiveUserLaundryBookings(
  laundrySlots: LaundrySlot[],
  userId: string
): { date: string; startTime: string; endTime: string; slotIds: string[]; launderyNumber: number }[] {
  const mine = laundrySlots.filter((s) => s.bookedBy === userId);
  const key = (s: LaundrySlot) => `${s.date}\0${s.launderyNumber}\0${s.gender}`;
  const groups = new Map<string, LaundrySlot[]>();
  for (const s of mine) {
    const k = key(s);
    const list = groups.get(k) ?? [];
    list.push(s);
    groups.set(k, list);
  }
  const merged: { date: string; startTime: string; endTime: string; slotIds: string[]; launderyNumber: number }[] =
    [];
  for (const slots of groups.values()) {
    slots.sort((a, b) => getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime));
    let run: LaundrySlot[] = [];
    const flush = () => {
      if (run.length === 0) return;
      merged.push({
        date: run[0].date,
        startTime: run[0].startTime,
        endTime: run[run.length - 1].endTime,
        slotIds: run.map((x) => x.id),
        launderyNumber: run[0].launderyNumber,
      });
      run = [];
    };
    for (const s of slots) {
      if (run.length === 0) {
        run = [s];
        continue;
      }
      const last = run[run.length - 1];
      if (last.endTime === s.startTime) {
        run.push(s);
      } else {
        flush();
        run = [s];
      }
    }
    flush();
  }
  merged.sort(
    (a, b) => a.date.localeCompare(b.date) || a.launderyNumber - b.launderyNumber || getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime)
  );
  return merged;
}

/**
 * Build booking windows from 1-hour underlying slots.
 * For multi-hour durations, uses a non-overlapping grid (e.g. 13–15, 15–17), not sliding starts every hour.
 */
export function buildNonOverlappingTimelineWindows<T extends { id: string; startTime: string; endTime: string }>(
  slots: T[],
  durationHours: number
): { id: string; startTime: string; endTime: string; range: T[] }[] {
  const sorted = [...slots].sort(
    (a, b) => getTimeInMinutes(a.startTime) - getTimeInMinutes(b.startTime)
  );
  const windows: { id: string; startTime: string; endTime: string; range: T[] }[] = [];
  let i = 0;
  while (i < sorted.length) {
    const base = sorted[i];
    if (!base) {
      i += 1;
      continue;
    }
    const range: T[] = [];
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
      const windowEnd = addMinutes(base.startTime, durationHours * 60);
      const endMin = getTimeInMinutes(windowEnd);
      windows.push({
        id: base.id,
        startTime: base.startTime,
        endTime: windowEnd,
        range,
      });
      i += 1;
      while (i < sorted.length && getTimeInMinutes(sorted[i].startTime) < endMin) {
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  return windows;
}

/** YYYY-MM-DD in the runtime's local calendar (avoids UTC day-shift from toISOString). */
export const formatLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getLocalTodayDateString = (): string => formatLocalDateString(new Date());

// Date comparison
export const isDateToday = (dateString: string): boolean => {
  return dateString === getLocalTodayDateString();
};

export const isDatePast = (dateString: string): boolean => {
  return dateString < getLocalTodayDateString();
};

export const isDateFuture = (dateString: string): boolean => {
  return dateString > getLocalTodayDateString();
};

// Time comparison
export const isTimePast = (dateString: string, timeString: string): boolean => {
  const now = new Date();
  const currentDate = getLocalTodayDateString();
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
    dates.push(formatLocalDateString(date));
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
