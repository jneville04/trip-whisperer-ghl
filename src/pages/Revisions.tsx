import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { MessageSquare, ArrowLeft, Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { buildBrandCssVars, type BrandColors } from "@/lib/brand";
import { useAppSettings } from "@/hooks/useAppSettings";
import ClientNav from "@/components/ClientNav";

const revisionCategories = [
  { id: "dates", label: "Travel Dates" },
  { id: "hotels", label: "Hotels / Rooms" },
  { id: "activities", label: "Activities / Tours" },
  { id: "flights", label: "Flights" },
  { id: "dining", label: "Dining" },
  { id: "pricing", label: "Pricing / Budget" },
  { id: "other", label: "Other" },
];

export default function RevisionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [selected, setSelected] = useState<string[]>([]);

  const { settings } = useAppSettings();
  const ghlFormUrl = settings.ghl_form_revision;

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
        .from("proposals")
        .select("data")
        .eq("share_id", shareId)
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

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const { error } = await supabase.functions.invoke("ghl-webhook", {
        body: {
          type: "revision",
          payload: {
            ...form,
            categories: selected,
            proposalId: proposalId || shareId,
            source: window.location.href,
          },
        },
      });

      if (error) {
        console.error("Webhook error:", error);
        toast({ title: "Submitted with warning", description: "Your revision request was recorded but the notification may have failed.", variant: "destructive" });
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
        <div className="max-w-3xl mx-auto px-6 py-8">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Proposal
          </button>
          <iframe
            src={iframeSrc}
            className="w-full border-0 rounded-xl"
            style={{ minHeight: "600px", height: "80vh" }}
            title="Request Revisions"
            allow="camera; microphone"
          />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6" style={brandStyles as React.CSSProperties}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-secondary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Revision Request Sent!</h1>
          <p className="text-muted-foreground font-body mb-8">
            Your travel advisor has received your feedback and will update the proposal shortly. You'll receive an email when the revised version is ready.
          </p>
          <Button variant="travel-ghost" onClick={goBack} className="text-sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Proposal
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      <div className="max-w-xl mx-auto px-6 py-16">
        <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Proposal
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Request Revisions</h1>
          <p className="text-muted-foreground font-body mt-2">Let your advisor know what you'd like changed.</p>
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
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block font-body">What would you like to change?</label>
            <div className="flex flex-wrap gap-2">
              {revisionCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggle(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-body border transition-colors ${
                    selected.includes(cat.id)
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">Details *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={5}
              required
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-body"
              placeholder="Please describe what you'd like changed. For example: 'We'd prefer a beachfront hotel in the Algarve' or 'Can we swap the wine tasting for a cooking class?'"
            />
          </div>

          <Button type="submit" variant="travel" size="lg" className="w-full text-base py-6 h-auto" disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {sending ? "Sending..." : "Send Revision Request"}
          </Button>
        </form>
      </div>
    </div>
  );
}
