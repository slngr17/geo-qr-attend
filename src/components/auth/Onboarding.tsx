import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, School, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function Onboarding() {
  const [role, setRole] = useState<'instructor' | 'student' | null>(null);
  const navigate = useNavigate();

  const handleComplete = () => {
    if (!role) return;
    // In real app: Update user metadata in Clerk
    localStorage.setItem('user_role', role);
    navigate(role === 'instructor' ? '/instructor' : '/student');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome to Smart Attendance</h1>
          <p className="text-muted-foreground">Choose your role to get started with your account</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card 
            className={`cursor-pointer transition-all border-2 ${role === 'instructor' ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-slate-300'}`}
            onClick={() => setRole('instructor')}
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${role === 'instructor' ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600'}`}>
                <School className="w-6 h-6" />
              </div>
              <CardTitle>Instructor</CardTitle>
              <CardDescription>
                Create classes, manage attendance, and generate QR codes for your students.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className={`cursor-pointer transition-all border-2 ${role === 'student' ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-slate-300'}`}
            onClick={() => setRole('student')}
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${role === 'student' ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600'}`}>
                <GraduationCap className="w-6 h-6" />
              </div>
              <CardTitle>Student</CardTitle>
              <CardDescription>
                Join classes, scan QR codes, and track your attendance progress.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="px-12 py-6 text-lg" 
            disabled={!role}
            onClick={handleComplete}
          >
            Continue as {role ? (role.charAt(0).toUpperCase() + role.slice(1)) : '...'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}