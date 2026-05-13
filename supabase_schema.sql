-- Smart Attendance System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Clerk)
CREATE TYPE user_role AS ENUM ('instructor', 'student');

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Classes Table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Geofences Table
CREATE TABLE geofences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius INTEGER NOT NULL, -- in meters
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sessions Table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  qr_code_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Attendance Records Table
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent');

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status attendance_status DEFAULT 'present',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  distance_from_center DOUBLE PRECISION,
  UNIQUE(session_id, student_id)
);

-- RLS POLICIES

-- Profiles: Anyone authenticated can view, only owner can update
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (clerk_id = auth.uid()::text);

-- Classes: Instructors can manage their own, students can view
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Instructors can manage own classes" ON classes FOR ALL USING (
  instructor_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Students can view classes" ON classes FOR SELECT USING (true);

-- Geofences: Same as classes
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Instructors can manage own geofences" ON geofences FOR ALL USING (
  class_id IN (SELECT id FROM classes WHERE instructor_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()::text))
);
CREATE POLICY "Everyone can view geofences" ON geofences FOR SELECT USING (true);

-- Sessions: Same as classes
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Instructors can manage sessions" ON sessions FOR ALL USING (
  class_id IN (SELECT id FROM classes WHERE instructor_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()::text))
);
CREATE POLICY "Everyone can view sessions" ON sessions FOR SELECT USING (true);

-- Attendance: Students can manage own, instructors can view all for their classes
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own attendance" ON attendance FOR SELECT USING (
  student_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Students can insert own attendance" ON attendance FOR INSERT WITH CHECK (
  student_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Instructors can view attendance for their classes" ON attendance FOR SELECT USING (
  session_id IN (
    SELECT id FROM sessions WHERE class_id IN (
      SELECT id FROM classes WHERE instructor_id IN (SELECT id FROM profiles WHERE clerk_id = auth.uid()::text)
    )
  )
);