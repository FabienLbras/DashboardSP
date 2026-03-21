import { usePropertyFilter } from "../../context/PropertyFilterContext";
import { useLanguage } from "../../context/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Building2 } from "lucide-react";

export default function PropertyFilterSelect() {
  const { properties, selectedProperty, setSelectedProperty } = usePropertyFilter();
  const { t } = useLanguage();

  if (!properties.length) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select
        value={selectedProperty ? String(selectedProperty.id) : "all"}
        onValueChange={(val) => {
          if (val === "all") setSelectedProperty(null);
          else setSelectedProperty(properties.find((p) => String(p.id) === val) || null);
        }}
      >
        <SelectTrigger className="w-44 h-9 text-sm">
          <SelectValue placeholder={t("allLocations") as string || "All locations"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{(t("allLocations") as string) || "All locations"}</SelectItem>
          {properties.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
