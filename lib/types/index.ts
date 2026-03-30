// User Types
export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  roomNumber: string;
  gender: 'male' | 'female';
  password: string; // Simple password storage for mock auth
  isAdmin: boolean;
  registeredAt: Date;
}

// Laundry Types
export interface LaundrySlot {
  id: string;
  launderyNumber: number; // 1-8
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  date: string; // YYYY-MM-DD
  bookedBy?: string; // userId
  gender: 'male' | 'female';
  capacity: number; // 1 person per slot
}

// Gym Types
export interface GymSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  bookedBy?: string;
  capacity: number;
}

// Clean Duty Types
export interface CleanDuty {
  id: string;
  assignedRoom: string;
  assignedUsers: string[]; // userIds
  date: string;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt?: Date;
}

// Game Club Types
export interface GameClubSession {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  createdAt: Date;
}

// Admin Comment Types
export interface AdminComment {
  id: string;
  targetId: string; // dutyId, userId, etc.
  targetType: 'duty' | 'user' | 'submission';
  authorId: string; // adminId
  content: string;
  createdAt: Date;
  visibility: 'admin_only';
}

// Scheduling Types
export interface ScheduleItem {
  id: string;
  type: 'laundry' | 'gym' | 'duty' | 'game_club';
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'pending_approval';
  details: LaundrySlot | GymSlot | CleanDuty | GameClubSession;
}
