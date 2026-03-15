import { ArrowLeft, Shield } from "lucide-react";

interface ClientNavProps {
  logoUrl?: string;
  agencyName?: string;
  showAgencyNameWithLogo?: boolean;
  onBack?: () => void;
  backLabel?: string;
}

export default function ClientNav({
  logoUrl,
  agencyName,
  showAgencyNameWithLogo = true,
  onBack,
  backLabel = "Back to Proposal",
}: ClientNavProps) {
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${agencyName || "Agency"} logo`}
              className="h-8 max-w-[120px] object-contain shrink-0"
            />
          )}
          {(!logoUrl || showAgencyNameWithLogo) && (
            <span className="font-display text-lg font-bold text-foreground truncate">
              {agencyName || "Travel Co."}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-body">
            <Shield className="h-3.5 w-3.5" /> Secure Booking
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              <ArrowLeft className="h-4 w-4" /> {backLabel}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
