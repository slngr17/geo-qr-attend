import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createAuthenticatedSupabaseClient } from '../lib/supabaseClient';
import { useSession } from '@clerk/clerk-react';
import { Class, Geofence } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import GeofenceModal from '../components/instructor/GeofenceModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ClassDetail = () => {
  const { classId } = useParams<{ classId: string }>();
  const { session } = useSession();
  const [course, setCourse] = useState<Class | null>(null);
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const navigate = useNavigate();

  const getSupabase = () =>
    createAuthenticatedSupabaseClient(
      async () => (await session?.getToken()) ?? null
    );

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  const fetchData = async () => {
    try {
      const supabase = getSupabase();
      const [classRes, geofenceRes] = await Promise.all([
        supabase.from('classes').select('*').eq('id', classId).single(),
        supabase.from('geofences').select('*').eq('class_id', classId).maybeSingle(),
      ]);

      if (classRes.error) throw classRes.error;
      setCourse(classRes.data);
      setGeofence(geofenceRes.data ?? null);
    } catch (err: any) {
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
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
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setIsGeofenceModalOpen(true)}
            >
              <MapPin className="mr-2 h-4 w-4" />
              {geofence ? 'Update Geofence' : 'Set Geofence'}
            </Button>
            <Button size="sm" onClick={() => setIsQRModalOpen(true)}>
              <QrCode className="mr-2 h-4 w-4" /> Start Session
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Info & Geofence */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Class Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users size={16} /> Code
                  </span>
                  <span className="font-mono font-semibold uppercase">{course.code}</span>
                </div>
                {course.description && (
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                )}
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
                    <p className="text-xs text-muted-foreground">
                      📍 {geofence.latitude.toFixed(5)}, {geofence.longitude.toFixed(5)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setIsGeofenceModalOpen(true)}
                    >
                      Update Location
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      No geofence set. Students can check in from anywhere!
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setIsGeofenceModalOpen(true)}
                    >
                      Set Location
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Sessions placeholder */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" /> Sessions
              </h2>
            </div>
            <Card className="border-dashed py-12 text-center text-muted-foreground">
              Click "Start Session" to generate a QR code for attendance.
            </Card>
          </div>
        </div>
      </main>

      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        classId={classId!}
        existing={geofence}
        onSaved={(saved) => setGeofence(saved)}
      />

      {isQRModalOpen && (
        <QRGenerator
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          session={{ id: 'preview', class_id: classId!, start_time: new Date().toISOString(), end_time: '', qr_code_token: 'preview', created_at: '' }}
          className={course}
        />
      )}
    </div>
  );
};

export default ClassDetail;
