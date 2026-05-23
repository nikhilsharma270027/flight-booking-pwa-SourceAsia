"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBookingDetails, BookingWithDetails } from "@/app/actions/bookings";
import Link from "next/link";
import { CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const result = await getBookingDetails(bookingId);
        setBooking(result);
      } catch (error) {
        console.error("Error fetching booking:", error);
        toast.error("Failed to load booking details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleDownloadItinerary = () => {
    if (!booking) return;

    const itinerary = `
FLIGHT ITINERARY & RECEIPT
========================================
PNR Code: ${booking.pnrCode}
Booking ID: ${bookingId}

PASSENGER INFORMATION
========================================
Name: ${booking.passengerName || "N/A"}

FLIGHT DETAILS
========================================
Flight: ${booking.flightNo}
Route: ${booking.origin} → ${booking.destination}
Departure: ${format(parseISO(booking.departsAt), "MMM dd, yyyy HH:mm")}
Arrival: ${format(parseISO(booking.arrivesAt), "MMM dd, yyyy HH:mm")}
Seat: ${booking.seatNumber}

PRICE INFORMATION
========================================
Total Price: $${booking.totalPrice.toFixed(2)}

Status: ${booking.status.toUpperCase()}
========================================
Thank you for booking with us!
    `.trim();

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(itinerary));
    element.setAttribute("download", `itinerary-${booking.pnrCode}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Booking not found</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Message */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-8 mb-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-4">Your flight has been successfully booked</p>
        </motion.div>

        {/* PNR Code */}
        <motion.div 
          className="bg-blue-50 border-2 border-blue-600 rounded-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-sm text-gray-600 mb-2">Your PNR Code</p>
          <p className="text-4xl font-bold text-blue-600 font-mono">{booking.pnrCode}</p>
          <p className="text-xs text-gray-500 mt-2">Save this code for your records</p>
        </motion.div>

        {/* Booking Details */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Details</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <p className="text-sm text-gray-600">Passenger Name</p>
                <p className="text-lg font-semibold text-gray-900">{booking.passengerName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Seat Number</p>
                <p className="text-lg font-semibold text-gray-900">{booking.seatNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <p className="text-sm text-gray-600">Flight</p>
                <p className="text-lg font-semibold text-gray-900">{booking.flightNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Route</p>
                <p className="text-lg font-semibold text-gray-900">
                  {booking.origin} → {booking.destination}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <p className="text-sm text-gray-600">Departure</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(parseISO(booking.departsAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Arrival</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(parseISO(booking.arrivesAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold">
                  <span className="inline-block px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Price</p>
                <p className="text-2xl font-bold text-blue-600">${booking.totalPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <button
            onClick={handleDownloadItinerary}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            Download Itinerary
          </button>
          <Link
            href="/my-bookings"
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
          >
            View My Bookings
          </Link>
          <Link href="/" className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-center">
            New Search
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
