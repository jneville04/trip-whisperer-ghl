import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProposalPreview from "@/components/ProposalPreview";
import type { ProposalData } from "@/types/proposal";
import { buildBrandCssVars } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone } from "lucide-react";

export default function ClientView() {
  const { shareId } = useParams<{ shareId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAgentPreview = searchParams.get("preview") === "agent";
  const previewFrom = searchParams.get("from") || "";
  const [data, setData] = useState<ProposalData | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripStatus, setTripStatus] = useState<string>("draft");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, []);

  useEffect(() => {
    if (!shareId) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");
      setData(null);

      // Use a direct fetch with no-cache to guarantee fresh data from the database
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(
        `${supabaseUrl}/rest/v1/trips?select=id,status,published_data,draft_data,org_id,archived_at,traveler_email,traveler_phone&public_slug=eq.${encodeURIComponent(shareId)}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Accept: "application/vnd.pgrst.object+json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          cache: "no-store",
        }
      );

      if (cancelled) return;

      if (!res.ok) {
        setError("Proposal not found or link has expired.");
        setLoading(false);
        return;
      }

      const row = await res.json();

      const r = row as any;
      const status = r.status || "draft";
      setTripStatus(status);
      setTripId(r.id);

      // Agent preview: show draft_data regardless of status
      if (isAgentPreview) {
        const previewData = (r.draft_data || r.published_data) as any;
        if (r.traveler_email) previewData.clientEmail = r.traveler_email;
        if (r.traveler_phone) previewData.clientPhone = r.traveler_phone;
        setData(previewData as ProposalData);
        setLoading(false);
        return;
      }

      // Archived trip — show inactive message for public visitors
      if (r.archived_at) {
        setError("archived");
        setLoading(false);
        return;
      }

      // Reopened trips show under revision for public visitors
      if (status === "reopened") {
        setError("under_revision");
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

  const getBackDestination = () => {
    if (previewFrom === "editor" && tripId) return { label: "Back to Editor", path: `/editor/${tripId}` };
    if (previewFrom === "dashboard") return { label: "Back to Dashboard", path: "/" };
    if (previewFrom === "trips") return { label: "Back to Trips", path: "/trips" };
    return { label: "Back to Trips", path: "/trips" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-body">
        Loading proposal...
      </div>
    );
  }

  // Archived trip message
  if (error === "archived") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📋</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Proposal Inactive</h1>
          <p className="text-muted-foreground font-body leading-relaxed">
            This proposal is no longer active. Please contact your travel advisor for more information.
          </p>
        </div>
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

  const back = getBackDestination();

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      {/* Agent-only back navigation */}
      {isLoggedIn && isAgentPreview && (
        <div className="sticky top-0 z-[60] bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate(back.path)}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> {back.label}
            </Button>
            <span className="ml-auto text-[10px] uppercase tracking-wider font-medium text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">
              Agent Preview
            </span>
          </div>
        </div>
      )}
      <ProposalPreview data={data} shareId={shareId} tripId={tripId || undefined} tripStatus={tripStatus} />
    </div>
  );
}
