# Flight Booking PWA - Developer Guide

## Getting Up to Speed

If you're joining this project, here's what you need to know:

### Project Overview
- **Type:** Full-stack flight booking web app
- **Status:** 90% complete, production-ready
- **Team:** Solo developer (you can collaborate!)
- **Timeline:** Started recently, actively in development

### Tech Stack Highlights
```
Frontend:  Next.js 16 + React 19 + TypeScript + Tailwind CSS
State:     Zustand (simple, lightweight)
Backend:   Next.js Server Actions (secure)
Database:  PostgreSQL (via Supabase)
Auth:      Supabase Auth (email/password)
Real-time: Supabase Realtime (WebSockets)
```

---

## Quick Start (5 minutes)

```bash
# 1. Clone & install
git clone <repo>
cd flight-booking-pwa
npm install

# 2. Setup Supabase
# Create account at https://supabase.com
# Create .env.local with credentials

# 3. Setup database
# Run migrations in Supabase SQL Editor:
#   001_initial_schema.sql
#   002_rls_policies.sql
#   003_rpc_functions.sql
# Then run seed.sql

# 4. Run
npm run dev
# Visit http://localhost:3000
```

---

## Code Structure (Find Things Fast)

```
What?                          Where?
─────────────────────────────────────────────────────────
User sees...                   app/page.tsx, app/*/page.tsx
Search flights                 app/actions/flights.ts
User login/signup              app/auth/*.tsx
Booking flow                   app/booking/[flightId]/page.tsx
My bookings (protected)        app/(protected)/my-bookings/*
Global state                   lib/stores/flightStore.ts
Database calls                 app/actions/*.ts
Database schema                supabase/migrations/
Sample data                    supabase/seed.sql
Authentication                 app/actions/auth.ts
Styling                        app/globals.css + tailwind.config
Navigation bar                 app/components/Navigation.tsx
Error handling                 app/error.tsx, app/not-found.tsx
Route protection               middleware.ts
Configuration                  next.config.ts, tsconfig.json
```

---

## Key Features (What Works)

### 1. Flight Search
- User enters: origin, destination, date, passenger count
- Backend searches flights from database
- Results show all available flights with prices
- **File:** `app/page.tsx` (UI), `app/actions/flights.ts` (backend)

### 2. Seat Selection
- Interactive seat map (First, Business, Economy classes)
- Real-time availability updates via WebSocket
- Optimistic UI (shows selection immediately)
- **File:** `app/booking/[flightId]/page.tsx`

### 3. Booking Flow
1. User selects seat (optimistic update)
2. Enters passenger details
3. Backend locks seat atomically (prevents double-booking)
4. Creates booking record
5. Shows confirmation with PNR code
- **Files:** Multiple files in booking flow

### 4. My Bookings
- Protected route (requires login)
- Shows all user's bookings
- Actions: Reschedule, Cancel
- **File:** `app/(protected)/my-bookings/page.tsx`

### 5. Reschedule Booking
- Choose alternative flight
- Select new seat
- Automatic fee calculation
- Updates booking record
- **File:** `app/(protected)/my-bookings/[bookingId]/reschedule/page.tsx`

---

## How Seat Locking Works (Important!)

**The Problem:** Multiple users could book the same seat

**The Solution:** Database function with atomic operation
```
1. User selects seat (optimistic update)
2. Frontend sends request to backend
3. Backend runs lock_seat_for_booking() RPC function
4. Function locks seat row in database
5. If available → marks as taken & creates booking
6. If taken → returns error
7. Either way, seat is locked (no race condition)
```

**Why It's Safe:**
- Database enforces atomicity (PostgreSQL guarantees)
- Server Actions validate everything
- No race condition possible
- User can't cheat by making multiple requests

**Code Location:** `supabase/migrations/003_rpc_functions.sql`

---

## Data Flow Example: Book a Flight

```
User Opens App
    ↓
Page.tsx renders search form
    ↓
User enters origin="New York", destination="London"
    ↓
User clicks "Search Flights"
    ↓
handleSearch() calls searchFlights() (server action)
    ↓
Flight.ts queries Supabase:
    SELECT * FROM flights 
    WHERE origin='New York' AND destination='London'
    ↓
Results returned to frontend
    ↓
FlightStore saves search query
    ↓
Router pushes to /search/results
    ↓
SearchResults page fetches flights again
    ↓
User sees list and clicks on flight
    ↓
Selected flight saved to store
    ↓
Router pushes to /booking/[flightId]
    ↓
BookingPage fetches seats for flight
    ↓
Subscribes to real-time seat updates (Realtime)
    ↓
User selects seat (optimistic update)
    ↓
User fills passenger details
    ↓
User clicks "Complete Booking"
    ↓
Frontend calls lockSeat() (server action)
    ↓
Backend RPC function lock_seat_for_booking():
    - Checks if seat available (SELECT...FOR UPDATE)
    - If available: marks as taken + creates booking
    - Returns booking ID
    ↓
Frontend calls createPassenger() (server action)
    ↓
Passenger record created
    ↓
Router pushes to /booking/confirmation/[bookingId]
    ↓
User sees confirmation with PNR code
    ↓
Done! ✅
```

---

## Common Tasks

### Add a New Page
1. Create file in `app/` directory
2. Use `"use client"` if it needs interactivity
3. Use server functions from `app/actions/` for backend
4. Use Zustand store for state
5. Update Navigation if it's a main page

