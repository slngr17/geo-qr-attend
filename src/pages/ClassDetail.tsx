import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createAuthenticatedSupabaseClient } from '../lib/supabaseClient';
import { useSession } from '@clerk/clerk-react';
import { Class, Geofence, Session } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MapPin, QrCode, Clock } from 'lucide-react';
import { toast } from 'sonner';
import QRGenerator from '../components/instructor/QRGenerator';
import GeofenceModal from '../components/instructor/GeofenceModal';

const DURATION_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: 'Custom', value: 0 },
];

const ClassDetail = () => {
  const { classId } = useParams<{ classId: string }>();
  const { session } = useSession();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Class | null>(null);
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [loading, setLoading] = useState(true);

  // Duration picker state
  const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [customMinutes, setCustomMinutes] = useState('');

  // QR Generator state
  const [isQROpen, setIsQROpen] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);

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

  const handleStartSession = () => {
    setSelectedDuration(30);
    setCustomMinutes('');
    setIsDurationPickerOpen(true);
  };

  const handleLaunchQR = () => {
    const minutes = selectedDuration === 0
      ? parseInt(customMinutes) || 30
      : selectedDuration;

    if (minutes < 1 || minutes > 480) {
      toast.error('Please enter a duration between 1 and 480 minutes');
      return;
    }

    const now = new Date();
    const end = new Date(now.getTime() + minutes * 60 * 1000);

    const newSession: Session = {
      id: crypto.randomUUID(),
      class_id: classId!,
      start_time: now.toISOString(),
      end_time: end.toISOString(),
      qr_code_token: crypto.randomUUID(),
      created_at: now.toISOString(),
    };

    setActiveSession(newSession);
    setIsDurationPickerOpen(false);
    setIsQROpen(true);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!course) return <div className="p-8 text-center text-destructive">Class not found</div>;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
            <Button variant="outline" size="sm" onClick={() => setIsGeofenceModalOpen(true)}>
              <MapPin className="mr-2 h-4 w-4" />
              {geofence ? 'Update Geofence' : 'Set Geofence'}
            </Button>
            <Button size="sm" onClick={handleStartSession}>
              <QrCode className="mr-2 h-4 w-4" /> Start Session
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Class Info */}
        <Card>
          <CardHeader><CardTitle>Class Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Code</span>
              <span className="font-mono font-semibold uppercase">{course.code}</span>
            </div>
            {course.description && (
              <p className="text-muted-foreground">{course.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Geofence */}
        <Card className={!geofence ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Geofence
            </CardTitle>
          </CardHeader>
          <CardContent>
            {geofence ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{geofence.name}</p>
                <p className="text-muted-foreground">Radius: {geofence.radius}m</p>
                <p className="text-muted-foreground">📍 {geofence.latitude.toFixed(5)}, {geofence.longitude.toFixed(5)}</p>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setIsGeofenceModalOpen(true)}>
                  Update Location
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  No geofence set — students can check in from anywhere!
                </p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setIsGeofenceModalOpen(true)}>
                  Set Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions placeholder */}
        <Card className="border-dashed py-12 text-center text-muted-foreground text-sm">
          Click "Start Session" to generate a timed QR code for attendance.
        </Card>
      </main>

      {/* Duration Picker Dialog */}
      <Dialog open={isDurationPickerOpen} onOpenChange={setIsDurationPickerOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Set Session Duration
            </DialogTitle>
            <DialogDescription>
              The QR code will expire after this time. Students must scan before it expires.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {DURATION_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSelectedDuration(value)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                  selectedDuration === value
                    ? 'border-primary bg-primary/5 font-semibold text-primary'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}

            {selectedDuration === 0 && (
              <div className="space-y-1">
                <Label htmlFor="customMinutes">Duration in minutes</Label>
                <Input
                  id="customMinutes"
                  type="number"
                  min={1}
                  max={480}
                  placeholder="e.g. 90"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDurationPickerOpen(false)}>Cancel</Button>
            <Button onClick={handleLaunchQR}>
              <QrCode className="mr-2 h-4 w-4" /> Generate QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Generator */}
      {activeSession && (
        <QRGenerator
          isOpen={isQROpen}
          onClose={() => { setIsQROpen(false); setActiveSession(null); }}
          session={activeSession}
          className={course}
        />
      )}

      {/* Geofence Modal */}
      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        classId={classId!}
        existing={geofence}
        onSaved={(saved) => setGeofence(saved)}
      />
    </div>
  );
};

export default ClassDetail;
