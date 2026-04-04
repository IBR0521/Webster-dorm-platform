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
  bookingQueue?: string[]; // queued userIds for this exact slot
  gender: 'male' | 'female';
  capacity: number; // 1 person per slot
}

// Gym Types
export interface GymSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  /** Active bookings for this hour (up to `capacity` students) */
  bookedUserIds?: string[];
  bookingQueue?: string[];
  capacity: number; // simultaneous bookings per 1-hour slot
}

// Clean Duty Types
export interface CleanDuty {
  id: string;
  assignedRoom: string;
  kitchenFloor?: number; // 1-4 floors, one kitchen per floor
  assignedRoomNumber?: string;
  assignedUsers: string[]; // userIds
  date: string;
  /** Proof-of-completion images (data URLs in mock storage) */
  photoUrls?: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt?: Date;
}

// Admin Comment Types
export interface AdminComment {
  id: string;
  targetId: string; // dutyId, userId, etc.
  targetType: 'duty' | 'user' | 'submission' | 'student_comment';
  authorId: string; // adminId
  content: string;
  createdAt: Date;
  visibility: 'admin_only';
}

// Student Comment Types
export interface StudentComment {
  id: string;
  dutyId?: string;
  commentType?: 'duty' | 'general';
  authorId: string;
  content: string;
  createdAt: Date;
}

// Scheduling Types
export interface ScheduleItem {
  id: string;
  type: 'laundry' | 'gym' | 'duty';
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'pending_approval';
  details: LaundrySlot | GymSlot | CleanDuty;
}
