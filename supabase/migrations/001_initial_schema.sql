-- Create flights table
CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_no VARCHAR(10) NOT NULL UNIQUE,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  departs_at TIMESTAMP NOT NULL,
  arrives_at TIMESTAMP NOT NULL,
  aircraft_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  base_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create seats table
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  seat_number VARCHAR(5) NOT NULL,
  class VARCHAR(20) NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  extra_fee DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(flight_id, seat_number)
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  booked_at TIMESTAMP DEFAULT NOW(),
  total_price DECIMAL(10, 2) NOT NULL,
  pnr_code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create passengers table
CREATE TABLE passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  passport_no VARCHAR(20) NOT NULL,
  nationality VARCHAR(50) NOT NULL,
  dob DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create reschedules table
CREATE TABLE reschedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  new_flight_id UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  requested_at TIMESTAMP DEFAULT NOW(),
  fee_charged DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_flights_route ON flights(origin, destination);
CREATE INDEX idx_flights_departure ON flights(departs_at);
CREATE INDEX idx_seats_flight ON seats(flight_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_flight ON bookings(flight_id);
CREATE INDEX idx_passengers_booking ON passengers(booking_id);
CREATE INDEX idx_reschedules_booking ON reschedules(booking_id);
