import React, { useState } from 'react';
import { useUser, useSession } from '@clerk/clerk-react';
import { createAuthenticatedSupabaseClient } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, School, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingProps {
  onComplete: (profile: any) => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { user } = useUser();
  const { session } = useSession();
  const [step, setStep] = useState<'role' | 'details'>('role');
  
  const [role, setRole] = useState<'instructor' | 'student' | null>(null);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [matricNumber, setMatricNumber] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selectedRole: 'instructor' | 'student') => {
    setRole(selectedRole);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !fullName || !user) {
      toast.error('Please complete all required fields');
      return;
    }

    // ── Instructor: school email must end with .edu ──────────────
    if (role === 'instructor') {
      if (!schoolEmail) {
        toast.error('School email is required for instructors');
        return;
      }
      if (!schoolEmail.toLowerCase().endsWith('.edu')) {
        toast.error('Invalid credentials — instructor email must end with .edu');
        return;
      }
    }

    // ── Student: matric must match FUO/XX/XXX/XXXXX (all caps) ──
    if (role === 'student') {
      if (!matricNumber) {
        toast.error('Matriculation number is required for students');
        return;
      }

      const matricPattern = /^FUO\/[A-Z0-9]{2}\/[A-Z]{3}\/[0-9]{5}$/;
      if (!matricPattern.test(matricNumber)) {
        toast.error('Invalid credentials — matric number must follow the format FUO/YY/DEP/NNNNN (e.g. FUO/19/CSC/12345)');
        return;
      }

      // Check uniqueness
      const supabaseCheck = createAuthenticatedSupabaseClient(
        async () => (await session?.getToken()) ?? null
      );
      const { data: existing } = await supabaseCheck
        .from('profiles')
        .select('id')
        .eq('matric_number', matricNumber)
        .maybeSingle();

      if (existing) {
        toast.error('Matric number already exists — please check your entry or contact admin');
        return;
      }
    }

    setLoading(true);

    try {
      const supabase = createAuthenticatedSupabaseClient(
        async () => (await session?.getToken()) ?? null
      );

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          clerk_id: user.id,
          full_name: fullName,
          role: role,
          matric_number: role === 'student' ? matricNumber : null,
          school_email: role === 'instructor' ? schoolEmail : null,
          avatar_url: user.imageUrl,
        }, { 
          onConflict: 'clerk_id' 
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Welcome to SmartAttendX, ${fullName}!`);
      onComplete(data);
    } catch (err: any) {
      console.error(err);
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
          <CardDescription>
            {step === 'role' 
              ? "Select your role to get started with SmartAttendX" 
              : `Enter your ${role === 'student' ? 'matriculation details' : 'school email'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Step 1: Role Selection */}
            {step === 'role' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('instructor')}
                  className="flex flex-col items-center justify-center rounded-xl border-2 p-8 transition-all hover:border-primary hover:bg-primary/5"
                >
                  <School className="mb-4 h-12 w-12" />
                  <span className="font-semibold text-lg">Instructor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('student')}
                  className="flex flex-col items-center justify-center rounded-xl border-2 p-8 transition-all hover:border-primary hover:bg-primary/5"
                >
                  <GraduationCap className="mb-4 h-12 w-12" />
                  <span className="font-semibold text-lg">Student</span>
                </button>
              </div>
            )}

            {/* Step 2: Additional Details */}
            {step === 'details' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {role === 'student' && (
                  <div className="space-y-2">
                    <Label htmlFor="matric">Matriculation Number</Label>
                    <Input
                      id="matric"
                      placeholder="FUO/19/CSC/12345"
                      value={matricNumber}
                      onChange={(e) => setMatricNumber(e.target.value.toUpperCase())}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: FUO/YY/DEP/NNNNN — e.g. FUO/19/CSC/12345
                    </p>
                  </div>
                )}

                {role === 'instructor' && (
                  <div className="space-y-2">
                    <Label htmlFor="schoolEmail">School Email Address</Label>
                    <Input
                      id="schoolEmail"
                      type="email"
                      placeholder="you@university.edu"
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                      required
                    />
                  </div>
                )}
              </>
            )}

            {step === 'details' && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating your profile...' : 'Complete Registration'} 
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
