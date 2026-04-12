'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  LaundrySlot,
  GymSlot,
  CleanDuty,
  AdminComment,
  StudentComment,
} from '../types';
import {
  getLaundrySlots,
  saveLaundrySlots,
  getGymSlots,
  saveGymSlots,
  getCleanDuties,
  saveCleanDuties,
  getAdminComments,
  saveAdminComments,
  getStudentComments,
  saveStudentComments,
  isInitialized,
  setInitialized,
} from '../utils/storage';
import {
  generateId,
  getNextNDays,
  getGymBookedUserIds,
  getCleanDutyPhotoUrls,
  isKitchenSubmissionExpired,
  isTimePast,
} from '../utils/helpers';
import type { GymSlotInput, CleanDutyWithLegacyPhotos } from '../utils/helpers';
import { isDatabaseEnabled } from '../config/client';
import { useAuth } from './AuthContext';
import { createFreshSchedule } from '../schedule/factory';
import { toast } from 'sonner';
import { apiErrorMessage } from '../utils/api-error';

const GYM_SLOT_CAPACITY = 10;

function mergeLaundrySlots(
  prev: LaundrySlot[],
  updates: LaundrySlot[]
): LaundrySlot[] {
  const m = new Map(updates.map((s) => [s.id, s]));
  return prev.map((s) => m.get(s.id) ?? s);
}

function mergeGymSlots(prev: GymSlot[], updates: GymSlot[]): GymSlot[] {
  const m = new Map(updates.map((s) => [s.id, s]));
  return prev.map((s) => m.get(s.id) ?? s);
}

function mergeCleanDuty(prev: CleanDuty[], duty: CleanDuty): CleanDuty[] {
  return prev.map((d) => (d.id === duty.id ? duty : d));
}

function normalizeGymSlotFromStorage(slot: GymSlotInput): GymSlot {
  const ids = getGymBookedUserIds(slot);
  return {
    id: slot.id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    date: slot.date,
    capacity: GYM_SLOT_CAPACITY,
    bookedUserIds: ids.length > 0 ? ids : undefined,
    bookingQueue: [...(slot.bookingQueue ?? [])],
  };
}

function normalizeCleanDutyFromStorage(duty: CleanDutyWithLegacyPhotos): CleanDuty {
  const urls = getCleanDutyPhotoUrls(duty);
  return {
    id: duty.id,
    assignedRoom: duty.assignedRoom,
    kitchenFloor: duty.kitchenFloor,
    assignedRoomNumber: duty.assignedRoomNumber,
    assignedUsers: duty.assignedUsers,
    date: duty.date,
    photoUrls: urls.length > 0 ? urls : undefined,
    status: duty.status,
    submittedAt: duty.submittedAt,
  };
}

interface ScheduleContextType {
  // Laundry
  laundrySlots: LaundrySlot[];
  bookLaundry: (slot: LaundrySlot) => void;
  cancelLaundry: (slotId: string, userId: string) => void;
  getUserLaundryBookings: (userId: string) => LaundrySlot[];

  // Gym
  gymSlots: GymSlot[];
  bookGym: (slot: GymSlot) => void;
  cancelGym: (slotId: string, userId: string) => void;
  getUserGymBookings: (userId: string) => GymSlot[];

  // Clean Duty
  cleanDuties: CleanDuty[];
  uploadDutyPhotos: (dutyId: string, photoUrls: string[]) => Promise<void>;
  getUserCleanDuties: (userId: string) => CleanDuty[];
  approveDuty: (dutyId: string) => Promise<void>;
  rejectDuty: (dutyId: string) => Promise<void>;
  assignDutyUsers: (
    dutyId: string,
    userIds: string[],
    roomNumber?: string
  ) => Promise<void>;

