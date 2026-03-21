import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Search, Plus, Wifi, WifiOff, QrCode, KeyRound, Loader2, AlertCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { QRCodeSVG } from "qrcode.react";
import { useCustomerFilter } from "../context/CustomerFilterContext";
import { usePropertyFilter } from "../context/PropertyFilterContext";
import { isSuperAdmin } from "../lib/permissions";
import { useAuth } from "../context/AuthContext";
import { APP_PERMISSIONS, hasPermission } from "../lib/permissions";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../hooks/useToast";
import { TerminalService, Terminal } from "../services/terminalService";
import PropertyFilterSelect from "../components/common/PropertyFilterSelect";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

type TerminalForm = { name: string; serial_number: string; location: string; model: string; status: "active" | "inactive" };
const emptyForm: TerminalForm = { name: "", serial_number: "", location: "", model: "", status: "active" };

export default function Terminals() {
  const { user } = useAuth();
  const { selectedCustomer, setSelectedCustomer, customers } = useCustomerFilter();
  const { selectedProperty } = usePropertyFilter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const isAdmin = isSuperAdmin(user?.role);
  const isHotelMgr = user?.role === "hotel_manager";
  const canManage = hasPermission(user?.role, APP_PERMISSIONS.MANAGE_TERMINALS);

  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Terminal | null>(null);
  const [form, setForm] = useState<TerminalForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Terminal | null>(null);
  const [deleting, setDeleting] = useState(false);

  // QR code dialog
  const [qrTerminal, setQrTerminal] = useState<{ id: number; name: string; api_key: string } | null>(null);
  const [generatingKey, setGeneratingKey] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, number> = {};
      if (selectedCustomer) params.customer_id = selectedCustomer.id;
      if (selectedProperty) params.property_id = selectedProperty.id;
      const res = await TerminalService.list(params);
      setTerminals(res.items);
    } catch (e: any) {
      setError(e?.response?.data?.message || t("noTerminalsYet"));
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, selectedProperty]);

  useEffect(() => { load(); }, [load]);

  const filteredTerminals = terminals.filter((term) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      String(term.id).includes(q) ||
      term.name.toLowerCase().includes(q) ||
      (term.location || "").toLowerCase().includes(q) ||
      (term.serial_number || "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (t: Terminal) => {
    setEditing(t);
    setForm({ name: t.name, serial_number: t.serial_number || "", location: t.location || "", model: t.model || "", status: t.status });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editing) {
        await TerminalService.update(editing.id, form);
        toast({ title: "Terminal updated" });
      } else {
        await TerminalService.create(form);
        toast({ title: "Terminal created" });
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await TerminalService.delete(deleteTarget.id);
      toast({ title: "Terminal deleted" });
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.response?.data?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateKey = async (terminal: Terminal) => {
    setGeneratingKey(terminal.id);
    try {
      const res = await TerminalService.generateKey(terminal.id);
      setQrTerminal({ id: res.terminal.id, name: res.terminal.name, api_key: res.terminal.api_key });
      load();
    } catch (e: any) {
      toast({ title: "Failed to generate key", description: e?.response?.data?.message });
    } finally {
      setGeneratingKey(null);
    }
  };

  const handleShowKey = async (terminal: Terminal) => {
    setGeneratingKey(terminal.id);
    try {
      const res = await TerminalService.getKey(terminal.id);
      if (!res.api_key) {
        toast({ title: t("noKeyYet"), description: t("generateFirst") });
        return;
      }
      setQrTerminal({ id: res.id, name: res.name, api_key: res.api_key });
    } catch (e: any) {
      toast({ title: "Failed to get key", description: e?.response?.data?.message });
    } finally {
      setGeneratingKey(null);
    }
  };

  const qrPayload = qrTerminal
    ? JSON.stringify({ api_key: qrTerminal.api_key, base_url: API_BASE_URL, terminal_id: qrTerminal.id })
    : "";

  const getStatusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-100 text-green-800"><Wifi className="h-3 w-3 mr-1" />{t("active")}</Badge>;
    return <Badge className="bg-red-100 text-red-800"><WifiOff className="h-3 w-3 mr-1" />{t("inactive")}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{t("terminalManagement")}</h1>
          <p className="text-muted-foreground">{t("monitorTerminals")}</p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="text-white bg-blue-700 hover:bg-blue-800">
            <Plus className="h-4 w-4 mr-2" />
            {t("addTerminal")}
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalTerminals")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{terminals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("acrossAllLocations")}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("onlineTerminals")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {terminals.filter(term => term.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("currentlyActive")}</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {terminals.filter(term => term.api_key).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("terminalsConfigured")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="text-lg">{t("filter")}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={t("searchTerminal")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            {isAdmin && (
              <Select
                value={selectedCustomer ? String(selectedCustomer.id) : "all"}
                onValueChange={(v) => setSelectedCustomer(v === "all" ? null : (customers.find((c) => String(c.id) === v) ?? null))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("allCustomers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCustomers")}</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isHotelMgr && <PropertyFilterSelect />}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("connectedTerminals")}</CardTitle>
          <CardDescription>{filteredTerminals.length} {t("terminalsFound")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span className="text-muted-foreground">{t("loading")}</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 rounded-md">
              <AlertCircle className="h-5 w-5" />{error}
            </div>
          ) : filteredTerminals.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {terminals.length === 0 ? t("noTerminalsYet") : t("noTerminalsMatch")}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("terminalId")}</TableHead>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("serialNumber")}</TableHead>
                    <TableHead>{t("location")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>{t("lastSeen")}</TableHead>
                    {canManage && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerminals.map((terminal) => (
                    <TableRow key={terminal.id}>
                      <TableCell className="font-medium">#{terminal.id}</TableCell>
                      <TableCell>{terminal.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{terminal.serial_number || "—"}</TableCell>
                      <TableCell>{terminal.location || "—"}</TableCell>
                      <TableCell>{getStatusBadge(terminal.status)}</TableCell>
                      <TableCell>
                        {terminal.api_key ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800 font-mono text-xs">
                              {terminal.api_key.slice(0, 8)}…
                            </Badge>
                            {isAdmin && (
                              <Button variant="ghost" size="sm" onClick={() => handleShowKey(terminal)} disabled={generatingKey === terminal.id}>
                                {generatingKey === terminal.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <QrCode className="h-3 w-3" />}
                              </Button>
                            )}
                          </div>
                        ) : (
                          isAdmin ? (
                            <Button variant="outline" size="sm" onClick={() => handleGenerateKey(terminal)} disabled={generatingKey === terminal.id}>
                              {generatingKey === terminal.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <KeyRound className="h-3 w-3 mr-1" />}
                              {t("generateKey")}
                            </Button>
                          ) : <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {terminal.last_seen_at ? new Date(terminal.last_seen_at).toLocaleString() : "—"}
                      </TableCell>
                      {canManage && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isAdmin && (
                                <DropdownMenuItem onClick={() => handleGenerateKey(terminal)}>
                                  <KeyRound className="h-4 w-4 mr-2" />{t("regenerateKey")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openEdit(terminal)}>
                                <Edit className="h-4 w-4 mr-2" />{t("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteTarget(terminal)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />{t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") + " Terminal" : t("addTerminal")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="space-y-4 py-2">
              {formError && <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">{formError}</div>}
              <div className="space-y-1">
                <Label>{t("name")} *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reception POS" required />
              </div>
              <div className="space-y-1">
                <Label>{t("serialNumber")}</Label>
                <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} placeholder="TRM-00123" />
              </div>
              <div className="space-y-1">
                <Label>{t("location")}</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Main Reception" />
              </div>
              <div className="space-y-1">
                <Label>{t("model")}</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Ingenico Move 5000" />
              </div>
              <div className="space-y-1">
                <Label>{t("status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("active")}</SelectItem>
                    <SelectItem value="inactive">{t("inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>{t("cancel")}</Button>
              <Button type="submit" disabled={saving}>{saving ? t("saving") : t("saveChanges")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t("delete")} Terminal</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>{t("cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrTerminal} onOpenChange={(o) => !o && setQrTerminal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Terminal API Key
            </DialogTitle>
          </DialogHeader>
          {qrTerminal && (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="text-sm text-muted-foreground text-center">
                {t("scanQrTerminal")} <strong>{qrTerminal.name}</strong>.
              </p>
              <div className="p-4 bg-white rounded-xl border shadow-sm">
                <QRCodeSVG value={qrPayload} size={200} level="M" />
              </div>
              <div className="w-full space-y-1">
                <Label className="text-xs text-muted-foreground">API Key</Label>
                <div className="p-2 bg-muted rounded font-mono text-xs break-all select-all">
                  {qrTerminal.api_key}
                </div>
              </div>
              <p className="text-xs text-amber-600 text-center">
                {t("storeKeySecurely")}
              </p>
              <Button variant="outline" size="sm" onClick={() => handleGenerateKey({ id: qrTerminal.id } as Terminal)}>
                <KeyRound className="h-3 w-3 mr-2" />{t("regenerateKey")}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setQrTerminal(null)}>{t("close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
