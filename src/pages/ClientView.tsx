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
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripStatus, setTripStatus] = useState<string>("draft");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareId) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");
      setData(null);

      const { data: row, error: err } = await supabase
        .from("trips")
        .select("id, status, published_data, draft_data, org_id")
        .eq("public_slug", shareId)
        .single();

      if (cancelled) return;

      if (err || !row) {
        setError("Proposal not found or link has expired.");
        setLoading(false);
        return;
      }

      const r = row as any;
      const status = r.status || "draft";
      setTripStatus(status);
      setTripId(r.id);

      // Agent preview: show draft_data regardless of status
      if (isAgentPreview) {
        setData((r.draft_data || r.published_data) as ProposalData);
        setLoading(false);
        return;
      }

      // Public view: only show published_data when status is published/approved
      const isPublic = status === "published" || status === "sent" || status === "approved";

      if (isPublic && r.published_data) {
        setData(r.published_data as ProposalData);
        setLoading(false);
        return;
      }

      // Not published — show "Under Revision"
      setError("under_revision");
      setLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [shareId, isAgentPreview]);

  const brandStyles = buildBrandCssVars(data?.brand);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-body">
        Loading proposal...
      </div>
    );
  }

  // Under Revision branded message
  if (error === "under_revision") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✏️</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Under Revision</h1>
          <p className="text-muted-foreground font-body leading-relaxed">
            Your travel advisor is currently updating this proposal. Please check back soon or contact your advisor for more information.
          </p>
        </div>
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
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Proposal Not Found</h1>
          <p className="text-muted-foreground font-body">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      <ProposalPreview data={data} shareId={shareId} tripId={tripId || undefined} />
    </div>
  );
}
