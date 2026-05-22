"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFlightStore } from "@/lib/stores/flightStore";
import { getSession } from "@/app/actions/auth";
import { getFeaturedFlights, FeaturedRoute } from "@/app/actions/flights";
import { Plane, Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";

// Available airports from seed data
const AIRPORTS = [
  { code: "NYC", name: "New York" },
  { code: "LHR", name: "London" },
  { code: "LAX", name: "Los Angeles" },
  { code: "NRT", name: "Tokyo" },
  { code: "CDG", name: "Paris" },
  { code: "DXB", name: "Dubai" },
  { code: "SYD", name: "Sydney" },
];

export default function Home() {
  const router = useRouter();
  const setSearchQuery = useFlightStore((state) => state.setSearchQuery);
  const setCurrentBookingStep = useFlightStore((state) => state.setCurrentBookingStep);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [featuredFlights, setFeaturedFlights] = useState<FeaturedRoute[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

  // Load featured flights
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const flights = await getFeaturedFlights();
        setFeaturedFlights(flights);
      } catch (error) {
        console.error("Error loading featured flights:", error);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    loadFeatured();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin || !destination || !departureDate || !passengers) {
      toast.error("Please fill in all fields");
      return;
    }

    if (origin === destination) {
      toast.error("Origin and destination must be different");
      return;
    }

    setIsLoading(true);

    try {
      // Check if user is logged in
      const session = await getSession();
      if (!session) {
        toast.error("Please login to search flights");
        router.push("/auth/login");
        setIsLoading(false);
        return;
      }

      setSearchQuery({
        origin,
        destination,
        departureDate,
        passengerCount: parseInt(passengers),
      });
      setCurrentBookingStep("results");
      router.push("/search/results");
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search flights");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeaturedFlightClick = async (featuredOrigin: string, featuredDestination: string) => {
    try {
      const session = await getSession();
      if (!session) {
        toast.error("Please login to book flights");
        router.push("/auth/login");
        return;
      }

      // Set default departure date to today
      const today = new Date().toISOString().split("T")[0];
      
      setSearchQuery({
        origin: featuredOrigin,
        destination: featuredDestination,
        departureDate: today,
        passengerCount: 1,
      });
      setCurrentBookingStep("results");
      router.push("/search/results");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to search flights");
    }
  };

  return (
    <div 
      className="relative"
      style={{
        minHeight: 'calc(100vh - 64px)',
        backgroundImage: 'url(/bg_flight.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better text contrast */}
      <div className="absolute inset-0 pointer-events-none"></div>
      
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <Plane className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Find and Book Your Next Flight
          </h1>
          <p className="text-lg text-gray-100 max-w-2xl mx-auto">
            Search for the best flight deals from thousands of routes worldwide
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-4xl mx-auto mb-16">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  From (Origin)
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white cursor-pointer"
                >
                  <option value="">Select Origin City</option>
                  {AIRPORTS.map((airport) => (
                    <option 
                      className="text-black" 
                      key={airport.code} 
                      value={airport.name}
                      disabled={airport.name === destination}
                    >
                      {airport.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  To (Destination)
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white cursor-pointer"
                >
                  <option value="">Select Destination City</option>
                  {AIRPORTS.map((airport) => (
                    <option 
                      className="text-black" 
                      key={airport.code} 
                      value={airport.name}
                      disabled={airport.name === origin}
                    >
                      {airport.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Departure Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Departure Date
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Number of Passengers
                </label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "Passenger" : "Passengers"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plane className="w-5 h-5" />
              {isLoading ? "Searching..." : "Search Flights"}
            </button>
          </form>
        </div>

        {/* Featured Flights Section */}
        {!isLoadingFeatured && featuredFlights.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">✨ Popular Routes</h2>
              <p className="text-gray-100">Browse our most booked flights and find amazing deals</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredFlights.map((route, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFeaturedFlightClick(route.origin, route.destination)}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Route</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-lg font-bold text-gray-900">{route.origin}</span>
                        <ArrowRight className="w-5 h-5 text-blue-600" />
                        <span className="text-lg font-bold text-gray-900">{route.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">From</span>
                      <span className="text-2xl font-bold text-blue-600">${route.minPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Available Flights</span>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {route.flightCount} flights
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
                    Book Now
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* // footer could go here if needed
      // <Footer /> */}
      <div className="absolute text-black bottom-0 left-0 w-full py-4 bg-gradient-to-t from-black/50 to-transparent text-center  text-sm">
        &copy; {new Date().getFullYear()} FlightBooking. All rights reserved.
      </div>
    </div>
  );
}
