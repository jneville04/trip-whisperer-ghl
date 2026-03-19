import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProposalPreview from "@/components/ProposalPreview";
import type { ProposalData } from "@/types/proposal";
import { buildBrandCssVars } from "@/lib/brand";

export default function ClientView() {
  const { shareId } = useParams<{ shareId: string }>();
  const [searchParams] = useSearchParams();
  const isAgentPreview = searchParams.get("preview") === "agent";
  const [data, setData] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareId) return;
    loadProposal();
  }, [shareId]);

  const loadProposal = async () => {
    // Get session first so we know if an agent is logged in
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    console.log("[ClientView] DEBUG — shareId:", shareId);
    console.log("[ClientView] DEBUG — isAgentPreview:", isAgentPreview);
    console.log("[ClientView] DEBUG — searchParams.get('preview'):", searchParams.get("preview"));
    console.log("[ClientView] DEBUG — currentUserId:", currentUserId);

    const { data: row, error: err } = await supabase
      .from("proposals")
      .select("data, status, user_id")
      .eq("share_id", shareId)
      .single();

    console.log("[ClientView] DEBUG — query error:", err);
    console.log("[ClientView] DEBUG — row status:", (row as any)?.status);
    console.log("[ClientView] DEBUG — row user_id:", (row as any)?.user_id);
    console.log("[ClientView] DEBUG — owner match:", currentUserId === (row as any)?.user_id);

    if (err || !row) {
      console.log("[ClientView] DEBUG — RESULT: Proposal not found");
      setError("Proposal not found or link has expired.");
      setLoading(false);
      return;
    }

    const r = row as any;
    const status = r.status;
    const isPublic = status === "published" || status === "sent" || status === "approved";

    // 1. Agent preview: logged-in owner with ?preview=agent can see any status
    if (isAgentPreview && currentUserId && currentUserId === r.user_id) {
      console.log("[ClientView] DEBUG — RESULT: Agent preview bypass — rendering proposal");
      setData(r.data as ProposalData);
      setLoading(false);
      return;
    }

    // 2. Public access: only published/sent/approved
    if (isPublic) {
      console.log("[ClientView] DEBUG — RESULT: Public access — rendering proposal");
      setData(r.data as ProposalData);
      setLoading(false);
      return;
    }

    console.log("[ClientView] DEBUG — RESULT: Blocked — not yet available");
    console.log("[ClientView] DEBUG — isAgentPreview was:", isAgentPreview, "| currentUserId was:", currentUserId, "| user_id was:", r.user_id, "| isPublic was:", isPublic);
    setError("This proposal is not yet available. Please check back later or contact your travel advisor.");
    setLoading(false);
  };

  const brandStyles = buildBrandCssVars(data?.brand);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-body">
        Loading proposal...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✈️</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            {error?.includes("not yet available") ? "Not Yet Available" : "Proposal Not Found"}
          </h1>
          <p className="text-muted-foreground font-body">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      <ProposalPreview data={data} shareId={shareId} />
    </div>
  );
}
