import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Loader2, Check, FileText, Globe } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { CustomerService, Customer } from "../../services/customerService";
import { BillingService } from "../../services/billingService";
import type { BillingInvoice } from "../../types/billing";
import { invoiceTranslations, type Language, getInvoiceTranslation } from "../../lib/invoiceTranslations";

interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Calcule les dates par défaut : dernier mois complet
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

// Liste des langues disponibles avec drapeaux
const availableLanguages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
];

export function InvoiceCreateDialog({ open, onOpenChange }: InvoiceCreateDialogProps) {
  const { toast } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");

  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<BillingInvoice | null>(null);

  // Fonction de traduction
  const t = (key: string) => getInvoiceTranslation(selectedLanguage, key);

  // Charger les clients à l'ouverture
  useEffect(() => {
    if (open) {
      setLoadingCustomers(true);
      CustomerService.list()
        .then((res) => setCustomers(res.items))
        .catch(() => toast({ title: t("error"), description: t("failedToLoad") }))
        .finally(() => setLoadingCustomers(false));
    }
  }, [open]);

  //  Génération automatique dès qu'un client est sélectionné
  useEffect(() => {
    if (!selectedCustomer) return;
    handleGenerate(selectedCustomer);
  }, [selectedCustomer, startDate, endDate]);

  const handleGenerate = async (customer: Customer) => {
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
      setGeneratedInvoice(invoice);
    } catch {
      toast({ title: t("error"), description: t("failedToGenerate") });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => String(c.id) === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      // Définir automatiquement la langue du client si disponible
      if ((customer as any).language) {
        setSelectedLanguage((customer as any).language as Language);
      }
    }
  };

  const handleClose = () => {
    setSelectedCustomer(null);
    setGeneratedInvoice(null);
    setSelectedLanguage("en");
    const d = getDefaultDates();
    setStartDate(d.start);
    setEndDate(d.end);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("generateInvoice")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">

          {/* Sélection client + dates + langue */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label>{t("customer")} *</Label>
              {loadingCustomers ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
                </div>
              ) : (
                <Select onValueChange={handleCustomerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCustomer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
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

            {/* Sélecteur de langue */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
              </Label>
              <Select value={selectedLanguage} onValueChange={(val) => setSelectedLanguage(val as Language)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading */}
          {isGenerating && (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              {t("generatingInvoice")}
            </div>
          )}

          {/* Résultat */}
          {!isGenerating && generatedInvoice && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {t("generatedInvoice")}
              </h3>

              {/* Période */}
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

              {/* Source data - VERSION AMÉLIORÉE MULTILINGUE */}
              <div className="space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {t("sourceData")}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card Transactions */}
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
                      
                      {/* Détails des transactions */}
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
                            €{generatedInvoice.totals.subtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card Terminals */}
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
                      
                      {/* Détails des terminaux */}
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
                        
                        {/* By Location */}
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-2">{t("byLocation")}:</p>
                          <div className="space-y-1.5">
                            {generatedInvoice.source_data.terminals_by_location.map((location) => (
                              <div key={location.location} className="flex items-center justify-between text-sm bg-muted/50 px-2 py-1.5 rounded">
                                <span className="flex items-center gap-2">
                                  <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {location.location}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {location.count}
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

              {/* Lignes facture */}
              <Card>
                <CardContent className="p-4">
                  <p className="font-semibold mb-3">{t("invoiceLines")}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">{t("description")}</th>
                        <th className="text-right py-2">{t("qty")}</th>
                        <th className="text-right py-2">{t("unitPrice")}</th>
                        <th className="text-right py-2">{t("amount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedInvoice.invoice_lines.map((line, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="py-2">{line.description}</td>
                          <td className="text-right py-2">{line.quantity}</td>
                          <td className="text-right py-2">€{line.unit_price.toFixed(2)}</td>
                          <td className="text-right py-2 font-medium">€{line.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end mt-4">
                    <div className="w-64 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{t("subtotal")}:</span>
                        <span>€{generatedInvoice.totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("tax")} (21%):</span>
                        <span>€{generatedInvoice.totals.tax_total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>{t("total")}:</span>
                        <span>€{generatedInvoice.totals.grand_total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer */}
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