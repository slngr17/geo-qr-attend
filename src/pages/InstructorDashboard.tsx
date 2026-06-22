import React, { useState, useEffect } from 'react';
import { Profile, Class } from '../../types';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, BookOpen, Users, Settings, LogOut, LayoutDashboard, Calendar, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import CreateClassModal from './CreateClassModal';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';

interface InstructorDashboardProps {
  profile: Profile;
}

const InstructorDashboard = ({ profile }: InstructorDashboardProps) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('instructor_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (err: any) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <LayoutDashboard size={18} />
          </div>
          <span className="font-bold text-xl">AttendX</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start text-primary bg-primary/5">
            <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <BookOpen className="mr-3 h-5 w-5" /> My Classes
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Calendar className="mr-3 h-5 w-5" /> Schedule
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="mr-3 h-5 w-5" /> Reports
          </Button>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserButton />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{profile.full_name}</span>
                <span className="text-xs text-muted-foreground capitalize">{profile.role}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {profile.full_name.split(' ')[0]}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Class
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
             <Card className="bg-primary text-primary-foreground">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs opacity-70">+2 from yesterday</p>
                </CardContent>
             </Card>
             <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">128</div>
                  <p className="text-xs text-muted-foreground">Across 5 classes</p>
                </CardContent>
             </Card>
             <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-green-500">↑ 3.2% this week</p>
                </CardContent>
             </Card>
          </div>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Classes</h2>
              <Button variant="link" className="text-primary">View All</Button>
            </div>

            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : classes.length === 0 ? (
              <Card className="border-dashed flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="font-semibold text-lg">No classes created yet</h3>
                <p className="text-muted-foreground mb-6">Create your first class to start tracking attendance.</p>
                <Button onClick={() => setIsModalOpen(true)} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Create First Class
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {classes.map((c) => (
                  <Card key={c.id} className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/20" onClick={() => navigate(`/class/${c.id}`)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <BookOpen size={20} />
                        </div>
                        <span className="text-xs font-mono font-medium px-2 py-1 bg-muted rounded uppercase">{c.code}</span>
                      </div>
                      <CardTitle className="mt-4">{c.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{c.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="border-t pt-4 text-xs text-muted-foreground flex justify-between">
                      <span className="flex items-center gap-1"><Users size={14} /> 24 Students</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> MWF 10:00 AM</span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <CreateClassModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={fetchClasses} 
        instructorId={profile.id}
      />
    </div>
  );
};

export default InstructorDashboard;
