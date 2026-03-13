import { useState } from "react";
import { Eye, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProposalEditor from "@/components/ProposalEditor";
import ProposalPreview from "@/components/ProposalPreview";
import { defaultProposal, type ProposalData } from "@/types/proposal";

const Index = () => {
  const [data, setData] = useState<ProposalData>(defaultProposal);
  const [mode, setMode] = useState<"split" | "preview">("split");

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 sm:px-6 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold text-foreground">Proposal Builder</span>
          <span className="text-xs text-muted-foreground font-body hidden sm:inline">— {data.destination || "New Trip"} for {data.clientName || "Client"}</span>
        </div>
        <div className="flex items-center gap-2">
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
            <Eye className="h-3.5 w-3.5 mr-1" /> Full Preview
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {mode === "split" && (
          <div className="w-full max-w-lg border-r border-border/50 overflow-y-auto bg-background">
            <ProposalEditor data={data} onChange={setData} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <ProposalPreview data={data} />
        </div>
      </div>
    </div>
  );
};

export default Index;
