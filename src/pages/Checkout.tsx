import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Plane, Hotel, Ship, Bus, Calendar, Users, Phone, Mail, Globe } from "lucide-react";
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

  const hasCustomForm = !!checkout.customFormUrl;

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      <div className="max-w-5xl mx-auto px-6 py-12">
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

        {/* Layout: Summary + Embedded Form */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Trip Summary */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 rounded-2xl p-6 sticky top-8">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Trip Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-body">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="font-semibold text-foreground">{proposalData?.destination}</span>
                </div>
                {proposalData?.travelDates && (
                  <div className="flex justify-between items-center text-sm font-body">
                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Dates</span>
                    <span className="font-semibold text-foreground">{proposalData.travelDates}</span>
                  </div>
                )}
                {proposalData?.travelerCount && (
                  <div className="flex justify-between items-center text-sm font-body">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Travelers</span>
                    <span className="font-semibold text-foreground">{proposalData.travelerCount}</span>
                  </div>
                )}

                {/* Items */}
                {proposalData && (proposalData.flightOptions?.length > 0 || proposalData.accommodations?.length > 0 || proposalData.cruiseShips?.length > 0 || proposalData.busTrips?.length > 0) && (
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
                {proposalData?.pricing && proposalData.pricing.length > 0 && (
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
                    {/* Deposit */}
                    {(() => {
                      const depositOpt = enabledOptions.find(o => o.type === "deposit");
                      if (!depositOpt?.depositPercent || tripTotal <= 0) return null;
                      const depositAmt = Math.round(tripTotal * (depositOpt.depositPercent / 100));
                      return (
                        <div className="flex justify-between text-sm font-body pt-1">
                          <span className="text-muted-foreground">Deposit Due ({depositOpt.depositPercent}%)</span>
                          <span className="font-semibold text-accent">${depositAmt.toLocaleString()}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

            </motion.div>
          </div>

          {/* Right side: Embedded form */}
          <div className="lg:col-span-3">
            {checkout.customFormUrl ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <iframe
                  src={checkout.customFormUrl.includes("?")
                    ? `${checkout.customFormUrl}&share_id=${shareId}`
                    : `${checkout.customFormUrl}?share_id=${shareId}`}
                  className="w-full border border-border/30 rounded-2xl bg-background"
                  style={{ minHeight: "600px", height: "80vh" }}
                  title="Checkout Form"
                  allow="payment"
                />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border/50 rounded-2xl p-8 text-center">
                <p className="text-muted-foreground font-body">Your travel advisor will provide checkout instructions. Please contact them directly to complete your booking.</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Travel Advisor Footer */}
        {agent.name && (
          <footer className="mt-16 pt-12 border-t border-border/50 text-center">
            <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-body mb-3">Your Travel Advisor</p>
            <div className="flex flex-col items-center gap-4 mb-6">
              {agent.photoUrl && (
                <img src={agent.photoUrl} alt={agent.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" />
              )}
              <div>
                <h3 className="font-display text-2xl font-bold text-foreground">{agent.name}</h3>
                {agent.title && <p className="text-muted-foreground font-body mt-0.5">{agent.title}</p>}
                {agent.agencyName && <p className="text-sm text-muted-foreground font-body">{agent.agencyName}</p>}
              </div>
              {brandData.logoUrl && (
                <img src={brandData.logoUrl} alt="Agency" className="h-12 max-w-[160px] object-contain" />
              )}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm font-body text-muted-foreground flex-wrap">
              {agent.phone && <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Phone className="h-4 w-4" /> {agent.phone}</a>}
              {agent.email && <a href={`mailto:${agent.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Mail className="h-4 w-4" /> {agent.email}</a>}
              {agent.website && <a href="#" className="flex items-center gap-1.5 hover:text-primary transition-colors"><Globe className="h-4 w-4" /> {agent.website}</a>}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-10 font-body">© 2026 {agent.agencyName} · All prices in USD · Subject to availability</p>
          </footer>
        )}
      </div>
    </div>
  );
}
