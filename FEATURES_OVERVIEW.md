# Webster University Dorm Management Platform - Features Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   WEBSTER DORM PLATFORM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              AUTHENTICATION LAYER                     │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  Register   │  │    Login     │  │   Logout   │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           CENTRAL DASHBOARD                          │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ User Profile | Upcoming Schedules | Stats   │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│   │                                                           │
│   ├─── ┌──────────────────────────────────────────────┐     │
│   │    │  STUDENT SERVICES                           │     │
│   │    │  ┌──────────────────────────────────────┐   │     │
│   │    │  │ 🧺 Laundry │ 💪 Gym │ 🧹 Clean Duty │  │     │
│   │    │  │ 🎮 Game Club │ 👤 Profile         │  │     │
│   │    │  └──────────────────────────────────────┘   │     │
│   │    └──────────────────────────────────────────────┘     │
│   │                                                           │
│   └─── ┌──────────────────────────────────────────────┐     │
│        │  ADMIN SERVICES (Admin Only)                │     │
│        │  ┌──────────────────────────────────────┐   │     │
│        │  │ ⚙️ Admin Panel                      │   │     │
│        │  │ ├─ Photo Approvals                 │   │     │
│        │  │ └─ Admin Comments                  │   │     │
│        │  └──────────────────────────────────────┘   │     │
│        └──────────────────────────────────────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              DATA LAYER (localStorage)               │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Users | Schedules | Photos | Comments | etc │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Feature Breakdown

### 1. LAUNDRY SCHEDULING

```
┌─────────────────────────────────────┐
│        LAUNDRY MANAGEMENT           │
├─────────────────────────────────────┤
│                                     │
│  Gender-Specific Availability       │
│  ├─ Boys: 4 days/month             │
│  └─ Girls: 3 days/month            │
│                                     │
│  Facility Details                   │
│  ├─ 8 Launderies                   │
│  ├─ 2-hour slots each              │
│  ├─ Time: 6 AM - 10 PM             │
│  └─ 1 person per slot              │
│                                     │
│  User Actions                       │
│  ├─ View available slots            │
│  ├─ Book slots                      │
│  ├─ Cancel bookings                 │
│  └─ View booking history            │
│                                     │
│  Workflow                           │
│  Available → Booked → Completed    │
│                                     │
└─────────────────────────────────────┘
```

### 2. GYM SCHEDULING

```
┌─────────────────────────────────────┐
│         GYM MANAGEMENT              │
├─────────────────────────────────────┤
│                                     │
│  Availability                       │
│  ├─ 1-hour slots                   │
│  ├─ Daily: 6 AM - 10 PM            │
│  └─ 5 people per slot              │
│                                     │
│  Unlimited                          │
│  ├─ Unlimited monthly bookings      │
│  ├─ Multi-user support             │
│  └─ No restrictions                 │
│                                     │
│  User Actions                       │
│  ├─ View calendar                   │
│  ├─ Book sessions                   │
│  ├─ Cancel sessions                 │
│  └─ View upcoming sessions          │
│                                     │
│  Workflow                           │
│  Available → Booked → Active       │
│                                     │
└─────────────────────────────────────┘
```

### 3. CLEAN DUTY MANAGEMENT

```
┌──────────────────────────────────────┐
│      CLEAN DUTY SYSTEM               │
├──────────────────────────────────────┤
│                                      │
│  Daily Rotation                      │
│  ├─ Auto-assigned duties            │
│  ├─ Kitchen cleaning rotation       │
│  └─ Room assignments                │
│                                      │
│  Submission Workflow                 │
│  ├─ Complete assigned duty          │
│  ├─ Take photo                      │
│  ├─ Upload proof                    │
│  └─ Wait for approval               │
│                                      │
│  Status Tracking                     │
│  ├─ Pending  (⏳) - Awaiting review │
│  ├─ Approved (✅) - Verified        │
│  └─ Rejected (❌) - Re-upload       │
│                                      │
│  Admin Features                      │
│  ├─ View submissions                │
│  ├─ Review photos                   │
│  ├─ Approve/Reject                  │
│  └─ Add comments                    │
│                                      │
└──────────────────────────────────────┘
```

### 4. GAME CLUB BOOKING

