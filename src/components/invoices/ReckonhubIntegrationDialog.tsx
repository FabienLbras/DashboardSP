import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  RotateCw, 
  Link,
  Shield,
  Zap,
  Clock
} from "lucide-react";
import { useToast } from "../../hooks/useToast";

interface ReckonhubIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReckonhubIntegrationDialog({ open, onOpenChange }: ReckonhubIntegrationDialogProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [settings, setSettings] = useState({
    autoSync: true,
    syncPayments: true,
    createCustomers: true,
    sendNotifications: true,
    syncInterval: "15" // minutes
  });

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Reckonhub API key to connect.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsConnected(true);
    setIsLoading(false);
    
    toast({
      title: "Successfully Connected!",
      description: "Reckonhub integration is now active. Invoices will sync automatically."
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setApiKey("");
    toast({
      title: "Disconnected",
      description: "Reckonhub integration has been disabled."
    });
  };

  const handleSyncNow = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    toast({
      title: "Sync Complete",
      description: "All invoices have been synchronized with Reckonhub."
    });
  };

  const features = [
    {
      icon: RotateCw,
      title: "Auto-Sync Invoices",
      description: "Automatically sync new invoices to Reckonhub",
      enabled: settings.autoSync
    },
    {
      icon: Shield,
      title: "Payment Tracking",
      description: "Real-time payment status updates",
      enabled: settings.syncPayments
    },
    {
      icon: Zap,
      title: "Customer Creation",
      description: "Automatically create customers in Reckonhub",
      enabled: settings.createCustomers
    },
    {
      icon: Clock,
      title: "Smart Notifications",
      description: "Get notified of sync status and errors",
      enabled: settings.sendNotifications
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Link className="w-6 h-6" />
            Reckonhub Integration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <Card className={isConnected ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {isConnected ? "Connected to Reckonhub" : "Not Connected"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isConnected 
                        ? "Your invoices are syncing automatically" 
                        : "Connect your Reckonhub account to start syncing"
                      }
                    </p>
                  </div>
                </div>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {!isConnected ? (
            /* Connection Setup */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Connect Your Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Reckonhub API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Reckonhub API key"
                  />
                  <p className="text-sm text-muted-foreground">
                    You can find your API key in Reckonhub Settings → Integration → API Keys
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleConnect} disabled={isLoading}>
                    {isLoading ? "Connecting..." : "Connect to Reckonhub"}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Get API Key
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Connected State */
            <>
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <RotateCw className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-medium">Sync Now</h4>
                    <p className="text-sm text-muted-foreground">Manually sync all invoices</p>
                    <Button 
                      size="sm" 
                      className="mt-2" 
                      onClick={handleSyncNow}
                      disabled={isLoading}
                    >
                      {isLoading ? "Syncing..." : "Sync"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium">24 Synced</h4>
                    <p className="text-sm text-muted-foreground">Invoices this month</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium">2 minutes ago</h4>
                    <p className="text-sm text-muted-foreground">Last sync</p>
                  </CardContent>
                </Card>
              </div>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Integration Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <feature.icon className="w-5 h-5 text-primary" />
                        <div>
                          <h5 className="font-medium">{feature.title}</h5>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={feature.enabled}
                        onCheckedChange={(checked) => {
                          const key = feature.title.toLowerCase().replace(/[^a-z]/g, '') as keyof typeof settings;
                          setSettings(prev => ({ ...prev, [key]: checked }));
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Sync Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sync Interval</Label>
                      <select 
                        className="w-full p-2 border border-input rounded-md"
                        value={settings.syncInterval}
                        onChange={(e) => setSettings(prev => ({ ...prev, syncInterval: e.target.value }))}
                      >
                        <option value="5">Every 5 minutes</option>
                        <option value="15">Every 15 minutes</option>
                        <option value="30">Every 30 minutes</option>
                        <option value="60">Every hour</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Connection Status</Label>
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Healthy Connection</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Disconnect */}
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-800">Disconnect Integration</h4>
                      <p className="text-sm text-red-600">This will stop all automatic syncing with Reckonhub</p>
                    </div>
                    <Button variant="destructive" onClick={handleDisconnect}>
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-2">Setup Guide</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Get your API key from Reckonhub</li>
                    <li>• Enter the key above to connect</li>
                    <li>• Configure sync settings</li>
                    <li>• Test with a sample invoice</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Support</h5>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Documentation
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        Contact Support
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}