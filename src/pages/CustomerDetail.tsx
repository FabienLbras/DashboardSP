import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  ArrowLeft, Plus, MoreHorizontal, Edit, Trash2, Building2,
  Users, Hotel, UtensilsCrossed, ShoppingBag, Loader2, AlertCircle,
} from "lucide-react";
import { CustomerService, CustomerDetail, Property, CustomerUser } from "../services/customerService";
import { useToast } from "../hooks/useToast";
import { getRoleLabel, APP_ROLES } from "../lib/permissions";

const CUSTOMER_ROLES = [
  APP_ROLES.HOTEL_MANAGER,
  APP_ROLES.FINANCIAL_MANAGER,
  APP_ROLES.FRONT_OFFICE_MANAGER,
  APP_ROLES.FRONT_OFFICE_OPERATOR,
];

const PROPERTY_TYPES = ["hotel", "restaurant", "retail"];

const typeIcon = (type: string) => {
  if (type === "restaurant") return <UtensilsCrossed className="h-4 w-4 text-orange-500" />;
  if (type === "retail") return <ShoppingBag className="h-4 w-4 text-purple-500" />;
  return <Hotel className="h-4 w-4 text-blue-500" />;
};

const emptyProp = { name: "", type: "hotel", address: "", status: "active" as const };
const emptyUser = { name: "", email: "", role: APP_ROLES.FRONT_OFFICE_OPERATOR, password: "" };

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const customerId = Number(id);

  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Property dialog
  const [propDialog, setPropDialog] = useState(false);
  const [editProp, setEditProp] = useState<Property | null>(null);
  const [propForm, setPropForm] = useState(emptyProp);
  const [propSaving, setPropSaving] = useState(false);
  const [propError, setPropError] = useState("");
  const [deleteProp, setDeleteProp] = useState<Property | null>(null);

  // User dialog
  const [userDialog, setUserDialog] = useState(false);
  const [editUser, setEditUser] = useState<CustomerUser | null>(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState("");
  const [deleteUser, setDeleteUser] = useState<CustomerUser | null>(null);
  const [showPass, setShowPass] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await CustomerService.get(customerId);
      setData(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load customer");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  // ── Properties ───────────────────────────────────────────────────────────────
  const openAddProp = () => { setEditProp(null); setPropForm(emptyProp); setPropError(""); setPropDialog(true); };
  const openEditProp = (p: Property) => { setEditProp(p); setPropForm({ name: p.name, type: p.type, address: p.address || "", status: p.status }); setPropError(""); setPropDialog(true); };

  const saveProp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropError(""); setPropSaving(true);
    try {
      if (editProp) {
        await CustomerService.updateProperty(customerId, editProp.id, propForm);
        toast({ title: "Property updated" });
      } else {
        await CustomerService.addProperty(customerId, propForm);
        toast({ title: "Property added" });
      }
      setPropDialog(false);
      load();
    } catch (e: any) {
      setPropError(e?.response?.data?.message || "Save failed");
    } finally {
      setPropSaving(false);
    }
  };

  const confirmDeleteProp = async () => {
    if (!deleteProp) return;
    try {
      await CustomerService.deleteProperty(customerId, deleteProp.id);
      toast({ title: "Property deleted" });
      setDeleteProp(null);
      load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.response?.data?.message });
    }
  };

  // ── Users ────────────────────────────────────────────────────────────────────
  const openAddUser = () => { setEditUser(null); setUserForm(emptyUser); setUserError(""); setUserDialog(true); };
  const openEditUser = (u: CustomerUser) => { setEditUser(u); setUserForm({ name: u.name, email: u.email, role: u.role, password: "" }); setUserError(""); setUserDialog(true); };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(""); setUserSaving(true);
    try {
      if (editUser) {
        await CustomerService.updateUser(customerId, editUser.id, { name: userForm.name, role: userForm.role });
        toast({ title: "User updated" });
      } else {
        if (!userForm.password || userForm.password.length < 8) {
          setUserError("Password must be at least 8 characters.");
          setUserSaving(false);
          return;
        }
        await CustomerService.addUser(customerId, userForm);
        toast({ title: "User created" });
      }
      setUserDialog(false);
      load();
    } catch (e: any) {
      setUserError(e?.response?.data?.message || "Save failed");
    } finally {
      setUserSaving(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteUser) return;
    try {
      await CustomerService.deleteUser(customerId, deleteUser.id);
      toast({ title: "User deleted" });
      setDeleteUser(null);
      load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.response?.data?.message });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin mr-2" />
      <span className="text-muted-foreground">Loading customer...</span>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center gap-4 py-24">
      <div className="flex items-center gap-2 text-red-600"><AlertCircle className="h-5 w-5" />{error || "Not found"}</div>
      <Button variant="outline" onClick={() => navigate("/customers")}>
        <ArrowLeft className="h-4 w-4 mr-2" />Back to Customers
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/customers")}>
          <ArrowLeft className="h-4 w-4 mr-1" />Customers
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            {data.name}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{data.email}</span>
            {data.phone && <span>· {data.phone}</span>}
            {data.address && <span>· {data.address}</span>}
            <Badge className={data.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
              {data.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Properties", value: data.properties.length, icon: <Building2 className="h-4 w-4 text-blue-500" /> },
          { label: "Hotels", value: data.properties.filter(p => p.type === "hotel").length, icon: <Hotel className="h-4 w-4 text-blue-400" /> },
          { label: "Restaurants", value: data.properties.filter(p => p.type === "restaurant").length, icon: <UtensilsCrossed className="h-4 w-4 text-orange-400" /> },
          { label: "Users", value: data.users.length, icon: <Users className="h-4 w-4 text-purple-500" /> },
        ].map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">{s.icon}{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Properties */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Properties</CardTitle>
          <Button size="sm" onClick={openAddProp} className="text-white bg-blue-700 hover:bg-blue-800">
            <Plus className="h-4 w-4 mr-1" />Add Property
          </Button>
        </CardHeader>
        <CardContent>
          {data.properties.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No properties yet. Add the first one!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.properties.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 capitalize">
                        {typeIcon(p.type)}{p.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.address || "—"}</TableCell>
                    <TableCell>
                      <Badge className={p.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditProp(p)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteProp(p)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Users</CardTitle>
          <Button size="sm" onClick={openAddUser} className="text-white bg-blue-700 hover:bg-blue-800">
            <Plus className="h-4 w-4 mr-1" />Add User
          </Button>
        </CardHeader>
        <CardContent>
          {data.users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users yet. Add the first one!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getRoleLabel(u.role)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditUser(u)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteUser(u)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Property Dialog */}
      <Dialog open={propDialog} onOpenChange={setPropDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editProp ? "Edit Property" : "Add Property"}</DialogTitle></DialogHeader>
          <form onSubmit={saveProp}>
            <div className="space-y-4 py-2">
              {propError && <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">{propError}</div>}
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input value={propForm.name} onChange={(e) => setPropForm({ ...propForm, name: e.target.value })} placeholder="Grand Hôtel Paris" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={propForm.type} onValueChange={(v) => setPropForm({ ...propForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={propForm.status} onValueChange={(v) => setPropForm({ ...propForm, status: v as "active" | "inactive" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Address</Label>
                <Input value={propForm.address} onChange={(e) => setPropForm({ ...propForm, address: e.target.value })} placeholder="12 Rue de Rivoli, Paris" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setPropDialog(false)} disabled={propSaving}>Cancel</Button>
              <Button type="submit" disabled={propSaving}>{propSaving ? "Saving..." : editProp ? "Save" : "Add Property"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editUser ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <form onSubmit={saveUser}>
            <div className="space-y-4 py-2">
              {userError && <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">{userError}</div>}
              <div className="space-y-1">
                <Label>Full Name *</Label>
                <Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="Jean Dupont" required />
              </div>
              {!editUser && (
                <div className="space-y-1">
                  <Label>Email *</Label>
                  <Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="jean@hotel.com" required />
                </div>
              )}
              <div className="space-y-1">
                <Label>Role *</Label>
                <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CUSTOMER_ROLES.map((r) => <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {!editUser && (
                <div className="space-y-1">
                  <Label>Password * <span className="text-xs text-muted-foreground">(min 8 chars)</span></Label>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Temporary password"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setUserDialog(false)} disabled={userSaving}>Cancel</Button>
              <Button type="submit" disabled={userSaving}>{userSaving ? "Saving..." : editUser ? "Save" : "Create User"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Property Confirm */}
      <Dialog open={!!deleteProp} onOpenChange={(o) => !o && setDeleteProp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete Property</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Delete <strong>{deleteProp?.name}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProp(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteProp}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirm */}
      <Dialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Delete <strong>{deleteUser?.name}</strong> ({deleteUser?.email})? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
