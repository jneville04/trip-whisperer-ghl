import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface TrialExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: () => void;
}

export default function TrialExpiredModal({ open, onOpenChange, onUpgrade }: TrialExpiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="font-display text-xl">Your trial has ended</DialogTitle>
          <DialogDescription className="font-body text-muted-foreground">
            Upgrade to continue creating and sending new trips to your clients.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onUpgrade}>
            Upgrade to Pro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
