"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBookingDetails, getAlternateFlights, rescheduleBooking, BookingWithDetails, FlightForReschedule } from "@/app/actions/bookings";
import { getFlightSeats, SeatInfo } from "@/app/actions/flights";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ReschedulePage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [alternateFlights, setAlternateFlights] = useState<FlightForReschedule[]>([]);
  const [selectedNewFlight, setSelectedNewFlight] = useState<FlightForReschedule | null>(null);
  const [availableSeats, setAvailableSeats] = useState<SeatInfo[]>([]);
  const [selectedNewSeat, setSelectedNewSeat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    const loadBookingAndAlternates = async () => {
      try {
        const bookingData = await getBookingDetails(bookingId);
        if (!bookingData) {
          toast.error("Booking not found");
          router.push("/my-bookings");
          return;
        }

        setBooking(bookingData);

        const alternates = await getAlternateFlights(
          bookingData.origin,
          bookingData.destination,
          bookingData.flightId || "", // Exclude current flight from alternates
          7 // Next 7 days
        );

        setAlternateFlights(alternates);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load booking details");
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingAndAlternates();
  }, [bookingId, router]);

  const handleFlightSelect = async (flight: FlightForReschedule) => {
    setSelectedNewFlight(flight);
    setSelectedNewSeat(null);

    try {
      const seats = await getFlightSeats(flight.id);
      setAvailableSeats(seats.filter((s) => s.isAvailable));
    } catch (error) {
      console.error("Error loading seats:", error);
      toast.error("Failed to load available seats");
    }
  };

  const handleReschedule = async () => {
    if (!selectedNewFlight || !selectedNewSeat || !booking) {
      toast.error("Please select a flight and seat");
      return;
    }

    setIsRescheduling(true);

    try {
      const result = await rescheduleBooking({
        bookingId,
        newFlightId: selectedNewFlight.id,
        newSeatId: selectedNewSeat,
      });

      if (result.success) {
        const feeMessage = result.feeCharged && result.feeCharged > 0
          ? ` Additional fee of $${result.feeCharged.toFixed(2)} has been charged.`
          : "";
        toast.success(`Booking rescheduled successfully!${feeMessage}`);
        router.push("/my-bookings");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error rescheduling:", error);
      toast.error("Failed to reschedule booking");
    } finally {
      setIsRescheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Current Booking */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Booking</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Flight</p>
              <p className="text-lg font-semibold text-gray-900">{booking.flightNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Departure</p>
              <p className="text-sm font-semibold text-gray-900">
                {format(parseISO(booking.departsAt), "MMM dd, yyyy HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Seat</p>
              <p className="text-lg font-semibold text-gray-900">{booking.seatNumber}</p>
            </div>
          </div>
        </div>

        {/* Alternative Flights */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Alternative Flight</h2>

          {alternateFlights.length > 0 ? (
            <div className="space-y-4">
              {alternateFlights.map((flight, idx) => (
                <motion.div
                  key={flight.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedNewFlight?.id === flight.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -3 }}
                  onClick={() => handleFlightSelect(flight)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-sm text-gray-600">Flight</p>
                      <p className="text-lg font-semibold text-gray-900">{flight.flightNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {format(parseISO(flight.departsAt), "MMM dd, HH:mm")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-lg font-semibold text-gray-900">${flight.basePrice}</p>
                    </div>
                    <div className="text-right">
                      <input
                        id={`flight-${flight.id}`}
                        type="radio"
                        name="flight"
                        checked={selectedNewFlight?.id === flight.id}
                        onChange={() => handleFlightSelect(flight)}
                        className="w-4 h-4 cursor-pointer"
                        aria-label={`Select flight ${flight.flightNo}`}
                      />
                    </div>
                  </div>

                  {/* Seats for Selected Flight */}
                  {selectedNewFlight?.id === flight.id && availableSeats.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Select Seat:</p>
                      <div className="grid grid-cols-6 gap-2">
                        {availableSeats.slice(0, 12).map((seat) => (
                          <button
                            key={seat.id}
                            onClick={() => setSelectedNewSeat(seat.id)}
                            aria-label={`Seat ${seat.seatNumber}, ${selectedNewSeat === seat.id ? 'selected' : 'available'}`}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                              selectedNewSeat === seat.id
                                ? "bg-blue-600 text-white"
                                : "bg-green-50 border border-green-500 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {seat.seatNumber}
                          </button>
                        ))}
                      </div>
                      {availableSeats.length > 12 && (
                        <p className="text-xs text-gray-500 mt-2">
                          And {availableSeats.length - 12} more available seats
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No alternative flights available</p>
          )}

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleReschedule}
              disabled={!selectedNewFlight || !selectedNewSeat || isRescheduling}
              className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isRescheduling ? "Rescheduling..." : "Confirm Reschedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
