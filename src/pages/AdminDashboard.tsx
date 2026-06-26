import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList,
  LogOut, Loader2, Pencil, Trash2, Save, X, Plus,
  ShieldCheck, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';

type AdminView = 'overview' | 'users' | 'classes' | 'attendance';

interface Profile {
  id: string;
  clerk_id: string;
  full_name: string;
  role: string;
  matric_number?: string;
  school_email?: string;
  created_at: string;
}

interface ClassRow {
  id: string;
  name: string;
  code: string;
  description?: string;
  clerk_user_id: string;
  created_at: string;
}

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
  totalUsers: number;
  totalInstructors: number;
  totalStudents: number;
  totalClasses: number;
  totalAttendance: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0, totalInstructors: 0, totalStudents: 0,
    totalClasses: 0, totalAttendance: 0,
  });

  // Edit state for users
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});

  // New profile form
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ clerk_id: '', full_name: '', role: 'student', matric_number: '', school_email: '' });

  // Search/filter
  const [userSearch, setUserSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');

  useEffect(() => {
    // Guard: bounce if not unlocked
    if (sessionStorage.getItem('admin_unlocked') !== 'true') {
      navigate('/admin');
    } else {
      fetchAll();
    }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profilesRes, classesRes, attendanceRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('classes').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('attendance').select('*').order('created_at', { ascending: false }),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (classesRes.error) throw classesRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      const p = profilesRes.data || [];
      const c = classesRes.data || [];
      const a = attendanceRes.data || [];

      setProfiles(p);
      setClasses(c);
      setAttendance(a);
      setMetrics({
        totalUsers: p.length,
        totalInstructors: p.filter((x: Profile) => x.role === 'instructor').length,
        totalStudents: p.filter((x: Profile) => x.role === 'student').length,
        totalClasses: c.length,
        totalAttendance: a.length,
      });
    } catch (err: any) {
      toast.error('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_unlocked');
    navigate('/admin');
  };

  // ── USER OPERATIONS ──────────────────────────────────────────────
  const startEdit = (profile: Profile) => {
    setEditingUserId(profile.id);
    setEditForm({ ...profile });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          role: editForm.role,
          matric_number: editForm.matric_number,
          school_email: editForm.school_email,
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Profile updated');
      setEditingUserId(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete profile for "${name}"? This forces them to re-onboard on next login.`)) return;
    try {
      const { error } = await supabaseAdmin.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast.success(`Profile for "${name}" deleted`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const createProfile = async () => {
    if (!newUser.clerk_id || !newUser.full_name) {
      toast.error('Clerk ID and full name are required');
      return;
    }
    try {
      const { error } = await supabaseAdmin.from('profiles').insert({
        clerk_id: newUser.clerk_id,
        full_name: newUser.full_name,
        role: newUser.role,
        matric_number: newUser.matric_number || null,
        school_email: newUser.school_email || null,
      });
      if (error) throw error;
      toast.success('Profile created');
      setShowNewUserForm(false);
      setNewUser({ clerk_id: '', full_name: '', role: 'student', matric_number: '', school_email: '' });
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ── CLASS OPERATIONS ─────────────────────────────────────────────
  const deleteClass = async (id: string, name: string) => {
    if (!confirm(`Delete class "${name}"? All associated attendance data will also be deleted.`)) return;
    try {
      const { error } = await supabaseAdmin.from('classes').delete().eq('id', id);
      if (error) throw error;
      toast.success(`Class "${name}" deleted`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ── ATTENDANCE OPERATIONS ────────────────────────────────────────
  const deleteAttendance = async (id: string) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      const { error } = await supabaseAdmin.from('attendance').delete().eq('id', id);
      if (error) throw error;
      toast.success('Record deleted');
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ── FILTERED LISTS ───────────────────────────────────────────────
  const filteredProfiles = profiles.filter((p) =>
    p.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.clerk_id?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.role?.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.matric_number?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredClasses = classes.filter((c) =>
    c.name?.toLowerCase().includes(classSearch.toLowerCase()) ||
    c.code?.toLowerCase().includes(classSearch.toLowerCase())
  );

  const getClassName = (classId: string) =>
    classes.find((c) => c.id === classId)?.name ?? classId.slice(0, 8) + '...';

  // ── NAV ──────────────────────────────────────────────────────────
  const navItems: { label: string; view: AdminView; icon: React.ReactNode }[] = [
    { label: 'Overview', view: 'overview', icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { label: 'Users', view: 'users', icon: <Users className="mr-3 h-5 w-5" /> },
    { label: 'Classes', view: 'classes', icon: <BookOpen className="mr-3 h-5 w-5" /> },
    { label: 'Attendance', view: 'attendance', icon: <ClipboardList className="mr-3 h-5 w-5" /> },
  ];

  // ── VIEWS ────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: metrics.totalUsers, color: 'bg-primary text-primary-foreground' },
          { label: 'Instructors', value: metrics.totalInstructors, color: '' },
          { label: 'Students', value: metrics.totalStudents, color: '' },
          { label: 'Classes', value: metrics.totalClasses, color: '' },
          { label: 'Attendance Records', value: metrics.totalAttendance, color: '' },
        ].map(({ label, value, color }) => (
          <Card key={label} className={color}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium opacity-80">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {profiles.slice(0, 5).map((p) => (
              <div key={p.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{p.full_name}</span>
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-muted capitalize">{p.role}</span>
                </div>
                <span className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {classes.slice(0, 5).map((c) => (
              <div key={c.id} className="py-2 flex items-center justify-between text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded uppercase">{c.code}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search by name, role, matric..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button size="sm" onClick={() => setShowNewUserForm(!showNewUserForm)}>
          <Plus className="mr-2 h-4 w-4" /> Create Profile
        </Button>
      </div>

      {showNewUserForm && (
        <Card className="border-primary/50">
          <CardHeader><CardTitle className="text-base">Create Profile Manually</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Clerk User ID (from Clerk dashboard)</label>
              <Input placeholder="user_xxxxxxxxxx" value={newUser.clerk_id} onChange={(e) => setNewUser({ ...newUser, clerk_id: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
              <Input placeholder="Full Name" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <select className="w-full border rounded px-3 py-2 text-sm bg-background" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Matric Number (students)</label>
              <Input placeholder="e.g. U19/CSC/1234" value={newUser.matric_number} onChange={(e) => setNewUser({ ...newUser, matric_number: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">School Email (instructors)</label>
              <Input placeholder="e.g. lecturer@school.edu" value={newUser.school_email} onChange={(e) => setNewUser({ ...newUser, school_email: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button onClick={createProfile}>Create</Button>
              <Button variant="outline" onClick={() => setShowNewUserForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filteredProfiles.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-4">
              {editingUserId === p.id ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                    <Input value={editForm.full_name || ''} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                    <select className="w-full border rounded px-3 py-2 text-sm bg-background" value={editForm.role || 'student'} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Matric Number</label>
                    <Input value={editForm.matric_number || ''} onChange={(e) => setEditForm({ ...editForm, matric_number: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">School Email</label>
                    <Input value={editForm.school_email || ''} onChange={(e) => setEditForm({ ...editForm, school_email: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(p.id)}><Save className="mr-1 h-3 w-3" /> Save</Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}><X className="mr-1 h-3 w-3" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.full_name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted capitalize">{p.role}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{p.clerk_id}</p>
                    {p.matric_number && <p className="text-xs text-muted-foreground">Matric: {p.matric_number}</p>}
                    {p.school_email && <p className="text-xs text-muted-foreground">Email: {p.school_email}</p>}
                    <p className="text-xs text-muted-foreground">Joined: {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteUser(p.id, p.full_name)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filteredProfiles.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No users found.</p>
        )}
      </div>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or code..."
        value={classSearch}
        onChange={(e) => setClassSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="space-y-2">
        {filteredClasses.map((c) => {
          const instructor = profiles.find((p) => p.clerk_id === c.clerk_user_id);
          const recordCount = attendance.filter((a) => a.class_id === c.id).length;
          return (
            <Card key={c.id}>
              <CardContent className="pt-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded uppercase">{c.code}</span>
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  <p className="text-xs text-muted-foreground">Instructor: {instructor?.full_name ?? c.clerk_user_id}</p>
                  <p className="text-xs text-muted-foreground">{recordCount} attendance record{recordCount !== 1 ? 's' : ''}</p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => deleteClass(c.id, c.name)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {filteredClasses.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No classes found.</p>
        )}
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-2">
      {attendance.map((a) => {
        const student = profiles.find((p) => p.clerk_id === a.clerk_user_id);
        return (
          <Card key={a.id}>
            <CardContent className="pt-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{student?.full_name ?? a.clerk_user_id}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${a.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Class: {getClassName(a.class_id)}</p>
                <p className="text-xs text-muted-foreground">Date: {a.session_date} · Method: {a.method}</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => deleteAttendance(a.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
      {attendance.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No attendance records yet.</p>
      )}
    </div>
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <ShieldCheck size={18} />
          </div>
          <span className="font-bold text-xl">Admin</span>
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
        <div className="p-4 border-t space-y-2">
          <Button variant="outline" size="sm" className="w-full" onClick={fetchAll}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="destructive" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Lock Admin
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold capitalize">{activeView}</h1>
              <p className="text-muted-foreground text-sm">AttendX System Administration</p>
            </div>
            <ThemeToggle />
          </header>

          {activeView === 'overview' && renderOverview()}
          {activeView === 'users' && renderUsers()}
          {activeView === 'classes' && renderClasses()}
          {activeView === 'attendance' && renderAttendance()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
