import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Separator } from "../../components/ui/separator";

interface Terminal {
  id: string;
  name: string;
  location: string;
  status: string;
  lastSeen: string;
  todayTransactions: number;
  todayRevenue: number;
}

interface TerminalConfigDialogProps {
  terminal: Terminal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (terminalId: string, config: any) => void;
}

export function TerminalConfigDialog({ 
  terminal, 
  open, 
  onOpenChange, 
  onSave 
}: TerminalConfigDialogProps) {
  const [config, setConfig] = useState({
    name: terminal?.name || "",
    location: terminal?.location || "",
    receiptPrinting: true,
    soundEnabled: true,
    autoReconnect: true,
    transactionLimit: "1000",
    currency: "USD",
  });

  const handleSave = () => {
    if (terminal) {
      onSave(terminal.id, config);
      onOpenChange(false);
    }
  };

  if (!terminal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Configure Terminal {terminal.id}</DialogTitle>
          <DialogDescription>
            Modify settings and preferences for this terminal
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Terminal Name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={config.location}
                  onChange={(e) => setConfig({ ...config, location: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="limit">Daily Transaction Limit</Label>
                <Input
                  id="limit"
                  value={config.transactionLimit}
                  onChange={(e) => setConfig({ ...config, transactionLimit: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Terminal Settings</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Receipt Printing</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically print receipts for transactions
                </p>
              </div>
              <Switch
                checked={config.receiptPrinting}
                onCheckedChange={(checked) => 
                  setConfig({ ...config, receiptPrinting: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound for successful transactions
                </p>
              </div>
              <Switch
                checked={config.soundEnabled}
                onCheckedChange={(checked) => 
                  setConfig({ ...config, soundEnabled: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Reconnect</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically reconnect if connection is lost
                </p>
              </div>
              <Switch
                checked={config.autoReconnect}
                onCheckedChange={(checked) => 
                  setConfig({ ...config, autoReconnect: checked })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}