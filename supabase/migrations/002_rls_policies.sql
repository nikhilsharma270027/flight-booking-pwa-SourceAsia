-- Enable Row Level Security on all tables
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- Flights: Anyone can read all flights
CREATE POLICY "flights_select_policy" ON flights
  FOR SELECT
  USING (true);

-- Flights: Allow insert for admin/seeding (no auth check needed)
CREATE POLICY "flights_insert_policy" ON flights
  FOR INSERT
  WITH CHECK (true);

-- Flights: Allow update for admin/seeding
CREATE POLICY "flights_update_policy" ON flights
  FOR UPDATE
  WITH CHECK (true);

-- Seats: Anyone can read all seat information
CREATE POLICY "seats_select_policy" ON seats
  FOR SELECT
  USING (true);

-- Seats: Allow insert for admin/seeding
CREATE POLICY "seats_insert_policy" ON seats
  FOR INSERT
  WITH CHECK (true);

-- Seats: Allow update for admin/seeding
CREATE POLICY "seats_update_policy" ON seats
  FOR UPDATE
  WITH CHECK (true);

-- Bookings: Users can only read their own bookings
CREATE POLICY "bookings_select_policy" ON bookings
  FOR SELECT
  USING (user_id = auth.uid());

-- Bookings: Users can insert their own bookings
CREATE POLICY "bookings_insert_policy" ON bookings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Bookings: Users can update their own bookings
CREATE POLICY "bookings_update_policy" ON bookings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Bookings: Users can delete their own bookings
CREATE POLICY "bookings_delete_policy" ON bookings
  FOR DELETE
  USING (user_id = auth.uid());

-- Passengers: Users can read passengers for their own bookings
CREATE POLICY "passengers_select_policy" ON passengers
  FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

-- Passengers: Users can insert passengers for their own bookings
CREATE POLICY "passengers_insert_policy" ON passengers
  FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

-- Reschedules: Users can read reschedules for their own bookings
CREATE POLICY "reschedules_select_policy" ON reschedules
  FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

-- Reschedules: Users can insert reschedules for their own bookings
CREATE POLICY "reschedules_insert_policy" ON reschedules
  FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );
