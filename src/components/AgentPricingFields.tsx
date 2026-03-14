import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AgentPricing } from "@/types/proposal";

const defaultPricing: AgentPricing = { cost: "", commission: "", markupType: "flat", markupValue: "" };

interface Props {
  pricing: AgentPricing | undefined;
  onChange: (pricing: AgentPricing) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block font-body">{children}</label>;
}

export default function AgentPricingFields({ pricing, onChange }: Props) {
  const p = pricing || defaultPricing;
  const update = (field: keyof AgentPricing, value: string) => {
    onChange({ ...p, [field]: value });
  };

  return (
    <div className="mt-3 p-3 rounded-lg border border-dashed border-accent/40 bg-accent/5 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-accent font-body flex items-center gap-1">
        🔒 Agent Only — Not visible to clients
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <FieldLabel>Cost</FieldLabel>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
            <Input value={p.cost} onChange={(e) => update("cost", e.target.value)} placeholder="0.00" className="h-7 text-xs pl-5" />
          </div>
        </div>
        <div>
          <FieldLabel>Commission</FieldLabel>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
            <Input value={p.commission} onChange={(e) => update("commission", e.target.value)} placeholder="0.00" className="h-7 text-xs pl-5" />
          </div>
        </div>
        <div>
          <FieldLabel>Markup</FieldLabel>
          <div className="flex gap-1">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                {p.markupType === "percent" ? "%" : "$"}
              </span>
              <Input value={p.markupValue} onChange={(e) => update("markupValue", e.target.value)} placeholder="0" className="h-7 text-xs pl-5" />
            </div>
            <Button
              type="button"
              variant={p.markupType === "flat" ? "default" : "outline"}
              size="sm"
              className="h-7 text-[10px] px-1.5"
              onClick={() => update("markupType", "flat")}
            >
              $
            </Button>
            <Button
              type="button"
              variant={p.markupType === "percent" ? "default" : "outline"}
              size="sm"
              className="h-7 text-[10px] px-1.5"
              onClick={() => update("markupType", "percent")}
            >
              %
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
