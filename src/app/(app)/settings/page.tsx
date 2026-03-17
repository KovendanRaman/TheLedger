"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { getUserProfile, getParentalLinksForUser } from "@/backend/actions/data";
import { updateSharingEnabled } from "@/backend/actions/auth";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { Switch } from "@/frontend/components/ui/switch";
import { Label } from "@/frontend/components/ui/label";
import { PageTransition } from "@/frontend/components/page-transition";
import type { UserProfile, ParentalLink } from "@/backend/lib/types/database.types";
import { IS_MOCK_MODE, MOCK_PROFILE, MOCK_PARENTAL_LINKS } from "@/backend/lib/mock-data";
import {
  createParentalLink,
  deleteParentalLink,
  getParentalLinks,
  updateParentalLinkLabel,
} from "@/backend/actions/parental-links";
import {
  Share2, Copy, ExternalLink, Loader2, Shield, LogOut,
  BookOpen, Plus, Trash2, Check, Pencil, X, Link2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/backend/lib/utils";

// ─── Link Card ────────────────────────────────────────────────
function ParentalLinkCard({
  link,
  onDelete,
  onLabelSaved,
  sharingEnabled,
}: {
  link: ParentalLink;
  onDelete: (id: string) => void;
  onLabelSaved: (id: string, label: string) => void;
  sharingEnabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [labelInput, setLabelInput] = useState(link.label);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/view/${link.key}`
      : `/view/${link.key}`;

  function handleCopy() {
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  }

  function handleSaveLabel() {
    if (!labelInput.trim()) return;
    startTransition(async () => {
      if (IS_MOCK_MODE) {
        onLabelSaved(link.id, labelInput.trim());
        setEditing(false);
        toast.success("[Mock] Label updated.");
        return;
      }
      const { error } = await updateParentalLinkLabel(link.id, labelInput.trim());
      if (error) {
        toast.error(error);
      } else {
        onLabelSaved(link.id, labelInput.trim());
        setEditing(false);
        toast.success("Label updated.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      if (IS_MOCK_MODE) {
        onDelete(link.id);
        toast.success("[Mock] Link removed.");
        return;
      }
      const { error } = await deleteParentalLink(link.id);
      if (error) {
        toast.error(error);
      } else {
        onDelete(link.id);
        toast.success("Share link removed.");
      }
    });
  }

  return (
    <div className="rounded-[1.25rem] border border-border/50 bg-secondary/20 overflow-hidden">
      {/* Card header: label + actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-white">
        {editing ? (
          <>
            <input
              autoFocus
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveLabel()}
              maxLength={40}
              className="flex-1 text-[14px] font-semibold bg-transparent border-b border-primary outline-none py-0.5"
              placeholder="e.g. Mom, Dad, Guardian"
            />
            <button
              onClick={handleSaveLabel}
              disabled={isPending || !labelInput.trim()}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button
              onClick={() => { setEditing(false); setLabelInput(link.label); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="flex-1 text-[14px] font-semibold text-foreground">{link.label}</span>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
              title="Rename"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-destructive">Remove?</span>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-2.5 py-1 rounded-lg bg-destructive text-white text-[12px] font-bold hover:bg-destructive/90 transition-colors disabled:opacity-40"
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-lg bg-muted text-[12px] font-bold hover:bg-muted/70 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Remove link"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* URL + action buttons */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-[12px] font-mono text-muted-foreground truncate">
          {url}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!sharingEnabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold border transition-all",
              sharingEnabled
                ? "bg-white border-border/60 hover:bg-secondary/40 text-foreground shadow-sm"
                : "bg-muted/30 border-border/30 text-muted-foreground cursor-not-allowed"
            )}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button
            onClick={() => window.open(url, "_blank")}
            disabled={!sharingEnabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold border transition-all",
              sharingEnabled
                ? "bg-white border-border/60 hover:bg-secondary/40 text-primary shadow-sm"
                : "bg-muted/30 border-border/30 text-muted-foreground cursor-not-allowed"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Link Form ────────────────────────────────────────────
function AddLinkForm({
  onAdd,
  onCancel,
}: {
  onAdd: (link: ParentalLink) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!label.trim()) return;
    startTransition(async () => {
      if (IS_MOCK_MODE) {
        const mockLink: ParentalLink = {
          id: `plink-mock-${Date.now()}`,
          user_id: "mock-user-001",
          key: crypto.randomUUID(),
          label: label.trim(),
          created_at: new Date().toISOString(),
        };
        onAdd(mockLink);
        toast.success("[Mock] Share link created.");
        return;
      }
      const { link, error } = await createParentalLink(label.trim());
      if (error || !link) {
        toast.error(error ?? "Could not create link.");
      } else {
        onAdd(link);
        toast.success("Share link created!");
      }
    });
  }

  return (
    <div className="rounded-[1.25rem] border border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-[13px] font-semibold text-foreground">New share link</p>
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        maxLength={40}
        placeholder="Label, e.g. Mom, Dad, Guardian…"
        className="w-full h-11 px-4 rounded-xl bg-white border border-border/60 text-[14px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={isPending || !label.trim()}
          className="flex-1 h-10 rounded-xl gradient-primary text-white text-[13px] font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create link
        </button>
        <button
          onClick={onCancel}
          className="px-4 h-10 rounded-xl bg-white border border-border/60 text-[13px] font-semibold text-muted-foreground hover:bg-muted/40 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<ParentalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingPending, startSharingTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (IS_MOCK_MODE) {
        setProfile({ id: MOCK_PROFILE.id, email: MOCK_PROFILE.email, full_name: MOCK_PROFILE.full_name, is_sharing_enabled: MOCK_PROFILE.is_sharing_enabled });
        setLinks(MOCK_PARENTAL_LINKS);
        setLoading(false);
        return;
      }
      const [profileData, linksData] = await Promise.all([
        getUserProfile(),
        getParentalLinksForUser(),
      ]);
      setProfile(profileData);
      setLinks(linksData);
      setLoading(false);
    }
    load();
  }, []);

  function toggleSharing(enabled: boolean) {
    if (!profile) return;
    if (IS_MOCK_MODE) {
      setProfile((p) => p ? { ...p, is_sharing_enabled: enabled } : p);
      toast.success(enabled ? "[Mock] Sharing enabled." : "[Mock] Sharing disabled.");
      return;
    }
    startSharingTransition(async () => {
      const { error } = await updateSharingEnabled(profile.id, enabled);
      if (error) {
        toast.error(error);
      } else {
        setProfile((p) => p ? { ...p, is_sharing_enabled: enabled } : p);
        toast.success(enabled ? "Parental sharing enabled." : "Parental sharing disabled.");
      }
    });
  }

  async function handleSignOut() {
    if (IS_MOCK_MODE) {
      toast.info("[Mock] Sign out — connect a real DB to enable auth.");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  const sharingEnabled = profile?.is_sharing_enabled ?? false;

  return (
    <PageTransition className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-white shadow-sm border border-border/50">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-[28px] font-bold text-foreground">Settings</h1>
        </div>
        {profile && (
          <p className="text-[15px] font-medium text-muted-foreground pl-[3.5rem]">
            {profile.full_name ?? profile.email}
          </p>
        )}
      </div>

      <div className="px-5 space-y-6">
        {/* ── Parental Sharing Card ── */}
        <div className="rounded-[1.5rem] bg-white border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 space-y-5">
          {/* Section header */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">Parental Share Links</p>
              <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
                Give each parent their own read-only link
              </p>
            </div>
          </div>

          {/* Master toggle */}
          <div className="flex items-center justify-between py-3 border-t border-border/40">
            <Label htmlFor="sharing-toggle" className="text-[15px] font-medium text-foreground cursor-pointer">
              Enable sharing
            </Label>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="sharing-toggle"
                checked={sharingEnabled}
                onCheckedChange={toggleSharing}
                disabled={sharingPending}
              />
            )}
          </div>

          {/* Links list (only shown when sharing is on) */}
          {!loading && sharingEnabled && (
            <div className="space-y-3 pt-1">
              {links.length === 0 && !showAddForm && (
                <p className="text-[13px] text-muted-foreground text-center py-4">
                  No share links yet. Add one below.
                </p>
              )}

              {links.map((link) => (
                <ParentalLinkCard
                  key={link.id}
                  link={link}
                  sharingEnabled={sharingEnabled}
                  onDelete={(id) => setLinks((prev) => prev.filter((l) => l.id !== id))}
                  onLabelSaved={(id, label) =>
                    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, label } : l))
                  }
                />
              ))}

              {showAddForm ? (
                <AddLinkForm
                  onAdd={(newLink) => {
                    setLinks((prev) => [...prev, newLink]);
                    setShowAddForm(false);
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              ) : (
                links.length < 10 && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-[1.25rem] border-2 border-dashed border-border/60 text-[13px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Add another link
                  </button>
                )
              )}
            </div>
          )}

          {/* Disabled state hint */}
          {!loading && !sharingEnabled && (
            <p className="text-[13px] font-medium text-muted-foreground text-center pb-1">
              Enable sharing to manage links
            </p>
          )}
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-3 p-5 rounded-[1.25rem] bg-indigo-50 border border-indigo-100/50 shadow-sm">
          <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Parents can only see transactions marked as{" "}
            <strong className="text-foreground">Bill to Parent</strong> with an{" "}
            <strong className="text-foreground">Invoiced</strong> status. Personal expenses are never visible.
          </p>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full h-14 rounded-full text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-colors font-semibold tracking-wide flex items-center justify-center gap-2 bg-white shadow-sm"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>

      <BottomNav />
    </PageTransition>
  );
}
