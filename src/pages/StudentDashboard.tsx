import React, { useState, useEffect } from 'react';
import { Profile, Class } from '../../types';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { QrCode, History, Bell, ChevronRight, LayoutDashboard, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';

interface StudentDashboardProps {
  profile: Profile;
}

const StudentDashboard = ({ profile }: StudentDashboardProps) => {
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .limit(5);

      if (error) throw error;
      setMyClasses(data || []);
    } catch (err: any) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode) return;
    
    setIsJoining(true);
    try {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('code', classCode.toUpperCase())
        .single();

      if (classError || !classData) {
        throw new Error('Invalid class code');
      }

      toast.success(`Joined ${classData.name}!`);
      setClassCode('');
      fetchMyClasses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to join class');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      {/* Mobile-first Header */}
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <QrCode size={18} />
          </div>
          <span className="font-bold">AttendX</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <section>
            <h1 className="text-2xl font-bold">Hello, {profile.full_name.split(' ')[0]}</h1>
            <p className="text-muted-foreground text-sm">Ready to mark your attendance?</p>
          </section>

          {/* Action Card */}
          <Card className="bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <QrCode size={120} />
            </div>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription className="text-primary-foreground/80">Scan the QR code shared by your instructor.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-white text-primary hover:bg-white/90" 
                size="lg"
                onClick={() => navigate('/scan/active')}
              >
                <QrCode className="mr-2 h-5 w-5" /> Open Scanner
              </Button>
            </CardContent>
          </Card>

          {/* Join Class */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Join New Class</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinClass} className="flex gap-2">
                <Input 
                  placeholder="Enter Class Code (e.g. CS101)" 
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className="uppercase"
                />
                <Button disabled={isJoining}>
                  {isJoining ? 'Joining...' : 'Join'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* My Classes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">My Classes</h2>
              <Button variant="ghost" size="sm" className="text-primary">History</Button>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Loading classes...</div>
              ) : myClasses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-dashed">
                  No classes yet. Join one above!
                </div>
              ) : (
                myClasses.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <History size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium leading-tight">{c.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">Attendance Rate: 92%</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="sticky bottom-0 border-t bg-card flex justify-around p-2 md:hidden">
        <Button variant="ghost" className="flex flex-col items-center h-auto py-2 gap-1 text-primary">
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Home</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center h-auto py-2 gap-1 text-muted-foreground">
          <History size={20} />
          <span className="text-[10px]">History</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center h-auto py-2 gap-1 text-muted-foreground">
          <Bell size={20} />
          <span className="text-[10px]">Alerts</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center h-auto py-2 gap-1 text-muted-foreground">
          <Settings size={20} />
          <span className="text-[10px]">Settings</span>
        </Button>
      </nav>
    </div>
  );
};

export default StudentDashboard;
