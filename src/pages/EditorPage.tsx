import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, PenLine, ArrowLeft, Save, ExternalLink, PanelLeftClose, PanelLeft, Send, HelpCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProposalEditor from "@/components/ProposalEditor";
import ProposalPreview from "@/components/ProposalPreview";
import { defaultProposal, type ProposalData } from "@/types/proposal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { buildBrandCssVars } from "@/lib/brand";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAgentSettings } from "@/hooks/useAgentSettings";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cssVars: appBrandVars } = useAppSettings();
  const { settings: agentSettings } = useAgentSettings();
  const [data, setData] = useState<ProposalData>(defaultProposal);
  const [mode, setMode] = useState<"split" | "preview">("split");
  const [panelOpen, setPanelOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [shareId, setShareId] = useState("");
  const [dirty, setDirty] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("draft");

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
    setCurrentStatus(r.status || "draft");
    setLoading(false);
  };

  const handleChange = useCallback((newData: ProposalData) => {
    setData(newData);
    setDirty(true);
  }, []);

  const saveProposal = async (status?: string) => {
    if (!id) return;
    const isPublish = status === "sent";
    if (isPublish) setPublishing(true);
    else setSaving(true);

    const { error } = await supabase
      .from("proposals")
      .update({
        title: data.destination ? `${data.destination} — ${data.clientName}` : "Untitled",
        client_name: data.clientName || "",
        destination: data.destination || "",
        data: data as any,
        status: status || currentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      if (status) setCurrentStatus(status);
      toast({ title: isPublish ? "Published!" : "Saved!" });
      setDirty(false);
    }
    setSaving(false);
    setPublishing(false);
  };

  const handleSave = () => saveProposal();
  const handlePublish = () => saveProposal("sent");

  const copyShareLink = () => {
    const url = `${window.location.origin}/view/${shareId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Client link copied!", description: url });
  };

  // Merge agent settings as fallbacks for brand and agent info
  const previewData = useMemo<ProposalData>(() => {
    const brand = data.brand || { primaryColor: "", secondaryColor: "", accentColor: "", logoUrl: "" };
    const agent = data.agent || { name: "", title: "", phone: "", email: "", website: "", agencyName: "", logoUrl: "", photoUrl: "" };
    return {
      ...data,
      brand: {
        primaryColor: brand.primaryColor || agentSettings.primary_color,
        secondaryColor: brand.secondaryColor || agentSettings.secondary_color,
        accentColor: brand.accentColor || agentSettings.accent_color,
        logoUrl: brand.logoUrl || agentSettings.logo_url,
        showAgencyNameWithLogo: brand.showAgencyNameWithLogo ?? agentSettings.show_agency_name_with_logo,
      },
      agent: {
        name: agent.name || agentSettings.agent_name,
        title: agent.title || agentSettings.agent_title,
        phone: agent.phone || agentSettings.agent_phone,
        email: agent.email || agentSettings.agent_email,
        website: agent.website || agentSettings.agent_website,
        agencyName: agent.agencyName || agentSettings.agency_name,
        logoUrl: agent.logoUrl || agentSettings.agency_logo_url,
        photoUrl: agent.photoUrl || agentSettings.agent_photo_url,
      },
    };
  }, [data, agentSettings]);

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
      {/* Top Bar */}
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 sm:px-6 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="travel-ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Library
          </Button>
          {mode === "split" && (
            <Button variant="travel-ghost" size="icon" className="h-8 w-8" onClick={() => setPanelOpen(!panelOpen)} title={panelOpen ? "Collapse editor panel" : "Open editor panel"}>
              {panelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
          )}
          <span className="text-xs text-muted-foreground font-body hidden sm:inline">
            — {data.destination || "New Trip"} for {data.clientName || "Client"}
            {currentStatus === "sent" && <span className="ml-2 text-[10px] uppercase tracking-wider text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">Published</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="travel-ghost" size="sm" onClick={copyShareLink}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Client Link
          </Button>
          <Button
            variant={mode === "split" ? "travel" : "travel-ghost"}
            size="sm"
            onClick={() => setMode("split")}
          >
            <PenLine className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button
            variant={mode === "preview" ? "travel" : "travel-ghost"}
            size="sm"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Preview
          </Button>
          <Button
            variant="travel-outline"
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save Draft"}
          </Button>
          {currentStatus === "sent" ? (
            <Button
              variant="travel-outline"
              size="sm"
              onClick={() => saveProposal("draft")}
              disabled={saving}
            >
              <EyeOff className="h-3.5 w-3.5 mr-1" /> Unpublish
            </Button>
          ) : null}
          <Button
            variant="travel"
            size="sm"
            onClick={handlePublish}
            disabled={publishing}
          >
            <Send className="h-3.5 w-3.5 mr-1" /> {publishing ? "Publishing..." : "Save & Publish"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {mode === "split" && panelOpen && (
          <div className="w-full max-w-lg border-r border-border/50 overflow-y-auto bg-background">
            <ProposalEditor data={data} onChange={handleChange} />
            <HelpdeskFooter />
          </div>
        )}
        <div className="flex-1 overflow-y-auto" style={builderBrandStyles as React.CSSProperties}>
          <ProposalPreview data={previewData} shareId={shareId} isEditor />
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
