import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Send, Plane, Hotel, Ship, Bus, CreditCard, Calendar, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { buildBrandCssVars, type BrandColors } from "@/lib/brand";
import type { ProposalData, CheckoutSettings, PaymentOption } from "@/types/proposal";
import { createDefaultCheckout } from "@/types/proposal";

const paymentIcons: Record<string, React.ReactNode> = {
  full: <CreditCard className="h-5 w-5" />,
  deposit: <Banknote className="h-5 w-5" />,
  installments: <Calendar className="h-5 w-5" />,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get("share") || "";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  useEffect(() => {
    if (!shareId) return;
    const load = async () => {
      const { data: row } = await supabase
        .from("proposals")
        .select("data")
        .eq("share_id", shareId)
        .single();
      if (row) {
        setProposalData((row as any).data as ProposalData);
      }
      setLoading(false);
    };
    load();
  }, [shareId]);

  const checkout: CheckoutSettings = useMemo(() => {
    return proposalData?.checkout || createDefaultCheckout();
  }, [proposalData]);

  const brandData = proposalData?.brand || {} as any;
  const brandStyles = useMemo(() => buildBrandCssVars(brandData), [brandData]);
  const agent = proposalData?.agent || {} as any;
  const enabledOptions = checkout.paymentOptions.filter((o) => o.enabled);

  const goBack = () => {
    if (shareId) navigate(`/view/${shareId}`);
    else navigate(-1);
  };

  // Calculate trip total from pricing lines
  const tripTotal = useMemo(() => {
    if (!proposalData?.pricing) return 0;
    return proposalData.pricing.reduce((sum, p) => {
      const num = parseFloat(p.amount.replace(/[^0-9.-]/g, ""));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [proposalData]);

  const getPaymentAmount = (option: PaymentOption) => {
    if (tripTotal === 0) return null;
    if (option.type === "full") return tripTotal;
    if (option.type === "deposit" && option.depositPercent) return Math.round(tripTotal * (option.depositPercent / 100));
    if (option.type === "installments" && option.installmentCount) return Math.round(tripTotal / option.installmentCount);
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) {
      toast({ title: "Please select a payment option", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await supabase.functions.invoke("ghl-webhook", {
        body: {
          type: "checkout",
          payload: {
            ...form,
            paymentOption: selectedPayment,
            proposalId: shareId,
            destination: proposalData?.destination,
            tripTotal,
            source: window.location.href,
          },
        },
      });
    } catch (err) {
      console.error("Webhook error:", err);
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={brandStyles as React.CSSProperties}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // If custom form URL is set, embed it
  if (checkout.customFormUrl) {
    const iframeSrc = checkout.customFormUrl.includes("?")
      ? `${checkout.customFormUrl}&share_id=${shareId}`
      : `${checkout.customFormUrl}?share_id=${shareId}`;
    return (
      <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Proposal
          </button>
          <iframe src={iframeSrc} className="w-full border-0 rounded-xl" style={{ minHeight: "600px", height: "80vh" }} title="Checkout" allow="payment" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6" style={brandStyles as React.CSSProperties}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Booking Confirmed!</h1>
          <p className="text-muted-foreground font-body mb-8">{checkout.confirmationMessage}</p>
          <Button variant="travel-ghost" onClick={goBack} className="text-sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Proposal
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Proposal
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          {brandData.logoUrl && (
            <img src={brandData.logoUrl} alt="Agency logo" className="h-10 mx-auto mb-4 object-contain" />
          )}
          <h1 className="font-display text-3xl font-bold text-foreground">{checkout.headline}</h1>
          {checkout.message && <p className="text-muted-foreground font-body mt-2">{checkout.message}</p>}
        </div>

        {/* Trip Summary */}
        {checkout.showTripSummary && proposalData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 rounded-2xl p-6 mb-8">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Trip Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-body">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-semibold text-foreground">{proposalData.destination}</span>
              </div>
              {proposalData.travelDates && (
                <div className="flex justify-between items-center text-sm font-body">
                  <span className="text-muted-foreground">Travel Dates</span>
                  <span className="font-semibold text-foreground">{proposalData.travelDates}</span>
                </div>
              )}
              {proposalData.travelerCount && (
                <div className="flex justify-between items-center text-sm font-body">
                  <span className="text-muted-foreground">Travelers</span>
                  <span className="font-semibold text-foreground">{proposalData.travelerCount}</span>
                </div>
              )}

              {/* Item summary */}
              {(proposalData.flightOptions?.length > 0 || proposalData.accommodations?.length > 0 || proposalData.cruiseShips?.length > 0 || proposalData.busTrips?.length > 0) && (
                <div className="pt-3 border-t border-border/30 space-y-2">
                  {proposalData.flightOptions?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                      <Plane className="h-3.5 w-3.5 text-primary" />
                      <span>{proposalData.flightOptions.length} flight option{proposalData.flightOptions.length > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {proposalData.accommodations?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                      <Hotel className="h-3.5 w-3.5 text-primary" />
                      <span>{proposalData.accommodations.map((a) => a.hotelName).filter(Boolean).join(", ") || `${proposalData.accommodations.length} hotel(s)`}</span>
                    </div>
                  )}
                  {proposalData.cruiseShips?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                      <Ship className="h-3.5 w-3.5 text-primary" />
                      <span>{proposalData.cruiseShips.map((c) => c.shipName).filter(Boolean).join(", ") || `${proposalData.cruiseShips.length} cruise(s)`}</span>
                    </div>
                  )}
                  {proposalData.busTrips?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                      <Bus className="h-3.5 w-3.5 text-primary" />
                      <span>{proposalData.busTrips.length} bus trip{proposalData.busTrips.length > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Pricing */}
              {proposalData.pricing?.length > 0 && (
                <div className="pt-3 border-t border-border/30 space-y-1.5">
                  {proposalData.pricing.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm font-body">
                      <span className="text-muted-foreground">{p.label}</span>
                      <span className="text-foreground">{p.amount}</span>
                    </div>
                  ))}
                  {tripTotal > 0 && (
                    <div className="flex justify-between text-base font-body font-bold pt-2 border-t border-border/30">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">${tripTotal.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Payment Options */}
        {enabledOptions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Payment Option</h2>
            <div className="grid gap-3">
              {enabledOptions.map((opt) => {
                const amount = getPaymentAmount(opt);
                const isActive = selectedPayment === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedPayment(opt.id)}
                    className={`relative flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all font-body ${
                      isActive
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border/50 hover:border-primary/40 bg-background"
                    }`}
                  >
                    <div className={`mt-0.5 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {paymentIcons[opt.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                      {opt.type === "deposit" && opt.depositPercent && (
                        <p className="text-xs text-muted-foreground mt-1">{opt.depositPercent}% deposit required</p>
                      )}
                      {opt.type === "installments" && opt.installmentCount && (
                        <p className="text-xs text-muted-foreground mt-1">{opt.installmentCount} monthly payments</p>
                      )}
                    </div>
                    {amount !== null && (
                      <div className="text-right shrink-0">
                        <p className="font-display text-lg font-bold text-foreground">${amount.toLocaleString()}</p>
                        {opt.type === "deposit" && <p className="text-[10px] text-muted-foreground">due now</p>}
                        {opt.type === "installments" && <p className="text-[10px] text-muted-foreground">/ month</p>}
                      </div>
                    )}
                    {/* Selection indicator */}
                    <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isActive ? "border-primary bg-primary" : "border-border"
                    }`}>
                      {isActive && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Your Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">Full Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John & Jane Smith" required className="h-11" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">Email *</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@email.com" required className="h-11" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" className="h-11" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-body"
                placeholder="Any special requests or notes..."
              />
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-sm font-body text-muted-foreground">
              <p>By confirming, you agree to the terms outlined in the proposal. Your travel advisor will follow up with payment instructions and booking confirmation.</p>
            </div>

            <Button type="submit" variant="travel" size="lg" className="w-full text-base py-6 h-auto" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {submitting ? "Submitting..." : "Confirm Booking"}
            </Button>
          </form>
        </motion.div>

        {/* Agent footer */}
        {agent.name && (
          <div className="text-center mt-12 pt-8 border-t border-border/30">
            <p className="text-xs text-muted-foreground font-body">Your Travel Advisor</p>
            <p className="text-sm font-semibold text-foreground font-body mt-1">{agent.name}</p>
            {agent.email && <p className="text-xs text-muted-foreground font-body">{agent.email}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
