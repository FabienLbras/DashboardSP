import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { ShieldCheck, Plus, Trash2, Loader2, AlertCircle, Eye, EyeOff, RefreshCw, Copy } from "lucide-react";
import { SpAdminService, SpAdmin } from "../services/spAdminService";
import { useToast } from "../hooks/useToast";
import { useLanguage } from "../context/LanguageContext";

type Form = { name: string; email: string; password: string; role: string };

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  // Guarantee at least one of each category
  const base = rand(upper) + rand(lower) + rand(digits) + rand(special);
  const rest = Array.from({ length: 8 }, () => rand(all)).join("");
  return (base + rest).split("").sort(() => Math.random() - 0.5).join("");
}

const emptyForm = (): Form => ({ name: "", email: "", password: generatePassword(), role: "sp_admin" });

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  sp_admin:    { label: "Admin",       color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
};

export default function SpAdmins() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const [admins, setAdmins] = useState<SpAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SpAdmin | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [changingRole, setChangingRole] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await SpAdminService.list();
      setAdmins(res.items);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(emptyForm());
    setFormError("");
    setShowPassword(true);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await SpAdminService.create({ ...form, lang });
      toast({ title: "Admin created", description: `${form.name} has been invited by email.` });
      setDialogOpen(false);
      setForm(emptyForm());
      load();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "Creation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeRole = async (admin: SpAdmin) => {
    const newRole = admin.role === "super_admin" ? "sp_admin" : "super_admin";
    setChangingRole(admin.id);
    try {
      const updated = await SpAdminService.changeRole(admin.id, newRole);
      setAdmins(prev => prev.map(a => a.id === updated.id ? updated : a));
      toast({ title: `Role changed to ${newRole === "super_admin" ? "Super Admin" : "Admin"}` });
    } catch (e: any) {
      toast({ title: "Change failed", description: e?.response?.data?.message });
    } finally {
      setChangingRole(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await SpAdminService.delete(deleteTarget.id);
      toast({ title: "Admin deleted" });
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.response?.data?.message });
    } finally {
      setDeleting(false);
    }
  };

  const superAdmins = admins.filter(a => a.role === "super_admin");
  const spAdmins    = admins.filter(a => a.role === "sp_admin");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            Platform Admins
          </h1>
          <p className="text-muted-foreground">Manage Success Payment platform administrators</p>
        </div>
        <Button onClick={openCreate} className="text-white bg-blue-700 hover:bg-blue-800">
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />Super Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{superAdmins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{spAdmins.length}</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Super Admin</strong> — full access + user management.<br />
              <strong>Admin</strong> — full access except creating other users.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin List</CardTitle>
          <CardDescription>{admins.length} platform administrator(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 rounded-md">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No admins yet. Create the first one!
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((a) => {
                    const roleInfo = ROLE_LABELS[a.role] || { label: a.role, color: "bg-gray-100 text-gray-800" };
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-semibold">{a.name}</TableCell>
                        <TableCell>{a.email}</TableCell>
                        <TableCell>
                          <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(a.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title={a.role === "super_admin" ? "Downgrade to Admin" : "Upgrade to Super Admin"}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleChangeRole(a)}
                              disabled={changingRole === a.id}
                            >
                              {changingRole === a.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <RefreshCw className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteTarget(a)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Platform Admin</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="space-y-4 py-2">
              {formError && (
                <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">{formError}</div>
              )}
              <div className="space-y-1">
                <Label>Role *</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="sp_admin">Admin — full access, cannot manage users</option>
                  <option value="super_admin">Super Admin — full access + user management</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Marie Dupont"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="marie@success-payment.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Temporary Password *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min. 8 characters"
                      className="pr-8 font-mono text-sm"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    title="Regenerate password"
                    className="px-2 rounded-md border border-input bg-background hover:bg-accent text-muted-foreground"
                    onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Copy password"
                    className="px-2 rounded-md border border-input bg-background hover:bg-accent text-muted-foreground"
                    onClick={() => navigator.clipboard.writeText(form.password)}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                An invitation email will be sent to the admin with their login credentials.
              </p>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
