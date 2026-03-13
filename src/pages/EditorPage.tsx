import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, PenLine, ArrowLeft, Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProposalEditor from "@/components/ProposalEditor";
import ProposalPreview from "@/components/ProposalPreview";
import { defaultProposal, type ProposalData } from "@/types/proposal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProposalData>(defaultProposal);
  const [mode, setMode] = useState<"split" | "preview">("split");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shareId, setShareId] = useState("");
  const [dirty, setDirty] = useState(false);

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
    setData(r.data as ProposalData);
    setShareId(r.share_id || "");
    setLoading(false);
  };

  const handleChange = useCallback((newData: ProposalData) => {
    setData(newData);
    setDirty(true);
  }, []);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);

    const { error } = await supabase
      .from("proposals")
      .update({
        title: data.destination ? `${data.destination} — ${data.clientName}` : "Untitled",
        client_name: data.clientName || "",
        destination: data.destination || "",
        data: data as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!" });
      setDirty(false);
    }
    setSaving(false);
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/view/${shareId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Client link copied!", description: url });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground font-body">
        Loading proposal...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 sm:px-6 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="travel-ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Library
          </Button>
          <span className="text-xs text-muted-foreground font-body hidden sm:inline">
            — {data.destination || "New Trip"} for {data.clientName || "Client"}
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
            variant="travel"
            size="sm"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {mode === "split" && (
          <div className="w-full max-w-lg border-r border-border/50 overflow-y-auto bg-background">
            <ProposalEditor data={data} onChange={handleChange} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <ProposalPreview data={data} />
        </div>
      </div>
    </div>
  );
}
