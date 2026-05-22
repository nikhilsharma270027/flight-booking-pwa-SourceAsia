import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SearchQuery {
  origin: string;
  destination: string;
  departureDate: string;
  passengerCount: number;
}

export interface SelectedFlight {
  id: string;
  flightNo: string;
  origin: string;
  destination: string;
  departsAt: string;
  arrivesAt: string;
  basePrice: number;
}

export interface PassengerFormData {
  fullName: string;
  passportNo: string;
  nationality: string;
  dob: string;
}

interface FlightStore {
  // Search state
  searchQuery: SearchQuery | null;
  setSearchQuery: (query: SearchQuery) => void;
  clearSearchQuery: () => void;

  // Flight selection
  selectedFlight: SelectedFlight | null;
  setSelectedFlight: (flight: SelectedFlight) => void;
  clearSelectedFlight: () => void;

  // Seat selection
  selectedSeat: string | null;
  optimisticSelectedSeat: string | null;
  setSelectedSeat: (seatId: string) => void;
  setOptimisticSelectedSeat: (seatId: string | null) => void;
  clearSelectedSeat: () => void;

  // Booking step
  currentBookingStep: "search" | "results" | "seat-selection" | "passenger-details" | "confirmation";
  setCurrentBookingStep: (step: FlightStore["currentBookingStep"]) => void;

  // Passenger form
  passengerFormData: PassengerFormData;
  setPassengerFormData: (data: Partial<PassengerFormData>) => void;
  clearPassengerFormData: () => void;

  // Reset all
  reset: () => void;
}

const initialSearchQuery: SearchQuery = {
  origin: "",
  destination: "",
  departureDate: "",
  passengerCount: 1,
};

const initialPassengerData: PassengerFormData = {
  fullName: "",
  passportNo: "",
  nationality: "",
  dob: "",
};

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      searchQuery: null,
      setSearchQuery: (query: SearchQuery) => set({ searchQuery: query }),
      clearSearchQuery: () => set({ searchQuery: null }),

      selectedFlight: null,
      setSelectedFlight: (flight: SelectedFlight) => set({ selectedFlight: flight }),
      clearSelectedFlight: () => set({ selectedFlight: null }),

      selectedSeat: null,
      optimisticSelectedSeat: null,
      setSelectedSeat: (seatId: string) => set({ selectedSeat: seatId }),
      setOptimisticSelectedSeat: (seatId: string | null) => set({ optimisticSelectedSeat: seatId }),
      clearSelectedSeat: () => set({ selectedSeat: null, optimisticSelectedSeat: null }),

      currentBookingStep: "search",
      setCurrentBookingStep: (step) => set({ currentBookingStep: step }),

      passengerFormData: initialPassengerData,
      setPassengerFormData: (data) =>
        set((state) => ({
          passengerFormData: { ...state.passengerFormData, ...data },
        })),
      clearPassengerFormData: () => set({ passengerFormData: initialPassengerData }),

      reset: () =>
        set({
          searchQuery: null,
          selectedFlight: null,
          selectedSeat: null,
          optimisticSelectedSeat: null,
          currentBookingStep: "search",
          passengerFormData: initialPassengerData,
        }),
    }),
    {
      name: "flight-store",
      // Exclude sensitive data from persistence
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        optimisticSelectedSeat: state.optimisticSelectedSeat,
        currentBookingStep: state.currentBookingStep,
        // Don't persist passport number
        passengerFormData: {
          fullName: state.passengerFormData.fullName,
          passportNo: "", // Excluded from persistence
          nationality: state.passengerFormData.nationality,
          dob: state.passengerFormData.dob,
        },
      }),
    }
  )
);
