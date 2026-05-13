import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, School, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingProps {
  onComplete: (profile: Profile) => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { user } = useUser();
  const [role, setRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !fullName) {
      toast.error('Please complete all fields');
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          clerk_id: user?.id,
          full_name: fullName,
          role: role,
          avatar_url: user?.imageUrl,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success(`Welcome, ${fullName}!`);
      onComplete(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>Select your role to get started with AttendX</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
              />
            </div>

            <div className="space-y-3">
              <Label>Select Your Role</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('instructor')}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
                    role === 'instructor' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-muted bg-card hover:border-primary/50'
                  }`}
                >
                  <School className="mb-2 h-8 w-8" />
                  <span className="font-semibold">Instructor</span>
                  {role === 'instructor' && <CheckCircle2 className="mt-2 h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
                    role === 'student' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-muted bg-card hover:border-primary/50'
                  }`}
                >
                  <GraduationCap className="mb-2 h-8 w-8" />
                  <span className="font-semibold">Student</span>
                  {role === 'student' && <CheckCircle2 className="mt-2 h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up...' : 'Complete Registration'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;