  // Admin Comments
  adminComments: AdminComment[];
  addAdminComment: (comment: AdminComment) => Promise<void>;
  deleteAdminComment: (commentId: string) => Promise<void>;
  getCommentsForTarget: (targetId: string) => AdminComment[];
  studentComments: StudentComment[];
  addStudentComment: (comment: StudentComment) => Promise<void>;
  getStudentCommentsForDuty: (dutyId: string) => StudentComment[];
  getStudentCommentsForDutyByAuthor: (dutyId: string, authorId: string) => StudentComment[];
  getGeneralStudentComments: () => StudentComment[];
  getGeneralStudentCommentsByAuthor: (authorId: string) => StudentComment[];

  // Initialization
  initializeData: () => void;

  /** Database mode: atomic booking APIs + full refresh */
  refreshSchedule: () => Promise<void>;
  submitLaundryBook: (slotIds: string[]) => Promise<void>;
  submitLaundryCancel: (slotIds: string[]) => Promise<void>;
  submitGymBook: (slotIds: string[]) => Promise<void>;
  submitGymCancel: (slotIds: string[]) => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(
  undefined
);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [laundrySlots, setLaundrySlots] = useState<LaundrySlot[]>([]);
  const [gymSlots, setGymSlots] = useState<GymSlot[]>([]);
  const [cleanDuties, setCleanDuties] = useState<CleanDuty[]>([]);
  const [adminComments, setAdminComments] = useState<AdminComment[]>([]);
  const [studentComments, setStudentComments] = useState<StudentComment[]>([]);

  const { currentUser } = useAuth();

  const cleanDutiesRef = useRef(cleanDuties);
  cleanDutiesRef.current = cleanDuties;

  const getLaundryGenderForDate = (date: string): 'male' | 'female' => {
    const day = new Date(date).getDay(); // 0 Sun, 1 Mon, ... 6 Sat
    return day === 1 || day === 3 || day === 5 || day === 0 ? 'male' : 'female';
  };

