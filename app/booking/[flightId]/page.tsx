"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFlightStore } from "@/lib/stores/flightStore";
import { getFlightSeats, getFlightDetails, SeatInfo, generatePNRCode, lockSeat, FlightDetails, createPassenger } from "@/app/actions/flights";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

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
  const searchQuery = useFlightStore((state) => state.searchQuery);
  const passengerCount = searchQuery?.passengerCount || 1;
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
  
  const [selectedSeats, setSelectedSeats] = useState<string[]>(Array(passengerCount).fill(""));
  const [passengersData, setPassengersData] = useState<Passenger[]>(
    Array(passengerCount).fill(null).map(() => ({
      fullName: "",
      passportNo: "",
      nationality: "",
      dob: "",
    }))
  );

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

        // Create channel
        channel = supabase.channel(`seats-${flightId}`, {
          config: {
            broadcast: { self: false },
          },
        });

        // Add event listener BEFORE subscribing
        channel
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
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              console.log("Realtime subscription established");
            }
          });
      } catch (error) {
        console.error("Error fetching seats:", error);
        toast.error("Failed to load seats");
      } finally {
        setIsLoadingSeats(false);
      }
    };

    fetchSeatsAndSubscribe();

    return () => {
      // Always unsubscribe
      if (channel) {
        supabase.removeChannel(channel).then(() => {
          console.log("Channel unsubscribed");
        });
      }
    };
  }, [flightId]);

  const seatsByClass = {
    economy: seats.filter((s) => s.class === "economy"),
    business: seats.filter((s) => s.class === "business"),
    first: seats.filter((s) => s.class === "first"),
  };

  const handleSeatSelect = (passengerIdx: number, seatId: string) => {
    const updatedSeats = [...selectedSeats];
    updatedSeats[passengerIdx] = seatId;
    setSelectedSeats(updatedSeats);
  };

  const handlePassengerChange = (passengerIdx: number, field: keyof Passenger, value: string) => {
    const updatedPassengers = [...passengersData];
    updatedPassengers[passengerIdx] = { ...updatedPassengers[passengerIdx], [field]: value };
    setPassengersData(updatedPassengers);
  };

  const handleContinueToDetails = () => {
    if (selectedSeats.some((seat) => !seat)) {
      toast.error("Please select a seat for each passenger");
      return;
    }
    setCurrentStep("passenger-details");
  };

  const handleCompleteBooking = async () => {
    // Validate all passengers
    for (let i = 0; i < passengerCount; i++) {
      const p = passengersData[i];
      if (!p.fullName || !p.passportNo || !p.nationality || !p.dob) {
        toast.error(`Please fill in all details for Passenger ${i + 1}`);
        return;
      }
      if (!validatePassport(p.passportNo)) {
        toast.error(`Invalid passport for Passenger ${i + 1}`);
        return;
      }
    }

    setIsBooking(true);

    try {
      let lastBookingId: string | undefined = undefined;

      // Create booking for each passenger
      for (let i = 0; i < passengerCount; i++) {
        const pnrCode = await generatePNRCode();
        const seatId = selectedSeats[i];
        const passengerInfo = passengersData[i];

        const selectedSeatInfo = seats.find((s) => s.id === seatId);
        const totalPrice = (flightDetails?.basePrice || 0) + (selectedSeatInfo?.extraFee || 0);

        const lockResult = await lockSeat(seatId, flightId, totalPrice, pnrCode);

        if (!lockResult.success) {
          toast.error(`Failed to book seat for ${passengerInfo.fullName}: ${lockResult.message}`);
          return;
        }

        const bookingId = lockResult.bookingId;
        if (bookingId) {
          lastBookingId = bookingId;
        }

        const passengerResult = await createPassenger(
          bookingId!,
          passengerInfo.fullName,
          passengerInfo.passportNo,
          passengerInfo.nationality,
          passengerInfo.dob
        );

        if (!passengerResult.success) {
          toast.error(`Failed to create passenger record for ${passengerInfo.fullName}`);
          return;
        }
      }

      if (!lastBookingId) {
        toast.error("No bookings were created");
        return;
      }

      toast.success("All bookings confirmed!");
      setCurrentBookingStep("confirmation");
      router.push(`/booking/confirmation/${lastBookingId}`);
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to complete booking");
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
        <div className="max-w-7xl mx-auto px-4">
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

          {/* Seat Selection for Each Passenger */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {Array.from({ length: passengerCount }).map((_, passengerIdx) => (
              <div key={passengerIdx} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Passenger {passengerIdx + 1}
                </h2>

                {/* Class Sections */}
                <div className="space-y-4 mb-4">
                  {(["first", "business", "economy"] as const).map((seatClass) => (
                    <div key={seatClass} className="border-t pt-3">
                      <h3 className="text-xs font-semibold text-gray-700 mb-2 capitalize">
                        {seatClass === "first" ? "First" : seatClass === "business" ? "Business" : "Economy"}
                        {seatClass === "first" && " (+$200)"}
                        {seatClass === "business" && " (+$100)"}
                      </h3>

                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-1">
                        {seatsByClass[seatClass].map((seat) => {
                          const isSelected = seat.id === selectedSeats[passengerIdx];
                          const isOtherPassengerSeat = selectedSeats.some((s, idx) => s === seat.id && idx !== passengerIdx);
                          const isOccupied = !seat.isAvailable;

                          return (
                            <button
                              key={seat.id}
                              onClick={() => !isOccupied && !isOtherPassengerSeat && handleSeatSelect(passengerIdx, seat.id)}
                              disabled={isOccupied || isOtherPassengerSeat}
                              aria-label={`${seat.seatNumber} seat, ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : 'available'}`}
                              title={seat.seatNumber}
                              className={`
                                w-10 h-10 sm:w-8 sm:h-8 rounded text-xs font-semibold transition-all
                                ${isSelected ? "bg-blue-600 text-white" : ""}
                                ${isOtherPassengerSeat ? "bg-orange-300 cursor-not-allowed" : ""}
                                ${isOccupied && !isSelected ? "bg-gray-300 text-gray-500 cursor-not-allowed" : ""}
                                ${!isSelected && !isOccupied && !isOtherPassengerSeat ? "bg-green-50 border border-green-500 text-green-700 hover:bg-green-100" : ""}
                              `}
                            >
                              {seat.seatNumber.replace(/[A-Z]/g, '')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Seat Display */}
                {selectedSeats[passengerIdx] && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 text-center">
                    ✓ Seat: <span className="font-semibold">{seats.find(s => s.id === selectedSeats[passengerIdx])?.seatNumber}</span>
                  </div>
                )}
                {!selectedSeats[passengerIdx] && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 text-center">
                    Please select a seat
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="flex gap-4 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-50 border border-green-500 rounded"></div>
                <span className="text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 rounded"></div>
                <span className="text-gray-600">Your Seat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-orange-300 rounded"></div>
                <span className="text-gray-600">Other Passenger</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                <span className="text-gray-600">Occupied</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={handleContinueToDetails}
              className="flex-1 px-6 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Continue to Passenger Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Passenger details step - show all passengers at once
  if (currentStep === "passenger-details") {
    const totalPrice = selectedSeats.reduce((sum, seatId) => {
      const seatInfo = seats.find((s) => s.id === seatId);
      return sum + (flightDetails?.basePrice || 0) + (seatInfo?.extraFee || 0);
    }, 0);

    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Flight</p>
                <p className="text-lg font-semibold text-gray-900">{flightDetails?.flightNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Passengers</p>
                <p className="text-lg font-semibold text-gray-900">{passengerCount}</p>
              </div>
              <div className="border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4">
                <p className="text-sm text-gray-600">Total Price</p>
                <p className="text-lg font-bold text-blue-600">${totalPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Passenger Forms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {passengersData.map((passenger, idx) => (
              <motion.div 
                key={idx} 
                className="bg-white rounded-lg shadow-md p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">Passenger {idx + 1}</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-900">
                  Seat: <span className="font-semibold">{seats.find(s => s.id === selectedSeats[idx])?.seatNumber}</span>
                </div>

                <form className="space-y-3">
                  <div>
                    <label htmlFor={`passenger-${idx}-fullname`} className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      id={`passenger-${idx}-fullname`}
                      type="text"
                      value={passenger.fullName}
                      onChange={(e) => handlePassengerChange(idx, "fullName", e.target.value)}
                      className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor={`passenger-${idx}-passport`} className="block text-sm font-medium text-gray-700 mb-1">Passport</label>
                    <input
                      id={`passenger-${idx}-passport`}
                      type="text"
                      value={passenger.passportNo}
                      onChange={(e) => handlePassengerChange(idx, "passportNo", e.target.value)}
                      className={`w-full px-3 text-black py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                        passenger.passportNo && !validatePassport(passenger.passportNo)
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="A123456789"
                    />
                    {passenger.passportNo && !validatePassport(passenger.passportNo) && (
                      <p className="text-red-600 text-xs mt-1">Must be capital letter + 9 digits</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={`passenger-${idx}-nationality`} className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <select
                      id={`passenger-${idx}-nationality`}
                      value={passenger.nationality}
                      onChange={(e) => handlePassengerChange(idx, "nationality", e.target.value)}
                      className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white cursor-pointer"
                    >
                      <option value="">Select</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`passenger-${idx}-dob`} className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      id={`passenger-${idx}-dob`}
                      type="date"
                      value={passenger.dob}
                      onChange={(e) => handlePassengerChange(idx, "dob", e.target.value)}
                      className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </form>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep("seat-selection")}
              className="px-6 py-3 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={handleCompleteBooking}
              disabled={isBooking}
              className="flex-1 px-6 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
            >
              {isBooking ? "Processing..." : `Complete Booking (${passengerCount} Passenger${passengerCount !== 1 ? "s" : ""})`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

