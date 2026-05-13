import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqpjcxhfbgiyyluixkpg.supabase.co';

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcGpjeGhmYmdpeXlsdWl4a3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzczNDQsImV4cCI6MjA5MzkxMzM0NH0.Q34IC8ONqan8qQgjktFIR3XCWj1Y2FEbsJ9ZD_Z5tt4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock storage for demo if Supabase isn't configured
const mockDB: Record<string, any[]> = {
  profiles: [],
  classes: [],
  geofences: [],
  sessions: [],
  attendance: []
};

export const getMockDB = () => mockDB;