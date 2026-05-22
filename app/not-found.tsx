"use client";

import Link from "next/link";
import { Plane } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="text-6xl font-bold text-gray-300">404</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-4">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plane className="w-5 h-5" />
            Back to Home
          </Link>
          <div>
            <Link
              href="/search/results"
              className="block text-blue-600 hover:underline text-sm"
            >
              Search Flights
            </Link>
            <Link
              href="/my-bookings"
              className="block text-blue-600 hover:underline text-sm"
            >
              My Bookings
            </Link>
          </div>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{" "}
            <span className="text-blue-600 font-semibold">support@flightbooking.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
