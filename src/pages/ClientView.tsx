import { useState, useEffect } from "react";
import ProposalPreview from "@/components/ProposalPreview";
import { defaultProposal, type ProposalData } from "@/types/proposal";
import { useBrandStyles } from "@/hooks/useBrandStyles";

const STORAGE_KEY = "proposal-builder-data";

function loadSavedProposal(): ProposalData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return defaultProposal;
}

export default function ClientView() {
  const [data] = useState<ProposalData>(loadSavedProposal);
  const brandStyles = useBrandStyles();

  return (
    <div className="min-h-screen bg-background" style={brandStyles as React.CSSProperties}>
      <ProposalPreview data={data} />
    </div>
  );
}
