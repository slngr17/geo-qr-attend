import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  instructorId: string;
}

const CreateClassModal = ({ isOpen, onClose, onCreated, instructorId }: CreateClassModalProps) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('classes')
        .insert({
          name,
          code: code.toUpperCase(),
          description,
          instructor_id: instructorId
        });

      if (error) throw error;
      
      toast.success('Class created successfully');
      onCreated();
      onClose();
      // Reset form
      setName('');
      setCode('');
      setDescription('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Add a new course or group to track attendance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="className">Class Name</Label>
            <Input 
              id="className" 
              placeholder="e.g. Computer Science 101" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="classCode">Class Code</Label>
            <Input 
              id="classCode" 
              placeholder="e.g. CS101" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description" 
              placeholder="Course details and schedule..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassModal;