import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "@/hooks/useAppSettings";

interface Props {
  status: "pending" | "rejected";
}

export default function PendingApproval({ status }: Props) {
  const navigate = useNavigate();
  const { settings } = useAppSettings();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        {status === "pending" ? (
          <>
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">
              Account Pending Approval
            </h1>
            <p className="text-muted-foreground font-body mb-8">
              Your account is awaiting approval from the {settings.app_name} administrator.
              You'll be able to access the platform once approved.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">
              Access Denied
            </h1>
            <p className="text-muted-foreground font-body mb-8">
              Your account access has been revoked. Please contact the administrator for assistance.
            </p>
          </>
        )}
        <Button variant="travel-ghost" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
