import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Settings } from "lucide-react";
import CreateTripMenu from "@/components/CreateTripMenu";
import PendingApproval from "@/components/PendingApproval";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading: authLoading, profileStatus } = useAuth();
  const { data: isAdmin } = useAdminCheck(user?.id);
  const { settings } = useAppSettings();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!authLoading && profileStatus && profileStatus !== "approved" && !isAdmin) {
    return <PendingApproval status={profileStatus as "pending" | "rejected"} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="border-b border-border bg-background">
            <div className="h-16 flex items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h1 className="font-display text-xl font-semibold text-foreground">{settings.app_name}</h1>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button variant="travel-ghost" size="sm" onClick={() => navigate("/admin")}>
                    <Shield className="h-4 w-4 mr-1" /> Admin
                  </Button>
                )}
                <CreateTripMenu />
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
    </SidebarProvider>
  );
}