```
┌──────────────────────────────────────┐
│     GAME CLUB SCHEDULING             │
├──────────────────────────────────────┤
│                                      │
│  Booking Type                        │
│  ├─ Temporary (one-time use)       │
│  └─ No permanent registration       │
│                                      │
│  Configuration                       │
│  ├─ Select date                     │
│  ├─ Choose start time               │
│  ├─ Set duration (1-8 hours)       │
│  └─ Auto-calculate end time         │
│                                      │
│  Features                            │
│  ├─ Flexible scheduling             │
│  ├─ Easy cancellation               │
│  └─ Multiple bookings allowed       │
│                                      │
│  Workflow                            │
│  Book → Active → Completed          │
│                                      │
└──────────────────────────────────────┘
```

### 5. ADMIN PANEL

```
┌──────────────────────────────────────────┐
│        ADMIN PANEL (ADMIN ONLY)          │
├──────────────────────────────────────────┤
│                                          │
│  SECTION 1: Photo Approval Queue         │
│  ├─ View pending submissions            │
│  ├─ Display photo preview               │
│  ├─ Approve photos                      │
│  └─ Reject with re-upload option        │
│                                          │
│  SECTION 2: Admin Comments              │
│  ├─ View all duty submissions           │
│  ├─ Add detailed feedback               │
│  ├─ Comments visible ONLY to admins     │
│  ├─ Students cannot see comments        │
│  └─ Comment history tracking            │
│                                          │
│  SECTION 3: Dashboard Stats             │
│  ├─ Total users                         │
│  ├─ Pending submissions                 │
│  └─ Admin comment count                 │
│                                          │
│  Visibility Control                      │
│  ├─ Admin-only routes                   │
│  ├─ Permission checks                   │
│  └─ Data isolation                      │
│                                          │
└──────────────────────────────────────────┘
```

### 6. USER PROFILE

```
┌──────────────────────────────────────┐
│       USER PROFILE                   │
├──────────────────────────────────────┤
│                                      │
│  Personal Information                │
│  ├─ Full name                       │
│  ├─ Email address                   │
│  ├─ Phone number                    │
│  └─ Room number                     │
│                                      │
│  Account Details                     │
│  ├─ Gender                          │
│  ├─ Account type (Student/Admin)    │
│  └─ Registration date               │
│                                      │
│  Features                            │
│  ├─ View-only (no editing)          │
│  ├─ Complete information display    │
│  └─ Account type indicator          │
│                                      │
└──────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│   User      │
│  Registers  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ AuthContext         │ ◄─ localStorage: Current User
│ (Auth State)        │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────┐
│ ScheduleContext      │ ◄─ localStorage: All Schedule Data
│ (Booking State)      │
└──────┬───────────────┘
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
┌──────────────────┐     ┌──────────────────┐
│ Laundry Slots    │     │ Gym Slots        │
│ Clean Duties     │     │ Game Sessions    │
│ Admin Comments   │     │ User Bookings    │
└──────────────────┘     └──────────────────┘
       │                         │
       └────────────┬────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │   localStorage   │
            │   Persistence    │
            └──────────────────┘
```

## Component Hierarchy

```
App (Root with Providers)
│
├─ AuthProvider
│  └─ ScheduleProvider
│     │
│     ├─ Home Page (Redirect)
│     │
│     ├─ Auth Routes (auth/)
│     │  ├─ /login
│     │  │  └─ LoginForm
│     │  │
│     │  └─ /register
│     │     └─ RegisterForm
│     │
│     └─ Dashboard Routes (Protected)
│        │
│        ├─ DashboardLayout
│        │  ├─ DashboardNavigation
│        │  │  └─ Nav Links (Student & Admin)
│        │  │
│        │  └─ Main Content
│        │     │
│        │     ├─ Dashboard Page (/)
│        │     │  └─ Schedule Overview
│        │     │
│        │     ├─ Laundry Page
│        │     │  ├─ LaundryScheduler
│        │     │  └─ LaundrySlotCard(s)
│        │     │
│        │     ├─ Gym Page
│        │     │  ├─ GymScheduler
│        │     │  └─ GymSlotCard(s)
│        │     │
│        │     ├─ Clean Duty Page
│        │     │  ├─ PhotoUploadForm
│        │     │  └─ DutyCard(s)
│        │     │
│        │     ├─ Game Club Page
│        │     │  └─ GameClubBooking
│        │     │
│        │     ├─ Profile Page
│        │     │  └─ UserProfileDisplay
│        │     │
│        │     └─ Admin Page (Admin Only)
│        │        ├─ PhotoApprovalPanel
│        │        └─ CommentsPanel
```