### Add a Database Table
1. Create migration file: `supabase/migrations/00X_name.sql`
2. Run migration in Supabase SQL Editor
3. Add types in TypeScript files
4. Create server action in `app/actions/` to query it
5. Use from frontend via server action

### Add Authentication to Route
1. Add to middleware.ts matcher array
2. Middleware will check session and redirect if needed
3. Page can also use `getSession()` to check

### Fix a Bug
1. Check browser console for errors
2. Check Network tab to see API responses
3. Check Supabase logs for database errors
4. Add `console.log()` to trace execution
5. Use TypeScript types to catch errors early

### Debug Seat Updates Not Working
1. Check if Realtime enabled in Supabase (Settings → Realtime)
2. Check if you're subscribed: Look for `.on('postgres_changes'...`
3. Check browser console for subscription errors
4. Try refreshing page
5. Check Network tab for WebSocket connection

---

## Important Patterns Used

### Server Actions
```typescript
// In app/actions/flights.ts
"use server"
export async function searchFlights(...) {
  const supabase = await createClient();
  // Safe to use secrets here
  // Runs on server, not client
  return data;
}

// In component
import { searchFlights } from "@/app/actions/flights";
const results = await searchFlights(origin, dest, date);
```

### Zustand Store
```typescript
// Define
export const useFlightStore = create((set) => ({
  searchQuery: null,
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

// Use in component
const { searchQuery, setSearchQuery } = useFlightStore();
```

### Supabase Real-time
```typescript
// Subscribe to changes
const channel = supabase
  .channel(`seats-${flightId}`)
  .on("postgres_changes", { 
    event: "*", 
    table: "seats" 
  }, (payload) => {
    // Handle update
  })
  .subscribe();
```

### Error Handling
```typescript
try {
  const result = await someAction();
  if (result.error) {
    toast.error(result.error);
    return;
  }
  // Success
} catch (error) {
  console.error(error);
  toast.error("Failed to...");
}
```

---

## Testing

### Manual Testing
1. Create account
2. Search flights
3. Select seat
4. Enter passenger details
5. Confirm booking
6. View in My Bookings
7. Reschedule to different flight
8. Cancel a booking

### Test Edge Cases
- Search with no results
- Try to select already booked seat
- Try to access /my-bookings without logging in
- Reschedule to same seat
- Cancel within 2 hours of departure (should fail)

### Check Console
- No red errors
- Auth state updates correctly
- Seat updates in real-time

---

## Deployment

### To Vercel (Easiest)
```bash
npm install -g vercel
vercel
# Follow prompts
# Add environment variables in Vercel dashboard
```

### To Docker
```bash
docker build -t flight-booking .
docker run -p 3000:3000 -e DATABASE_URL=... flight-booking
```

---

## Performance Tips

### For Users
- Optimistic updates (seat appears selected immediately)
- Real-time updates (seat availability updates live)
- Loading states (shows spinners while waiting)
- Responsive design (works on mobile)

### For Developers
- Server Actions minimize client code
- Zustand is lightweight (5KB)
- Tailwind CSS is tree-shaken at build time
- Supabase pooling reduces database load
- RLS policies filter at database level

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Supabase not configured" | Missing .env.local | Copy .env.example to .env.local, fill in values |
| "Cannot find module" | Import path wrong | Check file path matches |
| "User not authenticated" | Session expired | Refresh page, login again |
| "Seat already booked" | Race condition | Refresh and try different seat |
| "Build fails" | TypeScript error | Check `npm run build` output carefully |
| "Realtime not working" | Not enabled | Enable in Supabase Realtime settings |

---

## Where to Ask Questions

1. **"How does this feature work?"** → Check the relevant page file
2. **"Where is X function?"** → Check `app/actions/` or type Ctrl+F
3. **"Why is this not working?"** → Check console errors first
4. **"Can we add payment?"** → Check COMPLETION_SUMMARY.md for next steps
5. **"What does this code do?"** → Read comments in the code

---

## Code Style

The project follows these conventions:
- **TypeScript** for type safety
- **Camel case** for variables and functions
- **PascalCase** for components and types
- **Comments** for why, not what (code shows what)
- **Error handling** always (try/catch, error checks)
- **Validation** on both client and server

---

## Git Workflow (If Collaborating)

```bash
# Create branch for your feature
git checkout -b feature/feature-name

# Make changes, commit often
git add .
git commit -m "Descriptive message"

# Push to remote
git push origin feature/feature-name

# Create Pull Request on GitHub
# Get review, merge when approved
```

---

## Documentation Files

- **README-COMPLETE.md** - Full project documentation
- **QUICKSTART.md** - Getting started guide
- **COMPLETION_SUMMARY.md** - What was done in last session
- **This file** - Developer guide for working on the project

---

## Next Steps

1. **Understand the structure** - Read `app/page.tsx` to `app/booking/[flightId]/page.tsx`
2. **Trace the flow** - Follow a booking from start to finish
3. **Run locally** - Get it working on your machine
4. **Make a change** - Try modifying something small
5. **Add a feature** - Pick from TODO list in COMPLETION_SUMMARY.md

---

## Questions?

When stuck, follow this order:
1. Check the error message carefully
2. Search the code for similar patterns
3. Check the relevant documentation file
4. Check browser console and Network tab
5. Look at database logs in Supabase
6. Ask in comments or create an issue

---

**Welcome to the team!** 🚀

The codebase is clean, well-organized, and ready for contribution.
Start with understanding how the booking flow works, then make your first change!
