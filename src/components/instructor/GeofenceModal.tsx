import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, LocateFixed } from 'lucide-react';
import { createAuthenticatedSupabaseClient } from '../../lib/supabaseClient';
import { useSession } from '@clerk/clerk-react';
import { Geofence } from '../../types';
import { toast } from 'sonner';

interface GeofenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  existing: Geofence | null;
  onSaved: (geofence: Geofence) => void;
}

const GeofenceModal = ({ isOpen, onClose, classId, existing, onSaved }: GeofenceModalProps) => {
  const { session } = useSession();
  const [name, setName] = useState(existing?.name || '');
  const [radius, setRadius] = useState<number>(existing?.radius || 100);
  const [latitude, setLatitude] = useState<number | null>(existing?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(existing?.longitude || null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
        toast.success('Location captured successfully');
      },
      (err) => {
        setLocating(false);
        toast.error('Could not get location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!name) { toast.error('Please enter a geofence name'); return; }
    if (latitude === null || longitude === null) { toast.error('Please capture your location first'); return; }

    setSaving(true);
    try {
      const supabase = createAuthenticatedSupabaseClient(
        async () => (await session?.getToken()) ?? null
      );

      let data: Geofence;

      if (existing) {
        const { data: updated, error } = await supabase
          .from('geofences')
          .update({ name, latitude, longitude, radius })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        data = updated;
      } else {
        const { data: inserted, error } = await supabase
          .from('geofences')
          .insert({ class_id: classId, name, latitude, longitude, radius })
          .select()
          .single();
        if (error) throw error;
        data = inserted;
      }

      toast.success(existing ? 'Geofence updated!' : 'Geofence saved!');
      onSaved(data);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save geofence');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {existing ? 'Update Geofence' : 'Set Geofence'}
          </DialogTitle>
          <DialogDescription>
            Capture your current location as the attendance check-in boundary.
            Students must be within the radius to mark attendance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="geofenceName">Location Name</Label>
            <Input
              id="geofenceName"
              placeholder="e.g. Lecture Hall A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Your Current Location</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={getLocation}
              disabled={locating}
            >
              {locating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Locating...</>
              ) : (
                <><LocateFixed className="mr-2 h-4 w-4" /> {latitude ? 'Re-capture Location' : 'Capture My Location'}</>
              )}
            </Button>
            {latitude !== null && longitude !== null && (
              <p className="text-xs text-muted-foreground text-center">
                📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="radius">Radius (metres)</Label>
            <Input
              id="radius"
              type="number"
              min={10}
              max={1000}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Students must be within {radius}m of your location to check in.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || locating}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Geofence'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GeofenceModal;