  const refreshSchedule = useCallback(async (): Promise<void> => {
    if (!isDatabaseEnabled()) return;
    const res = await fetch('/api/schedule', { credentials: 'include' });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res));
      return;
    }
    const data = (await res.json()) as {
      laundrySlots: LaundrySlot[];
      gymSlots: GymSlot[];
      cleanDuties: CleanDuty[];
      adminComments: AdminComment[];
      studentComments: StudentComment[];
    };
    setLaundrySlots(data.laundrySlots);
    setGymSlots(data.gymSlots);
    setCleanDuties(data.cleanDuties);
    setAdminComments(data.adminComments);
    setStudentComments(data.studentComments);
  }, []);

  const submitLaundryBook = useCallback(async (slotIds: string[]): Promise<void> => {
    const res = await fetch('/api/laundry/book', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIds }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res));
      return;
    }
    const data = (await res.json()) as { laundrySlots: LaundrySlot[] };
    setLaundrySlots((prev) => mergeLaundrySlots(prev, data.laundrySlots));
  }, []);

  const submitLaundryCancel = useCallback(async (slotIds: string[]): Promise<void> => {
    const res = await fetch('/api/laundry/cancel', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIds }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res));
      return;
    }
    const data = (await res.json()) as { laundrySlots: LaundrySlot[] };
    setLaundrySlots((prev) => mergeLaundrySlots(prev, data.laundrySlots));
  }, []);

  const submitGymBook = useCallback(async (slotIds: string[]): Promise<void> => {
    const res = await fetch('/api/gym/book', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIds }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res));
      return;
    }
    const data = (await res.json()) as { gymSlots: GymSlot[] };
    setGymSlots((prev) => mergeGymSlots(prev, data.gymSlots));
  }, []);

  const submitGymCancel = useCallback(async (slotIds: string[]): Promise<void> => {
    const res = await fetch('/api/gym/cancel', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIds }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res));
      return;
    }
    const data = (await res.json()) as { gymSlots: GymSlot[] };
    setGymSlots((prev) => mergeGymSlots(prev, data.gymSlots));
  }, []);

  // Load schedule from API when using the database (after login).
  useEffect(() => {
    if (!isDatabaseEnabled()) return;
    if (!currentUser) {
      setLaundrySlots([]);
      setGymSlots([]);
      setCleanDuties([]);
      setAdminComments([]);
      setStudentComments([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/schedule', { credentials: 'include' });
        if (cancelled) return;
        if (!res.ok) {
          if (res.status !== 401) {
            toast.error(await apiErrorMessage(res));
          }
          return;
        }
        const data = (await res.json()) as {
          laundrySlots: LaundrySlot[];
          gymSlots: GymSlot[];
          cleanDuties: CleanDuty[];
          adminComments: AdminComment[];
          studentComments: StudentComment[];
        };
        if (cancelled) return;
        setLaundrySlots(data.laundrySlots);
        setGymSlots(data.gymSlots);
        setCleanDuties(data.cleanDuties);
        setAdminComments(data.adminComments);
        setStudentComments(data.studentComments);
      } catch (e) {
        console.error('Failed to load schedule', e);
        if (!cancelled && process.env.NODE_ENV === 'development') {
          toast.error(
            'Cannot reach the dev server (e.g. localhost:3000). Start it with: npm run dev'
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  // Initialize data on mount (localStorage mode only)
  useEffect(() => {
    if (isDatabaseEnabled()) return;
    if (!isInitialized()) {
      initializeData();
    } else {
      const storedLaundrySlots = getLaundrySlots();
      const storedGymSlots = getGymSlots();
      const storedCleanDuties = getCleanDuties();

      // Migrate old slot structures (e.g. legacy 2-hour laundry slots) to 1-hour model.
      const hasLegacyLaundryStructure = storedLaundrySlots.some((slot) => {
        const [startHour] = slot.startTime.split(':').map(Number);
        const [endHour] = slot.endTime.split(':').map(Number);
        return endHour - startHour !== 1;
      });

      // Enforce weekly gender rule for laundry:
      // Boys: Sun/Mon/Wed/Fri, Girls: Tue/Thu/Sat.
      const hasInvalidLaundryGenderByDay = storedLaundrySlots.some(
        (slot) => slot.gender !== getLaundryGenderForDate(slot.date)
      );

      if (hasLegacyLaundryStructure || hasInvalidLaundryGenderByDay) {
        initializeData();
        return;
      }

      // Migrate clean duties to floor-kitchen model (1 kitchen per floor, 4 floors).

      const hasLegacyDutyLabels = storedCleanDuties.some((duty) =>
        /^Room\s+\d+/i.test(duty.assignedRoom)
      );

      const needsFloorMigration = storedCleanDuties.some(
        (duty) =>
          typeof duty.kitchenFloor !== 'number' ||
          duty.kitchenFloor < 1 ||
          duty.kitchenFloor > 4
      );

      const migratedCleanDuties = hasLegacyDutyLabels || needsFloorMigration
        ? storedCleanDuties.map((duty, index) => ({
            ...duty,
            kitchenFloor: ((index % 4) + 1) as 1 | 2 | 3 | 4,
            assignedRoom: `Floor ${((index % 4) + 1)} Kitchen`,
          }))
        : storedCleanDuties;

      // Ensure every date has all 4 floor-kitchen duties.
      const expectedCleanDuties: CleanDuty[] = [];
      const upcomingDates = getNextNDays(30);
      upcomingDates.forEach((date) => {
        for (let floor = 1; floor <= 4; floor++) {
          const existing = migratedCleanDuties.find(
            (duty) => duty.date === date && (duty.kitchenFloor ?? 1) === floor
          );
          expectedCleanDuties.push(
            existing ?? {
              id: generateId(),
              assignedRoom: `Floor ${floor} Kitchen`,
              kitchenFloor: floor,
              assignedUsers: [],
              date,
              status: 'pending',
            }
          );
        }
      });

      setLaundrySlots(storedLaundrySlots);

      const normalizedGymSlots = storedGymSlots.map((s) =>
        normalizeGymSlotFromStorage(s as GymSlotInput)
      );
      const gymNeedsPersist = storedGymSlots.some(
        (s) =>
          !!(s as GymSlotInput).bookedBy || s.capacity !== GYM_SLOT_CAPACITY
      );
      setGymSlots(normalizedGymSlots);
      if (gymNeedsPersist) {
        saveGymSlots(normalizedGymSlots);
      }

      const finalCleanDuties = expectedCleanDuties.map((d) =>
        normalizeCleanDutyFromStorage(d as CleanDutyWithLegacyPhotos)
      );
      const cleanPhotoMigrateNeeded = expectedCleanDuties.some(
        (d) =>
          'photoUrl' in d &&
          String((d as { photoUrl?: string }).photoUrl ?? '').length > 0
      );
      setCleanDuties(finalCleanDuties);
      if (
        hasLegacyDutyLabels ||
        needsFloorMigration ||
        expectedCleanDuties.length !== storedCleanDuties.length ||
        cleanPhotoMigrateNeeded
      ) {
        saveCleanDuties(finalCleanDuties);
      }
      setAdminComments(getAdminComments());
      setStudentComments(getStudentComments());
    }
  }, []);

  // Auto-expire finished slot bookings every minute (local) or server tick (database).
  useEffect(() => {
    const clearExpiredBookings = () => {
      if (isDatabaseEnabled()) {
        if (!currentUser) return;
        void (async () => {
          const res = await fetch('/api/schedule/expire', {
            method: 'POST',
            credentials: 'include',
          });
          if (!res.ok) {
            if (res.status !== 401) {
              console.warn('schedule/expire failed', res.status);
            }
            return;
          }
          const j = (await res.json()) as {
            schedule?: {
              laundrySlots: LaundrySlot[];
              gymSlots: GymSlot[];
              cleanDuties: CleanDuty[];
              adminComments: AdminComment[];
              studentComments: StudentComment[];
            };
          };
          if (j.schedule) {
            setLaundrySlots(j.schedule.laundrySlots);
            setGymSlots(j.schedule.gymSlots);
            setCleanDuties(j.schedule.cleanDuties);
            setAdminComments(j.schedule.adminComments);
            setStudentComments(j.schedule.studentComments);
          }
        })();
        return;
      }

      setLaundrySlots((prev) => {
        let changed = false;
        const updated = prev.map((slot) => {
          if (!slot.bookedBy && !(slot.bookingQueue && slot.bookingQueue.length > 0)) {
            return slot;
          }

          // If slot end time has passed, clear owner and queue for this finished window.
          if (isTimePast(slot.date, slot.endTime)) {
            changed = true;
            return { ...slot, bookedBy: undefined, bookingQueue: [] };
          }
          return slot;
        });

        if (changed) {
          if (!isDatabaseEnabled()) saveLaundrySlots(updated);
          return updated;
        }
        return prev;
      });

      setGymSlots((prev) => {
        let changed = false;
        const updated = prev.map((slot) => {
          const ids = getGymBookedUserIds(slot as GymSlotInput);
          const hasQueue = (slot.bookingQueue?.length ?? 0) > 0;
          if (ids.length === 0 && !hasQueue) {
            return slot;
          }
          if (isTimePast(slot.date, slot.endTime)) {
            changed = true;
            return { ...slot, bookedUserIds: undefined, bookingQueue: [] };
          }
          return slot;
        });

        if (changed) {
          if (!isDatabaseEnabled()) saveGymSlots(updated);
          return updated;
        }
        return prev;
      });

      // Kitchen duties: remove submission (photos, status, timestamps) 24h after upload;
      // strip student + admin comments tied to those duty ids.
      const prevDuties = cleanDutiesRef.current;
      const expiredDutyIds: string[] = [];
      const nextDuties = prevDuties.map((d) => {
        if (!isKitchenSubmissionExpired(d)) return d;
        expiredDutyIds.push(d.id);
        return {
          ...d,
          photoUrls: undefined,
          submittedAt: undefined,
          status: 'pending' as const,
        };
      });
      if (expiredDutyIds.length > 0) {
        setCleanDuties(nextDuties);
        if (!isDatabaseEnabled()) saveCleanDuties(nextDuties);

        setStudentComments((sc) => {
          const filtered = sc.filter(
            (c) => !(c.dutyId && expiredDutyIds.includes(c.dutyId))
          );
          if (filtered.length !== sc.length && !isDatabaseEnabled()) {
            saveStudentComments(filtered);
          }
          return filtered;
        });

        setAdminComments((ac) => {
          const filtered = ac.filter(
            (c) =>
              !(
                expiredDutyIds.includes(c.targetId) &&
                (c.targetType === 'duty' || c.targetType === 'submission')
              )
          );
          if (filtered.length !== ac.length && !isDatabaseEnabled()) {
            saveAdminComments(filtered);
          }
          return filtered;
        });
      }
    };

    clearExpiredBookings();
    // Avoid reloading ~4k slots every minute; server only returns schedule when expiry changed something.
    const interval = setInterval(clearExpiredBookings, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Laundry functions (localStorage only; database uses submitLaundryBook / submitLaundryCancel)
  const bookLaundry = (slot: LaundrySlot): void => {
    if (isDatabaseEnabled()) return;
    const updatedSlots = laundrySlots.map((s) =>
      s.id === slot.id ? slot : s
    );
    setLaundrySlots(updatedSlots);
    saveLaundrySlots(updatedSlots);
  };

  const cancelLaundry = (slotId: string, userId: string): void => {
    if (isDatabaseEnabled()) return;
    const updatedSlots = laundrySlots.map((s) => {
      if (s.id !== slotId) {
        // If the user is queued on other slots, leave them as-is; cancellation is per-slot.
        return s;
      }

      // If user currently owns the slot, either promote next in queue or free it.
      if (s.bookedBy === userId) {
        if (s.bookingQueue && s.bookingQueue.length > 0) {
          const [nextUser, ...restQueue] = s.bookingQueue;
          return { ...s, bookedBy: nextUser, bookingQueue: restQueue };
        }
        return { ...s, bookedBy: undefined, bookingQueue: s.bookingQueue ?? [] };
      }

      // If user is only queued, remove them from the queue.
      if (s.bookingQueue && s.bookingQueue.includes(userId)) {
        return {
          ...s,
          bookingQueue: s.bookingQueue.filter((id) => id !== userId),
        };
      }

      return s;
    });
    setLaundrySlots(updatedSlots);
    saveLaundrySlots(updatedSlots);
  };

  const getUserLaundryBookings = (userId: string): LaundrySlot[] => {
    return laundrySlots.filter((s) => s.bookedBy === userId);
  };

  // Gym functions (localStorage only; database uses submitGymBook / submitGymCancel)
  const bookGym = (slot: GymSlot): void => {
    if (isDatabaseEnabled()) return;
    setGymSlots((prev) => {
      const updatedSlots = prev.map((s) => (s.id === slot.id ? slot : s));
      saveGymSlots(updatedSlots);
      return updatedSlots;
    });
  };

  const cancelGym = (slotId: string, userId: string): void => {
    if (isDatabaseEnabled()) return;
    setGymSlots((prev) => {
      const updatedSlots = prev.map((s) => {
        if (s.id !== slotId) {
          return s;
        }

        let ids = [...getGymBookedUserIds(s as GymSlotInput)];
        let queue = [...(s.bookingQueue ?? [])];
        const cap = s.capacity ?? GYM_SLOT_CAPACITY;

        if (ids.includes(userId)) {
          ids = ids.filter((id) => id !== userId);
          while (ids.length < cap && queue.length > 0) {
            const next = queue.shift();
            if (next && !ids.includes(next)) {
              ids.push(next);
            }
          }
          return {
            ...s,
            bookedUserIds: ids.length > 0 ? ids : undefined,
            bookingQueue: queue,
          };
        }

        if (queue.includes(userId)) {
          return {
            ...s,
            bookingQueue: queue.filter((id) => id !== userId),
          };
        }

        return s;
      });
      saveGymSlots(updatedSlots);
      return updatedSlots;
    });
  };

  const getUserGymBookings = (userId: string): GymSlot[] => {
    return gymSlots.filter((s) =>
      getGymBookedUserIds(s as GymSlotInput).includes(userId)
    );
  };

  const uploadDutyPhotos = async (
    dutyId: string,
    photoUrls: string[]
  ): Promise<void> => {
    if (photoUrls.length === 0) return;
    if (isDatabaseEnabled()) {
      const res = await fetch(`/api/clean-duty/${dutyId}/photos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrls }),
      });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res));
        return;
      }
      const data = (await res.json()) as { cleanDuty: CleanDuty };
      setCleanDuties((prev) => mergeCleanDuty(prev, data.cleanDuty));
      return;
    }
    const updatedDuties = cleanDuties.map((d) =>
      d.id === dutyId
        ? { ...d, photoUrls, status: 'pending' as const, submittedAt: new Date() }
        : d
    );
    setCleanDuties(updatedDuties);
    saveCleanDuties(updatedDuties);
  };

  const getUserCleanDuties = (userId: string): CleanDuty[] => {
    return cleanDuties.filter((d) => d.assignedUsers.includes(userId));
  };

  const approveDuty = async (dutyId: string): Promise<void> => {
    if (isDatabaseEnabled()) {
      const res = await fetch(`/api/clean-duty/${dutyId}/approve`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res));
        return;
      }
      const data = (await res.json()) as { cleanDuty: CleanDuty };
      setCleanDuties((prev) => mergeCleanDuty(prev, data.cleanDuty));
      return;
    }
    const updatedDuties = cleanDuties.map((d) =>
      d.id === dutyId ? { ...d, status: 'approved' as const } : d
    );
    setCleanDuties(updatedDuties);
    saveCleanDuties(updatedDuties);
  };

  const rejectDuty = async (dutyId: string): Promise<void> => {
    if (isDatabaseEnabled()) {
      const res = await fetch(`/api/clean-duty/${dutyId}/reject`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res));
        return;
      }
      const data = (await res.json()) as { cleanDuty: CleanDuty };
      setCleanDuties((prev) => mergeCleanDuty(prev, data.cleanDuty));
      return;
    }
    const updatedDuties = cleanDuties.map((d) =>
      d.id === dutyId
        ? { ...d, status: 'rejected' as const, photoUrls: undefined }
        : d
    );
    setCleanDuties(updatedDuties);
    saveCleanDuties(updatedDuties);
  };

  const assignDutyUsers = async (
    dutyId: string,
    userIds: string[],
    roomNumber?: string
  ): Promise<void> => {
    if (isDatabaseEnabled()) {
      const res = await fetch(`/api/clean-duty/${dutyId}/assign`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, roomNumber }),
      });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res));
        return;
      }
      const data = (await res.json()) as { cleanDuty: CleanDuty };
      setCleanDuties((prev) => mergeCleanDuty(prev, data.cleanDuty));
      return;
    }
    const updatedDuties = cleanDuties.map((d) =>
      d.id === dutyId
        ? {
            ...d,
            assignedUsers: userIds,
            assignedRoomNumber: roomNumber,
            assignedRoom: roomNumber
              ? `Floor ${d.kitchenFloor ?? '-'} Kitchen - Room ${roomNumber}`
              : d.assignedRoom,
          }
        : d
    );
    setCleanDuties(updatedDuties);
    saveCleanDuties(updatedDuties);
  };

  const addAdminComment = async (comment: AdminComment): Promise<void> => {
    if (isDatabaseEnabled()) {
      const res = await fetch('/api/comments/admin', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: comment.targetId,
          targetType: comment.targetType,
          content: comment.content,
        }),
      });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res));
        return;
      }
      const data = (await res.json()) as { adminComment: AdminComment };
      setAdminComments((prev) => [...prev, data.adminComment]);
      return;
    }
    const updatedComments = [...adminComments, comment];
    setAdminComments(updatedComments);
    saveAdminComments(updatedComments);
  };

  const deleteAdminComment = async (commentId: string): Promise<void> => {
    if (isDatabaseEnabled()) {
      const res = await fetch(`/api/comments/admin/${encodeURIComponent(commentId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res));
        return;
      }
      setAdminComments((prev) => prev.filter((c) => c.id !== commentId));
      return;
    }
    const updated = adminComments.filter((c) => c.id !== commentId);
    setAdminComments(updated);
    saveAdminComments(updated);
  };

  const getCommentsForTarget = (targetId: string): AdminComment[] => {
    return adminComments.filter((c) => c.targetId === targetId);
  };

  const addStudentComment = async (comment: StudentComment): Promise<void> => {
    if (isDatabaseEnabled()) {
      const res = await fetch('/api/comments/student', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dutyId: comment.dutyId,
          commentType: comment.commentType,
          content: comment.content,
        }),
      });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res));
        return;
      }
      const data = (await res.json()) as { studentComment: StudentComment };
      setStudentComments((prev) => [...prev, data.studentComment]);
      return;
    }
    const updated = [...studentComments, comment];
    setStudentComments(updated);
    saveStudentComments(updated);
  };

  const getStudentCommentsForDuty = (dutyId: string): StudentComment[] => {
    return studentComments.filter(
      (c) => c.commentType !== 'general' && c.dutyId === dutyId
    );
  };

  const getStudentCommentsForDutyByAuthor = (
    dutyId: string,
    authorId: string
  ): StudentComment[] => {
    return studentComments.filter(
      (c) => c.commentType !== 'general' && c.dutyId === dutyId && c.authorId === authorId
    );
  };

  const getGeneralStudentComments = (): StudentComment[] => {
    return studentComments.filter((c) => c.commentType === 'general');
  };

  const getGeneralStudentCommentsByAuthor = (authorId: string): StudentComment[] => {
    return studentComments.filter(
      (c) => c.commentType === 'general' && c.authorId === authorId
    );
  };

  const initializeData = (): void => {
    if (isDatabaseEnabled()) {
      void (async () => {
        try {
          const res = await fetch('/api/schedule/reset', {
            method: 'POST',
            credentials: 'include',
          });
          if (!res.ok) {
            toast.error(await apiErrorMessage(res));
            return;
          }
          const data = (await res.json()) as {
            laundrySlots: LaundrySlot[];
            gymSlots: GymSlot[];
            cleanDuties: CleanDuty[];
            adminComments: AdminComment[];
            studentComments: StudentComment[];
          };
          setLaundrySlots(data.laundrySlots);
          setGymSlots(data.gymSlots);
          setCleanDuties(data.cleanDuties);
          setAdminComments(data.adminComments);
          setStudentComments(data.studentComments);
        } catch (e) {
          console.error('Schedule reset failed', e);
        }
      })();
      return;
    }

    const fresh = createFreshSchedule();
    setLaundrySlots(fresh.laundrySlots);
    setGymSlots(fresh.gymSlots);
    setCleanDuties(fresh.cleanDuties);
    saveLaundrySlots(fresh.laundrySlots);
    saveGymSlots(fresh.gymSlots);
    saveCleanDuties(fresh.cleanDuties);
    setStudentComments([]);
    saveStudentComments([]);
    setInitialized();
  };

  const value: ScheduleContextType = {
    laundrySlots,
    bookLaundry,
    cancelLaundry,
    getUserLaundryBookings,
    gymSlots,
    bookGym,
    cancelGym,
    getUserGymBookings,
    cleanDuties,
    uploadDutyPhotos,
    getUserCleanDuties,
    approveDuty,
    rejectDuty,
    assignDutyUsers,
    adminComments,
    addAdminComment,
    deleteAdminComment,
    getCommentsForTarget,
    studentComments,
    addStudentComment,
    getStudentCommentsForDuty,
    getStudentCommentsForDutyByAuthor,
    getGeneralStudentComments,
    getGeneralStudentCommentsByAuthor,
    initializeData,
    refreshSchedule,
    submitLaundryBook,
    submitLaundryCancel,
    submitGymBook,
    submitGymCancel,
  };

  return (
    <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
  );
};

export const useSchedule = (): ScheduleContextType => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within ScheduleProvider');
  }
  return context;
};
