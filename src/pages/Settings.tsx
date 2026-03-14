import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Palette, User, Link2, CreditCard, Globe, Save, Check, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAgentSettings, type AgentSettings } from "@/hooks/useAgentSettings";
import { useAppSettings } from "@/hooks/useAppSettings";
import ImageUploadField from "@/components/ImageUploadField";
import { normalizeHexInput } from "@/lib/brand";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block font-body">{children}</label>;
}

export default function SettingsPage() {
  useAuth(true);
  const navigate = useNavigate();
  const { settings, isLoading, saveSettings, isSaving } = useAgentSettings();
  const { cssVars } = useAppSettings();
  const [form, setForm] = useState<Partial<AgentSettings>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({ ...settings });
    }
  }, [settings]);

  const updateField = <K extends keyof AgentSettings>(key: K, value: AgentSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      const { id, user_id, ...updates } = form as AgentSettings;
      await saveSettings(updates);
      setDirty(false);
      toast({ title: "Settings saved!" });
    } catch (e: any) {
      toast({ title: "Error saving settings", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground font-body" style={cssVars as React.CSSProperties}>
        Loading settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={cssVars as React.CSSProperties}>
      {/* Header */}
      <div className="border-b border-border/50 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="travel-ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Dashboard
            </Button>
            <span className="text-sm font-display font-semibold text-foreground">Settings</span>
          </div>
          <Button variant="travel" size="sm" onClick={handleSave} disabled={!dirty || isSaving}>
            <Save className="h-3.5 w-3.5 mr-1" /> {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="brand" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="brand" className="text-xs"><Palette className="h-3.5 w-3.5 mr-1" /> Brand</TabsTrigger>
            <TabsTrigger value="agent" className="text-xs"><User className="h-3.5 w-3.5 mr-1" /> Agent</TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs"><Link2 className="h-3.5 w-3.5 mr-1" /> Integrations</TabsTrigger>
            <TabsTrigger value="booking" className="text-xs"><CreditCard className="h-3.5 w-3.5 mr-1" /> Booking</TabsTrigger>
          </TabsList>

          {/* Brand Tab */}
          <TabsContent value="brand">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Brand Settings</CardTitle>
                <CardDescription className="font-body text-sm">Customize the look & feel of your proposals. These settings apply globally to all new proposals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <FieldLabel>Agency Logo</FieldLabel>
                  <ImageUploadField value={form.logo_url || ""} onChange={(url) => updateField("logo_url", url)} placeholder="Upload or paste logo URL" />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-body font-medium text-foreground">Show agency name with logo</p>
                    <p className="text-xs text-muted-foreground font-body">Display both logo and agency name in proposal navigation.</p>
                  </div>
                  <Switch
                    checked={form.show_agency_name_with_logo ?? true}
                    onCheckedChange={(v) => updateField("show_agency_name_with_logo", v)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FieldLabel>Primary Color</FieldLabel>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={form.primary_color || "#C2631A"} onChange={(e) => updateField("primary_color", e.target.value.toUpperCase())} className="w-8 h-8 rounded border border-input cursor-pointer" />
                      <Input value={form.primary_color || ""} onChange={(e) => updateField("primary_color", normalizeHexInput(e.target.value))} placeholder="#C2631A" className="h-8 text-sm flex-1" maxLength={7} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Secondary Color</FieldLabel>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={form.secondary_color || "#337A8A"} onChange={(e) => updateField("secondary_color", e.target.value.toUpperCase())} className="w-8 h-8 rounded border border-input cursor-pointer" />
                      <Input value={form.secondary_color || ""} onChange={(e) => updateField("secondary_color", normalizeHexInput(e.target.value))} placeholder="#337A8A" className="h-8 text-sm flex-1" maxLength={7} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Accent Color</FieldLabel>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={form.accent_color || "#D4A824"} onChange={(e) => updateField("accent_color", e.target.value.toUpperCase())} className="w-8 h-8 rounded border border-input cursor-pointer" />
                      <Input value={form.accent_color || ""} onChange={(e) => updateField("accent_color", normalizeHexInput(e.target.value))} placeholder="#D4A824" className="h-8 text-sm flex-1" maxLength={7} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-body">Use hex colors (e.g. #1A2B3C). Leave blank to use platform defaults.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Tab */}
          <TabsContent value="agent">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Agent Information</CardTitle>
                <CardDescription className="font-body text-sm">Your contact details that appear on proposals and the "Your Travel Advisor" footer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Full Name</FieldLabel>
                    <Input value={form.agent_name || ""} onChange={(e) => updateField("agent_name", e.target.value)} className="h-9 text-sm" placeholder="Jane Smith" />
                  </div>
                  <div>
                    <FieldLabel>Title</FieldLabel>
                    <Input value={form.agent_title || ""} onChange={(e) => updateField("agent_title", e.target.value)} className="h-9 text-sm" placeholder="Travel Advisor" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Phone</FieldLabel>
                    <Input value={form.agent_phone || ""} onChange={(e) => updateField("agent_phone", e.target.value)} className="h-9 text-sm" placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <Input value={form.agent_email || ""} onChange={(e) => updateField("agent_email", e.target.value)} className="h-9 text-sm" placeholder="agent@agency.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Website</FieldLabel>
                    <Input value={form.agent_website || ""} onChange={(e) => updateField("agent_website", e.target.value)} className="h-9 text-sm" placeholder="https://agency.com" />
                  </div>
                  <div>
                    <FieldLabel>Agency Name</FieldLabel>
                    <Input value={form.agency_name || ""} onChange={(e) => updateField("agency_name", e.target.value)} className="h-9 text-sm" placeholder="Dream Travel Co." />
                  </div>
                </div>
                <div>
                  <FieldLabel>Agent Photo</FieldLabel>
                  <ImageUploadField value={form.agent_photo_url || ""} onChange={(url) => updateField("agent_photo_url", url)} placeholder="Upload or paste photo URL" />
                </div>
                <div>
                  <FieldLabel>Agency Logo</FieldLabel>
                  <ImageUploadField value={form.agency_logo_url || ""} onChange={(url) => updateField("agency_logo_url", url)} placeholder="Upload or paste logo URL" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" /> GoHighLevel
                      </CardTitle>
                      <CardDescription className="font-body text-sm">Connect your GHL location to sync proposals and bookings.</CardDescription>
                    </div>
                    {form.ghl_connected ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <Check className="h-3 w-3" /> Connected
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  {form.ghl_connected ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2">
                        <div>
                          <p className="text-xs text-muted-foreground font-body">Location ID</p>
                          <p className="text-sm font-body font-medium text-foreground">{form.ghl_location_id || "—"}</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                          updateField("ghl_connected", false);
                          updateField("ghl_location_id", "");
                        }}>
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="travel" size="sm" disabled className="opacity-75">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Connect GoHighLevel
                      <span className="ml-2 text-[10px] uppercase tracking-wider bg-primary-foreground/20 px-1.5 py-0.5 rounded">Coming Soon</span>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" /> Stripe
                      </CardTitle>
                      <CardDescription className="font-body text-sm">Connect your Stripe account to accept payments.</CardDescription>
                    </div>
                    {form.stripe_connected ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <Check className="h-3 w-3" /> Connected
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  {form.stripe_connected ? (
                    <div className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-body">Account</p>
                        <p className="text-sm font-body font-medium text-foreground">{form.stripe_account_id || "—"}</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                        updateField("stripe_connected", false);
                        updateField("stripe_account_id", "");
                      }}>
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button variant="travel" size="sm" disabled className="opacity-75">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Connect Stripe
                      <span className="ml-2 text-[10px] uppercase tracking-wider bg-primary-foreground/20 px-1.5 py-0.5 rounded">Coming Soon</span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Booking Tab */}
          <TabsContent value="booking">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Booking Settings</CardTitle>
                <CardDescription className="font-body text-sm">Set your default "Book Now" behavior. Individual proposals can override these defaults.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <FieldLabel>Default Book Now Behavior</FieldLabel>
                  {[
                    { value: "stripe" as const, label: "Use Internal Stripe Checkout", desc: "Clients pay through your connected Stripe account" },
                    { value: "payment_link" as const, label: "Redirect to External Payment Link", desc: "Send clients to a custom payment URL" },
                    { value: "booking_form" as const, label: "Redirect to External Booking Form", desc: "Send clients to an external booking or intake form" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        form.default_booking_behavior === opt.value
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="booking_behavior"
                        value={opt.value}
                        checked={form.default_booking_behavior === opt.value}
                        onChange={() => updateField("default_booking_behavior", opt.value)}
                        className="mt-0.5 accent-[hsl(var(--primary))]"
                      />
                      <div>
                        <p className="text-sm font-body font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground font-body">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {form.default_booking_behavior === "payment_link" && (
                  <div>
                    <FieldLabel>Default Payment Link</FieldLabel>
                    <Input value={form.default_payment_link || ""} onChange={(e) => updateField("default_payment_link", e.target.value)} className="h-9 text-sm" placeholder="https://pay.stripe.com/..." />
                  </div>
                )}

                {form.default_booking_behavior === "booking_form" && (
                  <div>
                    <FieldLabel>Default Booking Form URL</FieldLabel>
                    <Input value={form.default_booking_form_url || ""} onChange={(e) => updateField("default_booking_form_url", e.target.value)} className="h-9 text-sm" placeholder="https://forms.example.com/booking" />
                  </div>
                )}

                <div>
                  <FieldLabel>Default Checkout URL (optional fallback)</FieldLabel>
                  <Input value={form.default_checkout_url || ""} onChange={(e) => updateField("default_checkout_url", e.target.value)} className="h-9 text-sm" placeholder="https://checkout.example.com" />
                  <p className="text-xs text-muted-foreground font-body mt-1">Used as a fallback when no per-proposal override is set.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
