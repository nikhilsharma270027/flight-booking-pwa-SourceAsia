import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Booking {
  id: string;
  flightNo: string;
  origin: string;
  destination: string;
  departsAt: string;
  seatNumber: string;
  status: "confirmed" | "rescheduled" | "cancelled";
  pnrCode: string;
  totalPrice: number;
}

export interface AuthSession {
  userId: string | null;
  email: string | null;
  token: string | null;
}

interface UserStore {
  // Auth session
  session: AuthSession;
  setSession: (session: Partial<AuthSession>) => void;
  clearSession: () => void;

  // Bookings cache
  bookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  clearBookings: () => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Reset all
  reset: () => void;
}

const initialSession: AuthSession = {
  userId: null,
  email: null,
  token: null,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      session: initialSession,
      setSession: (session: Partial<AuthSession>) =>
        set((state) => ({
          session: { ...state.session, ...session },
        })),
      clearSession: () => set({ session: initialSession }),

      bookings: [],
      setBookings: (bookings: Booking[]) => set({ bookings }),
      addBooking: (booking: Booking) =>
        set((state) => ({
          bookings: [...state.bookings, booking],
        })),
      updateBooking: (id: string, updates: Partial<Booking>) =>
        set((state) => ({
          bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),
      removeBooking: (id: string) =>
        set((state) => ({
          bookings: state.bookings.filter((b) => b.id !== id),
        })),
      clearBookings: () => set({ bookings: [] }),

      isLoading: false,
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),

      reset: () =>
        set({
          session: initialSession,
          bookings: [],
          isLoading: false,
        }),
    }),
    {
      name: "user-store",
      // Only persist session token and bookings, not sensitive data
      partialize: (state) => ({
        session: {
          userId: state.session.userId,
          email: state.session.email,
          token: state.session.token, // Only persist token
        },
        bookings: state.bookings,
      }),
    }
  )
);
