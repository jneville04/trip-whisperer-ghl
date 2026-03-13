import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProposalPreview from "@/components/ProposalPreview";
import type { ProposalData } from "@/types/proposal";
import { buildBrandCssVars } from "@/lib/brand";

export default function ClientView() {
  const { shareId } = useParams<{ shareId: string }>();
  const [data, setData] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareId) return;
    loadProposal();
  }, [shareId]);

  const loadProposal = async () => {
    const { data: row, error: err } = await supabase
      .from("proposals")
      .select("data")
      .eq("share_id", shareId)
      .single();

    if (err || !row) {
      setError("Proposal not found or link has expired.");
    } else {
      setData((row as any).data as ProposalData);
    }
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
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Proposal Not Found</h1>
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
