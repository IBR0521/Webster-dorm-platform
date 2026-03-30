# Getting Started - Webster University Dorm Management Platform

## Prerequisites
- Node.js 18+ installed
- npm, yarn, or pnpm package manager
- Modern web browser

## Installation

### 1. Install Dependencies
```bash
pnpm install
# or
npm install
# or
yarn install
```

### 2. Start Development Server
```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:3000`

## First Time Setup

1. **Open the application**
   - Navigate to http://localhost:3000
   - You'll be redirected to login page

2. **Admin Account Auto-Created**
   - The admin account is created automatically on first load
   - Email: `admin@webster.edu`
   - Password: any password (mock auth)

3. **Login as Admin (Optional)**
   - Click "Login here"
   - Enter admin@webster.edu
   - Enter any password
   - Explore admin features

4. **Register as Student**
   - Click back to registration
   - Fill in student details:
     - Name
     - Surname
     - Email (use a different email than admin)
     - Phone number
     - Room number
     - Gender (Male/Female)
   - Click Register
   - You'll be logged in to your dashboard

## Quick Navigation

### For Students
1. **Dashboard** - See all your upcoming schedules
2. **Laundry** - Book 2-hour laundry slots
3. **Gym** - Book 1-hour gym sessions
4. **Clean Duty** - View assignments and upload photos
5. **Game Club** - Book temporary game sessions
6. **Profile** - View your account information

### For Admins
1. **Dashboard** - Same as students
2. All student features...
3. **Admin Panel** - Access approvals and comments

## Testing the Features

### Test Scenario 1: Book Laundry
1. Login as student
2. Go to Laundry page
3. Select a date and laundery
4. Click "Book Slot"
5. View booking in "Your Bookings"
6. Dashboard shows next laundry appointment

### Test Scenario 2: Upload Clean Duty Photo
1. Go to Clean Duty page
2. Click "Upload Photo"
3. Select a test image from your device
4. Click "Upload Photo"
5. Status changes to "Pending Approval"
6. Login as admin to see approval queue

### Test Scenario 3: Admin Approval
1. Login as admin (admin@webster.edu)
2. Go to Admin Panel
3. Review photo in "Photo Approval Queue"
4. Click "Approve"
5. Status updates in student's view

### Test Scenario 4: Add Admin Comment
1. As admin, stay in Admin Panel
2. Go to "Comments Panel"
3. Click "Add Comment" on a duty
4. Type feedback
5. Click "Post Comment"
6. Comment saved (invisible to students)

## Useful Commands

### Development
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linter
```

### Reset Data
To clear all data and start fresh:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Clear all entries for localhost:3000
4. Refresh page - admin account recreated

## File Structure Overview

```
webster-dorm-platform/
├── app/                    # Next.js pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── page.tsx          # Home/redirect
├── components/            # Reusable React components
│   ├── admin/            # Admin-specific components
│   ├── dashboard/        # Dashboard components
│   ├── laundry/          # Laundry components
│   ├── gym/              # Gym components
│   ├── clean-duty/       # Clean duty components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and helpers
│   ├── context/          # React Context providers
│   ├── types/            # TypeScript definitions
│   └── utils/            # Helper functions
├── public/               # Static assets
└── docs/                 # Documentation files
```

## Key Files to Understand

### Core Architecture
- `/lib/context/AuthContext.tsx` - Authentication state
- `/lib/context/ScheduleContext.tsx` - Schedule/booking state
- `/lib/types/index.ts` - All TypeScript interfaces

### Authentication
- `app/(auth)/register/page.tsx` - Student registration
- `app/(auth)/login/page.tsx` - Login page

### Features
- `app/(dashboard)/laundry/page.tsx` - Laundry booking
- `app/(dashboard)/gym/page.tsx` - Gym booking
- `app/(dashboard)/clean-duty/page.tsx` - Clean duty
- `app/(dashboard)/game-club/page.tsx` - Game club
- `app/(dashboard)/admin/page.tsx` - Admin panel

### Components
- `components/dashboard/DashboardNavigation.tsx` - Main navigation
- `components/admin/PhotoApprovalPanel.tsx` - Photo approvals
- `components/admin/CommentsPanel.tsx` - Admin comments

## Troubleshooting

### App Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Data Not Persisting
- Check if localStorage is enabled in browser
- Clear browser cache and refresh
- Open DevTools → Application → Local Storage

### Can't Login as Admin
- Check if you're using correct email: `admin@webster.edu`
- Refresh page (admin auto-creates on load)
- Clear localStorage and restart

### Features Not Working
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify localStorage isn't full

## Documentation Files

- **QUICK_START.md** - Feature quick reference
- **PLATFORM_GUIDE.md** - Complete feature documentation
- **ADMIN_SETUP.md** - Admin account and panel guide
- **BUILD_SUMMARY.md** - Technical build details
- **GETTING_STARTED.md** - This file

## Development Tips

### Adding New Features
1. Add types in `/lib/types/index.ts`
2. Add context methods in `/lib/context/ScheduleContext.tsx`
3. Create component in `/components/`
4. Create page in `/app/(dashboard)/`
5. Add navigation link in `DashboardNavigation.tsx`

### Styling
- Use Tailwind CSS classes
- Use shadcn/ui components
- Check `globals.css` for theme variables
- Color system defined in CSS variables

### State Management
- Use AuthContext for user state
- Use ScheduleContext for booking state
- Use hooks: `useAuth()`, `useSchedule()`

## Browser DevTools Tips

### Check Stored Data
```javascript
// In browser console:
localStorage.getItem('webster_current_user') // Current user
localStorage.getItem('webster_laundry_slots') // Laundry data
localStorage.getItem('webster_admin_comments') // Admin comments
```

### Reset All Data
```javascript
// In browser console:
localStorage.clear() // Clear everything
window.location.reload() // Restart app
```

## Performance Considerations

- App uses localStorage (no server calls)
- Large images may slow performance
- Data is stored locally only
- Each browser has separate data

## Next Steps

1. ✅ Start the app
2. ✅ Explore all features as student
3. ✅ Test admin panel functions
4. ✅ Review code structure
5. ✅ Read BUILD_SUMMARY.md for technical details
6. ✅ Customize colors/styling as needed

## Support

For issues or questions:
1. Check browser console for errors (F12)
2. Review relevant documentation file
3. Check code comments in components
4. Examine data in localStorage via DevTools

## Production Deployment

To deploy to production:

### Using Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Using Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Using Traditional Hosting
```bash
pnpm build
# Upload 'out' folder to hosting provider
```

## Environment Variables
Currently not needed (frontend-only). For future backend integration:
```
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_ADMIN_EMAIL=admin_email
```

---

**Happy Testing!** 🎉

For detailed feature information, see PLATFORM_GUIDE.md or QUICK_START.md
