"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFlightStore } from "@/lib/stores/flightStore";
import { getFlightSeats, getFlightDetails, SeatInfo, generatePNRCode, lockSeat, FlightDetails, createPassenger } from "@/app/actions/flights";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

// Common countries list
const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Mexico",
  "Russia",
  "South Korea",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "Norway",
  "Belgium",
  "Austria",
  "Denmark",
  "Finland",
  "Poland",
  "Ireland",
  "New Zealand",
  "Singapore",
  "Thailand",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Vietnam",
  "Hong Kong",
  "UAE",
  "Saudi Arabia",
  "Turkey",
  "South Africa",
  "Egypt",
  "Argentina",
  "Chile",
  "Colombia",
  "Peru",
].sort();

interface Passenger {
  fullName: string;
  passportNo: string;
  nationality: string;
  dob: string;
}

type SeatClass = "economy" | "business" | "first";

// Passport validation: Capital letter followed by 9 numbers
const validatePassport = (passportNo: string): boolean => {
  const passportRegex = /^[A-Z]\d{9}$/;
  return passportRegex.test(passportNo);
};

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const flightId = params.flightId as string;

  const selectedFlight = useFlightStore((state) => state.selectedFlight);
  const selectedSeat = useFlightStore((state) => state.selectedSeat);
  const optimisticSelectedSeat = useFlightStore((state) => state.optimisticSelectedSeat);
  const setSelectedSeat = useFlightStore((state) => state.setSelectedSeat);
  const setOptimisticSelectedSeat = useFlightStore((state) => state.setOptimisticSelectedSeat);
  const passengerFormData = useFlightStore((state) => state.passengerFormData);
  const setPassengerFormData = useFlightStore((state) => state.setPassengerFormData);
  const setCurrentBookingStep = useFlightStore((state) => state.setCurrentBookingStep);

  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [flightDetails, setFlightDetails] = useState<FlightDetails | null>(null);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [currentStep, setCurrentStep] = useState<"seat-selection" | "passenger-details">("seat-selection");
  const [isBooking, setIsBooking] = useState(false);
  const [passenger, setPassenger] = useState<Passenger>({
    fullName: passengerFormData.fullName,
    passportNo: passengerFormData.passportNo,
    nationality: passengerFormData.nationality,
    dob: passengerFormData.dob,
  });

  // Subscribe to realtime seat updates
  useEffect(() => {
    const supabase = createClient();
    let channel: any = null;

    const fetchSeatsAndSubscribe = async () => {
      try {
        const seatData = await getFlightSeats(flightId);
        setSeats(seatData);

        const flightData = await getFlightDetails(flightId);
        if (flightData) {
          setFlightDetails(flightData);
        }

        // Create and subscribe to realtime updates
        channel = supabase
          .channel(`seats-${flightId}`, {
            config: {
              broadcast: { self: false },
            },
          })
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "seats",
              filter: `flight_id=eq.${flightId}`,
            },
            (payload: any) => {
              console.log("Seat update received:", payload);
              if (payload.new) {
                const updatedSeat = payload.new as any;
                setSeats((prevSeats) =>
                  prevSeats.map((seat) =>
                    seat.id === updatedSeat.id
                      ? {
                          ...seat,
                          isAvailable: updatedSeat.is_available,
                        }
                      : seat
                  )
                );
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error("Error fetching seats:", error);
        toast.error("Failed to load seats");
      } finally {
        setIsLoadingSeats(false);
      }
    };

    fetchSeatsAndSubscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [flightId]);

  const seatsByClass = {
    economy: seats.filter((s) => s.class === "economy"),
    business: seats.filter((s) => s.class === "business"),
    first: seats.filter((s) => s.class === "first"),
  };

  const handleSeatSelect = async (seatId: string) => {
    setOptimisticSelectedSeat(seatId);
    setSelectedSeat(seatId);
  };

  const handlePassengerChange = (field: keyof Passenger, value: string) => {
    setPassenger((prev) => ({ ...prev, [field]: value }));
    setPassengerFormData({ [field]: value });
  };

  const handleCompleteBooking = async () => {
    if (!selectedSeat || !passenger.fullName || !passenger.passportNo || !passenger.nationality || !passenger.dob) {
      toast.error("Please fill in all fields and select a seat");
      return;
    }

    setIsBooking(true);

    try {
      // Generate PNR code
      const pnrCode = await generatePNRCode();

      // Calculate total price
      const selectedSeatInfo = seats.find((s) => s.id === selectedSeat);
      const totalPrice = (flightDetails?.basePrice || 0) + (selectedSeatInfo?.extraFee || 0);

      // Lock seat and create booking
      const lockResult = await lockSeat(selectedSeat, flightId, totalPrice, pnrCode);

      if (!lockResult.success) {
        toast.error(lockResult.message);
        setOptimisticSelectedSeat(null);
        return;
      }

      const bookingId = lockResult.bookingId;

      // Create passenger record
      const passengerResult = await createPassenger(
        bookingId!,
        passenger.fullName,
        passenger.passportNo,
        passenger.nationality,
        passenger.dob
      );

      if (!passengerResult.success) {
        toast.error(passengerResult.message);
        return;
      }

      toast.success("Booking confirmed!");
      setCurrentBookingStep("confirmation");
      router.push(`/booking/confirmation/${bookingId}`);
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to complete booking");
      setOptimisticSelectedSeat(null);
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoadingSeats) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentStep === "seat-selection") {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Flight Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{flightDetails?.flightNo}</h1>
            <p className="text-gray-600">
              {flightDetails?.origin} → {flightDetails?.destination}
            </p>
            <p className="text-sm text-gray-500">
              {flightDetails?.departsAt ? format(parseISO(flightDetails.departsAt), "MMM dd, yyyy HH:mm") : ""}
            </p>
          </div>

          {/* Seat Map */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select Your Seat</h2>

            {/* Class Sections */}
            <div className="space-y-8">
              {(["first", "business", "economy"] as const).map((seatClass) => (
                <div key={seatClass} className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 capitalize">
                    {seatClass === "first" ? "First Class" : seatClass === "business" ? "Business Class" : "Economy Class"}
                    {seatClass === "first" && " (+$200)"}
                    {seatClass === "business" && " (+$100)"}
                  </h3>

                  <div className="grid grid-cols-6 gap-2 overflow-x-auto pb-4">
                    {seatsByClass[seatClass].map((seat) => {
                      const isSelected = seat.id === (optimisticSelectedSeat || selectedSeat);
                      const isOccupied = !seat.isAvailable;

                      return (
                        <button
                          key={seat.id}
                          onClick={() => !isOccupied && handleSeatSelect(seat.id)}
                          disabled={isOccupied}
                          className={`
                            w-10 h-10 rounded-md font-semibold text-xs transition-all
                            ${isSelected ? "bg-blue-600 text-white border-2 border-blue-700" : ""}
                            ${isOccupied && !isSelected ? "bg-gray-300 text-gray-500 cursor-not-allowed" : ""}
                            ${!isSelected && !isOccupied ? "bg-green-50 border-2 border-green-500 text-green-700 hover:bg-green-100" : ""}
                          `}
                          title={`${seat.seatNumber} - ${seat.class}`}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="border-t mt-8 pt-6 flex gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-50 border-2 border-green-500 rounded-md"></div>
                <span className="text-sm text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-md"></div>
                <span className="text-sm text-gray-600">Your Selection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 rounded-md"></div>
                <span className="text-sm text-gray-600">Occupied</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => selectedSeat && setCurrentStep("passenger-details")}
              disabled={!selectedSeat}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "passenger-details") {
    const selectedSeatInfo = seats.find((s) => s.id === selectedSeat);
    const totalPrice = (flightDetails?.basePrice || 0) + (selectedSeatInfo?.extraFee || 0);

    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Flight:</span>
                <span className="font-semibold text-black">{flightDetails?.flightNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seat:</span>
                <span className="font-semibold text-black">{selectedSeatInfo?.seatNumber}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span className="text-gray-600">Total Price:</span>
                <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Passenger Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Passenger Details</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={passenger.fullName}
                  onChange={(e) => handlePassengerChange("fullName", e.target.value)}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
                <input
                  type="text"
                  value={passenger.passportNo}
                  onChange={(e) => handlePassengerChange("passportNo", e.target.value)}
                  className={`w-full px-4 text-black py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    passenger.passportNo && !validatePassport(passenger.passportNo)
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="A123456789"
                />
                {passenger.passportNo && !validatePassport(passenger.passportNo) && (
                  <p className="text-red-600 text-sm mt-1">
                    Passport must start with a capital letter followed by 9 numbers (e.g., A123456789)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                <select
                  value={passenger.nationality}
                  onChange={(e) => handlePassengerChange("nationality", e.target.value)}
                  className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white cursor-pointer"
                >
                  <option value="">Select Nationality</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={passenger.dob}
                  onChange={(e) => handlePassengerChange("dob", e.target.value)}
                  className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setCurrentStep("seat-selection")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCompleteBooking}
                disabled={isBooking || !passenger.fullName || !passenger.passportNo || !passenger.nationality || !passenger.dob || !validatePassport(passenger.passportNo)}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isBooking ? "Completing Booking..." : "Complete Booking"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

