import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Bell, Download, Trash2, LogOut, Sparkles, Music } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PREFS_KEY = "gandharva:prefs";

interface Prefs {
  defaultExport: "midi" | "csv" | "pdf";
  autoSave: boolean;
  notifications: boolean;
  highQuality: boolean;
}

const defaultPrefs: Prefs = { defaultExport: "midi", autoSave: true, notifications: true, highQuality: true };

const SettingsPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  useEffect(() => {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) setPrefs({ ...defaultPrefs, ...JSON.parse(stored) });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("id", { count: "exact", head: true }).then(({ count }) => {
      setProjectCount(count ?? 0);
    });
  }, [user]);

  const updatePref = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    toast.success("Preferences saved");
  };

  const deleteAll = async () => {
    if (!confirm(`Delete all ${projectCount} projects? This cannot be undone.`)) return;
    const { error } = await supabase.from("projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) toast.error(error.message);
    else {
      toast.success("All projects deleted");
      setProjectCount(0);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <AppShell title="Settings" subtitle="Manage your account, preferences, and data.">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Account */}
        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/20">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="panel-heading text-sm">Account</h3>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/30">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-[11px] text-muted-foreground">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="rounded-full">
              <LogOut className="h-4 w-4 mr-1.5" /> Sign out
            </Button>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-accent/15 border border-accent/20">
              <Music className="h-3.5 w-3.5 text-accent" />
            </div>
            <h3 className="panel-heading text-sm">Preferences</h3>
          </div>

          <div className="space-y-1">
            <Row label="Auto-save analyses to cloud" hint="Every analysis becomes a project in History.">
              <Switch checked={prefs.autoSave} onCheckedChange={(v) => updatePref("autoSave", v)} />
            </Row>
            <Row label="Notifications" hint="Toasts for completed analyses and exports.">
              <Switch checked={prefs.notifications} onCheckedChange={(v) => updatePref("notifications", v)} />
            </Row>
            <Row label="High-quality processing" hint="Use larger FFT for better pitch resolution.">
              <Switch checked={prefs.highQuality} onCheckedChange={(v) => updatePref("highQuality", v)} />
            </Row>
            <Row label="Default export format" hint="Used when you click 'Quick Export'.">
              <div className="flex gap-1">
                {(["midi", "csv", "pdf"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => updatePref("defaultExport", f)}
                    className={`px-3 py-1 rounded-lg text-[11px] uppercase tracking-wider transition-colors ${
                      prefs.defaultExport === f
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-white/5 text-muted-foreground border border-white/5 hover:text-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Row>
          </div>
        </motion.div>

        {/* Data */}
        <motion.div className="glass-card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-destructive/15 border border-destructive/20">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </div>
            <h3 className="panel-heading text-sm">Data</h3>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <p className="text-sm text-foreground">Saved projects</p>
              <p className="text-[11px] text-muted-foreground">{projectCount} {projectCount === 1 ? "project" : "projects"} in cloud</p>
            </div>
            <Button variant="ghost" size="sm" onClick={deleteAll} disabled={projectCount === 0} className="text-destructive hover:bg-destructive/10 rounded-full">
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete all
            </Button>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
};

const Row = ({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div>
      <Label className="text-sm text-foreground">{label}</Label>
      <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
    {children}
  </div>
);

export default SettingsPage;
