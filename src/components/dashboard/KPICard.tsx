import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

export function KPICard({ title, value, change, icon: Icon, description }: KPICardProps) {
  return (
    <Card className="hover:shadow-medium transition-shadow bg-whit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-light text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="font-bold text-gray-800 text-title-sm dark:text-white/90">{value}</div>
        {change && (
          <div className="flex items-center mt-2">
            {change.type === "increase" ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <Badge 
              variant={change.type === "increase" ? "default" : "destructive"}
              className="text-xs"
            >
              {change.value > 0 ? "+" : ""}{change.value}%
            </Badge>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}