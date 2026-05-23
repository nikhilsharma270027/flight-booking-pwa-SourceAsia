-- RPC function to lock seat for booking (prevents double-booking)
CREATE OR REPLACE FUNCTION lock_seat_for_booking(
  p_seat_id UUID,
  p_flight_id UUID,
  p_user_id UUID,
  p_total_price DECIMAL,
  p_pnr_code VARCHAR
)
RETURNS TABLE(success BOOLEAN, booking_id UUID, message TEXT) AS $$
DECLARE
  v_booking_id UUID;
  v_seat_available BOOLEAN;
BEGIN
  -- Check if seat is still available
  SELECT is_available INTO v_seat_available
  FROM seats
  WHERE id = p_seat_id
  FOR UPDATE;
  
  IF NOT v_seat_available THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Seat is already booked'::TEXT;
    RETURN;
  END IF;
  
  -- Mark seat as unavailable
  UPDATE seats
  SET is_available = FALSE, updated_at = NOW()
  WHERE id = p_seat_id;
  
  -- Create booking record
  INSERT INTO bookings (user_id, flight_id, seat_id, total_price, pnr_code, status)
  VALUES (p_user_id, p_flight_id, p_seat_id, p_total_price, p_pnr_code, 'confirmed')
  RETURNING bookings.id INTO v_booking_id;
  
  RETURN QUERY SELECT TRUE, v_booking_id, 'Seat locked and booking created'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to cancel booking and free seat
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_seat_id UUID;
  v_flight_id UUID;
  v_departs_at TIMESTAMP;
  v_time_until_departure INTERVAL;
BEGIN
  -- Get booking and flight details
  SELECT b.seat_id, b.flight_id, f.departs_at
  INTO v_seat_id, v_flight_id, v_departs_at
  FROM bookings b
  JOIN flights f ON b.flight_id = f.id
  WHERE b.id = p_booking_id;
  
  IF v_seat_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Booking not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if cancellation is within 2 hours of departure
  v_time_until_departure := v_departs_at - NOW();
  IF v_time_until_departure < INTERVAL '2 hours' AND v_time_until_departure > INTERVAL '0' THEN
    RETURN QUERY SELECT FALSE, 'Cannot cancel within 2 hours of departure'::TEXT;
    RETURN;
  END IF;
  
  -- Update booking status to cancelled
  UPDATE bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_booking_id;
  
  -- Free the seat
  UPDATE seats
  SET is_available = TRUE, updated_at = NOW()
  WHERE id = v_seat_id;
  
  RETURN QUERY SELECT TRUE, 'Booking cancelled and seat freed'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to reschedule booking
CREATE OR REPLACE FUNCTION reschedule_booking(
  p_booking_id UUID,
  p_new_flight_id UUID,
  p_new_seat_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT, fee_charged DECIMAL) AS $$
DECLARE
  v_old_flight_id UUID;
  v_old_seat_id UUID;
  v_old_price DECIMAL;
  v_new_price DECIMAL;
  v_fee DECIMAL;
  v_new_seat_available BOOLEAN;
BEGIN
  -- Get current booking details
  SELECT b.flight_id, b.seat_id, b.total_price
  INTO v_old_flight_id, v_old_seat_id, v_old_price
  FROM bookings b
  WHERE b.id = p_booking_id;
  
  IF v_old_flight_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Booking not found'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Check if new seat is available
  SELECT is_available INTO v_new_seat_available
  FROM seats
  WHERE id = p_new_seat_id
  FOR UPDATE;
  
  IF NOT v_new_seat_available THEN
    RETURN QUERY SELECT FALSE, 'New seat is not available'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Calculate new total price
  SELECT base_price + COALESCE(s.extra_fee, 0)
  INTO v_new_price
  FROM flights f
  LEFT JOIN seats s ON s.flight_id = f.id AND s.id = p_new_seat_id
  WHERE f.id = p_new_flight_id;
  
  v_fee := GREATEST(0, v_new_price - v_old_price);
  
  -- Record reschedule
  INSERT INTO reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
  VALUES (p_booking_id, v_old_flight_id, p_new_flight_id, v_fee);
  
  -- Free old seat
  UPDATE seats
  SET is_available = TRUE, updated_at = NOW()
  WHERE id = v_old_seat_id;
  
  -- Mark new seat as unavailable
  UPDATE seats
  SET is_available = FALSE, updated_at = NOW()
  WHERE id = p_new_seat_id;
  
  -- Update booking
  UPDATE bookings
  SET flight_id = p_new_flight_id, seat_id = p_new_seat_id, total_price = v_new_price, updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN QUERY SELECT TRUE, 'Booking rescheduled successfully'::TEXT, v_fee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate PNR code
CREATE OR REPLACE FUNCTION generate_pnr_code()
RETURNS VARCHAR AS $$
DECLARE
  v_pnr VARCHAR;
  v_chars VARCHAR := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_len INTEGER := 6;
  v_i INTEGER;
BEGIN
  v_pnr := '';
  FOR v_i IN 1..v_len LOOP
    v_pnr := v_pnr || substr(v_chars, (random() * length(v_chars))::INTEGER + 1, 1);
  END LOOP;
  RETURN v_pnr;
END;
$$ LANGUAGE plpgsql;
