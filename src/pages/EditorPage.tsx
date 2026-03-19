import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, ArrowLeft, PanelLeftClose, PanelLeft, Send, HelpCircle, Mail, Phone, X, Pencil, Link2, FileDown, ChevronDown, Check, EyeOff, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [tripType, setTripType] = useState<string>("individual");
  const [maxCapacity, setMaxCapacity] = useState<number | null>(null);
  const [mode, setMode] = useState<"split" | "preview">("split");
  const [panelOpen, setPanelOpen] = useState(true);
  const [linkCopiedAlert, setLinkCopiedAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publicSlug, setPublicSlug] = useState("");
  const [dirty, setDirty] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("draft");
  const [editorSubPage, setEditorSubPage] = useState<EditorSubPage | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [editingTripName, setEditingTripName] = useState(false);
  const tripNameInputRef = useRef<HTMLInputElement>(null);
  const [, setSearchParams] = useSearchParams();
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<ProposalData>(data);
  dataRef.current = data;

  const handleEditorSubPage = useCallback((page: EditorSubPage | null) => {
    setEditorSubPage(page);
    if (page && publicSlug) {
      setSearchParams({ share: publicSlug, subpage: page }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [publicSlug, setSearchParams]);

  useEffect(() => {
    const handleCheckoutHeightUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ shareId?: string; height?: number }>;
      const updatedShareId = custom.detail?.shareId;
      const updatedHeight = custom.detail?.height;
      if (!updatedHeight) return;
      if (publicSlug && updatedShareId && updatedShareId !== publicSlug) return;

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
  }, [publicSlug]);

  const statusMeta: Record<string, { label: string; badgeClassName: string }> = {
    draft: { label: "Draft", badgeClassName: "text-muted-foreground bg-muted/80" },
    published: { label: "Published", badgeClassName: "text-primary-foreground bg-primary/90" },
    sent: { label: "Published", badgeClassName: "text-primary-foreground bg-primary/90" },
    unpublished: { label: "Unpublished", badgeClassName: "text-muted-foreground bg-muted/80" },
    approved: { label: "Approved", badgeClassName: "text-primary-foreground bg-primary/90" },
  };

  const normalizeStatus = (status?: string | null) => {
    if (!status) return "draft";
    if (status === "sent") return "published";
    return status;
  };

  useEffect(() => {
    if (!id) return;
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    const { data: row, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !row) {
      toast({ title: "Trip not found", variant: "destructive" });
      navigate("/dashboard");
      return;
    }
    const r = row as any;
    const saved = (r.draft_data || {}) as ProposalData;
    const merged: ProposalData = {
      ...defaultProposal,
      ...saved,
      tripName: (saved as any).tripName || saved.destination || "",
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
    setTripType(r.trip_type || "individual");
    setMaxCapacity(r.max_capacity ?? null);
    setPublicSlug(r.public_slug || "");
    setCurrentStatus(normalizeStatus(r.status));
    setLastSavedAt(new Date());
    setLoading(false);
  };

  const handleChange = useCallback((newData: ProposalData) => {
    setData(newData);
    setDirty(true);
    setSaveFailed(false);
  }, []);

  // Core save function
  const saveTrip = async (status?: string, dataOverride?: ProposalData): Promise<boolean> => {
    if (!id) return false;
    const saveData = dataOverride || dataRef.current;
    const targetStatus = status ?? currentStatus;
    const isPublish = status === "published";
    const isUnpublish = status === "unpublished";

    if (isPublish) setPublishing(true);
    else setSaving(true);

    const currentBrand = saveData.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "" };
    const resolvedBrand = {
      primaryColor: currentBrand.primaryColor || agentSettings.primary_color || appSettings.primary_color,
      secondaryColor: currentBrand.secondaryColor || agentSettings.secondary_color || appSettings.secondary_color,
      accentColor: currentBrand.accentColor || agentSettings.accent_color || agentSettings.secondary_color || appSettings.accent_color,
      logoUrl: agentSettings.logo_url || "",
      showAgencyNameWithLogo: currentBrand.showAgencyNameWithLogo ?? agentSettings.show_agency_name_with_logo,
    };
    const dataToSave: ProposalData = {
      ...saveData,
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

    // Build the update payload
    const updatePayload: Record<string, any> = {
      draft_data: dataToSave as any,
      status: targetStatus,
    };

    // On publish: copy draft_data into published_data
    if (isPublish) {
      updatePayload.published_data = dataToSave as any;
    }

    // Update max_capacity for group trips
    if (tripType === "group") {
      updatePayload.max_capacity = maxCapacity;
    }

    const { error } = await supabase
      .from("trips")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      setSaveFailed(true);
      if (isPublish || isUnpublish) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
      }
      setSaving(false);
      setPublishing(false);
      return false;
    }

    setCurrentStatus(targetStatus);
    setLastSavedAt(new Date());
    setDirty(false);
    setSaveFailed(false);

    if (isPublish) toast({ title: "Published!" });
    else if (isUnpublish) toast({ title: "Unpublished!" });

    setSaving(false);
    setPublishing(false);
    return true;
  };

  // Debounced autosave
  useEffect(() => {
    if (!dirty || !id) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveTrip();
    }, 2000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [dirty, data, id]);

  const handleSave = () => saveTrip();
  const handlePublish = () => saveTrip("published");
  const handleUnpublish = () => saveTrip("unpublished");

  const copyShareLink = () => {
    const url = `${window.location.origin}/view/${publicSlug}`;
    navigator.clipboard.writeText(url);
    setLinkCopiedAlert(true);
    setTimeout(() => setLinkCopiedAlert(false), 2500);
  };

  const handlePublishAndCopy = () => {
    if (currentStatus !== "published") {
      saveTrip("published").then(() => {
        copyShareLink();
      });
    } else {
      copyShareLink();
    }
  };

  const previewData = useMemo<ProposalData>(() => {
    const brand = data.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "" };
    const fallbackPrimary = agentSettings.primary_color || appSettings.primary_color;
    const fallbackSecondary = agentSettings.secondary_color || appSettings.secondary_color;
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
        Loading trip...
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
           <Button variant="travel-ghost" size="sm" onClick={() => navigate("/trips")}>
             <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Trips
          </Button>
          {mode === "split" && (
            <Button variant="travel-ghost" size="icon" className="h-8 w-8" onClick={() => setPanelOpen(!panelOpen)} title={panelOpen ? "Collapse editor panel" : "Open editor panel"}>
              {panelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
          )}
          <span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${
            currentStatus === "published" ? "bg-emerald-100 text-emerald-700" : currentStatus === "approved" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
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
          {saveFailed ? (
            <span className="text-destructive font-medium">Save failed — retrying…</span>
          ) : lastSavedAt ? (
            `Last saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          ) : "Not saved yet"}
          {dirty && !saveFailed && <span className="ml-1.5 text-amber-500">• Unsaved changes</span>}
          {saving && <span className="ml-1.5 text-muted-foreground">• Saving…</span>}
        </div>

        <div className="flex items-center gap-2">
          {mode === "preview" ? (
            <Button variant="travel-outline" size="sm" onClick={() => setMode("split")}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Editor
            </Button>
          ) : (
            <Button variant="travel-outline" size="sm" onClick={() => setMode("preview")}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="travel"
                size="default"
                disabled={publishing || !publicSlug}
                className="px-5 font-semibold shadow-md"
              >
                <Send className="h-4 w-4 mr-1.5" /> Send Proposal <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handlePublishAndCopy}>
                <Link2 className="h-4 w-4 mr-2" /> Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FileDown className="h-4 w-4 mr-2" /> Download PDF
              </DropdownMenuItem>
              {currentStatus === "published" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleUnpublish}>
                    <EyeOff className="h-4 w-4 mr-2" /> Unpublish
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
        {tripType === "group" && (
          <span className="ml-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-travel-ocean text-white">
            Group Trip
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {mode === "split" && panelOpen && !editorSubPage && (
          <div className="w-full max-w-lg border-r border-border/50 overflow-y-auto overscroll-contain bg-background">
            {/* Inventory Settings for Group Trips */}
            {tripType === "group" && (
              <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-display text-sm font-semibold text-foreground">Inventory Settings</span>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxCapacity" className="text-xs">Max Capacity</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    placeholder="e.g. 20"
                    value={maxCapacity ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : null;
                      setMaxCapacity(val);
                      setDirty(true);
                    }}
                    className="max-w-[140px]"
                  />
                </div>
              </div>
            )}
            <ProposalEditor data={data} onChange={handleChange} />
            <HelpdeskFooter />
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={builderBrandStyles as React.CSSProperties}>
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
            <ProposalPreview data={previewData} shareId={publicSlug} isEditor onEditorSubPage={handleEditorSubPage} />
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
