import {
  User,
  LaundrySlot,
  GymSlot,
  CleanDuty,
  GameClubSession,
  AdminComment,
} from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'webster_current_user',
  USERS: 'webster_users',
  LAUNDRY_SLOTS: 'webster_laundry_slots',
  GYM_SLOTS: 'webster_gym_slots',
  CLEAN_DUTIES: 'webster_clean_duties',
  GAME_CLUB_SESSIONS: 'webster_game_club_sessions',
  ADMIN_COMMENTS: 'webster_admin_comments',
  INITIALIZED: 'webster_initialized',
};

// User Management
export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUsers = (users: User[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// Laundry Management
export const getLaundrySlots = (): LaundrySlot[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.LAUNDRY_SLOTS);
  return data ? JSON.parse(data) : [];
};

export const saveLaundrySlots = (slots: LaundrySlot[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LAUNDRY_SLOTS, JSON.stringify(slots));
};

// Gym Management
export const getGymSlots = (): GymSlot[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.GYM_SLOTS);
  return data ? JSON.parse(data) : [];
};

export const saveGymSlots = (slots: GymSlot[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.GYM_SLOTS, JSON.stringify(slots));
};

// Clean Duty Management
export const getCleanDuties = (): CleanDuty[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.CLEAN_DUTIES);
  return data ? JSON.parse(data) : [];
};

export const saveCleanDuties = (duties: CleanDuty[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CLEAN_DUTIES, JSON.stringify(duties));
};

// Game Club Management
export const getGameClubSessions = (): GameClubSession[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.GAME_CLUB_SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const saveGameClubSessions = (sessions: GameClubSession[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    STORAGE_KEYS.GAME_CLUB_SESSIONS,
    JSON.stringify(sessions)
  );
};

// Admin Comments Management
export const getAdminComments = (): AdminComment[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.ADMIN_COMMENTS);
  return data ? JSON.parse(data) : [];
};

export const saveAdminComments = (comments: AdminComment[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ADMIN_COMMENTS, JSON.stringify(comments));
};

// Initialization Check
export const isInitialized = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
};

export const setInitialized = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
};

// Clear all data (for development/testing)
export const clearAllData = (): void => {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
};
