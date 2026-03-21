import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { AuthService } from "../services/authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const api = axios.create({ baseURL: API_BASE_URL });
api.interceptors.request.use((config) => {
  const token = AuthService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Property {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface PropertyFilterContextType {
  selectedProperty: Property | null;
  setSelectedProperty: (p: Property | null) => void;
  properties: Property[];
  loadingProperties: boolean;
}

const STORAGE_KEY = "sp_selected_property_id";

const PropertyFilterContext = createContext<PropertyFilterContextType>({
  selectedProperty: null,
  setSelectedProperty: () => {},
  properties: [],
  loadingProperties: false,
});

export const usePropertyFilter = () => useContext(PropertyFilterContext);

export const PropertyFilterProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedProperty, setSelectedPropertyState] = useState<Property | null>(null);

  const isCustomerScoped =
    user?.role === "hotel_manager" || user?.role === "admin";

  useEffect(() => {
    if (!isCustomerScoped) {
      setProperties([]);
      setSelectedPropertyState(null);
      return;
    }
    setLoadingProperties(true);
    api.get("/my/properties")
      .then(({ data }) => {
        const items: Property[] = data.items || [];
        setProperties(items);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const found = items.find((p) => String(p.id) === stored);
          if (found) setSelectedPropertyState(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProperties(false));
  }, [user?.role, user?.email]);

  const setSelectedProperty = (p: Property | null) => {
    setSelectedPropertyState(p);
    if (p) localStorage.setItem(STORAGE_KEY, String(p.id));
    else localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <PropertyFilterContext.Provider value={{ selectedProperty, setSelectedProperty, properties, loadingProperties }}>
      {children}
    </PropertyFilterContext.Provider>
  );
};
