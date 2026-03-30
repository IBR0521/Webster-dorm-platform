# Admin Account Setup Guide

## Automatic Setup
The admin account is created automatically on the first app load.

### Default Admin Credentials
- **Email**: `admin@webster.edu`
- **Password**: Any password (mock authentication accepts any input)

## First Login Steps

1. Open the application
2. Click "Login here" on the registration page
3. Enter admin credentials:
   - Email: `admin@webster.edu`
   - Password: (any password)
4. Click "Sign In"
5. You will be redirected to the admin dashboard

## Accessing the Admin Panel

Once logged in as admin:
1. Look for the "⚙️ Admin Panel" option in the sidebar
2. Click it to access the admin dashboard

## Admin Features

### 1. Photo Approval Queue
- View all clean duty photos pending approval
- Review submitted photos
- Approve photos if duty is complete
- Reject photos if not acceptable (student can re-upload)

**Steps:**
1. Click on a pending submission to expand it
2. Review the photo
3. Click "✓ Approve" or "✗ Reject"
4. Status updates in real-time

### 2. Admin Comments Section
- Add comments/feedback on any duty submission
- Comments are only visible to admins
- Students cannot see admin comments
- Track all feedback in one place

**Steps:**
1. Find the duty submission in the comments panel
2. Click "Add Comment"
3. Type your feedback
4. Click "Post Comment"
5. Comment appears in the history

## Managing Users

Currently, the platform handles user creation through:
- Student self-registration (register page)
- Manual admin account creation

### To Create Additional Admin Accounts

Edit `/lib/utils/initAdmin.ts` and add more admin users:

```typescript
const adminUsers = [
  {
    id: generateId(),
    name: 'Admin',
    surname: 'One',
    email: 'admin1@webster.edu',
    phone: '+1-555-0001',
    roomNumber: 'ADMIN',
    gender: 'male',
    isAdmin: true,
    registeredAt: new Date(),
  },
  // Add more admins...
];

users.push(...adminUsers);
```

Then reload the app to initialize.

## Testing the Admin Panel

### Test Scenario 1: Approve a Clean Duty
1. Login as a student
2. Go to Clean Duty page
3. Upload a photo for a duty
4. Logout and login as admin
5. Go to Admin Panel → Photo Approval Queue
6. Approve the photo
7. Logout and login as student to see updated status

### Test Scenario 2: Add Admin Comments
1. Have a student upload a clean duty photo
2. Login as admin
3. Go to Admin Panel → Comments Panel
4. Click "Add Comment" on the duty
5. Add feedback
6. Comments are saved (students can't see)

## Admin-Only Features

✅ **Can Access:**
- Photo approval queue
- Admin comments section
- All student data for moderation

✅ **Cannot Access:**
- Student edit profiles (admin only view)
- System configuration

❌ **Cannot Do (by Design):**
- Delete student accounts
- View student comments (if implemented)
- Edit student bookings

## Important Security Notes

⚠️ **Current Implementation:**
- Mock authentication (for development only)
- No password validation
- All data stored in browser localStorage
- Admin status stored in local user object

⚠️ **For Production:**
- Implement proper JWT-based authentication
- Use secure password hashing
- Store admin data in secure backend database
- Add role-based access control (RBAC)
- Implement audit logging

## Troubleshooting Admin Access

### Admin Panel Not Showing
- Verify you're logged in as `admin@webster.edu`
- Check if `isAdmin` flag is set to `true` in user object
- Reload the page

### Photos Not Appearing in Approval Queue
- Ensure a student has uploaded photos
- Photos must have status "pending" to appear
- Check localStorage hasn't been cleared

### Comments Not Saving
- Verify admin is logged in
- Check browser console for errors
- Ensure localStorage has available space

## Developer Notes

The admin system is built with:
- Frontend-only admin panel
- No backend API required
- Real-time data updates via Context API
- localStorage for data persistence

To add more features, edit:
- `/components/admin/PhotoApprovalPanel.tsx` - Photo approvals
- `/components/admin/CommentsPanel.tsx` - Admin comments
- `/app/(dashboard)/admin/page.tsx` - Main admin page
