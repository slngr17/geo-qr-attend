import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Session, Class } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Clock } from 'lucide-react';

interface QRGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  className: Class;
}

const QRGenerator = ({ isOpen, onClose, session, className }: QRGeneratorProps) => {
  // Generate a payload that includes session info and a simple signature (mock)
  const qrPayload = JSON.stringify({
    sid: session.id,
    cid: className.id,
    ts: Date.now(),
    sig: 'valid_signature_placeholder'
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Session QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-primary/20">
            <QRCodeSVG value={qrPayload} size={240} level="H" includeMargin={true} />
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="font-bold text-lg uppercase tracking-wider">{className.code}</h3>
            <p className="text-muted-foreground">{className.name}</p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-xs font-medium">
            <Clock size={14} />
            Valid until {new Date(session.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" /> Save
            </Button>
            <Button variant="outline" className="w-full">
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