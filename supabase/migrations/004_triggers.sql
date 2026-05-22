-- Trigger to enforce 2-hour cancellation rule
CREATE OR REPLACE FUNCTION check_cancellation_time()
RETURNS TRIGGER AS $$
DECLARE
  v_departs_at TIMESTAMP;
  v_time_until_departure INTERVAL;
BEGIN
  -- Only check when status is changing to 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Get flight departure time
    SELECT departs_at INTO v_departs_at
    FROM flights
    WHERE id = NEW.flight_id;
    
    -- Calculate time until departure
    v_time_until_departure := v_departs_at - NOW();
    
    -- Reject if within 2 hours of departure
    IF v_time_until_departure < INTERVAL '2 hours' AND v_time_until_departure > INTERVAL '0' THEN
      RAISE EXCEPTION 'Cannot cancel booking within 2 hours of departure';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_cancellation_check
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_cancellation_time();

-- Trigger to auto-update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flights_update_timestamp BEFORE UPDATE ON flights
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER seats_update_timestamp BEFORE UPDATE ON seats
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER bookings_update_timestamp BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER passengers_update_timestamp BEFORE UPDATE ON passengers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER reschedules_update_timestamp BEFORE UPDATE ON reschedules
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
