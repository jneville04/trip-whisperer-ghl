import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion, type Easing } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Calendar, Users, Phone, Mail, Globe, CreditCard, MapPin, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildBrandCssVars } from "@/lib/brand";
import type { ProposalData, CheckoutSettings, PricingOption } from "@/types/proposal";
import { createDefaultCheckout } from "@/types/proposal";

const fmtCurrency = (val: string) => {
  const num = parseFloat(val.replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return val;
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const easeOut: Easing = [0.25, 0.46, 0.45, 0.94];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: easeOut },
  }),
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const shareId = searchParams.get("share") || "";
  const [loading, setLoading] = useState(true);
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);

  const navState = (location.state || {}) as {
    brand?: any;
    returnTo?: string;
    selectedPricingOption?: PricingOption | null;
    tripName?: string;
  };
  const selectedOption = navState.selectedPricingOption || null;
  const tripName = navState.tripName || "";

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

  const brandData = proposalData?.brand || navState.brand || ({} as any);
  const brandStyles = useMemo(() => buildBrandCssVars(brandData), [brandData]);
  const agent = proposalData?.agent || ({} as any);

  const goBack = () => {
    if (navState.returnTo) navigate(navState.returnTo);
    else if (shareId) navigate(`/view/${shareId}`);
    else navigate(-1);
  };

  const resolvedTripName = tripName || proposalData?.clientName || proposalData?.destination || "";

  // Calculate installments in dollar amounts
  const installments = useMemo(() => {
    if (!selectedOption?.totalPrice) return null;
    const total = parseFloat(selectedOption.totalPrice.replace(/[^0-9.-]/g, ""));
    if (isNaN(total) || total <= 0) return null;
    const deposit = selectedOption.deposit ? parseFloat(selectedOption.deposit.replace(/[^0-9.-]/g, "")) : 0;
    const remaining = total - deposit;
    if (remaining <= 0) return null;

    const installmentOption = checkout.paymentOptions?.find(o => o.enabled && o.type === "installments");
    const count = installmentOption?.installmentCount || 3;
    const perInstallment = remaining / count;

    const travelDates = proposalData?.travelDates || "";
    let startDate: Date | null = null;
    const dateMatch = travelDates.match(/(\w+\s+\d+).+?(\w+\s+\d+)/);
    if (dateMatch) {
      const year = new Date().getFullYear();
      startDate = new Date(`${dateMatch[1]}, ${year}`);
      if (isNaN(startDate.getTime())) startDate = null;
    }

    const payments: { label: string; amount: number; dueDate?: string }[] = [];
    if (deposit > 0) {
      payments.push({ label: "Deposit Due Today", amount: deposit });
    }
    for (let i = 0; i < count; i++) {
      let dueDate: string | undefined;
      if (selectedOption.finalPaymentDate && i === count - 1) {
        dueDate = selectedOption.finalPaymentDate;
      } else if (startDate) {
        const now = new Date();
        const daysUntilTrip = Math.max((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24), 30);
        const interval = daysUntilTrip / (count + 1);
        const payDate = new Date(now.getTime() + interval * (i + 1) * (1000 * 60 * 60 * 24));
        dueDate = payDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      payments.push({ label: `Installment ${i + 1} of ${count}`, amount: perInstallment, dueDate });
    }
    return payments;
  }, [selectedOption, checkout, proposalData?.travelDates]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={brandStyles as React.CSSProperties}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const iframeUrl = checkout.customFormUrl ? (() => {
    const base = checkout.customFormUrl;
    const sep = base.includes("?") ? "&" : "?";
    const params = new URLSearchParams();
    if (shareId) params.set("share_id", shareId);
    if (selectedOption?.name) params.set("option", selectedOption.name);
    if (selectedOption?.totalPrice) params.set("price", selectedOption.totalPrice);
    if (selectedOption?.deposit) params.set("deposit", selectedOption.deposit);
    const qs = params.toString();
    return qs ? `${base}${sep}${qs}` : base;
  })() : "";

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>

      {/* ── Compact top bar ── */}
      <div className="border-b border-border/30 bg-background sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
            <ArrowLeft className="h-4 w-4" /> Back to Proposal
          </button>
          {brandData.logoUrl && (
            <img src={brandData.logoUrl} alt="Agency logo" className="h-6 object-contain" />
          )}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-body">
            <Shield className="h-3.5 w-3.5" /> Secure Booking
          </div>
        </div>
      </div>

      {/* ── Page header ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="max-w-[1400px] mx-auto px-4 md:px-6 pt-4 pb-2">
        <h1 className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight">
          {checkout.headline || "Complete Your Booking"}
        </h1>
        {checkout.message && (
          <p className="text-muted-foreground font-body mt-1 text-sm max-w-3xl">{checkout.message}</p>
        )}
      </motion.div>

      {/* ── SECTION 1: Booking Summary ── */}
      {selectedOption && (
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={1} className="max-w-[1400px] mx-auto px-4 md:px-6 pb-5">
          <div className="bg-background rounded-xl border border-border/30 overflow-hidden">
            {/* Summary header band */}
            <div className="bg-primary/5 border-b border-primary/10 px-8 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  {resolvedTripName && (
                    <h2 className="font-display text-2xl font-bold text-foreground">{resolvedTripName}</h2>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm font-body text-muted-foreground flex-wrap">
                    {proposalData?.destination && (
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {proposalData.destination}</span>
                    )}
                    {proposalData?.travelDates && (
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {proposalData.travelDates}</span>
                    )}
                    {proposalData?.travelerCount && (
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {proposalData.travelerCount} travelers</span>
                    )}
                  </div>
                </div>
                {selectedOption.totalPrice && (
                  <div className="text-right">
                    <p className="text-sm font-body text-muted-foreground">Total</p>
                    <p className="font-display text-3xl font-bold text-foreground">{fmtCurrency(selectedOption.totalPrice)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected option + payment details */}
            <div className="px-8 py-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="font-display text-base font-semibold text-foreground">
                  {selectedOption.name || "Selected Option"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedOption.deposit && (
                  <div className="bg-background rounded-xl border border-border/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">Deposit Due Today</p>
                    <p className="font-display text-xl font-bold text-primary">{fmtCurrency(selectedOption.deposit)}</p>
                  </div>
                )}
                {selectedOption.finalPaymentDate && (
                  <div className="bg-background rounded-xl border border-border/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">Final Payment</p>
                    <p className="font-display text-base font-semibold text-foreground">{selectedOption.finalPaymentDate}</p>
                  </div>
                )}
                {selectedOption.paymentNote && (
                  <div className="bg-background rounded-xl border border-border/30 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">Note</p>
                    <p className="font-body text-sm text-foreground">{selectedOption.paymentNote}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Installments breakdown */}
            {installments && installments.length > 0 && (
              <div className="px-8 pb-6">
                <div className="border-t border-border/30 pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Payment Schedule</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {installments.map((payment, i) => (
                      <div key={i} className={`rounded-xl border p-4 ${i === 0 && payment.label.includes("Deposit") ? "border-primary/30 bg-primary/5" : "border-border/30 bg-background"}`}>
                        <p className="text-xs text-muted-foreground font-body mb-1">
                          {payment.label}
                          {payment.dueDate && <span className="ml-1">· {payment.dueDate}</span>}
                        </p>
                        <p className="font-display text-lg font-bold text-foreground">
                          {fmtCurrency(payment.amount.toFixed(2))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Non-selected fallback */}
      {!selectedOption && resolvedTripName && (
        <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={1} className="max-w-[1400px] mx-auto px-4 md:px-6 pb-5">
          <div className="bg-card rounded-2xl border border-border/40 px-8 py-6">
            <h2 className="font-display text-2xl font-bold text-foreground">{resolvedTripName}</h2>
            {proposalData?.travelDates && (
              <p className="text-sm text-muted-foreground font-body mt-2 flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{proposalData.travelDates}</p>
            )}
          </div>
        </motion.section>
      )}

      {/* ── SECTION 2: Booking Form ── */}
      <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2} className="max-w-[1400px] mx-auto px-4 md:px-6 pb-6">
        {iframeUrl ? (
          <div className="bg-background rounded-xl border border-border/30 overflow-hidden">
            <div className="px-4 md:px-6 pt-3 pb-2 border-b border-border/20">
              <h2 className="font-display text-lg md:text-xl font-bold text-foreground">Traveler Information</h2>
              <p className="text-xs text-muted-foreground font-body mt-1">Please fill in your details below to complete your booking.</p>
            </div>
            <iframe
              src={iframeUrl}
              className="w-full bg-transparent"
              style={{ height: "1600px", minHeight: "calc(100vh - 120px)", border: "none" }}
              title="Booking Form"
              allow="payment"
            />
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border/30 px-6 py-12 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Ready to Book?</h2>
            <p className="text-muted-foreground font-body max-w-md mx-auto">
              Your travel advisor will provide booking instructions. Please contact them directly to complete your reservation.
            </p>
            {agent.email && (
              <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-body font-medium hover:opacity-90 transition-opacity">
                <Mail className="h-4 w-4" /> Contact {agent.name || "Your Advisor"}
              </a>
            )}
          </div>
        )}
      </motion.section>

      {/* ── SECTION 3: Travel Advisor ── */}
      {agent.name && (
        <motion.footer variants={fadeUp} initial="hidden" animate="visible" custom={3} className="border-t border-border/40 bg-card/50">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 max-w-2xl mx-auto">
              {agent.photoUrl && (
                <img src={agent.photoUrl} alt={agent.name} className="w-24 h-24 rounded-full object-cover border-2 border-primary/20 shrink-0" />
              )}
              <div className="text-center md:text-left">
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-body mb-2">Your Travel Advisor</p>
                <h3 className="font-display text-2xl font-bold text-foreground">{agent.name}</h3>
                {agent.title && <p className="text-muted-foreground font-body mt-0.5">{agent.title}</p>}
                {agent.agencyName && <p className="text-sm text-muted-foreground font-body">{agent.agencyName}</p>}
                <div className="flex items-center gap-5 mt-4 text-sm font-body text-muted-foreground flex-wrap justify-center md:justify-start">
                  {agent.phone && <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Phone className="h-4 w-4" /> {agent.phone}</a>}
                  {agent.email && <a href={`mailto:${agent.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Mail className="h-4 w-4" /> {agent.email}</a>}
                  {agent.website && <a href={agent.website.startsWith('http') ? agent.website : `https://${agent.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors"><Globe className="h-4 w-4" /> {agent.website}</a>}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-12 text-center font-body">© 2026 {agent.agencyName} · All prices in USD · Subject to availability</p>
          </div>
        </motion.footer>
      )}
    </div>
  );
}
