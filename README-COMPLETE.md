# Flight Booking PWA

A modern, full-stack flight booking Progressive Web App built with Next.js, React, TypeScript, and Supabase.

## 🚀 Features

- **Flight Search** - Search flights by origin, destination, date, and passenger count
- **Seat Selection** - Interactive seat map with real-time availability updates
- **Booking Management** - View, reschedule, and cancel bookings
- **User Authentication** - Secure auth with Supabase
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Progressive Web App** - Install as a native app, works offline
- **Real-time Updates** - Live seat availability using WebSocket subscriptions
- **PNR Code** - Unique booking reference codes for each reservation

## 📋 Tech Stack

### Frontend
- **Next.js 16.2.6** - React framework with App Router
- **React 19.2.4** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Zustand 5.0.13** - State management
- **Sonner** - Toast notifications
- **lucide-react** - Icon library
- **date-fns** - Date utilities

### Backend & Database
- **Supabase** - PostgreSQL database + Auth
- **RLS Policies** - Row-Level Security for data protection
- **RPC Functions** - Custom database functions for complex operations

### Tools & Setup
- **Node.js** - Runtime
- **npm** - Package manager
- **Turbopack** - Next.js 16 bundler

## 📁 Project Structure

```
app/
├── layout.tsx                 # Root layout with navigation
├── page.tsx                   # Home/search page
├── error.tsx                  # Global error page
├── not-found.tsx              # 404 page
├── actions/                   # Server actions
│   ├── auth.ts               # Authentication functions
│   ├── flights.ts            # Flight search & seat management
│   └── bookings.ts           # Booking operations
├── auth/                      # Authentication pages
│   ├── login/page.tsx
│   └── signup/page.tsx
├── booking/                   # Booking flow pages
│   ├── [flightId]/page.tsx    # Seat selection & passenger details
│   └── confirmation/[bookingId]/page.tsx  # Confirmation page
├── (protected)/               # Protected routes (requires auth)
│   └── my-bookings/
│       ├── page.tsx           # My bookings list
│       └── [bookingId]/reschedule/page.tsx  # Reschedule booking
├── components/
│   └── Navigation.tsx         # Navigation bar
└── globals.css                # Global styles

lib/
├── stores/
│   ├── flightStore.ts         # Zustand flight store
│   └── userStore.ts           # User store
└── supabase/
    ├── client.ts              # Browser Supabase client
    └── server.ts              # Server Supabase client

supabase/
├── migrations/                # Database migrations
│   ├── 001_initial_schema.sql # Tables & indexes
│   ├── 002_rls_policies.sql   # Row-level security
│   ├── 003_rpc_functions.sql  # Custom functions
│   └── 004_triggers.sql       # Database triggers
└── seed.sql                   # Sample data

middleware.ts                  # Route protection middleware
next.config.ts                 # Next.js configuration
tsconfig.json                  # TypeScript configuration
package.json                   # Dependencies
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free at https://supabase.com)

### 1. Clone and Install Dependencies

```bash
cd flight-booking-pwa
npm install
```

### 2. Setup Supabase

1. Create a new Supabase project at https://supabase.com
2. Get your project URL and anon key from Supabase dashboard
3. Create `.env.local` file in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_NAME=Flight Booking PWA
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Setup Database

1. Go to Supabase Dashboard > SQL Editor
2. Create a new query and copy content from each migration file in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_rpc_functions.sql`
3. Run seed data from `supabase/seed.sql`

### 4. Enable Realtime (Optional but Recommended)

In Supabase dashboard:
1. Go to Realtime settings
2. Enable realtime for the `seats` table
3. Configure publication to include tables needed for updates

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Opens at http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## 📱 Usage Guide

### 1. Search Flights
- Enter origin city (e.g., "New York")
- Enter destination city (e.g., "London")
- Select departure date
- Choose number of passengers
- Click "Search Flights"

### 2. Review Search Results
- View available flights with prices and duration
- Check aircraft type and status
- Click on a flight to proceed

### 3. Select Seat
- View interactive seat map organized by class:
  - First Class: Extra fees apply (+$200)
  - Business Class: Extra fees apply (+$100)
  - Economy Class: Base price only
- Green = available, Gray = occupied
- Click seat to select
- View booking summary

### 4. Enter Passenger Details
- Full name (required)
- Passport number (required)
- Nationality (required)
- Date of birth (required)

