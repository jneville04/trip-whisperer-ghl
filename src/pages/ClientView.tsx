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

    // When opening in a new tab, the Supabase client needs a moment to
    // restore the session from localStorage. We listen for the auth state
    // to be resolved before loading the proposal.
    let resolved = false;

    const loadWithSession = async (userId?: string) => {
      if (resolved) return;
      resolved = true;

      const { data: row, error: err } = await supabase
        .from("proposals")
        .select("data, status, user_id")
        .eq("share_id", shareId)
        .single();

      if (err || !row) {
        setError("Proposal not found or link has expired.");
        setLoading(false);
        return;
      }

      const r = row as any;
      const status = r.status;
      const isPublic = status === "published" || status === "sent" || status === "approved";

      // 1. Agent preview: logged-in owner with ?preview=agent can see any status
      if (isAgentPreview && userId && userId === r.user_id) {
        setData(r.data as ProposalData);
        setLoading(false);
        return;
      }

      // 2. Public access: only published/sent/approved
      if (isPublic) {
        setData(r.data as ProposalData);
        setLoading(false);
        return;
      }

      setError("This proposal is not yet available. Please check back later or contact your travel advisor.");
      setLoading(false);
    };

    if (!isAgentPreview) {
      // Public access — no need to wait for auth
      loadWithSession(undefined);
      return;
    }

    // For agent preview, listen for auth state to resolve
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadWithSession(session?.user?.id);
    });

    // Also check immediately in case the session is already available
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadWithSession(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, [shareId, isAgentPreview]);

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
