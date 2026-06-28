import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Session, Class } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface QRGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  className: Class;
}

const QRGenerator = ({ isOpen, onClose, session, className }: QRGeneratorProps) => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const endTime = new Date(session.end_time).getTime();

  // QR payload includes expiry so students can also validate it client-side
  const qrPayload = JSON.stringify({
    sid: session.id,
    cid: session.class_id,
    exp: endTime,
    token: session.qr_code_token,
  });

  useEffect(() => {
    if (!isOpen) return;

    const tick = () => {
      const remaining = Math.floor((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        setExpired(true);
      } else {
        setSecondsLeft(remaining);
        setExpired(false);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOpen, endTime]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatEndTime = () => {
    const d = new Date(session.end_time);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSave = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const link = document.createElement('a');
      link.download = `${className.code}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('QR code saved');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShare = async () => {
    const text = `Attendance QR for ${className.name} (${className.code})\nValid until ${formatEndTime()}`;
    if (navigator.share) {
      await navigator.share({ title: `${className.code} Attendance`, text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Session info copied to clipboard');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Session QR Code</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {/* QR Code */}
          <div
            ref={qrRef}
            className={`bg-white p-6 rounded-2xl shadow-lg border-4 transition-all ${
              expired ? 'border-destructive/40 opacity-30 grayscale' : 'border-primary/20'
            }`}
          >
            <QRCodeSVG value={qrPayload} size={240} level="H" includeMargin={true} />
          </div>

          {/* Class info */}
          <div className="text-center space-y-1">
            <h3 className="font-bold text-lg uppercase tracking-wider">{className.code}</h3>
            <p className="text-muted-foreground">{className.name}</p>
          </div>

          {/* Countdown / Expired */}
          {expired ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-full text-sm font-semibold">
              <AlertTriangle size={14} /> Session Expired
            </div>
          ) : (
            <div className="text-center space-y-1">
              <div className={`text-3xl font-mono font-bold tabular-nums ${secondsLeft <= 60 ? 'text-destructive' : 'text-primary'}`}>
                {formatCountdown(secondsLeft)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock size={12} /> Valid until {formatEndTime()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="outline" className="w-full" onClick={handleSave} disabled={expired}>
              <Download className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button variant="outline" className="w-full" onClick={handleShare} disabled={expired}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-tighter font-bold">
          Students must scan this code and be within the geofence to verify attendance
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default QRGenerator;
