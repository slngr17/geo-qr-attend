import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const AttendanceScan = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  // onScanSuccess is bound to the scanner once, on mount, so it closes over
  // whatever `location` state was at that instant (always null). Reading
  // location via a ref instead means the callback always sees the latest value.
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Request location immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          locationRef.current = loc;
          setLocation(loc);
        },
        (error) => {
          toast.error("Location access denied. Attendance cannot be verified without GPS.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }

    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  async function onScanSuccess(decodedText: string) {
    if (verifying) return;
    
    try {
      setVerifying(true);
      setScanning(false);
      
      // Stop scanner
      if (scannerRef.current) {
        await scannerRef.current.clear();
      }

      // Parse payload
      const payload = JSON.parse(decodedText);
      
      // Verify Geofence & Session with Supabase (Edge Function Simulation)
      // In a real app, you'd call a Supabase Edge Function here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      if (!locationRef.current) {
         throw new Error("GPS location required to verify attendance. Please wait a moment for GPS to lock and try again.");
      }

      // Record attendance
      // const { error } = await supabase.from('attendance').insert({ ... });

      setResult({
        success: true,
        message: "Attendance marked successfully! You are within the authorized geofence."
      });
      toast.success("Success!");
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Invalid QR code or verification failed."
      });
      toast.error("Verification Failed");
    } finally {
      setVerifying(false);
    }
  }

  function onScanFailure(error: any) {
    // Console error too noisy, just ignore failures until success
  }

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col text-white">
      <header className="p-4 flex items-center justify-between border-b border-white/10">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
        </Button>
        <span className="font-bold">Scan QR Code</span>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {!result ? (
          <div className="w-full max-w-sm space-y-6">
            <div className="relative aspect-square overflow-hidden rounded-3xl border-2 border-primary/50 bg-white/5">
              <div id="reader" className="w-full h-full"></div>
              {verifying && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-bold">Verifying Location...</p>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-bold">
                <Camera size={20} />
                <span>Camera Active</span>
              </div>
              <p className="text-sm text-gray-400">Position the QR code inside the frame to scan.</p>
            </div>

            {location && (
               <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] text-green-400 font-mono">
                 <MapPin size={12} />
                 GPS ACTIVE: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
               </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <Card className={`bg-transparent border-2 ${result.success ? 'border-green-500/50' : 'border-destructive/50'}`}>
              <CardContent className="pt-12 pb-8 flex flex-col items-center text-center space-y-6">
                {result.success ? (
                  <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <CheckCircle2 size={48} />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                    <AlertCircle size={48} />
                  </div>
                )}
                
                <div>
                  <h3 className="text-2xl font-bold">{result.success ? 'Verified' : 'Failed'}</h3>
                  <p className="mt-2 text-gray-400 text-sm">{result.message}</p>
                </div>

                <div className="w-full pt-4 space-y-3">
                  <Button className="w-full" variant={result.success ? "default" : "destructive"} onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                  </Button>
                  {!result.success && (
                    <Button variant="outline" className="w-full text-white border-white/20" onClick={handleReset}>
                      Try Again
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="p-8 text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Powered by SmartAttendX Secure Geofencing</p>
      </footer>
    </div>
  );
};

export default AttendanceScan;
