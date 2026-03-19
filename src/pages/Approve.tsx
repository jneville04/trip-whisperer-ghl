import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { buildBrandCssVars, type BrandColors } from "@/lib/brand";
import { useAppSettings } from "@/hooks/useAppSettings";
import ClientNav from "@/components/ClientNav";

export default function ApprovePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const { settings } = useAppSettings();
  const ghlFormUrl = settings.ghl_form_approve;

  const shareId = searchParams.get("share") || "";
  const proposalId = searchParams.get("proposal") || "";
  const navState = location.state as { brand?: BrandColors; returnTo?: string } | null;
  const initialBrand = navState?.brand;
  const returnTo = navState?.returnTo;
  const isEmbeddedInEditor = location.pathname.includes("/editor");

  const [brandData, setBrandData] = useState<BrandColors>(initialBrand || {});
  const [agentData, setAgentData] = useState<{ agencyName?: string; logoUrl?: string; showAgencyNameWithLogo?: boolean }>({});
  const [brandLoading, setBrandLoading] = useState(Boolean(shareId) && !initialBrand);

  useEffect(() => {
    if (!shareId || initialBrand) {
      setBrandLoading(false);
      return;
    }

    const loadBrand = async () => {
      setBrandLoading(true);
      const { data: row } = await supabase
        .from("trips")
        .select("published_data, draft_data")
        .eq("public_slug", shareId)
        .single();

      const proposalData = (row as any)?.data;
      if (proposalData?.brand) {
        setBrandData(proposalData.brand as BrandColors);
      }
      if (proposalData?.agent) {
        setAgentData({
          agencyName: proposalData.agent.agencyName,
          logoUrl: proposalData.brand?.logoUrl,
          showAgencyNameWithLogo: proposalData.brand?.showAgencyNameWithLogo,
        });
      }
      setBrandLoading(false);
    };

    loadBrand();
  }, [shareId, initialBrand]);

  const brandStyles = buildBrandCssVars(brandData);

  const goBack = () => {
    if (returnTo) navigate(returnTo);
    else if (shareId) navigate(`/view/${shareId}`);
    else navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const { error } = await supabase.functions.invoke("ghl-webhook", {
        body: {
          type: "approve",
          payload: {
            ...form,
            proposalId: proposalId || shareId,
            source: window.location.href,
          },
        },
      });

      if (error) {
        console.error("Webhook error:", error);
        toast({ title: "Submitted with warning", description: "Your approval was recorded but the notification may have failed.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Failed to call webhook:", err);
    }

    setSubmitted(true);
    setSending(false);
  };

  if (brandLoading && !submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={brandStyles as React.CSSProperties}>
        <div className="flex items-center gap-2 text-muted-foreground font-body">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading proposal...
        </div>
      </div>
    );
  }

  // If GHL form URL is configured, show embedded form
  if (ghlFormUrl) {
    const iframeSrc = ghlFormUrl.includes("?")
      ? `${ghlFormUrl}&proposal_id=${proposalId || shareId}`
      : `${ghlFormUrl}?proposal_id=${proposalId || shareId}`;

    return (
      <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
        {!isEmbeddedInEditor && <ClientNav logoUrl={agentData.logoUrl} agencyName={agentData.agencyName} showAgencyNameWithLogo={agentData.showAgencyNameWithLogo} onBack={goBack} />}
        <div className="max-w-3xl mx-auto px-6 py-8">
          <iframe
            src={iframeSrc}
            className="w-full border-0 rounded-xl"
            style={{ height: "calc(100vh - 120px)", border: "none" }}
            title="Approve Trip"
            allow="camera; microphone"
            scrolling="no"
          />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
        {!isEmbeddedInEditor && <ClientNav logoUrl={agentData.logoUrl} agencyName={agentData.agencyName} showAgencyNameWithLogo={agentData.showAgencyNameWithLogo} onBack={goBack} />}
        <div className="flex items-center justify-center px-6" style={{ minHeight: "calc(100vh - 56px)" }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">Itinerary Approved!</h1>
            <p className="text-muted-foreground font-body mb-8">
              Thank you for approving your trip. Your travel advisor will be in touch shortly with next steps and booking confirmation.
            </p>
            <Button variant="travel-ghost" onClick={goBack} className="text-sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Proposal
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      {!isEmbeddedInEditor && <ClientNav logoUrl={agentData.logoUrl} agencyName={agentData.agencyName} showAgencyNameWithLogo={agentData.showAgencyNameWithLogo} onBack={goBack} />}
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Approve Itinerary</h1>
          <p className="text-muted-foreground font-body mt-2">Confirm your details below to approve and book this trip.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">Full Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Michael & Sarah Johnson" required />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">Email Address *</label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="michael@email.com" required />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">Phone Number</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">Additional Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-body"
              placeholder="Any special requests, dietary needs, or preferences..."
            />
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-sm font-body text-muted-foreground">
            <p>By approving, you agree to the payment terms outlined in the proposal. Your travel advisor will send a booking confirmation and deposit invoice.</p>
          </div>

          <Button type="submit" variant="travel" size="lg" className="w-full text-base py-6 h-auto" disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {sending ? "Sending..." : "Confirm & Approve Trip"}
          </Button>
        </form>
      </div>
    </div>
  );
}
