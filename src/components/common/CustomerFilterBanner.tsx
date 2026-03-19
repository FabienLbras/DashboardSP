import { useAuth } from "../../context/AuthContext";
import { useCustomerFilter } from "../../context/CustomerFilterContext";
import { isSuperAdmin } from "../../lib/permissions";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Building2, X } from "lucide-react";

export default function CustomerFilterBanner() {
  const { user } = useAuth();
  const { selectedCustomer, setSelectedCustomer, customers, loadingCustomers } = useCustomerFilter();

  if (!isSuperAdmin(user?.role)) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg mb-4 text-sm dark:bg-blue-950/30 dark:border-blue-800">
      <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
      <span className="text-blue-800 dark:text-blue-300 font-medium whitespace-nowrap">Viewing as:</span>
      <Select
        value={selectedCustomer ? String(selectedCustomer.id) : "all"}
        onValueChange={(v) => {
          if (v === "all") setSelectedCustomer(null);
          else setSelectedCustomer(customers.find((c) => String(c.id) === v) ?? null);
        }}
        disabled={loadingCustomers}
      >
        <SelectTrigger className="w-56 h-8 text-sm bg-white border-blue-300 dark:bg-gray-900">
          <SelectValue placeholder={loadingCustomers ? "Loading..." : "All Customers"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Customers</SelectItem>
          {customers.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
              {c.status === "inactive" && (
                <span className="ml-1 text-xs text-gray-400">(inactive)</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedCustomer && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
          onClick={() => setSelectedCustomer(null)}
        >
          <X className="h-3 w-3 mr-1" />Clear
        </Button>
      )}
      {selectedCustomer && (
        <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
          Filtered to: <strong>{selectedCustomer.name}</strong>
        </span>
      )}
    </div>
  );
}
