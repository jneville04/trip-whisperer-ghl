import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/hooks/useAppSettings";
import PendingApproval from "@/components/PendingApproval";

export default function PendingPage() {
  const navigate = useNavigate();
  const { cssVars } = useAppSettings();
  const [status, setStatus] = useState<"pending" | "rejected" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Not logged in — they just signed up and haven't confirmed email yet
        setStatus("pending");
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", session.user.id)
        .single();
      const s = (profile as any)?.status;
      if (s === "approved") {
        navigate("/dashboard");
        return;
      }
      setStatus(s === "rejected" ? "rejected" : "pending");
      setLoading(false);
    };
    check();
  }, [navigate]);

  if (loading) return null;

  return (
    <div style={cssVars as React.CSSProperties}>
      <PendingApproval status={status || "pending"} />
    </div>
  );
}
