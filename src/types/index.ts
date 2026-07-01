export type UserRole = 'instructor' | 'student';

export interface Profile {
  id: string;
  clerk_id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  matric_number?: string;
  school_email?: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  description?: string;
  clerk_user_id: string;
  created_at: string;
}

export interface Geofence {
  id: string;
  class_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  created_at: string;
}

export interface Session {
  id: string;
  class_id: string;
  start_time: string;
  end_time: string;
  qr_code_token: string;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  timestamp: string;
  location_lat?: number;
  location_lng?: number;
  distance_from_center?: number;
  student_name?: string;
}

export interface ClassWithStats extends Class {
  attendance_rate?: number;
  student_count?: number;
  active_session?: Session | null;
}
