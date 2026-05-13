import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Class, Session, Geofence, AttendanceRecord } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  QrCode, 
  History, 
  Plus, 
  Clock,
  MoreVertical,
  Calendar as CalendarIcon,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import QRGenerator from '../components/instructor/QRGenerator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ClassDetail = () => {
  const { classId } = useParams<{ classId: string }>();
  const [course, setCourse] = useState<Class | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  const fetchData = async () => {
    try {
      const [classRes, sessionsRes, geofenceRes] = await Promise.all([
        supabase.from('classes').select('*').eq('id', classId).single(),
        supabase.from('sessions').select('*').eq('class_id', classId).order('start_time', { ascending: false }),
        supabase.from('geofences').select('*').eq('class_id', classId).single()
      ]);

      if (classRes.error) throw classRes.error;
      setCourse(classRes.data);
      setSessions(sessionsRes.data || []);
      setGeofence(geofenceRes.data);
    } catch (err: any) {
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!classId) return;
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          class_id: classId,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour session
          qr_code_token: Math.random().toString(36).substring(7)
        })
        .select()
        .single();

      if (error) throw error;
      
      setSessions([data, ...sessions]);
      toast.success('Session started! Share the QR code.');
      setIsQRModalOpen(true);
    } catch (err: any) {
      toast.error('Failed to start session');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!course) return <div className="p-8 text-center text-destructive">Class not found</div>;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{course.name}</h1>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{course.code}</p>
            </div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="hidden sm:flex">
               <MapPin className="mr-2 h-4 w-4" /> Manage Geofence
             </Button>
             <Button size="sm" onClick={startSession}>
               <QrCode className="mr-2 h-4 w-4" /> Start Session
             </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Stats & Geofence */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Class Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><Users size={16} /> Students</span>
                  <span className="font-semibold">32 Enrolled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2"><History size={16} /> Avg. Presence</span>
                  <span className="font-semibold text-green-600">91.4%</span>
                </div>
              </CardContent>
            </Card>

            <Card className={!geofence ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : ""}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Geofence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {geofence ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{geofence.name}</p>
                    <p className="text-xs text-muted-foreground">Radius: {geofence.radius}m</p>
                    <div className="mt-4 h-32 rounded bg-muted flex items-center justify-center border text-xs text-muted-foreground italic">
                      [Interactive Map Placeholder]
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">No geofence set. Students can scan from anywhere!</p>
                    <Button variant="outline" size="sm" className="w-full">Set Location</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Sessions */}
          <div className="md:col-span-2 space-y-6">
             <div className="flex items-center justify-between">
               <h2 className="text-2xl font-bold flex items-center gap-2">
                 <CalendarIcon className="h-6 w-6" /> Recent Sessions
               </h2>
               <Button variant="ghost" size="sm">View All</Button>
             </div>

             {sessions.length === 0 ? (
               <Card className="border-dashed py-12 text-center text-muted-foreground">
                 No sessions yet. Click "Start Session" to begin.
               </Card>
             ) : (
               <div className="space-y-4">
                 {sessions.map((session) => (
                   <Card key={session.id} className="overflow-hidden">
                     <div className="flex items-center p-4">
                       <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mr-4">
                         <Clock className="text-muted-foreground" />
                       </div>
                       <div className="flex-1">
                         <h4 className="font-bold">{new Date(session.start_time).toLocaleDateString()}</h4>
                         <p className="text-xs text-muted-foreground">
                           {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                           {new Date(session.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </p>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="text-right hidden sm:block">
                           <p className="font-bold text-sm">28 / 32</p>
                           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Present</p>
                         </div>
                         <Button variant="outline" size="icon" onClick={() => {
                           setIsQRModalOpen(true);
                           // In real app, set current session for generator
                         }}>
                           <QrCode size={16} />
                         </Button>
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon"><MoreVertical size={16} /></Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem>View Report</DropdownMenuItem>
                             <DropdownMenuItem>Mark Attendance Manually</DropdownMenuItem>
                             <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                     </div>
                   </Card>
                 ))}
               </div>
             )}
          </div>
        </div>
      </main>

      {/* QR Code Overlay (Simulation) */}
      {isQRModalOpen && sessions[0] && (
        <QRGenerator 
          isOpen={isQRModalOpen} 
          onClose={() => setIsQRModalOpen(false)} 
          session={sessions[0]} 
          className={course}
        />
      )}
    </div>
  );
};

export default ClassDetail;