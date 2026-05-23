"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFlightStore } from "@/lib/stores/flightStore";
import { searchFlights, FlightSearchResult } from "@/app/actions/flights";
import { ArrowRight, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function SearchResults() {
  const router = useRouter();
  const searchQuery = useFlightStore((state) => state.searchQuery);
  const setSelectedFlight = useFlightStore((state) => state.setSelectedFlight);
  const setCurrentBookingStep = useFlightStore((state) => state.setCurrentBookingStep);

  const [flights, setFlights] = useState<FlightSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlights = async () => {
      if (!searchQuery) {
        router.push("/");
        return;
      }

      try {
        setIsLoading(true);
        const results = await searchFlights(
          searchQuery.origin,
          searchQuery.destination,
          searchQuery.departureDate
        );

        if (results.length === 0) {
          setError("No flights found for the selected route and date");
          setFlights([]);
        } else {
          setFlights(results);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching flights:", err);
        setError("Failed to fetch flights");
        toast.error("Failed to search flights");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlights();
  }, [searchQuery, router]);

  const handleSelectFlight = (flight: FlightSearchResult) => {
    setSelectedFlight({
      id: flight.id,
      flightNo: flight.flightNo,
      origin: flight.origin,
      destination: flight.destination,
      departsAt: flight.departsAt,
      arrivesAt: flight.arrivesAt,
      basePrice: flight.basePrice,
    });
    setCurrentBookingStep("seat-selection");
    router.push(`/booking/${flight.id}`);
  };

  const calculateDuration = (departure: string, arrival: string) => {
    const depTime = parseISO(departure);
    const arrTime = parseISO(arrival);
    const minutes = differenceInMinutes(arrTime, depTime);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
      {/* add back button */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Search
        </button>
      </div>
      <div className="max-w-4xl mx-auto px-4">
        {/* Search Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {searchQuery?.origin} <ArrowRight className="w-5 h-5 inline mx-2" />
            {searchQuery?.destination}
          </h2>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span className="font-semibold">Date:</span>{" "}
              {searchQuery?.departureDate ? format(new Date(searchQuery.departureDate), "MMM dd, yyyy") : ""}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-semibold">Passengers:</span> {searchQuery?.passengerCount || 1}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
            {error}
          </div>
        )}

        {/* Flight Results */}
        {!error && flights.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Flights ({flights.length})
            </h3>
            {flights.map((flight, idx) => (
              <motion.div
                key={flight.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start md:items-center">
                  {/* Flight Info */}
                  <div>
                    <p className="text-sm text-gray-600">Flight Number</p>
                    <p className="text-lg font-semibold text-gray-900">{flight.flightNo}</p>
                  </div>

                  {/* Times */}
                  <div>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(flight.departsAt), "HH:mm")} -{" "}
                      {format(parseISO(flight.arrivesAt), "HH:mm")}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      {calculateDuration(flight.departsAt, flight.arrivesAt)}
                    </p>
                  </div>

                  {/* Aircraft */}
                  <div>
                    <p className="text-sm text-gray-600">Aircraft</p>
                    <p className="text-lg font-semibold text-gray-900">{flight.aircraftType}</p>
                  </div>

                  {/* Price & Button */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-2 mt-4 sm:mt-0">
                    <div className="sm:flex-1 md:flex-none md:text-right">
                      <p className="text-sm text-gray-600">From</p>
                      <p className="text-2xl font-bold text-blue-600">${flight.basePrice}</p>
                    </div>
                    <button
                      onClick={() => handleSelectFlight(flight)}
                      className="w-full sm:w-auto md:w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base font-medium"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          !error && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 mb-4">No flights available for your search</p>
              <button
                onClick={() => router.push("/")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                New Search
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
