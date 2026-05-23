"use client";

export default function Offline() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="max-w-md text-center">
        {/* Offline Icon */}
        <div className="mb-8 text-6xl">
          🌐
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Offline</h1>
        <p className="text-gray-600 mb-6">
          It looks like you've lost your internet connection. Some features may not be available right now.
        </p>
        
        {/* Available Features */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
          <h2 className="font-semibold text-gray-900 mb-3">What you can do offline:</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>View cached bookings</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Browse previously viewed flights</span>
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <span>Check your booking history</span>
            </li>
          </ul>
        </div>

        {/* Try Again Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mb-4"
        >
          Try Again
        </button>

        {/* Tips */}
        <div className="text-xs text-gray-500 mt-8 space-y-2">
          <p>💡 Tips to restore connection:</p>
          <ul className="space-y-1">
            <li>• Check your Wi-Fi or mobile data</li>
            <li>• Restart your router or mobile device</li>
            <li>• Move closer to a Wi-Fi network</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
