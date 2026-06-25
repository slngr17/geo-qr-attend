import React, { useState, useEffect } from 'react';
import { Profile, Class } from '../../types';
import { createAuthenticatedSupabaseClient } from '../../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, BookOpen, Users, Settings, LogOut, LayoutDashboard, Calendar, FileText, Loader2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useSession } from '@clerk/clerk-react';
import CreateClassModal from './CreateClassModal';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';

interface InstructorDashboardProps {
  profile: Profile;
}

type View = 'dashboard' | 'classes' | 'schedule' | 'reports';

interface AttendanceRow {
  id: string;
  class_id: string;
  clerk_user_id: string;
  session_date: string;
  status: string;
  method: string;
  created_at: string;
}

interface Metrics {
  totalClasses: number;
  totalStudents: number;
  avgAttendanceRate: number;
}

const InstructorDashboard = ({ profile }: InstructorDashboardProps) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ totalClasses: 0, totalStudents: 0, avgAttendanceRate: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const navigate = useNavigate();
  const { session } = useSession();

  useEffect(() => {
    fetchAll();
  }, []);

  const getSupabase = () =>
    createAuthenticatedSupabaseClient(
      async () => (await session?.getToken()) ?? null
    );

  const fetchAll = async () => {
    try {
      const supabase = getSupabase();

      // Fetch classes
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('clerk_user_id', profile.clerk_id)
        .order('created_at', { ascending: false });

      if (classError) throw classError;
      const fetchedClasses: Class[] = classData || [];
      setClasses(fetchedClasses);

      if (fetchedClasses.length === 0) {
        setMetrics({ totalClasses: 0, totalStudents: 0, avgAttendanceRate: 0 });
        return;
      }

      // Fetch all attendance records for this instructor's classes
      const classIds = fetchedClasses.map((c) => c.id);
      const { data: attData, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .in('class_id', classIds);

      if (attError) throw attError;
      const fetchedAtt: AttendanceRow[] = attData || [];
      setAttendance(fetchedAtt);

      // Compute metrics
      const uniqueStudents = new Set(fetchedAtt.map((a) => a.clerk_user_id)).size;
      const presentCount = fetchedAtt.filter((a) => a.status === 'present').length;
      const avgRate = fetchedAtt.length > 0
        ? Math.round((presentCount / fetchedAtt.length) * 100)
        : 0;

      setMetrics({
        totalClasses: fetchedClasses.length,
        totalStudents: uniqueStudents,
        avgAttendanceRate: avgRate,
      });
    } catch (err: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Group attendance by date for Schedule view
  const attendanceByDate = attendance.reduce<Record<string, AttendanceRow[]>>((acc, row) => {
    const date = row.session_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(row);
    return acc;
  }, {});
  const sortedDates = Object.keys(attendanceByDate).sort((a, b) => b.localeCompare(a));

  // Per-class attendance stats for Reports view
  const classStats = classes.map((c) => {
    const records = attendance.filter((a) => a.class_id === c.id);
    const present = records.filter((a) => a.status === 'present').length;
    const rate = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
    const students = new Set(records.map((a) => a.clerk_user_id)).size;
    return { ...c, total: records.length, present, rate, students };
  });

  const navItems: { label: string; view: View; icon: React.ReactNode }[] = [
    { label: 'Dashboard', view: 'dashboard', icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { label: 'My Classes', view: 'classes', icon: <BookOpen className="mr-3 h-5 w-5" /> },
    { label: 'Schedule', view: 'schedule', icon: <Calendar className="mr-3 h-5 w-5" /> },
    { label: 'Reports', view: 'reports', icon: <FileText className="mr-3 h-5 w-5" /> },
  ];

  const renderMetrics = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalClasses}</div>
          <p className="text-xs opacity-70">Classes you manage</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalStudents}</div>
          <p className="text-xs text-muted-foreground">Across {metrics.totalClasses} {metrics.totalClasses === 1 ? 'class' : 'classes'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.avgAttendanceRate}%</div>
          <p className={`text-xs ${metrics.avgAttendanceRate >= 75 ? 'text-green-500' : 'text-amber-500'}`}>
            {metrics.avgAttendanceRate >= 75 ? '↑ On track' : '↓ Below target'}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderClasses = () => (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Classes</h2>
        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Class
        </Button>
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
          {classes.map((c) => {
            const stats = classStats.find((s) => s.id === c.id);
            return (
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
                  <span className="flex items-center gap-1"><Users size={14} /> {stats?.students ?? 0} Students</span>
                  <span className="flex items-center gap-1"><TrendingUp size={14} /> {stats?.rate ?? 0}% Attendance</span>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderSchedule = () => (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Schedule</h2>
      {sortedDates.length === 0 ? (
        <Card className="border-dashed py-12 text-center text-muted-foreground">
          No attendance sessions recorded yet.
        </Card>
      ) : (
        sortedDates.map((date) => {
          const rows = attendanceByDate[date];
          const classId = rows[0].class_id;
          const cls = classes.find((c) => c.id === classId);
          const present = rows.filter((r) => r.status === 'present').length;
          return (
            <Card key={date}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{cls?.name ?? 'Unknown Class'}</CardTitle>
                  <span className="text-xs text-muted-foreground font-mono">{date}</span>
                </div>
              </CardHeader>
              <CardContent className="flex gap-6 text-sm">
                <span><strong>{rows.length}</strong> records</span>
                <span className="text-green-600"><strong>{present}</strong> present</span>
                <span className="text-red-500"><strong>{rows.length - present}</strong> absent</span>
              </CardContent>
            </Card>
          );
        })
      )}
    </section>
  );

  const renderReports = () => (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Reports</h2>
      {classStats.length === 0 ? (
        <Card className="border-dashed py-12 text-center text-muted-foreground">
          No data to report yet. Create classes and record attendance first.
        </Card>
      ) : (
        <div className="space-y-4">
          {classStats.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <span className="text-xs font-mono uppercase bg-muted px-2 py-1 rounded">{c.code}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Students</p>
                    <p className="font-bold text-lg">{c.students}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Records</p>
                    <p className="font-bold text-lg">{c.total}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Present</p>
                    <p className="font-bold text-lg text-green-600">{c.present}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Avg. Rate</p>
                    <p className={`font-bold text-lg ${c.rate >= 75 ? 'text-green-600' : 'text-amber-500'}`}>{c.rate}%</p>
                  </div>
                </div>
                {/* Attendance rate bar */}
                <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${c.rate >= 75 ? 'bg-green-500' : 'bg-amber-400'}`}
                    style={{ width: `${c.rate}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );

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
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ label, view, icon }) => (
            <Button
              key={view}
              variant="ghost"
              className={`w-full justify-start ${activeView === view ? 'text-primary bg-primary/5' : ''}`}
              onClick={() => setActiveView(view)}
            >
              {icon} {label}
            </Button>
          ))}
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
              <h1 className="text-3xl font-bold">
                {activeView === 'dashboard' && 'Instructor Dashboard'}
                {activeView === 'classes' && 'My Classes'}
                {activeView === 'schedule' && 'Schedule'}
                {activeView === 'reports' && 'Reports'}
              </h1>
              <p className="text-muted-foreground">Welcome back, {profile.full_name.split(' ')[0]}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Class
              </Button>
            </div>
          </header>

          {activeView === 'dashboard' && (
            <>
              {renderMetrics()}
              {renderClasses()}
            </>
          )}
          {activeView === 'classes' && renderClasses()}
          {activeView === 'schedule' && renderSchedule()}
          {activeView === 'reports' && renderReports()}
        </div>
      </main>

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchAll}
        instructorId={profile.clerk_id}
      />
    </div>
  );
};

export default InstructorDashboard;
