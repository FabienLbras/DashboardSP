import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { 
  Plus, 
  Settings,
  Wifi,
  WifiOff,
  MoreHorizontal,
  Activity,
  Power,
  PowerOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { mockTerminals } from "../data/mockData";
import { useToast } from "../hooks/useToast";
import { TerminalConfigDialog } from "../components/terminals/TerminalConfigDialog";
import TerminalActivityDialog from "../components/terminals/TerminalActivityDialog";

export default function Terminals() {
  const [terminals, setTerminals] = useState(mockTerminals);
  const [configDialog, setConfigDialog] = useState<{ open: boolean; terminal: any }>({ 
    open: false, 
    terminal: null 
  });
  const [activityDialog, setActivityDialog] = useState<{ open: boolean; terminal: any }>({ 
    open: false, 
    terminal: null 
  });
  const { toast } = useToast();

  const toggleTerminalStatus = (terminalId: string) => {
    setTerminals(prev => prev.map(terminal => {
      if (terminal.id === terminalId) {
        const newStatus = terminal.status === "online" ? "offline" : "online";
        toast({
          title: `Terminal ${newStatus}`,
          description: `Terminal ${terminalId} has been ${newStatus === "online" ? "activated" : "deactivated"}`,
        });
        return { 
          ...terminal, 
          status: newStatus,
          lastSeen: newStatus === "online" ? new Date().toISOString() : terminal.lastSeen
        };
      }
      return terminal;
    }));
  };

  const handleConfigSave = (terminalId: string, config: any) => {
    setTerminals(prev => prev.map(terminal => {
      if (terminal.id === terminalId) {
        return { ...terminal, name: config.name, location: config.location };
      }
      return terminal;
    }));
    toast({
      title: "Configuration saved",
      description: `Settings for terminal ${terminalId} have been updated`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Wifi className="h-3 w-3 mr-1" />
            Online
          </Badge>
        );
      case "offline":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Terminal Management</h1>
          <p className="text-muted-foreground">Monitor and manage all connected payment terminals</p>
        </div>
        <Button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 hover:scale-105 transition-transform">
          <Plus className="h-4 w-4 mr-2" />
          Add Terminal
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Terminals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{terminals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all locations
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Online Terminals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {terminals.filter(t => t.status === "online").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {terminals.reduce((sum, t) => sum + t.todayTransactions, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all terminals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Terminals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Terminals</CardTitle>
          <CardDescription>
            All payment terminals and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Terminal ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Today's Transactions</TableHead>
                <TableHead>Today's Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terminals.map((terminal) => (
                <TableRow key={terminal.id}>
                  <TableCell className="font-medium">{terminal.id}</TableCell>
                  <TableCell>{terminal.name}</TableCell>
                  <TableCell>{terminal.location}</TableCell>
                  <TableCell>{getStatusBadge(terminal.status)}</TableCell>
                  <TableCell>
                    {new Date(terminal.lastSeen).toLocaleString()}
                  </TableCell>
                  <TableCell>{terminal.todayTransactions}</TableCell>
                  <TableCell className="font-medium">
                    ${terminal.todayRevenue.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={terminal.status === "online" ? "destructive" : "default"}
                        className={`${terminal.status === "online" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white`}
                        size="sm"
                        onClick={() => toggleTerminalStatus(terminal.id)}
                      >
                        {terminal.status === "online" ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setConfigDialog({ open: true, terminal })}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setActivityDialog({ open: true, terminal })}
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            View Activity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {terminal.status === "offline" && (
                            <DropdownMenuItem 
                              onClick={() => toggleTerminalStatus(terminal.id)}
                            >
                              <Wifi className="h-4 w-4 mr-2" />
                              Reconnect
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Terminal Health */}
      <Card>
        <CardHeader>
          <CardTitle>Terminal Health Overview</CardTitle>
          <CardDescription>
            Real-time status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Connection Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Main Reception</span>
                  <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Restaurant POS</span>
                  <Badge className="bg-green-100 text-green-800">Good</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Spa Counter</span>
                  <Badge variant="destructive">Disconnected</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Performance Alerts</h4>
              <div className="space-y-2">
                <div className="p-3 border rounded-lg bg-red-50">
                  <p className="text-sm font-medium text-red-800">Spa Counter Offline</p>
                  <p className="text-xs text-red-600">Terminal has been offline for 3 hours</p>
                </div>
                <div className="p-3 border rounded-lg bg-yellow-50">
                  <p className="text-sm font-medium text-yellow-800">High Transaction Volume</p>
                  <p className="text-xs text-yellow-600">Restaurant POS handling peak traffic</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TerminalConfigDialog
        terminal={configDialog.terminal}
        open={configDialog.open}
        onOpenChange={(open) => setConfigDialog({ open, terminal: null })}
        onSave={handleConfigSave}
      />

      <TerminalActivityDialog
        terminal={activityDialog.terminal}
        open={activityDialog.open}
        onOpenChange={(open) => setActivityDialog({ open, terminal: null })}
      />
    </div>
  );
}