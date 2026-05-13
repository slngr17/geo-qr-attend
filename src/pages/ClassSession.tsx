import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Users, 
  QrCode, 
  MapPin, 
  Settings,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QRGenerator } from '@/components/attendance/QRGenerator';
import { signQRPayload } from '@/lib/geo-utils';
import { toast } from 'sonner';

export function ClassSession() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [sessionActive, setSessionActive] = useState(false);
  const [qrPayload, setQrPayload] = useState('');
  
  const classInfo = {
    name: "Intro to Computer Science",
    code: "CS101",
    students: 45
  };

  const startSession = () => {
    const sessionId = Math.random().toString(36).substring(7);
    const payload = signQRPayload(sessionId, classId || '1');
    setQrPayload(payload);
    setSessionActive(true);
    toast.success("Attendance session started!");
  };

  const endSession = () => {
    setSessionActive(false);
    toast.info("Attendance session ended.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" /> Class Settings
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge className="mb-2">{classInfo.code}</Badge>
                  <CardTitle className="text-2xl font-bold">{classInfo.name}</CardTitle>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${sessionActive ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                  {sessionActive ? '● LIVE SESSION' : 'OFFLINE'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Enrolled Students
                  </p>
                  <p className="text-xl font-bold">{classInfo.students}</p>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Geofence
                  </p>
                  <p className="text-xl font-bold">Active (50m)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Control</CardTitle>
              <CardDescription>Start a new attendance window for your students</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              {!sessionActive ? (
                <Button className="w-full py-6 text-lg" onClick={startSession}>
                  <QrCode className="w-5 h-5 mr-2" /> Generate Session QR
                </Button>
              ) : (
                <Button variant="destructive" className="w-full py-6 text-lg" onClick={endSession}>
                  End Attendance Session
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-[320px]">
          {sessionActive ? (
            <QRGenerator payload={qrPayload} />
          ) : (
            <Card className="h-full border-dashed flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-slate-950/30">
              <QrCode className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">No active session. Click Start to generate a QR code for students to scan.</p>
            </Card>
          )}
        </div>
      </div>

      {sessionActive && (
        <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-green-800 dark:text-green-400">Geofencing Active</p>
                <p className="text-sm text-green-700 dark:text-green-500">Students must be within 50 meters of the Main Lecture Hall to mark attendance. Current accuracy: High.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}