import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { isValidHexColor, normalizeHexInput } from "@/lib/brand";
import {
  Palette, Users, ArrowLeft, Save, Upload, Check, X, UserX,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  agency_name: string | null;
  status: string;
  created_at: string | null;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useAdminCheck(user?.id);
  const navigate = useNavigate();
  const [tab, setTab] = useState<"branding" | "agents">("branding");

  useEffect(() => {
    if (!authLoading && !adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [authLoading, adminLoading, isAdmin, navigate]);

  if (authLoading || adminLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="travel-ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="font-display text-xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <div className="flex gap-1">
            <Button
              variant={tab === "branding" ? "travel" : "travel-ghost"}
              size="sm"
              onClick={() => setTab("branding")}
            >
              <Palette className="h-4 w-4 mr-1" /> Branding
            </Button>
            <Button
              variant={tab === "agents" ? "travel" : "travel-ghost"}
              size="sm"
              onClick={() => setTab("agents")}
            >
              <Users className="h-4 w-4 mr-1" /> Agents
            </Button>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {tab === "branding" ? <BrandingTab /> : <AgentsTab />}
      </div>
    </div>
  );
}

function BrandingTab() {
  const queryClient = useQueryClient();
  const { settings } = useAppSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);

    if (
      !isValidHexColor(form.primary_color) ||
      !isValidHexColor(form.secondary_color) ||
      !isValidHexColor(form.accent_color)
    ) {
      toast({ title: "Invalid colors", description: "Use full hex colors only, like #1A2B3C.", variant: "destructive" });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("app_settings")
      .update({
        app_name: form.app_name,
        tagline: form.tagline,
        logo_url: form.logo_url,
        favicon_url: form.favicon_url,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        accent_color: form.accent_color,
        font_display: form.font_display,
        font_body: form.font_body,
        login_message: form.login_message,
        ghl_webhook_approve: (form as any).ghl_webhook_approve || "",
        ghl_webhook_revision: (form as any).ghl_webhook_revision || "",
        ghl_form_approve: (form as any).ghl_form_approve || "",
        ghl_form_revision: (form as any).ghl_form_revision || "",
        admin_photo_url: (form as any).admin_photo_url || "",
        login_hero_url: (form as any).login_hero_url || "",
        login_hero_position: (form as any).login_hero_position || "none",
        login_button_color: (form as any).login_button_color || "",
        helpdesk_email: (form as any).helpdesk_email || "",
        helpdesk_phone: (form as any).helpdesk_phone || "",
        helpdesk_message: (form as any).helpdesk_message || "",
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", 1);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "Branding saved!" });
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `logo-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("app-assets").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload error", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("app-assets").getPublicUrl(path);
    setForm({ ...form, logo_url: urlData.publicUrl });
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `favicon-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("app-assets").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload error", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("app-assets").getPublicUrl(path);
    setForm({ ...form, favicon_url: urlData.publicUrl });
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block font-body">
      {children}
    </label>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label>App Name</Label>
          <Input value={form.app_name} onChange={(e) => setForm({ ...form, app_name: e.target.value })} />
        </div>
        <div>
          <Label>Tagline</Label>
          <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <Label>Logo</Label>
          <div className="flex items-center gap-3">
            {form.logo_url && (
              <img src={form.logo_url} alt="Logo" className="h-10 w-10 object-contain rounded" />
            )}
            <label className="cursor-pointer inline-flex items-center gap-1 text-sm text-primary hover:underline font-body">
              <Upload className="h-4 w-4" /> Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
        </div>
        <div>
          <Label>Favicon</Label>
          <div className="flex items-center gap-3">
            {form.favicon_url && (
              <img src={form.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
            )}
            <label className="cursor-pointer inline-flex items-center gap-1 text-sm text-primary hover:underline font-body">
              <Upload className="h-4 w-4" /> Upload
              <input type="file" accept="image/*,.ico" className="hidden" onChange={handleFaviconUpload} />
            </label>
          </div>
        </div>
        <div>
          <Label>Admin Photo (Login Page)</Label>
          <div className="flex items-center gap-3">
            {(form as any).admin_photo_url && (
              <img src={(form as any).admin_photo_url} alt="Admin" className="h-12 w-12 rounded-full object-cover" />
            )}
            <label className="cursor-pointer inline-flex items-center gap-1 text-sm text-primary hover:underline font-body">
              <Upload className="h-4 w-4" /> Upload
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const path = `admin-photo-${Date.now()}.${file.name.split(".").pop()}`;
                const { error } = await supabase.storage.from("app-assets").upload(path, file, { upsert: true });
                if (error) { toast({ title: "Upload error", description: error.message, variant: "destructive" }); return; }
                const { data: urlData } = supabase.storage.from("app-assets").getPublicUrl(path);
                setForm({ ...form, admin_photo_url: urlData.publicUrl } as any);
              }} />
            </label>
            {(form as any).admin_photo_url && (
              <button onClick={() => setForm({ ...form, admin_photo_url: "" } as any)} className="text-xs text-destructive hover:underline">Remove</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <Label>Primary Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => setForm({ ...form, primary_color: e.target.value.toUpperCase() })}
              className="h-10 w-10 rounded border border-border cursor-pointer"
            />
            <Input
              value={form.primary_color}
              onChange={(e) => setForm({ ...form, primary_color: normalizeHexInput(e.target.value) })}
              className="flex-1"
              inputMode="text"
              maxLength={7}
              placeholder="#1A2B3C"
            />
          </div>
        </div>
        <div>
          <Label>Secondary Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.secondary_color}
              onChange={(e) => setForm({ ...form, secondary_color: e.target.value.toUpperCase() })}
              className="h-10 w-10 rounded border border-border cursor-pointer"
            />
            <Input
              value={form.secondary_color}
              onChange={(e) => setForm({ ...form, secondary_color: normalizeHexInput(e.target.value) })}
              className="flex-1"
              inputMode="text"
              maxLength={7}
              placeholder="#1A2B3C"
            />
          </div>
        </div>
        <div>
          <Label>Accent Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.accent_color}
              onChange={(e) => setForm({ ...form, accent_color: e.target.value.toUpperCase() })}
              className="h-10 w-10 rounded border border-border cursor-pointer"
            />
            <Input
              value={form.accent_color}
              onChange={(e) => setForm({ ...form, accent_color: normalizeHexInput(e.target.value) })}
              className="flex-1"
              inputMode="text"
              maxLength={7}
              placeholder="#1A2B3C"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label>Display Font</Label>
          <Input value={form.font_display} onChange={(e) => setForm({ ...form, font_display: e.target.value })} />
        </div>
        <div>
          <Label>Body Font</Label>
          <Input value={form.font_body} onChange={(e) => setForm({ ...form, font_body: e.target.value })} />
        </div>
      </div>

      <div>
        <Label>Login Page Message</Label>
        <Textarea
          value={form.login_message || ""}
          onChange={(e) => setForm({ ...form, login_message: e.target.value || null })}
          placeholder="Optional message shown on the login page"
          rows={3}
        />
      </div>

      {/* Login Page Branding */}
      <div className="border-t border-border/50 pt-6 mt-2">
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Login Page Branding</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Label>Login Button Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(form as any).login_button_color || "#E07A2F"}
                  onChange={(e) => setForm({ ...form, login_button_color: e.target.value.toUpperCase() } as any)}
                  className="h-10 w-10 rounded border border-border cursor-pointer"
                />
                <Input
                  value={(form as any).login_button_color || ""}
                  onChange={(e) => setForm({ ...form, login_button_color: normalizeHexInput(e.target.value) } as any)}
                  placeholder="#E07A2F"
                  className="flex-1"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <Label>Hero Image Position</Label>
              <div className="flex gap-2 mt-1">
                {(["none", "top", "left", "right"] as const).map((pos) => (
                  <Button
                    key={pos}
                    type="button"
                    size="sm"
                    variant={(form as any).login_hero_position === pos ? "travel" : "travel-outline"}
                    className="text-xs h-8 capitalize"
                    onClick={() => setForm({ ...form, login_hero_position: pos } as any)}
                  >
                    {pos === "none" ? "None" : pos}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          {(form as any).login_hero_position !== "none" && (
            <div>
              <Label>Hero Image</Label>
              <div className="flex items-center gap-3">
                {(form as any).login_hero_url && (
                  <img src={(form as any).login_hero_url} alt="Hero" className="h-16 w-24 object-cover rounded" />
                )}
                <label className="cursor-pointer inline-flex items-center gap-1 text-sm text-primary hover:underline font-body">
                  <Upload className="h-4 w-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const path = `login-hero-${Date.now()}.${file.name.split(".").pop()}`;
                    const { error } = await supabase.storage.from("app-assets").upload(path, file, { upsert: true });
                    if (error) { toast({ title: "Upload error", description: error.message, variant: "destructive" }); return; }
                    const { data: urlData } = supabase.storage.from("app-assets").getPublicUrl(path);
                    setForm({ ...form, login_hero_url: urlData.publicUrl } as any);
                  }} />
                </label>
                <Input
                  value={(form as any).login_hero_url || ""}
                  onChange={(e) => setForm({ ...form, login_hero_url: e.target.value } as any)}
                  placeholder="Or paste image URL..."
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helpdesk / Support Contact */}
      <div className="border-t border-border/50 pt-6 mt-2">
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Helpdesk / Support Contact</h3>
        <p className="text-xs text-muted-foreground font-body mb-3">
          This contact info is shown to travel agents in their dashboard for support.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <Label>Support Email</Label>
            <Input
              value={(form as any).helpdesk_email || ""}
              onChange={(e) => setForm({ ...form, helpdesk_email: e.target.value } as any)}
              placeholder="support@youragency.com"
            />
          </div>
          <div>
            <Label>Support Phone</Label>
            <Input
              value={(form as any).helpdesk_phone || ""}
              onChange={(e) => setForm({ ...form, helpdesk_phone: e.target.value } as any)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        <div className="mt-3">
          <Label>Support Message</Label>
          <Textarea
            value={(form as any).helpdesk_message || ""}
            onChange={(e) => setForm({ ...form, helpdesk_message: e.target.value } as any)}
            placeholder="Need help? Reach out to us..."
            rows={2}
          />
        </div>
      </div>

      {/* GHL Integration */}
      <div className="border-t border-border/50 pt-6 mt-2">
        <h3 className="font-display text-base font-semibold text-foreground mb-4">GHL Integration</h3>

        <div className="space-y-6">
          <div>
            <p className="text-xs text-muted-foreground font-body mb-3">
              <strong>Form Embeds:</strong> Paste your GHL form/survey embed URLs below. These will replace the built-in approve & revision forms with your GHL forms.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label>Approve Form URL</Label>
                <Input
                  value={(form as any).ghl_form_approve || ""}
                  onChange={(e) => setForm({ ...form, ghl_form_approve: e.target.value } as any)}
                  placeholder="https://link.yourdomain.com/widget/form/..."
                />
              </div>
              <div>
                <Label>Revision Form URL</Label>
                <Input
                  value={(form as any).ghl_form_revision || ""}
                  onChange={(e) => setForm({ ...form, ghl_form_revision: e.target.value } as any)}
                  placeholder="https://link.yourdomain.com/widget/form/..."
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-body mb-3">
              <strong>Webhook URLs (optional):</strong> If you also want webhook notifications when the built-in forms are used.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label>Approve Webhook URL</Label>
                <Input
                  value={(form as any).ghl_webhook_approve || ""}
                  onChange={(e) => setForm({ ...form, ghl_webhook_approve: e.target.value } as any)}
                  placeholder="https://services.leadconnectorhq.com/hooks/..."
                />
              </div>
              <div>
                <Label>Revision Webhook URL</Label>
                <Input
                  value={(form as any).ghl_webhook_revision || ""}
                  onChange={(e) => setForm({ ...form, ghl_webhook_revision: e.target.value } as any)}
                  placeholder="https://services.leadconnectorhq.com/hooks/..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Proposal */}
      <div className="border-t border-border/50 pt-6 mt-2">
        <h3 className="font-display text-base font-semibold text-foreground mb-2">Sample Proposal</h3>
        <p className="text-xs text-muted-foreground font-body mb-4">
          Choose a trip to automatically clone for every new agent who signs up. Each agent gets their own independent copy they can edit freely.
        </p>
        <SampleTripPicker
          currentId={(form as any).sample_trip_id || null}
          onChange={(id) => setForm({ ...form, sample_trip_id: id } as any)}
        />
      </div>

      <Button variant="travel" onClick={handleSave} disabled={saving}>
        <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Branding"}
      </Button>
    </div>
  );
}

function AgentsTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setProfiles(data as unknown as Profile[]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status } as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Agent ${status}` });
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));

    // Send approval email after successful status update
    if (status === "approved") {
      const profile = profiles.find((p) => p.id === id);
      if (profile?.email) {
        const loginUrl = `${window.location.origin}/auth`;
        supabase.functions.invoke("notify-agent-approval", {
          body: {
            agentEmail: profile.email,
            agentName: profile.full_name || "",
            loginUrl,
          },
        }).catch((err) => console.error("Approval email failed:", err));
      }
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="text-muted-foreground font-body">Loading agents...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground font-body">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground font-body">Email</th>
              <th className="px-4 py-3 font-medium text-muted-foreground font-body">Agency</th>
              <th className="px-4 py-3 font-medium text-muted-foreground font-body">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground font-body">Joined</th>
              <th className="px-4 py-3 font-medium text-muted-foreground font-body">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id} className="border-t border-border/30">
                <td className="px-4 py-3 font-body">{profile.full_name || "—"}</td>
                <td className="px-4 py-3 font-body text-muted-foreground">{profile.email || "—"}</td>
                <td className="px-4 py-3 font-body">{profile.agency_name || "—"}</td>
                <td className="px-4 py-3">{statusBadge(profile.status)}</td>
                <td className="px-4 py-3 font-body text-muted-foreground text-xs">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {profile.status !== "approved" && (
                      <Button
                        variant="travel-ghost"
                        size="sm"
                        className="h-7 text-xs text-green-600"
                        onClick={() => updateStatus(profile.id, "approved")}
                      >
                        <Check className="h-3 w-3 mr-1" /> Approve
                      </Button>
                    )}
                    {profile.status !== "rejected" && (
                      <Button
                        variant="travel-ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive"
                        onClick={() => updateStatus(profile.id, "rejected")}
                      >
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
