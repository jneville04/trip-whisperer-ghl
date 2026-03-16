import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DuplicateTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripName: string;
  clientName: string;
  onConfirm: (tripName: string, clientName: string) => void;
}

export default function DuplicateTripModal({ open, onOpenChange, tripName, clientName, onConfirm }: DuplicateTripModalProps) {
  const [name, setName] = useState(tripName);
  const [client, setClient] = useState(clientName);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setName(tripName);
      setClient(clientName);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate Trip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="dup-name">Trip Name</Label>
            <Input id="dup-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dup-client">Client / Traveler Name</Label>
            <Input id="dup-client" value={client} onChange={(e) => setClient(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onConfirm(name, client); onOpenChange(false); }}>Create Copy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
