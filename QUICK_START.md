# Webster University Dorm Management Platform - Quick Start

## 🚀 Get Started in 3 Steps

### Step 1: Launch the App
Open the application in your browser. The admin account is created automatically.

### Step 2: Choose Your Role
- **Student**: Click "Register" and create your account
- **Admin**: Login with `admin@webster.edu` (any password)

### Step 3: Explore Features
Start booking services and managing your schedule!

---

## 📚 Feature Quick Guide

### 🧺 Laundry Scheduling
**What**: Book 2-hour laundry slots
**Where**: Dashboard → Laundry
**How**:
1. Select date and laundery number
2. Choose available 2-hour slot
3. Click "Book Slot"
4. View your bookings below

**Gender-Based Days**:
- Boys: 4 days/month
- Girls: 3 days/month

---

### 💪 Gym Scheduling  
**What**: Book 1-hour gym sessions
**Where**: Dashboard → Gym
**How**:
1. Select date
2. Choose 1-hour time slot
3. Click "Book Session"
4. View bookings in list below

**Capacity**: Up to 5 people per slot

---

### 🧹 Clean Duty
**What**: Complete daily cleaning duties with photo proof
**Where**: Dashboard → Clean Duty
**Status Flow**: Pending → Approved/Rejected

**How to Complete**:
1. View assigned duty
2. Complete the cleaning
3. Upload photo as proof
4. Wait for admin approval
5. Status updates when approved

---

### 🎮 Game Club
**What**: Temporary game session bookings (no permanent registration)
**Where**: Dashboard → Game Club
**How**:
1. Select date and start time
2. Choose duration (1-8 hours)
3. Click "Book Session"
4. Cancel anytime

**Note**: Each booking is temporary - no permanent membership

---

### 👤 Profile
**What**: View your account information
**Where**: Dashboard → Profile
**Info Shown**:
- Name and contact details
- Room number and gender
- Account type (Student/Admin)
- Registration date

---

### ⚙️ Admin Panel (Admin Only)
**What**: Manage submissions and add comments
**Where**: Dashboard → Admin Panel
**Features**:
1. **Photo Approval Queue**: Approve/reject student photos
2. **Comments Panel**: Add admin-only feedback (students can't see)

---

## 📊 Dashboard Overview

The main dashboard shows:
- ✅ Quick stats (total bookings)
- 📅 Next upcoming appointment for each service
- 🔗 Quick action buttons
- 📱 Mobile-friendly layout

---

## 🔑 Test Accounts

### Admin Account
```
Email: admin@webster.edu
Password: (any password - mock auth)
```

### Student Account
```
1. Register with your details
2. Login with registered email
3. Password: (any password - mock auth)
```

---

## 📱 Platform Features at a Glance

| Feature | Max per Month | Time Slots | Notes |
|---------|---------------|-----------|-------|
| Laundry (Boys) | 4 days | 2 hours each | Gender-specific |
| Laundry (Girls) | 3 days | 2 hours each | Gender-specific |
| Gym | Unlimited | 1 hour each | Multiple users allowed |
| Clean Duty | Daily rotation | Varies | Requires photo proof |
| Game Club | Unlimited | Custom | Temporary bookings |

---

## ⚡ Quick Tips

✅ **DO**
- Check dashboard for next appointment
- Upload clean duty photos same day
- Book games club with specific duration
- Review your profile information
- Admin: Approve photos promptly

❌ **DON'T**
- Wait until last minute to cancel laundry
- Forget to upload duty photos
- Book gym slots you won't use
- Expect permanent game club registration

---

## 🆘 Common Tasks

### Need to Cancel a Booking?
1. Find your booking in the respective page
2. Click "Cancel" or "Cancel Session"
3. Slot becomes available for others

### Upload Clean Duty Photo?
1. Go to Clean Duty page
2. Click "Upload Photo"
3. Select image from device
4. Review preview
5. Click "Upload Photo"
6. Wait for admin approval

### Add Admin Comment?
(Admin only)
1. Go to Admin Panel
2. Find duty in Comments section
3. Click "Add Comment"
4. Type your feedback
5. Click "Post Comment"

---

## 🎯 Goals of Each Feature

| Feature | Goal |
|---------|------|
| Laundry | Fair access to washing facilities |
| Gym | Manage fitness facility usage |
| Clean Duty | Maintain hygienic shared spaces |
| Game Club | Flexible gaming session booking |
| Admin Panel | Monitor and approve submissions |

---

## 📞 Need Help?

Refer to:
- **Full Guide**: `PLATFORM_GUIDE.md`
- **Admin Guide**: `ADMIN_SETUP.md`
- **This Guide**: `QUICK_START.md`

For developer questions, check the TypeScript code in:
- `/lib/context/` - State management
- `/lib/types/` - Data structures
- `/components/` - UI components

---

**Platform**: Webster University Dorm Management
**Version**: 1.0.0
**Last Updated**: 2026
