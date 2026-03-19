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
  Wifi,
  WifiOff,
} from "lucide-react";
import { mockTerminals } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { APP_PERMISSIONS, hasPermission } from "../lib/permissions";

export default function Terminals() {
  const { user } = useAuth();
  const [terminals, setTerminals] = useState(mockTerminals);
  const canManageTerminals = hasPermission(user?.role, APP_PERMISSIONS.MANAGE_TERMINALS);

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
        {canManageTerminals && (
          <Button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 hover:scale-105 transition-transform">
            <Plus className="h-4 w-4 mr-2" />
            Add Terminal
          </Button>
        )}
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
                    ${Number(terminal.todayRevenue).toFixed(2)}
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

    </div>
  );
}
