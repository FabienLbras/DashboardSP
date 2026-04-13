import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Loader2, Check, FileText, Globe, RefreshCw } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { CustomerService, Customer } from "../../services/customerService";
import { BillingService } from "../../services/billingService";
import type { BillingInvoice } from "../../types/billing";
import { type Language, getInvoiceTranslation } from "../../lib/invoiceTranslations";

interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const availableLanguages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
];

function getDefaultDates() {
  const now = new Date();
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return {
    start: fmt(firstDayLastMonth),
    end: fmt(lastDayLastMonth),
  };
}

export function InvoiceCreateDialog({ open, onOpenChange }: InvoiceCreateDialogProps) {
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");

  const t = (key: string) => getInvoiceTranslation(selectedLanguage, key);

  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<BillingInvoice | null>(null);

  const loadCustomers = () => {
    setLoadingCustomers(true);
    CustomerService.list()
      .then((res) => {
        console.log("[InvoiceDialog] CustomerService.list() response:", res);
        const items = Array.isArray(res?.items) ? res.items : [];
        console.log("[InvoiceDialog] customers loaded:", items.length, "items");
        setCustomers(items);
      })
      .catch((err) => {
        console.error("[InvoiceDialog] CustomerService.list() ERROR:", err);
        toast({ title: "Error", description: "Failed to load customers" });
        setCustomers([]);
      })
      .finally(() => setLoadingCustomers(false));
  };

  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  useEffect(() => {
    console.log("[InvoiceDialog] useEffect triggered — selectedCustomer:", selectedCustomer?.id ?? null, "startDate:", startDate, "endDate:", endDate);
    if (!selectedCustomer) return;
    handleGenerate(selectedCustomer);
  }, [selectedCustomer, startDate, endDate]);

  const handleGenerate = async (customer: Customer) => {
    console.log("[InvoiceDialog] handleGenerate START — customer:", customer.id, customer.name, "dates:", startDate, "→", endDate);
    setIsGenerating(true);
    setGeneratedInvoice(null);
    try {
      const invoice = await BillingService.generateInvoice(
        {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          address: customer.address,
          status: customer.status,
        },
        { start_date: startDate, end_date: endDate }
      );
      console.log("[InvoiceDialog] handleGenerate SUCCESS — invoice:", invoice);
      console.log("[InvoiceDialog]   totals:", invoice?.totals);
      console.log("[InvoiceDialog]   invoice_lines:", invoice?.invoice_lines);
      console.log("[InvoiceDialog]   source_data:", invoice?.source_data);
      console.log("[InvoiceDialog]   ABOUT TO RENDER — setting generatedInvoice");
      setGeneratedInvoice(invoice);
    } catch (err) {
      console.error("[InvoiceDialog] handleGenerate ERROR:", err);
      toast({ title: "Error", description: "Failed to generate invoice" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomerChange = (id: string) => {
    console.log("[InvoiceDialog] handleCustomerChange — id:", id, "customers array length:", customers?.length);
    const c = (customers ?? []).find((c) => String(c.id) === id);
    console.log("[InvoiceDialog]   customer found:", c ? `${c.id} / ${c.name}` : "NOT FOUND");
    setSelectedCustomerId(id);
    setSelectedCustomer(c ?? null);
    if (c && (c as any).language) {
      console.log("[InvoiceDialog]   auto-setting language:", (c as any).language);
      setSelectedLanguage((c as any).language as Language);
    }
  };

  const handleClose = () => {
    setSelectedCustomer(null);
    setSelectedCustomerId("");
    setGeneratedInvoice(null);
    setSelectedLanguage("en");
    const d = getDefaultDates();
    setStartDate(d.start);
    setEndDate(d.end);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("generateInvoice")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <Label>{t("customer")} *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-muted-foreground hover:text-foreground"
                  onClick={loadCustomers}
                  disabled={loadingCustomers}
                  title="Rafraîchir"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingCustomers ? "animate-spin" : ""}`} />
                </Button>
              </div>
              {loadingCustomers ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
                </div>
              ) : (
                <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCustomer")} />
                  </SelectTrigger>
                  <SelectContent onPointerDownOutside={(e) => e.preventDefault()}>
                    {(customers ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("startDate")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("endDate")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
              </Label>
              <Select value={selectedLanguage} onValueChange={(val) => setSelectedLanguage(val as Language)}>
                <SelectTrigger>
                  <SelectValue>
                    {(() => {
                      const lang = availableLanguages.find(l => l.code === selectedLanguage);
                      return lang ? `${lang.flag} ${lang.name}` : selectedLanguage;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent onPointerDownOutside={(e) => e.preventDefault()}>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isGenerating && (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              {t("generatingInvoice")}
            </div>
          )}

          {!isGenerating && generatedInvoice && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {t("generatedInvoice")}
              </h3>

              <Card>
                <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("periodStart")}</p>
                    <p className="font-medium">{generatedInvoice.billing_period.period_start}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("periodEnd")}</p>
                    <p className="font-medium">{generatedInvoice.billing_period.period_end}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("invoiceDate")}</p>
                    <p className="font-medium">{generatedInvoice.billing_period.invoice_date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("dueDate")}</p>
                    <p className="font-medium">{generatedInvoice.billing_period.due_date}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {t("sourceData")}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t("totalTransactions")}</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {generatedInvoice.source_data.tx_count}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-600" />
                            {t("successful")}
                          </span>
                          <span className="font-medium">
                            {generatedInvoice.source_data.tx_count}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t font-semibold">
                          <span className="text-muted-foreground">{t("totalVolume")}</span>
                          <span className="text-blue-600">
                            €{(generatedInvoice.totals?.subtotal ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t("totalTerminals")}</p>
                            <p className="text-2xl font-bold text-green-600">
                              {generatedInvoice.source_data.terminal_count}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            {t("active")}
                          </span>
                          <span className="font-medium">
                            {Math.floor(generatedInvoice.source_data.terminal_count * 0.85)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            {t("inactive")}
                          </span>
                          <span className="font-medium">
                            {Math.floor(generatedInvoice.source_data.terminal_count * 0.15)}
                          </span>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-2">{t("byLocation")}:</p>
                          <div className="space-y-1.5">
                            {(generatedInvoice.source_data?.terminals_by_location ?? []).map((loc) => (
                              <div key={loc.location} className="flex items-center justify-between text-sm bg-muted/50 px-2 py-1.5 rounded">
                                <span className="flex items-center gap-2">
                                  <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {loc.location}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {loc.count}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center gap-2 border-b bg-muted/30">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                  <p className="font-semibold text-sm">{t("invoiceLines")}</p>
                </div>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                        <th className="text-left px-4 py-2.5">{t("description")}</th>
                        <th className="text-right px-3 py-2.5">{t("qty")}</th>
                        <th className="text-right px-3 py-2.5">{t("unitPrice")}</th>
                        <th className="text-right px-4 py-2.5">{t("amount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const included = generatedInvoice.pricing?.included_tx_count ?? 1000;
                        const lineConfigs = [
                          {
                            icon: (
                              <div className="p-1.5 bg-blue-100 rounded">
                                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            ),
                            label: `Forfait mensuel — ${included.toLocaleString()} tx incluses`,
                            detail: null as string | null,
                            bg: "bg-white",
                          },
                          {
                            icon: (
                              <div className="p-1.5 bg-amber-100 rounded">
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                            ),
                            label: "Transactions supplémentaires",
                            detail: null as string | null,
                            bg: "bg-muted/20",
                          },
                          {
                            icon: (
                              <div className="p-1.5 bg-green-100 rounded">
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                              </div>
                            ),
                            label: "Frais de terminaux",
                            detail: null as string | null,
                            bg: "bg-white",
                          },
                        ];

                        return (generatedInvoice.invoice_lines ?? [])
                          .map((line, i) => {
                            const cfg = lineConfigs[i] ?? { icon: null, label: line.description, detail: null, bg: i % 2 === 0 ? "bg-white" : "bg-muted/20" };
                            if (i === 1 && line.quantity > 0) {
                              cfg.detail = `${line.quantity.toLocaleString()} tx × €${(line.unit_price ?? 0).toFixed(2)}`;
                            } else if (i === 2 && line.quantity > 0) {
                              cfg.detail = `${line.quantity} terminal${line.quantity > 1 ? "x" : ""} × €${(line.unit_price ?? 0).toFixed(2)}`;
                            }
                            return { line, i, cfg };
                          })
                          .filter(({ line }) => (line.amount ?? 0) > 0)
                          .map(({ line, i, cfg }) => (
                            <tr key={i} className={`border-b last:border-0 hover:brightness-95 transition-all ${cfg.bg}`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  {cfg.icon}
                                  <div>
                                    <div className="font-medium text-foreground">{cfg.label}</div>
                                    {cfg.detail && (
                                      <div className="text-xs text-muted-foreground mt-0.5 font-mono">{cfg.detail}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="text-right px-3 py-3 tabular-nums text-muted-foreground">{line.quantity}</td>
                              <td className="text-right px-3 py-3 tabular-nums text-muted-foreground">€{(line.unit_price ?? 0).toFixed(2)}</td>
                              <td className="text-right px-4 py-3 font-semibold tabular-nums">€{(line.amount ?? 0).toFixed(2)}</td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>

                  <div className="flex justify-end px-4 py-4 border-t bg-muted/10">
                    <div className="w-64 space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("subtotal")}</span>
                        <span className="tabular-nums">€{(generatedInvoice.totals?.subtotal ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t("tax")} ({((generatedInvoice.pricing?.tax_rate ?? 0.21) * 100).toFixed(0)}%)</span>
                        <span className="tabular-nums">€{(generatedInvoice.totals?.tax_total ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t pt-2 text-foreground">
                        <span>{t("total")}</span>
                        <span className="tabular-nums text-blue-700">€{(generatedInvoice.totals?.grand_total ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>{t("cancel")}</Button>
            {generatedInvoice && (
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleClose}>
                <Check className="w-4 h-4 mr-2" />
                {t("done")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}