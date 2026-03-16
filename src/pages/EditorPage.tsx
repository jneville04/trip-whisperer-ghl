import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, ArrowLeft, PanelLeftClose, PanelLeft, Send, HelpCircle, Mail, Phone, X, Pencil, Link2, FileDown, ChevronDown, Check, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ProposalEditor from "@/components/ProposalEditor";
import ProposalPreview, { type EditorSubPage } from "@/components/ProposalPreview";
import { defaultProposal, createDefaultCheckout, type ProposalData } from "@/types/proposal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { buildBrandCssVars } from "@/lib/brand";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAgentSettings } from "@/hooks/useAgentSettings";
import CheckoutPage from "@/pages/Checkout";
import ApprovePage from "@/pages/Approve";
import RevisionsPage from "@/pages/Revisions";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings: appSettings, cssVars: appBrandVars } = useAppSettings();
  const { settings: agentSettings } = useAgentSettings();
  const [data, setData] = useState<ProposalData>(defaultProposal);
  const [mode, setMode] = useState<"split" | "preview">("split");
  const [panelOpen, setPanelOpen] = useState(true);
  const [linkCopiedAlert, setLinkCopiedAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [shareId, setShareId] = useState("");
  const [dirty, setDirty] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("draft");
  const [editorSubPage, setEditorSubPage] = useState<EditorSubPage | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [editingTripName, setEditingTripName] = useState(false);
  const tripNameInputRef = useRef<HTMLInputElement>(null);
  const [, setSearchParams] = useSearchParams();

  const handleEditorSubPage = useCallback((page: EditorSubPage | null) => {
    setEditorSubPage(page);
    if (page && shareId) {
      setSearchParams({ share: shareId, subpage: page }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [shareId, setSearchParams]);

  useEffect(() => {
    const handleCheckoutHeightUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ shareId?: string; height?: number }>;
      const updatedShareId = custom.detail?.shareId;
      const updatedHeight = custom.detail?.height;
      if (!updatedHeight) return;
      if (shareId && updatedShareId && updatedShareId !== shareId) return;

      setData((prev) => {
        const currentHeight = prev.checkout?.formHeight || 1200;
        if (currentHeight === updatedHeight) return prev;
        return {
          ...prev,
          checkout: {
            ...(prev.checkout || createDefaultCheckout()),
            formHeight: updatedHeight,
          },
        };
      });
    };

    window.addEventListener("checkout-form-height-updated", handleCheckoutHeightUpdated);
    return () => {
      window.removeEventListener("checkout-form-height-updated", handleCheckoutHeightUpdated);
    };
  }, [shareId]);

  const statusMeta: Record<string, { label: string; badgeClassName: string }> = {
    draft: { label: "Draft", badgeClassName: "text-muted-foreground bg-muted/80" },
    published: { label: "Published", badgeClassName: "text-primary-foreground bg-primary/90" },
    sent: { label: "Published", badgeClassName: "text-primary-foreground bg-primary/90" },
    unpublished: { label: "Draft", badgeClassName: "text-muted-foreground bg-muted/80" },
  };

  const normalizeProposalStatus = (status?: string | null) => {
    if (!status) return "draft";
    if (status === "sent") return "published";
    return status;
  };

  useEffect(() => {
    if (!id) return;
    loadProposal();
  }, [id]);

  const loadProposal = async () => {
    const { data: row, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !row) {
      toast({ title: "Proposal not found", variant: "destructive" });
      navigate("/dashboard");
      return;
    }
    const r = row as any;
    const saved = r.data as ProposalData;
    // Merge with defaults so new fields are available on old proposals
    const merged: ProposalData = {
      ...defaultProposal,
      ...saved,
      // Backward compat: if no tripName, use destination as tripName
      tripName: (saved as any).tripName || saved.destination || r.title || "",
      sectionVisibility: { ...defaultProposal.sectionVisibility, ...(saved.sectionVisibility || {}) },
      sectionOrder: (() => {
        let order = saved.sectionOrder || defaultProposal.sectionOrder;
        if (!order.includes("cruiseShips")) {
          order = [...order];
          const accomIdx = order.indexOf("accommodations");
          order.splice(accomIdx >= 0 ? accomIdx + 1 : order.length - 1, 0, "cruiseShips");
        }
        if (!order.includes("busTrips")) {
          order = [...order];
          const cruiseIdx = order.indexOf("cruiseShips");
          order.splice(cruiseIdx >= 0 ? cruiseIdx + 1 : order.length - 1, 0, "busTrips");
        }
        return order;
      })(),
      // Migrate old flights[] to flightOptions[] for backward compat
      flightOptions: saved.flightOptions || (saved.flights && saved.flights.length > 0
        ? [{
            id: crypto.randomUUID(),
            legs: saved.flights.map((f: any) => ({ ...f, price: undefined, agentPricing: undefined })),
            price: saved.flights[0]?.price,
            agentPricing: saved.flights[0]?.agentPricing,
          }]
        : []),
      flights: [],
      cruiseShips: saved.cruiseShips || [],
      busTrips: saved.busTrips || [],
      checkout: saved.checkout || undefined,
    };
    setData(merged);
    setShareId(r.share_id || "");
    setCurrentStatus(normalizeProposalStatus(r.status));
    setLastSavedAt(new Date());
    setLoading(false);
  };

  const handleChange = useCallback((newData: ProposalData) => {
    setData(newData);
    setDirty(true);
  }, []);

  const saveProposal = async (status?: string) => {
    if (!id) return;
    const targetStatus = status ?? currentStatus;
    const isPublish = status === "published";
    const isUnpublish = status === "unpublished";

    if (isPublish) setPublishing(true);
    else setSaving(true);

    // Sync agent info AND resolved brand colors into proposal data on every save
    const currentBrand = data.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "" };
    const resolvedBrand = {
      primaryColor: currentBrand.primaryColor || agentSettings.primary_color || appSettings.primary_color,
      secondaryColor: currentBrand.secondaryColor || agentSettings.secondary_color || appSettings.secondary_color,
      accentColor: currentBrand.accentColor || agentSettings.accent_color || agentSettings.secondary_color || appSettings.accent_color,
      logoUrl: agentSettings.logo_url || "",
      showAgencyNameWithLogo: currentBrand.showAgencyNameWithLogo ?? agentSettings.show_agency_name_with_logo,
    };
    const dataToSave = {
      ...data,
      brand: resolvedBrand,
      agent: {
        name: agentSettings.agent_name || "",
        title: agentSettings.agent_title || "",
        phone: agentSettings.agent_phone || "",
        email: agentSettings.agent_email || "",
        website: agentSettings.agent_website || "",
        agencyName: agentSettings.agency_name || "",
        logoUrl: agentSettings.agency_logo_url || "",
        photoUrl: agentSettings.agent_photo_url || "",
      },
    };

    const tripName = (data as any).tripName || data.destination || "Untitled";
    const displayTitle = data.clientName ? `${tripName} — ${data.clientName}` : tripName;

    const { error } = await supabase
      .from("proposals")
      .update({
        title: displayTitle,
        client_name: data.clientName || "",
        destination: data.destination || "",
        data: dataToSave as any,
        status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      setCurrentStatus(targetStatus);
      setLastSavedAt(new Date());
      const msg = isPublish ? "Published!" : isUnpublish ? "Unpublished!" : "Saved!";
      toast({ title: msg });
      setDirty(false);
    }

    setSaving(false);
    setPublishing(false);
  };

  const handleSave = () => saveProposal();
  const handlePublish = () => saveProposal("published");
  const handleUnpublish = () => saveProposal("draft");

  const copyShareLink = () => {
    const url = `${window.location.origin}/view/${shareId}`;
    navigator.clipboard.writeText(url);
    setLinkCopiedAlert(true);
    setSendMenuOpen(false);
    setTimeout(() => setLinkCopiedAlert(false), 2500);
  };

  // Close send menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sendMenuRef.current && !sendMenuRef.current.contains(e.target as Node)) {
        setSendMenuOpen(false);
      }
    };
    if (sendMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sendMenuOpen]);
  // Brand colors: proposal overrides take priority, then agent settings, then app defaults
  const previewData = useMemo<ProposalData>(() => {
    const brand = data.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "" };

    const fallbackPrimary = agentSettings.primary_color || appSettings.primary_color;
    const fallbackSecondary = agentSettings.secondary_color || appSettings.secondary_color;

    // Only use logo_url if it's actually set (non-empty string)
    const agentLogoUrl = agentSettings.logo_url || "";
    const agentPhotoUrl = agentSettings.agent_photo_url || "";
    const agentAgencyLogoUrl = agentSettings.agency_logo_url || "";

    return {
      ...data,
      brand: {
        primaryColor: brand.primaryColor || fallbackPrimary,
        secondaryColor: brand.secondaryColor || fallbackSecondary,
        accentColor: brand.accentColor || agentSettings.accent_color || fallbackSecondary,
        logoUrl: agentLogoUrl,
        showAgencyNameWithLogo: brand.showAgencyNameWithLogo ?? agentSettings.show_agency_name_with_logo,
      },
      agent: {
        name: agentSettings.agent_name || "",
        title: agentSettings.agent_title || "",
        phone: agentSettings.agent_phone || "",
        email: agentSettings.agent_email || "",
        website: agentSettings.agent_website || "",
        agencyName: agentSettings.agency_name || "",
        logoUrl: agentAgencyLogoUrl,
        photoUrl: agentPhotoUrl,
      },
    };
  }, [data, agentSettings, appSettings.primary_color, appSettings.secondary_color]);

  const builderBrandStyles = useMemo(() => buildBrandCssVars(previewData.brand), [previewData.brand]);
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground font-body">
        Loading proposal...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" style={appBrandVars as React.CSSProperties}>
      {/* Link Copied Alert */}
      {linkCopiedAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-card border border-border shadow-lg rounded-lg px-4 py-2.5 text-sm font-medium text-foreground animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="h-4 w-4 text-emerald-600" /> Link Copied!
        </div>
      )}
      {/* ROW 1 – Top Controls */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Button variant="travel-ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Library
          </Button>
          {mode === "split" && (
            <Button variant="travel-ghost" size="icon" className="h-8 w-8" onClick={() => setPanelOpen(!panelOpen)} title={panelOpen ? "Collapse editor panel" : "Open editor panel"}>
              {panelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
          )}
          <span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${
            currentStatus === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}>
            {(statusMeta[currentStatus] || statusMeta.draft).label}
          </span>
          {editorSubPage && (
            <Button variant="travel-outline" size="sm" onClick={() => handleEditorSubPage(null)} className="ml-2">
              <X className="h-3.5 w-3.5 mr-1" /> Back to Preview
            </Button>
          )}
        </div>

        <div className="hidden sm:flex items-center text-xs text-muted-foreground font-body">
          {lastSavedAt ? `Last saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Not saved yet"}
          {dirty && <span className="ml-1.5 text-amber-500">• Unsaved changes</span>}
        </div>

        <div className="flex items-center gap-2">
          {mode === "preview" ? (
            <Button
              variant="travel-outline"
              size="sm"
              onClick={() => setMode("split")}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Editor
            </Button>
          ) : (
            <Button
              variant="travel-outline"
              size="sm"
              onClick={() => setMode("preview")}
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
          )}
          <div className="relative" ref={sendMenuRef}>
            <Button
              variant="travel"
              size="default"
              onClick={() => {
                if (!shareId) {
                  toast({ title: "Please save the trip first." });
                  return;
                }
                setSendMenuOpen(!sendMenuOpen);
              }}
              disabled={publishing || !shareId}
              className="px-5 font-semibold shadow-md"
            >
              <Send className="h-4 w-4 mr-1.5" /> Send Proposal <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
            {sendMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                <button
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors text-left"
                  onClick={copyShareLink}
                >
                  <Link2 className="h-4 w-4 text-muted-foreground" /> Copy Link
                </button>
                <button
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground/50 cursor-not-allowed text-left"
                  disabled
                >
                  <FileDown className="h-4 w-4" /> Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 2 – Trip Identity */}
      <div className="h-12 border-b border-border/50 flex items-center px-4 sm:px-6 bg-card shrink-0 sticky top-12 z-30">
        {editingTripName ? (
          <input
            ref={tripNameInputRef}
            className="text-lg font-bold font-display bg-transparent border-b-2 border-primary outline-none text-foreground py-0.5 pr-2 min-w-[200px]"
            value={(data as any).tripName || ""}
            onChange={(e) => handleChange({ ...data, tripName: e.target.value } as any)}
            onBlur={() => setEditingTripName(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setEditingTripName(false); }}
            autoFocus
          />
        ) : (
          <button
            className="flex items-center gap-2 group cursor-pointer text-left"
            onClick={() => {
              setEditingTripName(true);
              setTimeout(() => tripNameInputRef.current?.focus(), 0);
            }}
          >
            <h2 className="text-lg font-bold font-display text-foreground tracking-tight">
              {(data as any).tripName || data.destination || "Untitled Trip"}
            </h2>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {mode === "split" && panelOpen && !editorSubPage && (
          <div className="w-full max-w-lg border-r border-border/50 overflow-y-auto bg-background">
            <ProposalEditor data={data} onChange={handleChange} />
            <HelpdeskFooter />
          </div>
        )}
        <div className="flex-1 overflow-y-auto" style={builderBrandStyles as React.CSSProperties}>
          {editorSubPage === "checkout" && (
            <CheckoutPage />
          )}
          {editorSubPage === "approve" && (
            <ApprovePage />
          )}
          {editorSubPage === "revisions" && (
            <RevisionsPage />
          )}
          {!editorSubPage && (
            <ProposalPreview data={previewData} shareId={shareId} isEditor onEditorSubPage={handleEditorSubPage} />
          )}
        </div>
      </div>
    </div>
  );
}

function HelpdeskFooter() {
  const { settings } = useAppSettings();
  if (!settings.helpdesk_email && !settings.helpdesk_phone) return null;

  return (
    <div className="border-t border-border/50 px-6 py-5 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="h-4 w-4 text-primary" />
        <span className="font-display text-sm font-semibold text-foreground">Need Help?</span>
      </div>
      {settings.helpdesk_message && (
        <p className="text-xs text-muted-foreground font-body mb-2">{settings.helpdesk_message}</p>
      )}
      <div className="flex flex-col gap-1 text-xs text-muted-foreground font-body">
        {settings.helpdesk_email && (
          <a href={`mailto:${settings.helpdesk_email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Mail className="h-3 w-3" /> {settings.helpdesk_email}
          </a>
        )}
        {settings.helpdesk_phone && (
          <a href={`tel:${settings.helpdesk_phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Phone className="h-3 w-3" /> {settings.helpdesk_phone}
          </a>
        )}
      </div>
    </div>
  );
}
