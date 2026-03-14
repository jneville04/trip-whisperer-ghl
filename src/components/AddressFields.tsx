import { Input } from "@/components/ui/input";

export interface AddressData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressFieldsProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  nameLabel?: string;
  namePlaceholder?: string;
  compact?: boolean;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block font-body">{children}</label>;
}

export function parseAddressString(str: string): AddressData {
  // Try to parse "Name, Address, City, State Zip" format
  if (!str) return { name: "", address: "", city: "", state: "", zip: "" };
  const parts = str.split(",").map((s) => s.trim());
  if (parts.length >= 4) {
    const stateZip = parts[3].split(" ");
    return {
      name: parts[0],
      address: parts[1],
      city: parts[2],
      state: stateZip[0] || "",
      zip: stateZip.slice(1).join(" ") || "",
    };
  }
  return { name: str, address: "", city: "", state: "", zip: "" };
}

export function formatAddress(addr: AddressData): string {
  const parts = [addr.name, addr.address, addr.city, [addr.state, addr.zip].filter(Boolean).join(" ")].filter(Boolean);
  return parts.join(", ");
}

export default function AddressFields({ value, onChange, nameLabel = "Location Name", namePlaceholder = "Station Name", compact }: AddressFieldsProps) {
  const update = (field: keyof AddressData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  const inputClass = compact ? "h-7 text-xs" : "h-8 text-xs";

  return (
    <div className="space-y-1.5">
      <div>
        <FieldLabel>{nameLabel}</FieldLabel>
        <Input value={value.name} onChange={(e) => update("name", e.target.value)} placeholder={namePlaceholder} className={inputClass} />
      </div>
      <div>
        <FieldLabel>Address</FieldLabel>
        <Input value={value.address} onChange={(e) => update("address", e.target.value)} placeholder="123 Main St" className={inputClass} />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <FieldLabel>City</FieldLabel>
          <Input value={value.city} onChange={(e) => update("city", e.target.value)} placeholder="City" className={inputClass} />
        </div>
        <div>
          <FieldLabel>State</FieldLabel>
          <Input value={value.state} onChange={(e) => update("state", e.target.value)} placeholder="State" className={inputClass} />
        </div>
        <div>
          <FieldLabel>Zip</FieldLabel>
          <Input value={value.zip} onChange={(e) => update("zip", e.target.value)} placeholder="Zip" className={inputClass} />
        </div>
      </div>
    </div>
  );
}
