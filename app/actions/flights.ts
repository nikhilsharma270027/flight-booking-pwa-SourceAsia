"use server";

import { createClient } from "@/lib/supabase/server";

export interface FlightSearchResult {
  id: string;
  flightNo: string;
  origin: string;
  destination: string;
  departsAt: string;
  arrivesAt: string;
  aircraftType: string;
  basePrice: number;
  status: string;
}

export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string
): Promise<FlightSearchResult[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("flights")
      .select("*")
      .eq("origin", origin)
      .eq("destination", destination)
      .gte("departs_at", departureDate)
      .lt("departs_at", new Date(new Date(departureDate).getTime() + 24 * 60 * 60 * 1000).toISOString())
      .order("departs_at", { ascending: true });

    if (error) {
      console.error("Error searching flights:", error);
      return [];
    }

    // Transform snake_case to camelCase
    return (data || []).map((flight) => ({
      id: flight.id,
      flightNo: flight.flight_no,
      origin: flight.origin,
      destination: flight.destination,
      departsAt: flight.departs_at,
      arrivesAt: flight.arrives_at,
      aircraftType: flight.aircraft_type,
      basePrice: flight.base_price,
      status: flight.status,
    }));
  } catch (error) {
    console.error("Error in searchFlights:", error);
    return [];
  }
}

export interface SeatInfo {
  id: string;
  flightId: string;
  seatNumber: string;
  class: string;
  isAvailable: boolean;
  extraFee: number;
}

export async function getFlightSeats(flightId: string): Promise<SeatInfo[]> {
  try {
    const supabase = await createClient();

    console.log("Fetching seats for flight:", flightId);

    const { data, error } = await supabase
      .from("seats")
      .select("*")
      .eq("flight_id", flightId)
      .order("seat_number", { ascending: true });

    if (error) {
      console.error("Error fetching seats - DB error:", error);
      return [];
    }

    console.log("Seats found in DB:", data?.length || 0);

    if (!data || data.length === 0) {
      console.warn("NO SEATS FOUND FOR FLIGHT:", flightId, "- This means the seats table is empty or seed didn't run");
    }

    return (
      data?.map((seat) => ({
        id: seat.id,
        flightId: seat.flight_id,
        seatNumber: seat.seat_number,
        class: seat.class,
        isAvailable: seat.is_available,
        extraFee: seat.extra_fee,
      })) || []
    );
  } catch (error) {
    console.error("Error in getFlightSeats:", error);
    return [];
  }
}

export interface FlightDetails {
  id: string;
  flightNo: string;
  origin: string;
  destination: string;
  departsAt: string;
  arrivesAt: string;
  aircraftType: string;
  basePrice: number;
  status: string;
}

export async function getFlightDetails(flightId: string): Promise<FlightDetails | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("flights")
      .select("*")
      .eq("id", flightId)
      .single();

    if (error) {
      console.error("Error fetching flight details:", error);
      return null;
    }

    return {
      id: data.id,
      flightNo: data.flight_no,
      origin: data.origin,
      destination: data.destination,
      departsAt: data.departs_at,
      arrivesAt: data.arrives_at,
      aircraftType: data.aircraft_type,
      basePrice: data.base_price,
      status: data.status,
    };
  } catch (error) {
    console.error("Error in getFlightDetails:", error);
    return null;
  }
}

export async function lockSeat(
  seatId: string,
  flightId: string,
  totalPrice: number,
  pnrCode: string
): Promise<{ success: boolean; bookingId?: string; message: string }> {
  try {
    const supabase = await createClient();

    const {
      data: session,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.session?.user?.id) {
      return { success: false, message: "User not authenticated" };
    }

    const userId = session.session.user.id;

    const { data, error } = await supabase.rpc("lock_seat_for_booking", {
      p_seat_id: seatId,
      p_flight_id: flightId,
      p_user_id: userId,
      p_total_price: totalPrice,
      p_pnr_code: pnrCode,
    });

    if (error) {
      console.error("Error locking seat:", error);
      return { success: false, message: error.message };
    }

    return {
      success: data?.[0]?.success || false,
      bookingId: data?.[0]?.booking_id,
      message: data?.[0]?.message || "Seat locked",
    };
  } catch (error) {
    console.error("Error in lockSeat:", error);
    return { success: false, message: "Failed to lock seat" };
  }
}

export async function createPassenger(
  bookingId: string,
  fullName: string,
  passportNo: string,
  nationality: string,
  dob: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("passengers").insert({
      booking_id: bookingId,
      full_name: fullName,
      passport_no: passportNo,
      nationality,
      dob,
    });

    if (error) {
      console.error("Error creating passenger:", error);
      return { success: false, message: error.message };
    }

    return { success: true, message: "Passenger created" };
  } catch (error) {
    console.error("Error in createPassenger:", error);
    return { success: false, message: "Failed to create passenger" };
  }
}

export async function generatePNRCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pnr = "";
  for (let i = 0; i < 6; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
}

export interface FeaturedRoute {
  origin: string;
  destination: string;
  minPrice: number;
  flightCount: number;
}

export async function getFeaturedFlights(): Promise<FeaturedRoute[]> {
  try {
    const supabase = await createClient();

    // Get all flights from today onwards
    const today = new Date().toISOString();
    const { data, error } = await supabase
      .from("flights")
      .select("origin, destination, base_price")
      .gte("departs_at", today)
      .order("origin", { ascending: true });

    if (error) {
      console.error("Error fetching featured flights:", error);
      return [];
    }

    // Group by route and calculate min price and count
    const routeMap = new Map<string, { minPrice: number; count: number }>();
    
    (data || []).forEach((flight) => {
      const key = `${flight.origin}-${flight.destination}`;
      if (!routeMap.has(key)) {
        routeMap.set(key, { minPrice: flight.base_price, count: 1 });
      } else {
        const existing = routeMap.get(key)!;
        existing.count += 1;
        existing.minPrice = Math.min(existing.minPrice, flight.base_price);
      }
    });

    // Convert to featured routes and sort by count (most popular first)
    const featured = Array.from(routeMap.entries())
      .map(([route, data]) => {
        const [origin, destination] = route.split("-");
        return {
          origin,
          destination,
          minPrice: data.minPrice,
          flightCount: data.count,
        };
      })
      .sort((a, b) => b.flightCount - a.flightCount)
      .slice(0, 6); // Top 6 routes

    return featured;
  } catch (error) {
    console.error("Error in getFeaturedFlights:", error);
    return [];
  }
}
