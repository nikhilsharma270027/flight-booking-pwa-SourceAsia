"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
          <p className="text-gray-600 mb-4">
            We encountered an unexpected error. Please try again or contact support.
          </p>
          {error.message && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-left">
              <p className="text-sm text-red-800 break-words font-mono">{error.message}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="block px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
          >
            Go to Home
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <p className="text-sm text-gray-600">
            If the problem persists, please contact our support team at{" "}
            <span className="text-blue-600 font-semibold">support@flightbooking.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
