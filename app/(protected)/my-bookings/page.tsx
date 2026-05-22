"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyBookings, cancelBooking, BookingWithDetails } from "@/app/actions/bookings";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Trash2, RefreshCw, ArrowRight } from "lucide-react";

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
        console.log("Bookings result:", result);
        
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
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setCancellingId(null);
      setShowCancelConfirm(null);
    }
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
                      className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Cancel Confirmation Modal */}
                {showCancelConfirm === booking.id && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 mb-3">
                      Are you sure you want to cancel this booking? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
                      >
                        {cancellingId === booking.id ? "Cancelling..." : "Confirm Cancel"}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(null)}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors text-sm"
                      >
                        Keep Booking
                      </button>
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