## State Management Flow

```
┌─────────────────────────────────────┐
│      React Context API              │
├─────────────────────────────────────┤
│                                     │
│  AuthContext                        │
│  ├─ currentUser                    │
│  ├─ isLoading                      │
│  ├─ isAuthenticated                │
│  ├─ isAdmin                        │
│  ├─ login()                        │
│  ├─ register()                     │
│  └─ logout()                       │
│                                     │
│  ScheduleContext                    │
│  ├─ laundrySlots[]                 │
│  ├─ gymSlots[]                     │
│  ├─ cleanDuties[]                  │
│  ├─ gameClubSessions[]             │
│  ├─ adminComments[]                │
│  │                                 │
│  ├─ Laundry Methods                │
│  │  ├─ bookLaundry()              │
│  │  ├─ cancelLaundry()            │
│  │  └─ getUserLaundryBookings()   │
│  │                                 │
│  ├─ Gym Methods                    │
│  │  ├─ bookGym()                  │
│  │  ├─ cancelGym()                │
│  │  └─ getUserGymBookings()       │
│  │                                 │
│  ├─ Clean Duty Methods             │
│  │  ├─ uploadDutyPhoto()          │
│  │  ├─ getUserCleanDuties()       │
│  │  ├─ approveDuty()              │
│  │  └─ rejectDuty()               │
│  │                                 │
│  ├─ Game Club Methods              │
│  │  ├─ bookGameClub()             │
│  │  ├─ cancelGameClub()           │
│  │  └─ getUserGameClubSessions()  │
│  │                                 │
│  └─ Admin Methods                  │
│     ├─ addAdminComment()          │
│     └─ getCommentsForTarget()     │
│                                     │
└─────────────────────────────────────┘
```

## User Journey Maps

### Student Journey
```
Register → Login → Dashboard 
         ↓
    Explore Features
    ├─ Book Laundry ──→ View Booking ──→ Cancel
    ├─ Book Gym ──────→ View Session ──→ Cancel
    ├─ Upload Photo ──→ Wait Approval ──→ Check Status
    ├─ Book Game Club → View Session ──→ Cancel
    └─ View Profile ──→ See Info (Read-only)
```

### Admin Journey
```
Login (admin@webster.edu) → Dashboard → Admin Panel
                          ↓
                    Two Main Tasks
                    ├─ Photo Approvals
                    │  ├─ View Pending
                    │  ├─ Review Photo
                    │  └─ Approve/Reject
                    │
                    └─ Comments
                       ├─ View Submissions
                       ├─ Add Feedback
                       └─ Track History
```

## Status Codes & Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Available | Green | Slot/feature available for booking |
| Booked | Gray | Already booked by someone |
| Your Booking | Blue | Booked by current user |
| Pending | Yellow | Awaiting approval/review |
| Approved | Green | Approved by admin |
| Rejected | Red | Needs resubmission |
| Upcoming | Blue | Future appointment |
| In Progress | Yellow | Currently active |
| Completed | Gray | Already finished |

## Data Models Summary

```
Users
├─ id, name, surname, email, phone
├─ roomNumber, gender
├─ isAdmin, registeredAt

LaundrySlots
├─ id, launderyNumber (1-8), date
├─ startTime, endTime (2-hour blocks)
├─ bookedBy?, gender
└─ capacity: 1

GymSlots
├─ id, date, startTime, endTime (1-hour)
├─ bookedBy?, capacity: 5

CleanDuties
├─ id, assignedRoom, assignedUsers[]
├─ date, photoUrl?, submittedAt?
└─ status: pending|approved|rejected

GameClubSessions
├─ id, userId, date
├─ startTime, endTime, durationHours
└─ createdAt

AdminComments
├─ id, targetId, targetType
├─ authorId, content, createdAt
└─ visibility: admin_only
```

---

This comprehensive overview provides a complete visual understanding of the platform architecture, features, and data flow!
