import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QRGeneratorProps {
  payload: string;
  className?: string;
  expiresInSeconds?: number;
}

export function QRGenerator({ payload, className, expiresInSeconds = 1800 }: QRGeneratorProps) {
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'attendance-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Card className={`p-8 flex flex-col items-center gap-6 ${className}`}>
      <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100">
        <QRCodeSVG 
          id="qr-code-svg"
          value={payload} 
          size={256} 
          level="H"
          includeMargin
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Timer className="w-4 h-4 text-orange-500" />
          <span>Valid for: {minutes}:{seconds.toString().padStart(2, '0')}</span>
        </div>
        
        <div className="flex gap-3 mt-2">
          <Button variant="outline" size="sm" onClick={downloadQR}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </div>
      </div>
    </Card>
  );
}