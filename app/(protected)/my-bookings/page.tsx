"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyBookings, cancelBooking, BookingWithDetails } from "@/app/actions/bookings";
import { toast } from "sonner";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Trash2, RefreshCw, ArrowRight, AlertTriangle } from "lucide-react";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBookings = async () => {
      try {
        console.log("Starting to fetch bookings...");
        const result = await getMyBookings();
        console.log("Bookings reference result:", result);
        
        if (isMounted) {
          setBookings(result || []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        if (isMounted) {
          setIsLoading(false);
          setBookings([]);
        }
      }
    };

    fetchBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);

    try {
      const result = await cancelBooking(bookingId);

      if (result.success) {
        toast.success("Booking cancelled successfully");
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      } else {
        toast.error(result.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setCancellingId(null);
      setShowCancelConfirm(null);
    }
  };

  const getTimeUntilDeparture = (departsAt: string): { minutes: number; hours: number; withinTwoHours: boolean } => {
    const departureTime = parseISO(departsAt);
    const now = new Date();
    const minutesRemaining = differenceInMinutes(departureTime, now);
    
    return {
      minutes: minutesRemaining % 60,
      hours: Math.floor(minutesRemaining / 60),
      withinTwoHours: minutesRemaining < 120 && minutesRemaining > 0,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your flight reservations</p>
        </div>

        {/* Bookings List or Empty State */}
        {bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-gray-50 rounded-lg shadow-md p-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Flight Info */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Flight</p>
                    <p className="text-lg font-bold text-gray-900">{booking.flightNo}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                      {booking.origin} <ArrowRight className="w-4 h-4" /> {booking.destination}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Departure</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {format(parseISO(booking.departsAt), "MMM dd, yyyy")}
                      </p>
                      <p className="text-xs text-gray-600">
                        {format(parseISO(booking.departsAt), "HH:mm")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Seat</p>
                      <p className="text-sm font-semibold text-gray-900">{booking.seatNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Status & Price */}
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-gray-600">PNR Code</p>
                      <p className="font-mono font-bold text-blue-600">{booking.pnrCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "rescheduled"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-lg font-bold text-gray-900">${booking.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/my-bookings/${booking.id}/reschedule`}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reschedule
                    </Link>
                    <button
                      onClick={() => setShowCancelConfirm(booking.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={getTimeUntilDeparture(booking.departsAt).withinTwoHours}
                      title={getTimeUntilDeparture(booking.departsAt).withinTwoHours ? "Cannot cancel within 2 hours of departure" : ""}
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Cancellation Warning - within 2 hours */}
                {getTimeUntilDeparture(booking.departsAt).withinTwoHours && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Cancellation Not Available</p>
                      <p className="text-sm text-red-700 mt-1">
                        Your flight departs in {getTimeUntilDeparture(booking.departsAt).hours}h {getTimeUntilDeparture(booking.departsAt).minutes}m. 
                        Cancellations are not allowed within 2 hours of departure.
                      </p>
                    </div>
                  </div>
                )}

                {/* Cancel Confirmation Modal */}
                {showCancelConfirm === booking.id && !getTimeUntilDeparture(booking.departsAt).withinTwoHours && (
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => !cancellingId && setShowCancelConfirm(null)}
                  >
                    <div 
                      className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Confirm Cancellation</h3>
                          <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Flight:</span>
                          <span className="text-sm font-semibold text-gray-900">{booking.flightNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Route:</span>
                          <span className="text-sm font-semibold text-gray-900">{booking.origin} → {booking.destination}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Departure:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {format(parseISO(booking.departsAt), "MMM dd, HH:mm")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Seat:</span>
                          <span className="text-sm font-semibold text-gray-900">{booking.seatNumber}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span className="text-sm text-gray-600">Refund Amount:</span>
                          <span className="text-sm font-bold text-green-600">${booking.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-6">
                        Are you sure you want to cancel this booking? The full amount of ${booking.totalPrice.toFixed(2)} will be refunded to your account.
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          {cancellingId === booking.id ? "Cancelling..." : "Yes, Cancel Booking"}
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(null)}
                          disabled={cancellingId === booking.id}
                          className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-300 text-gray-800 rounded-lg transition-colors text-sm font-medium"
                        >
                          No, Keep It
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg shadow-md p-8 text-center border border-gray-200">
            <p className="text-gray-600 mb-4">No bookings yet</p>
            <Link href="/" className="text-blue-600 hover:underline font-semibold">
              Search for flights
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
