import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Search, User, Loader2, AlertCircle } from "lucide-react";

export interface GhlContact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface GhlContactSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (contact: GhlContact) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  id?: string;
}

export default function GhlContactSearch({
  value,
  onChange,
  onSelect,
  placeholder = "Search or enter client name...",
  className,
  error,
  id,
}: GhlContactSearchProps) {
  const [results, setResults] = useState<GhlContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setApiError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setApiError(null);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("search-ghl-contacts", {
          body: { query: value.trim() },
        });
        if (fnErr) {
          console.error("GHL search error:", fnErr);
          setResults([]);
          setApiError("Check GHL API Key in Settings.");
        } else {
          const contacts = data?.contacts || [];
          const errMsg = data?.error || null;
          console.log("GHL search response:", { contacts: contacts.length, error: errMsg });
          setResults(contacts);
          setOpen(contacts.length > 0);
          if (errMsg && contacts.length === 0) {
            setApiError(errMsg);
          }
        }
      } catch (err) {
        console.error("GHL search error:", err);
        setResults([]);
        setApiError("Check GHL API Key in Settings.");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (contact: GhlContact) => {
    onChange(contact.name);
    setOpen(false);
    onSelect?.(contact);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value.trim().length >= 2) setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          className={cn("pl-9", error && "border-destructive focus-visible:ring-destructive", className)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
      </div>

      {apiError && !loading && value.trim().length >= 2 && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-[300] top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-[220px] overflow-y-auto">
          {results.map((contact) => (
            <button
              key={contact.id}
              type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-start gap-2.5 border-b border-border/40 last:border-b-0"
              onClick={() => handleSelect(contact)}
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{contact.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {contact.email && <span className="truncate">{contact.email}</span>}
                  {contact.email && contact.phone && <span>·</span>}
                  {contact.phone && <span>{contact.phone}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
