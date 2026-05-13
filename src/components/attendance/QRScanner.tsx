import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface QRScannerProps {
  onResult: (result: string) => void;
  isLoading?: boolean;
}

export function QRScanner({ onResult, isLoading }: QRScannerProps) {
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload'>('camera');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (scanMethod === 'camera' && !isScanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          onResult(decodedText);
          scanner.clear();
          setIsScanning(false);
        },
        (error) => {
          // console.warn(error);
        }
      );

      setIsScanning(true);

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }
  }, [scanMethod, onResult, isScanning]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("qr-reader-hidden");
    try {
      const result = await html5QrCode.scanFile(file, true);
      onResult(result);
    } catch (err) {
      toast.error("Could not find a valid QR code in the image");
    }
  };

  return (
    <Card className="p-6 flex flex-col items-center gap-4">
      <div className="flex gap-2 w-full">
        <Button 
          variant={scanMethod === 'camera' ? 'default' : 'outline'} 
          className="flex-1"
          onClick={() => setScanMethod('camera')}
        >
          <Camera className="w-4 h-4 mr-2" /> Camera
        </Button>
        <Button 
          variant={scanMethod === 'upload' ? 'default' : 'outline'} 
          className="flex-1"
          onClick={() => setScanMethod('upload')}
        >
          <Upload className="w-4 h-4 mr-2" /> Upload
        </Button>
      </div>

      <div className="relative w-full aspect-square max-w-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
        {scanMethod === 'camera' ? (
          <div id="qr-reader" className="w-full h-full" />
        ) : (
          <div className="text-center p-8">
            <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-sm text-slate-500 mb-4">Click to upload or drag & drop</p>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        )}
        
        {/* Hidden element for file scanning */}
        <div id="qr-reader-hidden" className="hidden" />
        
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
}