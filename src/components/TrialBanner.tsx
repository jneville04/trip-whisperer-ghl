import { type TrialState } from "@/hooks/useTrialStatus";
import { X } from "lucide-react";
import { useState } from "react";

interface TrialBannerProps {
  state: TrialState;
  daysRemaining: number;
  onUpgrade: () => void;
}

export default function TrialBanner({ state, daysRemaining, onUpgrade }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (state === "active_subscription" || state === "trial_no_banner") return null;

  if (state === "trial_expired") {
    return null; // Expired state is handled by the persistent notice, not a banner
  }

  const isLastDay = state === "trial_last_day";

  return (
    <div className={`w-full px-4 py-2.5 text-sm flex items-center justify-center gap-3 ${
      isLastDay
        ? "bg-destructive/10 text-destructive border-b border-destructive/20"
        : "bg-primary/5 text-foreground border-b border-primary/10"
    }`}>
      <span className="font-body">
        {isLastDay
          ? "Your trial ends today. Upgrade to keep access."
          : `Your free trial ends in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} — upgrade anytime.`
        }
      </span>
      <button
        onClick={onUpgrade}
        className="font-display font-semibold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
      >
        Upgrade now
      </button>
      {!isLastDay && (
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
