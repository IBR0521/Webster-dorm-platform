'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  LaundrySlot,
  GymSlot,
  CleanDuty,
  GameClubSession,
  AdminComment,
} from '../types';
import {
  getLaundrySlots,
  saveLaundrySlots,
  getGymSlots,
  saveGymSlots,
  getCleanDuties,
  saveCleanDuties,
  getGameClubSessions,
  saveGameClubSessions,
  getAdminComments,
  saveAdminComments,
  isInitialized,
  setInitialized,
} from '../utils/storage';
import { generateId, getNextNDays } from '../utils/helpers';

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
  uploadDutyPhoto: (dutyId: string, photoUrl: string) => void;
  getUserCleanDuties: (userId: string) => CleanDuty[];
  approveDuty: (dutyId: string) => void;
  rejectDuty: (dutyId: string) => void;

  // Game Club
  gameClubSessions: GameClubSession[];
  bookGameClub: (session: GameClubSession) => void;
  cancelGameClub: (sessionId: string) => void;
  getUserGameClubSessions: (userId: string) => GameClubSession[];

  // Admin Comments
  adminComments: AdminComment[];
  addAdminComment: (comment: AdminComment) => void;
  getCommentsForTarget: (targetId: string) => AdminComment[];

  // Initialization
  initializeData: () => void;
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
  const [gameClubSessions, setGameClubSessions] = useState<GameClubSession[]>(
    []
  );
  const [adminComments, setAdminComments] = useState<AdminComment[]>([]);

  // Initialize data on mount
  useEffect(() => {
    if (!isInitialized()) {
      initializeData();
    } else {
      setLaundrySlots(getLaundrySlots());
      setGymSlots(getGymSlots());
      setCleanDuties(getCleanDuties());
      setGameClubSessions(getGameClubSessions());
      setAdminComments(getAdminComments());
    }
  }, []);

  // Laundry functions
  const bookLaundry = (slot: LaundrySlot): void => {
    const updatedSlots = laundrySlots.map((s) =>
      s.id === slot.id ? slot : s
    );
    setLaundrySlots(updatedSlots);
    saveLaundrySlots(updatedSlots);
  };

  const cancelLaundry = (slotId: string, userId: string): void => {
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

  // Gym functions
  const bookGym = (slot: GymSlot): void => {
    const updatedSlots = gymSlots.map((s) =>
      s.id === slot.id ? slot : s
    );
    setGymSlots(updatedSlots);
    saveGymSlots(updatedSlots);
  };

  const cancelGym = (slotId: string, userId: string): void => {
    const updatedSlots = gymSlots.map((s) => {
      if (s.id !== slotId) {
        return s;
      }

      if (s.bookedBy === userId) {
        if (s.bookingQueue && s.bookingQueue.length > 0) {
          const [nextUser, ...restQueue] = s.bookingQueue;
          return { ...s, bookedBy: nextUser, bookingQueue: restQueue };
        }
        return { ...s, bookedBy: undefined, bookingQueue: s.bookingQueue ?? [] };
      }

      if (s.bookingQueue && s.bookingQueue.includes(userId)) {
        return {
          ...s,
          bookingQueue: s.bookingQueue.filter((id) => id !== userId),
        };
      }

      return s;
    });
    setGymSlots(updatedSlots);
    saveGymSlots(updatedSlots);
  };

  const getUserGymBookings = (userId: string): GymSlot[] => {
    return gymSlots.filter((s) => s.bookedBy === userId);
  };

  // Clean Duty functions
  const uploadDutyPhoto = (dutyId: string, photoUrl: string): void => {
    const updatedDuties = cleanDuties.map((d) =>
      d.id === dutyId
        ? { ...d, photoUrl, status: 'pending', submittedAt: new Date() }
        : d
    );
    setCleanDuties(updatedDuties);
    saveCleanDuties(updatedDuties);
  };

  const getUserCleanDuties = (userId: string): CleanDuty[] => {
    return cleanDuties.filter((d) => d.assignedUsers.includes(userId));
  };

  const approveDuty = (dutyId: string): void => {
    const updatedDuties = cleanDuties.map((d) =>
      d.id === dutyId ? { ...d, status: 'approved' } : d
    );
    setCleanDuties(updatedDuties);
    saveCleanDuties(updatedDuties);
  };

  const rejectDuty = (dutyId: string): void => {
    const updatedDuties = cleanDuties.map((d) =>
      d.id === dutyId ? { ...d, status: 'rejected', photoUrl: undefined } : d
    );
    setCleanDuties(updatedDuties);
    saveCleanDuties(updatedDuties);
  };

  // Game Club functions
  const bookGameClub = (session: GameClubSession): void => {
    const updatedSessions = [...gameClubSessions, session];
    setGameClubSessions(updatedSessions);
    saveGameClubSessions(updatedSessions);
  };

  const cancelGameClub = (sessionId: string): void => {
    const updatedSessions = gameClubSessions.filter((s) => s.id !== sessionId);
    setGameClubSessions(updatedSessions);
    saveGameClubSessions(updatedSessions);
  };

  const getUserGameClubSessions = (userId: string): GameClubSession[] => {
    return gameClubSessions.filter((s) => s.userId === userId);
  };

  // Admin Comments functions
  const addAdminComment = (comment: AdminComment): void => {
    const updatedComments = [...adminComments, comment];
    setAdminComments(updatedComments);
    saveAdminComments(updatedComments);
  };

  const getCommentsForTarget = (targetId: string): AdminComment[] => {
    return adminComments.filter((c) => c.targetId === targetId);
  };

  // Initialize data with mock data
  const initializeData = (): void => {
    // Create laundry slots for next 30 days
    const laundryDates = getNextNDays(30);
    const newLaundrySlots: LaundrySlot[] = [];

    laundryDates.forEach((date) => {
      for (let launderyNum = 1; launderyNum <= 8; launderyNum++) {
        // Create 1-hour slots so users can choose flexible duration.
        for (let slotStart = 6; slotStart < 22; slotStart += 1) {
          const startTime = `${String(slotStart).padStart(2, '0')}:00`;
          const endTime = `${String(slotStart + 1).padStart(2, '0')}:00`;

          // Alternate gender availability
          const genders: ('male' | 'female')[] = ['male', 'female'];
          genders.forEach((gender) => {
            newLaundrySlots.push({
              id: generateId(),
              launderyNumber: launderyNum,
              startTime,
              endTime,
              date,
              gender,
              capacity: 1,
              bookingQueue: [],
            });
          });
        }
      }
    });

    setLaundrySlots(newLaundrySlots);
    saveLaundrySlots(newLaundrySlots);

    // Create gym slots for next 30 days
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
          capacity: 5,
          bookingQueue: [],
        });
      }
    });

    setGymSlots(newGymSlots);
    saveGymSlots(newGymSlots);

    // Create clean duty schedule
    const newCleanDuties: CleanDuty[] = laundryDates.slice(0, 30).map((date) => ({
      id: generateId(),
      assignedRoom: `Room ${Math.floor(Math.random() * 100) + 1}`,
      assignedUsers: [],
      date,
      status: 'pending',
    }));

    setCleanDuties(newCleanDuties);
    saveCleanDuties(newCleanDuties);

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
    uploadDutyPhoto,
    getUserCleanDuties,
    approveDuty,
    rejectDuty,
    gameClubSessions,
    bookGameClub,
    cancelGameClub,
    getUserGameClubSessions,
    adminComments,
    addAdminComment,
    getCommentsForTarget,
    initializeData,
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
