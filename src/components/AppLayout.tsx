import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Settings } from "lucide-react";
import CreateTripMenu from "@/components/CreateTripMenu";
import PendingApproval from "@/components/PendingApproval";
import TrialBanner from "@/components/TrialBanner";
import TrialExpiredModal from "@/components/TrialExpiredModal";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading: authLoading, profileStatus } = useAuth();
  const { data: isAdmin } = useAdminCheck(user?.id);
  const { settings } = useAppSettings();
  const { data: trialStatus } = useTrialStatus(user?.id);
  const navigate = useNavigate();
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleUpgrade = () => {
    setTrialModalOpen(false);
    navigate("/settings");
  };

  if (!authLoading && profileStatus && profileStatus !== "approved" && !isAdmin) {
    return <PendingApproval status={profileStatus as "pending" | "rejected"} />;
  }

  const trialState = trialStatus?.state ?? "trial_no_banner";
  const isExpired = trialState === "trial_expired";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Trial banner */}
          {trialStatus && (
            <TrialBanner
              state={trialState}
              daysRemaining={trialStatus.daysRemaining}
              onUpgrade={handleUpgrade}
            />
          )}
          {/* Top bar */}
          <div className="border-b border-border bg-background">
            <div className="h-16 flex items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h1 className="font-display text-xl font-semibold text-foreground">{settings.app_name}</h1>
              </div>
              <div className="flex items-center gap-2">
                {isExpired && (
                  <span className="text-xs font-body text-muted-foreground mr-2">
                    Trial expired · <button onClick={handleUpgrade} className="text-primary underline underline-offset-2 hover:text-primary/80">Upgrade</button>
                  </span>
                )}
                {isAdmin && (
                  <Button variant="travel-ghost" size="sm" onClick={() => navigate("/admin")}>
                    <Shield className="h-4 w-4 mr-1" /> Admin
                  </Button>
                )}
                <CreateTripMenu
                  trialExpired={isExpired}
                  onTrialBlock={() => setTrialModalOpen(true)}
                />
                <Button variant="travel-ghost" size="sm" onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-1" /> Settings
                </Button>
                <Button variant="travel-ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1" /> Sign Out
                </Button>
              </div>
            </div>
          </div>
          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      <TrialExpiredModal
        open={trialModalOpen}
        onOpenChange={setTrialModalOpen}
        onUpgrade={handleUpgrade}
      />
    </SidebarProvider>
  );
}
