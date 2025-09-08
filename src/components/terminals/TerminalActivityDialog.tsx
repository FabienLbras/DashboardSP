import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { ScrollArea } from "../../components/ui/scroll-area";
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle 
} from "lucide-react";

interface Terminal {
  id: string;
  name: string;
  location: string;
  status: string;
  lastSeen: string;
  todayTransactions: number;
  todayRevenue: number;
}

interface TerminalActivityDialogProps {
  terminal: Terminal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock activity data
const mockActivity = [
  {
    id: "1",
    type: "transaction",
    status: "completed",
    amount: 45.99,
    method: "card",
    time: "2024-01-15T10:30:00Z",
    customer: "John D."
  },
  {
    id: "2",
    type: "transaction",
    status: "failed",
    amount: 23.50,
    method: "card",
    time: "2024-01-15T10:25:00Z",
    customer: "Sarah M.",
    error: "Card declined"
  },
  {
    id: "3",
    type: "system",
    status: "info",
    message: "Terminal reconnected",
    time: "2024-01-15T10:20:00Z"
  },
  {
    id: "4",
    type: "transaction",
    status: "completed",
    amount: 78.25,
    method: "contactless",
    time: "2024-01-15T10:15:00Z",
    customer: "Mike R."
  },
  {
    id: "5",
    type: "system",
    status: "warning",
    message: "Low paper in receipt printer",
    time: "2024-01-15T10:10:00Z"
  }
];

const TerminalActivityDialog = ({ 
  terminal, 
  open, 
  onOpenChange 
}: TerminalActivityDialogProps) => {
  if (!terminal) return null;

  const getActivityIcon = (type: string, status: string) => {
    if (type === "transaction") {
      return status === "completed" ? 
        <CheckCircle className="h-4 w-4 text-green-600" /> :
        <XCircle className="h-4 w-4 text-red-600" />;
    }
    if (type === "system") {
      return status === "warning" ? 
        <AlertCircle className="h-4 w-4 text-yellow-600" /> :
        <Clock className="h-4 w-4 text-blue-600" />;
    }
    return <CreditCard className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Terminal Activity - {terminal.name}</DialogTitle>
          <DialogDescription>
            Real-time activity log for terminal {terminal.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Terminal Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Current Status</h4>
              <p className="text-sm text-muted-foreground">
                Last seen: {new Date(terminal.lastSeen).toLocaleString()}
              </p>
            </div>
            <Badge className={terminal.status === "online" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {terminal.status}
            </Badge>
          </div>

          {/* Today's Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">{terminal.todayTransactions}</div>
              <p className="text-xs text-muted-foreground">Transactions Today</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">${terminal.todayRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Revenue Today</p>
            </div>
          </div>

          <div className="border-b"></div>
          
          <div>
            <h4 className="font-medium mb-3">Recent Activity</h4>
            <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4"> {/* ⬅️ add vertical spacing */}
                    {mockActivity.map((activity) => (
                    <div
                        key={activity.id}
                        className="flex items-start gap-3 rounded-lg border p-4 bg-white"
                    >
                        {getActivityIcon(activity.type, activity.status)}

                        <div className="flex-1 space-y-2"> {/* ⬅️ spacing between blocks */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                            {activity.type === "transaction" ? (
                                <span className="font-medium">
                                ${activity.amount?.toFixed(2)} – {activity.customer}
                                </span>
                            ) : (
                                <span className="font-medium">{activity.message}</span>
                            )}
                            {getStatusBadge(activity.status)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                            {new Date(activity.time).toLocaleTimeString()}
                            </span>
                        </div>

                        {activity.type === "transaction" && (
                            <p className="text-sm text-muted-foreground">
                            Payment method: {activity.method}
                            </p>
                        )}

                        {activity.error && (
                            <p className="text-sm text-red-600">{activity.error}</p>
                        )}
                        </div>
                    </div>
                    ))}
                </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TerminalActivityDialog;
