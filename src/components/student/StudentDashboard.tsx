import React, { useState, useEffect } from 'react';
import { Profile, Class } from '../../types';
import { createAuthenticatedSupabaseClient } from '../../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { QrCode, History, Bell, ChevronRight, LayoutDashboard, Settings, Loader2, CheckCircle2, XCircle, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useSession } from '@clerk/clerk-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';

interface StudentDashboardProps {
  profile: Profile;
}

type StudentView = 'home' | 'history' | 'alerts' | 'settings';

interface AttendanceRecord {
  id: string;
  class_id: string;
  session_date: string;
  status: string;
  method: string;
  created_at: string;
}

const Logo = () => (
  <img
    src="/logo.png"
    alt="SmartAttendX"
    className="h-8 w-8 rounded-lg object-contain"
    onError={(e) => {
      // fallback to icon if logo.png not found
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />
);

const StudentDashboard = ({ profile }: StudentDashboardProps) => {
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [activeView, setActiveView] = useState<StudentView>('home');
  const navigate = useNavigate();
  const { session } = useSession();

  const getSupabase = () =>
    createAuthenticatedSupabaseClient(
      async () => (await session?.getToken()) ?? null
    );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const supabase = getSupabase();

      // Fetch this student's attendance records
      const { data: attData, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .eq('clerk_user_id', profile.clerk_id)
        .order('session_date', { ascending: false });

      if (attError) throw attError;
      const records: AttendanceRecord[] = attData || [];
      setAttendance(records);

      // Fetch classes student has attended
      const classIds = [...new Set(records.map((r) => r.class_id))];
      if (classIds.length > 0) {
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('*')
          .in('id', classIds);
        if (classError) throw classError;
        setMyClasses(classData || []);
      }
    } catch (err: any) {
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode) return;
    setIsJoining(true);
    try {
      const supabase = getSupabase();
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('code', classCode.toUpperCase())
        .single();

      if (classError || !classData) throw new Error('Invalid class code — check with your instructor');

      // Check if already in this class
      if (myClasses.find((c) => c.id === classData.id)) {
        toast.info(`You're already in ${classData.name}`);
        setClassCode('');
        return;
      }

      toast.success(`Found ${classData.name}! Scan the QR code in class to mark your first attendance.`);
      setClassCode('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to find class');
    } finally {
      setIsJoining(false);
    }
  };

  // Per-class attendance stats
  const getClassStats = (classId: string) => {
    const records = attendance.filter((r) => r.class_id === classId);
    const present = records.filter((r) => r.status === 'present').length;
    const rate = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
    return { total: records.length, present, rate };
  };

  // ── VIEWS ────────────────────────────────────────────────────────

  const renderHome = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <section>
        <h1 className="text-2xl font-bold">Hello, {profile.full_name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground text-sm">Ready to mark your attendance?</p>
      </section>

      {/* Scan Card */}
      <Card className="bg-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <QrCode size={120} />
        </div>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Scan the QR code shared by your instructor.
          </CardDescription>
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
          <CardTitle className="text-lg">Join a Class</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinClass} className="flex gap-2">
            <Input
              placeholder="Enter class code (e.g. CS101)"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              className="uppercase"
            />
            <Button disabled={isJoining}>
              {isJoining ? 'Searching...' : 'Join'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Classes */}
      <section className="space-y-3">
        <h2 className="font-semibold text-lg">My Classes</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : myClasses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-dashed">
            No classes yet. Join one above or scan a QR code first!
          </div>
        ) : (
          myClasses.map((c) => {
            const stats = getClassStats(c.id);
            return (
              <div key={c.id} className="flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium leading-tight">{c.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.total} sessions · {stats.rate}% attendance
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            );
          })
        )}
      </section>
    </div>
  );

  const renderHistory = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Attendance History</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : attendance.length === 0 ? (
        <Card className="border-dashed py-12 text-center text-muted-foreground">
          No attendance records yet. Scan a QR code in class to get started.
        </Card>
      ) : (
        <div className="space-y-3">
          {attendance.map((record) => {
            const cls = myClasses.find((c) => c.id === record.class_id);
            const isPresent = record.status === 'present';
            return (
              <div key={record.id} className="flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isPresent ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {isPresent ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{cls?.name ?? 'Unknown Class'}</p>
                    <p className="text-xs text-muted-foreground">{record.session_date} · {record.method}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold capitalize px-2 py-1 rounded-full ${isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {record.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAlerts = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Alerts</h2>
      {/* Show low attendance warnings */}
      {myClasses.length === 0 ? (
        <Card className="border-dashed py-12 text-center text-muted-foreground">
          No alerts. Attend classes to see your attendance warnings here.
        </Card>
      ) : (
        <div className="space-y-3">
          {myClasses.map((c) => {
            const stats = getClassStats(c.id);
            const isLow = stats.rate < 75 && stats.total > 0;
            return (
              <Card key={c.id} className={isLow ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : ''}>
                <CardContent className="pt-4 flex items-start gap-3">
                  <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isLow ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                    {isLow ? <Bell size={16} /> : <CheckCircle2 size={16} />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className={`text-xs mt-0.5 ${isLow ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'}`}>
                      {isLow
                        ? `⚠️ Low attendance: ${stats.rate}% — you need at least 75% to qualify`
                        : `✅ Attendance: ${stats.rate}% — you're on track`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {myClasses.every((c) => getClassStats(c.id).rate >= 75) && (
            <p className="text-center text-sm text-muted-foreground py-4">
              All clear — no low attendance warnings.
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <p className="font-medium">{profile.full_name}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <p className="font-medium capitalize">{profile.role}</p>
          </div>
          {profile.matric_number && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Matriculation Number</Label>
              <p className="font-medium font-mono">{profile.matric_number}</p>
            </div>
          )}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              To update your profile details, contact your administrator.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm">Dark / Light Mode</p>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{myClasses.length}</p>
            <p className="text-xs text-muted-foreground">Classes</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{attendance.filter((a) => a.status === 'present').length}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {attendance.length > 0
                ? Math.round((attendance.filter((a) => a.status === 'present').length / attendance.length) * 100)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Avg. Rate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const navItems: { view: StudentView; icon: React.ReactNode; label: string }[] = [
    { view: 'home', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { view: 'history', icon: <History size={20} />, label: 'History' },
    { view: 'alerts', icon: <Bell size={20} />, label: 'Alerts' },
    { view: 'settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-bold">SmartAttendX</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 pb-24">
        {activeView === 'home' && renderHome()}
        {activeView === 'history' && renderHistory()}
        {activeView === 'alerts' && renderAlerts()}
        {activeView === 'settings' && renderSettings()}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-card flex justify-around p-2 z-10">
        {navItems.map(({ view, icon, label }) => (
          <Button
            key={view}
            variant="ghost"
            className={`flex flex-col items-center h-auto py-2 gap-1 flex-1 ${
              activeView === view ? 'text-primary' : 'text-muted-foreground'
            }`}
            onClick={() => setActiveView(view)}
          >
            {icon}
            <span className="text-[10px]">{label}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
};

export default StudentDashboard;
