"use server";

import { createClient } from "@/lib/supabase/server";

export interface BookingRecord {
  id: string;
  userId: string;
  flightId: string;
  seatId: string;
  status: string;
  bookedAt: string;
  totalPrice: number;
  pnrCode: string;
}

export interface BookingWithDetails {
  id: string;
  flightId?: string;
  flightNo: string;
  origin: string;
  destination: string;
  departsAt: string;
  arrivesAt: string;
  seatNumber: string;
  status: "confirmed" | "rescheduled" | "cancelled";
  pnrCode: string;
  totalPrice: number;
  passengerName?: string;
}

export async function getMyBookings(): Promise<BookingWithDetails[]> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return [];
    }

    const userId = user.id;

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        flight_id,
        seat_id,
        status,
        booked_at,
        total_price,
        pnr_code,
        flights(flight_no, origin, destination, departs_at, arrives_at),
        seats(seat_number),
        passengers(full_name)
      `
      )
      .eq("user_id", userId)
      .order("booked_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }

    return (
      data?.map((booking: any) => ({
        id: booking.id,
        flightId: booking.flight_id,
        flightNo: booking.flights?.flight_no || "",
        origin: booking.flights?.origin || "",
        destination: booking.flights?.destination || "",
        departsAt: booking.flights?.departs_at || "",
        arrivesAt: booking.flights?.arrives_at || "",
        seatNumber: booking.seats?.seat_number || "",
        status: booking.status,
        pnrCode: booking.pnr_code,
        totalPrice: booking.total_price,
        passengerName: booking.passengers?.[0]?.full_name,
      })) || []
    );
  } catch (error) {
    console.error("Error in getMyBookings:", error);
    return [];
  }
}

export async function cancelBooking(
  bookingId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("cancel_booking", {
      p_booking_id: bookingId,
    });

    if (error) {
      console.error("Error cancelling booking:", error);
      return { success: false, message: error.message };
    }

    return {
      success: data?.[0]?.success || false,
      message: data?.[0]?.message || "Booking cancelled",
    };
  } catch (error) {
    console.error("Error in cancelBooking:", error);
    return { success: false, message: "Failed to cancel booking" };
  }
}

export interface RescheduleOptions {
  bookingId: string;
  newFlightId: string;
  newSeatId: string;
}

export async function rescheduleBooking(
  options: RescheduleOptions
): Promise<{ success: boolean; message: string; feeCharged?: number }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("reschedule_booking", {
      p_booking_id: options.bookingId,
      p_new_flight_id: options.newFlightId,
      p_new_seat_id: options.newSeatId,
    });

    if (error) {
      console.error("Error rescheduling booking:", error);
      return { success: false, message: error.message };
    }

    return {
      success: data?.[0]?.success || false,
      message: data?.[0]?.message || "Booking rescheduled",
      feeCharged: data?.[0]?.fee_charged || 0,
    };
  } catch (error) {
    console.error("Error in rescheduleBooking:", error);
    return { success: false, message: "Failed to reschedule booking" };
  }
}

export async function getBookingDetails(bookingId: string): Promise<BookingWithDetails | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id,
        flight_id,
        seat_id,
        status,
        booked_at,
        total_price,
        pnr_code,
        flights(flight_no, origin, destination, departs_at, arrives_at),
        seats(seat_number),
        passengers(full_name)
      `
      )
      .eq("id", bookingId)
      .single();

    if (error) {
      console.error("Error fetching booking details:", error);
      return null;
    }

    return {
      id: data.id,
      flightId: data.flight_id,
      flightNo: (data.flights as any)?.flight_no || "",
      origin: (data.flights as any)?.origin || "",
      destination: (data.flights as any)?.destination || "",
      departsAt: (data.flights as any)?.departs_at || "",
      arrivesAt: (data.flights as any)?.arrives_at || "",
      seatNumber: (data.seats as any)?.seat_number || "",
      status: data.status,
      pnrCode: data.pnr_code,
      totalPrice: data.total_price,
      passengerName: data.passengers?.[0]?.full_name,
    };
  } catch (error) {
    console.error("Error in getBookingDetails:", error);
    return null;
  }
}

export interface FlightForReschedule {
  id: string;
  flightNo: string;
  origin: string;
  destination: string;
  departsAt: string;
  arrivesAt: string;
  basePrice: number;
}

export async function getAlternateFlights(
  origin: string,
  destination: string,
  excludeFlightId: string,
  daysAhead: number = 7
): Promise<FlightForReschedule[]> {
  try {
    const supabase = await createClient();

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    let query = supabase
      .from("flights")
      .select("*")
      .eq("origin", origin)
      .eq("destination", destination)
      .gte("departs_at", startDate.toISOString())
      .lte("departs_at", endDate.toISOString());

    // Only add the neq filter if excludeFlightId is provided
    if (excludeFlightId && excludeFlightId.trim()) {
      query = query.neq("id", excludeFlightId);
    }

    const { data, error } = await query.order("departs_at", { ascending: true });

    if (error) {
      console.error("Error fetching alternate flights:", error);
      return [];
    }

    return (
      data?.map((flight) => ({
        id: flight.id,
        flightNo: flight.flight_no,
        origin: flight.origin,
        destination: flight.destination,
        departsAt: flight.departs_at,
        arrivesAt: flight.arrives_at,
        basePrice: flight.base_price,
      })) || []
    );
  } catch (error) {
    console.error("Error in getAlternateFlights:", error);
    return [];
  }
}
