import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, PenLine, ArrowLeft, Save, ExternalLink, PanelLeftClose, PanelLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProposalEditor from "@/components/ProposalEditor";
import ProposalPreview from "@/components/ProposalPreview";
import { defaultProposal, type ProposalData } from "@/types/proposal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { buildBrandCssVars } from "@/lib/brand";
import { useAppSettings } from "@/hooks/useAppSettings";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cssVars: appBrandVars } = useAppSettings();
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
      sectionOrder: saved.sectionOrder && !saved.sectionOrder.includes("cruiseShips")
        ? (() => {
            const order = [...saved.sectionOrder];
            const accomIdx = order.indexOf("accommodations");
            if (accomIdx >= 0) {
              order.splice(accomIdx + 1, 0, "cruiseShips");
            } else {
              order.splice(order.length - 1, 0, "cruiseShips");
            }
            return order;
          })()
        : saved.sectionOrder || defaultProposal.sectionOrder,
      cruiseShips: saved.cruiseShips || [],
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

  const builderBrandStyles = useMemo(() => buildBrandCssVars(data.brand), [data.brand]);

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
          </div>
        )}
        <div className="flex-1 overflow-y-auto" style={builderBrandStyles as React.CSSProperties}>
          <ProposalPreview data={data} shareId={shareId} />
        </div>
      </div>
    </div>
  );
}
