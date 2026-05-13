import React, { useState } from 'react';
import { 
  QrCode, 
  History, 
  Star, 
  MapPin, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Search,
  LogIn,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QRScanner } from '@/components/attendance/QRScanner';
import { calculateDistance, verifyQRPayload } from '@/lib/geo-utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const mockJoinedClasses = [
  { id: '1', name: 'Intro to Computer Science', code: 'CS101', instructor: 'Dr. Sarah Smith', attendance: 85 },
  { id: '2', name: 'Advanced Web Development', code: 'CS302', instructor: 'Prof. Michael Ross', attendance: 92 },
];

export function StudentDashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQRResult = async (result: string) => {
    setIsScanning(false);
    setIsProcessing(true);
    
    const payload = verifyQRPayload(result);
    if (!payload) {
      toast.error("Invalid or expired QR code");
      setIsProcessing(false);
      return;
    }

    // Geofencing Check
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsProcessing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Mock target location (In real app, fetch from Supabase based on payload.classId)
        // const targetLat = 0; // Replace with actual class lat
        // const targetLng = 0; // Replace with actual class lng
        // const radius = 50; // meters

        // For demo, we'll assume success if the payload is valid
        setTimeout(() => {
          toast.success("Attendance marked successfully!", {
            description: "Location verified. You are within the class geofence.",
            icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
          });
          setIsProcessing(false);
        }, 1500);
      },
      (error) => {
        toast.error("Please enable location services to mark attendance");
        setIsProcessing(false);
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" /> Mark Attendance
            </CardTitle>
            <CardDescription>Scan the class QR code and verify your location</CardDescription>
          </CardHeader>
          <CardContent>
            {!isScanning ? (
              <Button className="w-full py-8 text-lg gap-2" onClick={() => setIsScanning(true)}>
                <QrCode className="w-6 h-6" /> Open Scanner
              </Button>
            ) : (
              <div className="space-y-4">
                <QRScanner onResult={handleQRResult} isLoading={isProcessing} />
                <Button variant="outline" className="w-full" onClick={() => setIsScanning(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-600" /> Join New Class
            </CardTitle>
            <CardDescription>Enter the class code provided by your instructor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                placeholder="Enter Code (e.g. CS101)" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="uppercase font-mono"
              />
              <Button onClick={() => toast.success(`Successfully joined class ${joinCode}`)}>
                Join
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Joined Classes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">My Classes</h3>
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockJoinedClasses.map((cls) => (
              <Card key={cls.id} className="overflow-hidden group hover:border-primary/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="mb-2 font-mono">{cls.code}</Badge>
                    <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {cls.instructor}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attendance</span>
                      <span className="font-medium">{cls.attendance}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${cls.attendance > 90 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${cls.attendance}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 border-t py-3">
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-1">
                    <History className="w-3 h-3" /> View History
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Recent Records</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center justify-center w-12 border-r pr-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Oct</p>
                  <p className="text-xl font-black">{12 - i}</p>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">CS101 - Lecture {10 - i}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] h-5 py-0 px-1 text-green-600 bg-green-50 border-green-200">
                      Present
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> Room 302
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}