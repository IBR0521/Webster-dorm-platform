# Webster University Dorm Management Platform

A comprehensive platform for managing dorm facilities and services at Webster University Tashkent.

## Features

### 1. **User Registration & Authentication**
- Single registration form requiring: Name, Surname, Email, Phone, Room Number, and Gender
- No admin self-registration (admin accounts created manually by developer)
- Simple login system for students

### 2. **Central Dashboard**
- Overview of all upcoming schedules
- Quick stats showing total bookings
- Quick action buttons to manage services
- Responsive design for mobile and desktop

### 3. **Laundry Scheduling**
- 8 launderies available
- 2-hour time slots (6 AM - 10 PM)
- Gender-specific availability:
  - **Boys**: 4 days per month
  - **Girls**: 3 days per month
- View available slots by date and laundery number
- Book and cancel laundry slots
- View your upcoming bookings

### 4. **Gym Scheduling**
- 1-hour time slots throughout the day
- Unlimited capacity per slot
- Calendar-based booking system
- Book and cancel gym sessions
- View upcoming sessions

### 5. **Clean Duty Management**
- Assigned daily clean duty schedule
- Photo upload verification system
- Three status levels:
  - **Pending**: Submitted, awaiting admin approval
  - **Approved**: Duty verified and approved
  - **Rejected**: Photo not accepted, resubmission available
- Upload photos to verify completion
- Historical view of all duties

### 6. **Game Club Scheduling**
- Temporary booking (no permanent registration)
- Specify date, start time, and duration (1-8 hours)
- Flexible scheduling system
- Cancel sessions anytime
- View all your game club sessions

### 7. **Admin Panel** (Admin Only)
- Photo approval queue for clean duties
- View submitted photos and approve/reject
- Admin-only comment section
- Add comments/feedback on submissions
- Comments hidden from regular students
- Queue shows pending submissions

### 8. **User Profile**
- View all account information
- Display personal details, room number, registration date
- Account type indicator (Student/Admin)
- Profile information is read-only

## Getting Started

### First Time Setup

1. **Create Admin Account**
   - Admin account is created automatically on first app load
   - Email: `admin@webster.edu`
   - Password: any password (mock authentication)

2. **Access the Platform**
   - Open the app and go to `/login`
   - Register a new student account with your details
   - Or login with admin account to access admin panel

### For Developers

To manually create additional admin accounts:

```typescript
import { initializeAdminAccount } from '@/lib/utils/initAdmin';
initializeAdminAccount();
```

Or manually add to localStorage:
```javascript
const adminUser = {
  id: 'unique-id',
  name: 'Admin',
  surname: 'Name',
  email: 'admin@email.edu',
  phone: '+1-555-0000',
  roomNumber: 'ADMIN',
  gender: 'male',
  isAdmin: true,
  registeredAt: new Date()
};
```

## Platform Architecture

### Frontend-Only Implementation
- No backend API calls
- All data stored in browser's localStorage
- Data persists until browser cache is cleared

### Tech Stack
- **Framework**: Next.js 14+ with App Router
- **UI**: shadcn/ui + Tailwind CSS
- **State Management**: React Context API
- **Storage**: localStorage (mock persistence)
- **Language**: TypeScript

### Project Structure
```
/app
  /(auth)              # Registration & Login pages
  /(dashboard)         # Protected dashboard pages
    /laundry          # Laundry scheduling
    /gym              # Gym scheduling
    /clean-duty       # Clean duty management
    /game-club        # Game club booking
    /admin            # Admin panel
    /profile          # User profile

/components
  /dashboard          # Dashboard navigation & components
  /laundry           # Laundry-related components
  /gym               # Gym-related components
  /clean-duty        # Clean duty components
  /admin             # Admin panel components

/lib
  /types             # TypeScript interfaces
  /context           # React Context providers
  /utils             # Utility functions & helpers
```

## Key Features Overview

### Laundry System
- Rotational availability based on gender
- 2-hour fixed time slots
- Separate launderies (8 total)
- Booking confirmation and cancellation
- Next booking quick view on dashboard

### Gym System
- Flexible 1-hour slots
- Daily availability
- Multi-user booking support
- Quick access from dashboard

### Clean Duty System
- Automatic daily assignments
- Photo proof requirement
- Admin approval workflow
- Status tracking (Pending/Approved/Rejected)
- Photo preview functionality

### Game Club System
- Temporary bookings (no permanent registration)
- Custom duration (1-8 hours)
- Flexible scheduling
- One-time use sessions
- Easy cancellation

### Admin System
- Photo approval queue
- Admin-only comments (hidden from students)
- Duty management interface
- Comment history tracking
- Isolated admin views

## Mock Data

The platform generates mock data on first initialization:
- 30 days of laundry slots
- 30 days of gym slots
- 30 days of clean duty assignments
- Initial admin account

## Important Notes

### Authentication
- Mock authentication accepts any email/password combination
- Passwords are not stored or validated
- For production, implement proper authentication

### Data Persistence
- All data stored in browser localStorage
- Clearing browser data will reset the platform
- No data synchronization across devices

### Admin Comments
- Only visible to users with `isAdmin: true`
- Regular students cannot see or access comments
- Comments attached to duty submissions

### Photo Uploads
- Photos stored as base64 in localStorage
- Large images may impact performance
- For production, use cloud storage (AWS S3, Cloudinary, etc.)

## Testing

### Test Account Credentials
- **Admin**: 
  - Email: `admin@webster.edu`
  - Password: any password
  
- **Student**: 
  - Register any account with valid details
  - Login with registered email

### Test Scenarios
1. Register as student → book laundry → view on dashboard
2. Login as admin → view clean duty queue → approve/reject photos
3. Book gym session → add game club session → view both on dashboard
4. Upload clean duty photo → admin approves → check status update

## Troubleshooting

### Data Not Persisting
- Check browser localStorage is enabled
- Clear cache and reload
- Check browser's Storage settings

### Admin Panel Not Accessible
- Verify user has `isAdmin: true`
- Admin account created on first app load
- Try logging in with `admin@webster.edu`

### Photos Not Displaying
- Ensure browser allows file reading
- Check localStorage isn't full
- Try smaller image files

## Future Enhancements

- Backend API integration
- Real authentication system
- Cloud file storage
- Email notifications
- Automated duty assignments
- Analytics dashboard
- Push notifications
- Payment integration for laundry
- Reporting and export features

## Support

For issues or questions about the platform, contact the development team.
