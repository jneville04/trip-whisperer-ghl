import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Plane, Hotel, Ship, Bus, Calendar, Users, Phone, Mail, Globe, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { buildBrandCssVars } from "@/lib/brand";
import type { ProposalData, CheckoutSettings, PricingOption } from "@/types/proposal";
import { createDefaultCheckout } from "@/types/proposal";

const fmtCurrency = (val: string) => {
  const num = parseFloat(val.replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return val;
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
    if (shareId) navigate(`/view/${shareId}`);
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

    // Check checkout payment options for installment config
    const installmentOption = checkout.paymentOptions?.find(o => o.enabled && o.type === "installments");
    const count = installmentOption?.installmentCount || 3;
    const perInstallment = remaining / count;

    // Auto-calculate due dates from travel dates
    const travelDates = proposalData?.travelDates || "";
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const dateMatch = travelDates.match(/(\w+\s+\d+).+?(\w+\s+\d+)/);
    if (dateMatch) {
      const year = new Date().getFullYear();
      startDate = new Date(`${dateMatch[1]}, ${year}`);
      endDate = new Date(`${dateMatch[2]}, ${year}`);
      if (isNaN(startDate.getTime())) startDate = null;
      if (isNaN(endDate.getTime())) endDate = null;
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
        // Spread installments evenly before trip start
        const now = new Date();
        const daysUntilTrip = Math.max((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24), 30);
        const interval = daysUntilTrip / (count + 1);
        const payDate = new Date(now.getTime() + interval * (i + 1) * (1000 * 60 * 60 * 24));
        dueDate = payDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      payments.push({
        label: `Installment ${i + 1} of ${count}`,
        amount: perInstallment,
        dueDate,
      });
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

        {/* Booking Summary — always at the top */}
        {selectedOption && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              {/* Left: Trip & option details */}
              <div className="space-y-3 flex-1">
                {resolvedTripName && (
                  <h2 className="font-display text-2xl font-bold text-foreground">{resolvedTripName}</h2>
                )}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-display text-base font-semibold text-foreground">
                      {selectedOption.name || "Selected Option"}
                    </span>
                  </div>
                  {selectedOption.totalPrice && (
                    <p className="text-3xl font-bold text-foreground font-display">
                      {fmtCurrency(selectedOption.totalPrice)}
                    </p>
                  )}
                  {selectedOption.deposit && (
                    <p className="text-sm font-body text-muted-foreground">
                      Deposit due today: <span className="font-semibold text-primary">{fmtCurrency(selectedOption.deposit)}</span>
                    </p>
                  )}
                  {selectedOption.paymentNote && (
                    <p className="text-sm font-body text-muted-foreground">{selectedOption.paymentNote}</p>
                  )}
                  {selectedOption.finalPaymentDate && (
                    <p className="text-sm font-body text-muted-foreground">
                      Final payment due by {selectedOption.finalPaymentDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Trip details */}
              <div className="space-y-3 min-w-[200px]">
                {proposalData?.travelDates && (
                  <div className="flex items-center gap-2 text-sm font-body">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-foreground">{proposalData.travelDates}</span>
                  </div>
                )}
                {proposalData?.travelerCount && (
                  <div className="flex items-center gap-2 text-sm font-body">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-foreground">{proposalData.travelerCount} travelers</span>
                  </div>
                )}
                {proposalData?.flightOptions && proposalData.flightOptions.length > 0 && (
                  <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                    <Plane className="h-3.5 w-3.5 text-primary" />
                    <span>{proposalData.flightOptions.length} flight option{proposalData.flightOptions.length > 1 ? "s" : ""}</span>
                  </div>
                )}
                {proposalData?.accommodations && proposalData.accommodations.length > 0 && (
                  <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                    <Hotel className="h-3.5 w-3.5 text-primary" />
                    <span>{proposalData.accommodations.map((a) => a.hotelName).filter(Boolean).join(", ") || `${proposalData.accommodations.length} hotel(s)`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Installments breakdown in dollar amounts */}
            {installments && installments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border/30">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Payment Schedule</h3>
                </div>
                <div className="space-y-3">
                  {installments.map((payment, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-border/20 last:border-b-0">
                      <div>
                        <span className="font-body text-sm text-foreground font-medium">{payment.label}</span>
                        {payment.dueDate && (
                          <span className="text-xs text-muted-foreground ml-2">— {payment.dueDate}</span>
                        )}
                      </div>
                      <span className="font-display text-base font-bold text-foreground">
                        {fmtCurrency(payment.amount.toFixed(2))}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Total verification */}
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-primary/20">
                  <span className="font-display text-sm font-semibold text-muted-foreground">Total</span>
                  <span className="font-display text-lg font-bold text-primary">
                    {fmtCurrency(selectedOption.totalPrice)}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Non-selected option fallback */}
        {!selectedOption && resolvedTripName && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 rounded-2xl p-6 mb-8">
            <h2 className="font-display text-xl font-bold text-foreground">{resolvedTripName}</h2>
            {proposalData?.travelDates && (
              <p className="text-sm text-muted-foreground font-body mt-2"><Calendar className="h-3.5 w-3.5 inline mr-1" />{proposalData.travelDates}</p>
            )}
          </motion.div>
        )}

        {/* Embedded form — full width below summary */}
        {checkout.customFormUrl ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <iframe
              src={(() => {
                const base = checkout.customFormUrl;
                const sep = base.includes("?") ? "&" : "?";
                const params = new URLSearchParams();
                if (shareId) params.set("share_id", shareId);
                if (selectedOption?.name) params.set("option", selectedOption.name);
                if (selectedOption?.totalPrice) params.set("price", selectedOption.totalPrice);
                if (selectedOption?.deposit) params.set("deposit", selectedOption.deposit);
                const qs = params.toString();
                return qs ? `${base}${sep}${qs}` : base;
              })()}
              className="w-full border border-border/30 rounded-2xl bg-background"
              style={{ minHeight: "600px", height: "80vh" }}
              title="Booking Form"
              allow="payment"
            />
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border/50 rounded-2xl p-8 text-center">
            <p className="text-muted-foreground font-body">Your travel advisor will provide booking instructions. Please contact them directly to complete your booking.</p>
          </motion.div>
        )}

        {/* Travel Advisor Footer — no logo, no Book Now */}
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
            </div>
            <div className="flex items-center justify-center gap-6 text-sm font-body text-muted-foreground flex-wrap">
              {agent.phone && <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Phone className="h-4 w-4" /> {agent.phone}</a>}
              {agent.email && <a href={`mailto:${agent.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors"><Mail className="h-4 w-4" /> {agent.email}</a>}
              {agent.website && <a href={agent.website.startsWith('http') ? agent.website : `https://${agent.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors"><Globe className="h-4 w-4" /> {agent.website}</a>}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-10 font-body">© 2026 {agent.agencyName} · All prices in USD · Subject to availability</p>
          </footer>
        )}
      </div>
    </div>
  );
}
