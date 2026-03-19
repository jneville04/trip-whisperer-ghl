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

    let cancelled = false;
    let timeoutId: number | undefined;
    let authSub: { unsubscribe: () => void } | undefined;

    const notYetAvailable = () => {
      setError("This proposal is not yet available. Please check back later or contact your travel advisor.");
      setLoading(false);
    };

    const run = async () => {
      setLoading(true);
      setError("");
      setData(null);

      const { data: row, error: err } = await supabase
        .from("proposals")
        .select("data, status, user_id")
        .eq("share_id", shareId)
        .single();

      if (cancelled) return;

      if (err || !row) {
        setError("Proposal not found or link has expired.");
        setLoading(false);
        return;
      }

      const r = row as any;
      const status = r.status;
      const isPublic = status === "published" || status === "sent" || status === "approved";

      // Public behavior unchanged
      if (!isAgentPreview) {
        if (isPublic) {
          setData(r.data as ProposalData);
          setLoading(false);
          return;
        }
        notYetAvailable();
        return;
      }

      // Agent preview: if already public, no auth needed
      if (isPublic) {
        setData(r.data as ProposalData);
        setLoading(false);
        return;
      }

      // Agent preview for non-public statuses requires authenticated owner context.
      const decide = (userId: string | null | undefined, isFinal: boolean) => {
        if (cancelled) return;

        if (userId && userId === r.user_id) {
          setData(r.data as ProposalData);
          setLoading(false);
          return;
        }

        if (isFinal) {
          notYetAvailable();
        }
      };

      // First: attempt to read the restored session directly.
      const { data: sessionData } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionData.session?.user?.id) {
        decide(sessionData.session.user.id, true);
        return;
      }

      // Then: wait for the auth library to finish its initial session restore.
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "INITIAL_SESSION") {
          decide(session?.user?.id ?? null, true);
        }
        if (event === "SIGNED_IN") {
          decide(session?.user?.id ?? null, true);
        }
      });
      authSub = data.subscription;

      // Final fallback: if auth never resolves, treat as unauthenticated.
      timeoutId = window.setTimeout(() => decide(null, true), 800);
    };

    run();

    return () => {
      cancelled = true;
      authSub?.unsubscribe();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
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
