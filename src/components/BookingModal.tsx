import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  url: string;
  agencyName?: string;
}

export default function BookingModal({ open, onClose, url, agencyName }: Props) {
  const [loading, setLoading] = useState(true);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Book with {agencyName || "your travel advisor"}</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full h-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground font-body">Loading booking form...</span>
            </div>
          )}
          <iframe
            src={url}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            allow="payment"
            title="Booking Form"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
