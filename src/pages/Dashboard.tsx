import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { Profile, Class, Session } from '../types';
import InstructorDashboard from '../components/instructor/InstructorDashboard';
import StudentDashboard from '../components/student/StudentDashboard';
import Onboarding from '../components/Onboarding';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (isUserLoaded && user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('clerk_id', user.id)
          .single();

        if (!error && data) {
          setProfile(data);
        }
        setLoading(false);
      }
    }
    fetchProfile();
  }, [isUserLoaded, user]);

  if (!isUserLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return <Onboarding onComplete={(newProfile) => setProfile(newProfile)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {profile.role === 'instructor' ? (
        <InstructorDashboard profile={profile} />
      ) : (
        <StudentDashboard profile={profile} />
      )}
    </div>
  );
};

export default Dashboard;