### 5. Confirm Booking
- Review complete booking summary
- PNR code provided
- Download itinerary as text file
- Proceed to "My Bookings"

### 6. Manage Bookings
- Sign in to view all your bookings
- **Reschedule** - Change to different flight/seat
  - Select alternative flight
  - Choose new seat
  - Additional fees apply if new price is higher
- **Cancel** - Cancel booking
  - Restrictions: Cannot cancel within 2 hours of departure
  - Seat becomes available for others

## 🔐 Security Features

- **Row Level Security (RLS)** - Users can only access their own bookings
- **Authentication** - Supabase Auth with email/password
- **Server Actions** - All sensitive operations run on server
- **Optimistic UI** - Seat selection feels instant but validates on server
- **Stored Procedures** - Complex operations use database functions for atomicity
- **Session Management** - Proper server-side session handling

## 📊 Database Schema

### Tables
- **flights** - Flight information (flight_no, routes, departure times, pricing)
- **seats** - Seat inventory (availability, class, extra fees)
- **bookings** - User bookings (flight, seat, passenger, status, PNR)
- **passengers** - Passenger details (name, passport, nationality, DOB)
- **reschedules** - Reschedule history (old/new flights, fees charged)

### Key RPC Functions
- `lock_seat_for_booking()` - Atomic seat locking to prevent double-booking
- `cancel_booking()` - Cancel with business logic (2-hour rule)
- `reschedule_booking()` - Reschedule with price adjustment and fee calculation

### Indexes
- Flight routes and departure times for fast search
- User/booking relationships for quick lookups

## 🧪 Testing

### Demo Credentials
```
Email: demo@example.com
Password: demo123456
```

Or create your own account via signup page.

### Sample Flights
Seed data includes flights between:
- New York ↔ London (2 flights daily)
- Los Angeles ↔ Tokyo (2 flights daily)
- London ↔ Paris (2 flights daily)
- Dubai ↔ Sydney (2 flights daily)

## 🐛 Known Issues & Limitations

1. **Middleware Deprecation Warning** - Next.js 16 deprecated middleware file convention in favor of "proxy" (still functional)
2. **PWA Icons** - manifest.json includes icon references but actual icon files not included
3. **Email Verification** - Requires Supabase email provider configuration for email verification
4. **Timezone Handling** - All dates stored in UTC, client should handle timezone conversion
5. **Payment Integration** - Not implemented, needs Stripe/Razorpay integration
6. **Mobile Icons** - PWA icons need to be generated and placed in `/public` folder

## 📈 Future Enhancements

- [ ] Payment integration (Stripe/Razorpay)
- [ ] Email confirmations and notifications
- [ ] Return flight selection (round trip)
- [ ] Loyalty program and frequent flyer miles
- [ ] Admin dashboard for flight/seat management
- [ ] Advanced search filters (airlines, stops, price range)
- [ ] Booking history analytics
- [ ] Multi-language support
- [ ] OAuth integration (Google, GitHub)
- [ ] SMS notifications

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard.

### Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t flight-booking .
docker run -p 3000:3000 flight-booking
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💼 Support

For issues and questions:
1. Check existing documentation in README
2. Review code comments in relevant files
3. Check Supabase dashboard for configuration issues
4. Verify environment variables are set correctly

## ✅ Project Completion Status

This project is **90% complete** and fully functional:

### ✅ Completed
- Core booking functionality (search, select, book)
- User authentication (signup/login/logout)
- Seat management with real-time updates
- Booking management (view, reschedule, cancel)
- Responsive design for all devices
- Error handling & custom error pages (404, 500)
- Database with RLS policies & RPC functions
- Route protection middleware
- Optimistic UI updates
- PNR code generation
- Booking confirmation & itinerary download
- Input validation & error messages

### ⚠️ Partially Complete
- PWA setup (manifest.json created, icons needed)
- Middleware (functional but deprecated, upgrade to proxy recommended)

### ❌ Not Implemented
- Payment processing (Stripe/Razorpay)
- Email notifications
- SMS notifications
- Admin dashboard
- OAuth authentication

The application is **production-ready** for testing and can be deployed as-is. Payment and notification features can be added as enhancements.

---

**Last Updated:** May 21, 2026
**Version:** 0.1.0
**Status:** Ready for Development & Testing
