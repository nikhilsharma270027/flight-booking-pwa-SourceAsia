-- Seed script for flights, seats, and test data
-- Insert test user (you'll need to create this via Supabase Auth UI or this will be the user's UUID)

-- Insert flights (8 flights across 4 routes)
INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES
  -- Route 1: New York to London (2 flights)
  ('AA101', 'New York', 'London', NOW() + INTERVAL '0 days' + INTERVAL '08:00:00', NOW() + INTERVAL '0 days' + INTERVAL '20:00:00', 'Boeing 777', 'scheduled', 450.00),
  ('AA102', 'New York', 'London', NOW() + INTERVAL '1 day' + INTERVAL '14:00:00', NOW() + INTERVAL '2 days' + INTERVAL '02:00:00', 'Boeing 777', 'scheduled', 480.00),
  
  -- Route 2: Los Angeles to Tokyo (2 flights)
  ('UA201', 'Los Angeles', 'Tokyo', NOW() + INTERVAL '0 days' + INTERVAL '09:30:00', NOW() + INTERVAL '1 day' + INTERVAL '13:30:00', 'Boeing 787', 'scheduled', 520.00),
  ('UA202', 'Los Angeles', 'Tokyo', NOW() + INTERVAL '2 days' + INTERVAL '11:00:00', NOW() + INTERVAL '3 days' + INTERVAL '15:00:00', 'Boeing 787', 'scheduled', 550.00),
  
  -- Route 3: London to Paris (2 flights)
  ('BA301', 'London', 'Paris', NOW() + INTERVAL '0 days' + INTERVAL '06:00:00', NOW() + INTERVAL '0 days' + INTERVAL '08:00:00', 'Airbus A320', 'scheduled', 150.00),
  ('BA302', 'London', 'Paris', NOW() + INTERVAL '1 day' + INTERVAL '18:00:00', NOW() + INTERVAL '1 day' + INTERVAL '20:00:00', 'Airbus A320', 'scheduled', 160.00),
  
  -- Route 4: Dubai to Sydney (2 flights)
  ('EK401', 'Dubai', 'Sydney', NOW() + INTERVAL '0 days' + INTERVAL '07:00:00', NOW() + INTERVAL '1 day' + INTERVAL '21:00:00', 'Boeing 777-300ER', 'scheduled', 650.00),
  ('EK402', 'Dubai', 'Sydney', NOW() + INTERVAL '2 days' + INTERVAL '22:00:00', NOW() + INTERVAL '4 days' + INTERVAL '12:00:00', 'Boeing 777-300ER', 'scheduled', 680.00)
ON CONFLICT (flight_no) DO NOTHING;

-- Get flight IDs for seat insertion
DO $$
DECLARE
  v_flight_ids UUID[];
  v_flight_id UUID;
  v_row_num INTEGER;
  v_col_num INTEGER;
  v_seat_number VARCHAR;
  v_class VARCHAR;
  v_extra_fee DECIMAL;
  v_flight_count INTEGER := 0;
BEGIN
  -- Get all flight IDs
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_flight_ids FROM flights;
  
  -- For each flight, create seats (Boeing 777: 32 rows, A320: 25 rows, etc.)
  FOREACH v_flight_id IN ARRAY v_flight_ids LOOP
    v_flight_count := v_flight_count + 1;
    
    -- Create 32 rows x 6 columns for large aircraft, 25 rows x 6 columns for smaller
    FOR v_row_num IN 1..32 LOOP
      FOR v_col_num IN 1..6 LOOP
        -- Determine class based on row number
        IF v_row_num <= 6 THEN
          v_class := 'first';
          v_extra_fee := 200.00;
        ELSIF v_row_num <= 12 THEN
          v_class := 'business';
          v_extra_fee := 100.00;
        ELSE
          v_class := 'economy';
          v_extra_fee := 0.00;
        END IF;
        
        -- Seat letters: A, B, C, D, E, F
        v_seat_number := v_row_num || CHR(64 + v_col_num);
        
        INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (v_flight_id, v_seat_number, v_class, TRUE, v_extra_fee)
        ON CONFLICT (flight_id, seat_number) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Seeded % flights with seat maps', v_flight_count;
END $$;
