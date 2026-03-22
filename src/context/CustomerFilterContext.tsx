import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Customer, CustomerService } from "../services/customerService";

interface CustomerFilterContextType {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;
  customers: Customer[];
  loadingCustomers: boolean;
}

const STORAGE_KEY = "sp_selected_customer_id";

const CustomerFilterContext = createContext<CustomerFilterContextType>({
  selectedCustomer: null,
  setSelectedCustomer: () => {},
  customers: [],
  loadingCustomers: false,
});

export const useCustomerFilter = () => useContext(CustomerFilterContext);

export const CustomerFilterProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomerState] = useState<Customer | null>(null);

  useEffect(() => {
    setLoadingCustomers(true);
    CustomerService.list()
      .then(({ items }) => {
        setCustomers(items);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const found = items.find((c) => String(c.id) === stored);
          if (found) setSelectedCustomerState(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCustomers(false));
  }, []);

  const setSelectedCustomer = (c: Customer | null) => {
    setSelectedCustomerState(c);
    if (c) localStorage.setItem(STORAGE_KEY, String(c.id));
    else localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CustomerFilterContext.Provider value={{ selectedCustomer, setSelectedCustomer, customers, loadingCustomers }}>
      {children}
    </CustomerFilterContext.Provider>
  );
};
