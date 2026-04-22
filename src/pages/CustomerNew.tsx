import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { ArrowLeft, Loader2, AlertCircle, Plus } from "lucide-react";
import { CustomerService } from "../services/customerService";
import { useToast } from "../hooks/useToast";
import { useLanguage } from "../context/LanguageContext";

type Form = {
  name: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
  zohoContactId: string;
  fixedFee: string;
  includedTxCount: string;
  extraTxUnitPrice: string;
  pricePerTerminal: string;
  taxRate: string;
};

export default function CustomerNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    zohoContactId: "",
    fixedFee: "100",
    includedTxCount: "1000",
    extraTxUnitPrice: "0.02",
    pricePerTerminal: "10",
    taxRate: "0.21",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    if (!form.email.trim()) { setFormError("Email is required."); return; }
    setSaving(true);
    try {
      const created = await CustomerService.create({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        zoho_id: form.zohoContactId.trim() || null,
        fixed_fee: Number(form.fixedFee || 100),
        included_tx_count: Number(form.includedTxCount || 1000),
        extra_tx_unit_price: Number(form.extraTxUnitPrice || 0.02),
        price_per_terminal: Number(form.pricePerTerminal || 10),
        tax_rate: Number(form.taxRate || 0.21),
      });
      toast({ title: "Customer created successfully" });
      navigate(`/customers/${created.id}`);
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "Create failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/customers")}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("newCustomer")}</h1>
          <p className="text-muted-foreground text-sm">{t("addCustomerDesc")}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("customerInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">{`${t("name")} *`}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Acme Hotels Ltd."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">{`${t("email")} *`}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@acme.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">{t("status")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("active")}</SelectItem>
                    <SelectItem value="inactive">{t("inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">{t("address")}</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St, Paris"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="zohoContactId">Zoho Contact ID</Label>
              <Input
                id="zohoContactId"
                value={form.zohoContactId}
                onChange={(e) => setForm({ ...form, zohoContactId: e.target.value })}
                placeholder="Auto-generated if left empty"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fixedFee">Monthly Fee</Label>
                <Input id="fixedFee" type="number" step="0.01" value={form.fixedFee} onChange={(e) => setForm({ ...form, fixedFee: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="includedTxCount">Included Transactions</Label>
                <Input id="includedTxCount" type="number" step="1" value={form.includedTxCount} onChange={(e) => setForm({ ...form, includedTxCount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="extraTxUnitPrice">Extra Transaction Price</Label>
                <Input id="extraTxUnitPrice" type="number" step="0.0001" value={form.extraTxUnitPrice} onChange={(e) => setForm({ ...form, extraTxUnitPrice: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pricePerTerminal">Price Per Terminal</Label>
                <Input id="pricePerTerminal" type="number" step="0.01" value={form.pricePerTerminal} onChange={(e) => setForm({ ...form, pricePerTerminal: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taxRate">Tax Rate</Label>
              <Input id="taxRate" type="number" step="0.0001" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/customers")}
                disabled={saving}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("creating")}</>
                ) : (
                  <><Plus className="h-4 w-4" />{t("createCustomer")}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
