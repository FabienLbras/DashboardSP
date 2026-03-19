import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import AuthService, {
  BackupCodesResponse,
  MfaSetupResponse,
  MfaStatusResponse,
} from "../services/authService";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function MfaSettings() {
  const [status, setStatus] = useState<MfaStatusResponse | null>(null);
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [regenCode, setRegenCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    void loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const currentStatus = await AuthService.getMfaStatus();
      setStatus(currentStatus);
      if (currentStatus.mfaEnabled) {
        setSetup(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load MFA status.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    setBusyAction("setup");
    setError("");
    setMessage("");
    setBackupCodes([]);
    try {
      const response = await AuthService.setupMfa();
      setSetup(response);
      setMessage("Scan the QR code in your authenticator app, then confirm with a 6-digit code.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to start MFA setup.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleConfirmSetup = async () => {
    setBusyAction("confirm");
    setError("");
    setMessage("");
    try {
      const response: BackupCodesResponse = await AuthService.confirmMfa(setupCode);
      setBackupCodes(response.backupCodes);
      setSetup(null);
      setSetupCode("");
      setMessage("MFA is now enabled. Store these backup codes securely. They will not be shown again.");
      await loadStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to confirm MFA setup.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleDisable = async () => {
    setBusyAction("disable");
    setError("");
    setMessage("");
    try {
      await AuthService.disableMfa(disableCode, disablePassword);
      setDisableCode("");
      setDisablePassword("");
      setBackupCodes([]);
      setMessage("MFA has been disabled.");
      await loadStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to disable MFA.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRegenerateCodes = async () => {
    setBusyAction("regenerate");
    setError("");
    setMessage("");
    try {
      const response = await AuthService.regenerateBackupCodes(regenCode);
      setBackupCodes(response.backupCodes);
      setRegenCode("");
      setMessage("New backup codes generated. The previous ones are no longer valid.");
      await loadStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to regenerate backup codes.");
    } finally {
      setBusyAction(null);
    }
  };

  const backupCodesText = backupCodes.join("\n");

  const handleCopyBackupCodes = async () => {
    if (!backupCodes.length) return;
    try {
      await navigator.clipboard.writeText(backupCodesText);
      setMessage("Backup codes copied to clipboard.");
      setError("");
    } catch {
      setError("Unable to copy backup codes. Please copy them manually.");
    }
  };

  const handleDownloadBackupCodes = () => {
    if (!backupCodes.length) return;

    const blob = new Blob(
      [
        "Success Payment Dashboard - Backup Codes\n\n",
        "Store these codes offline in a secure place.\n",
        "Each code can only be used once.\n\n",
        backupCodesText,
        "\n",
      ],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "success-payment-backup-codes.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage("Backup codes downloaded.");
    setError("");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Multi-Factor Authentication</h1>
          <p className="mt-1 text-text-secondary">
            Protect your account with an authenticator app and one-time backup codes.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/profile">Back to profile</Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-text-primary">Status</h2>
          {loading ? (
            <p className="mt-4 text-sm text-text-secondary">Loading MFA status...</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-text-secondary">Current protection</p>
                <p className="mt-1 text-lg font-semibold text-text-primary">
                  {status?.mfaEnabled ? "MFA enabled" : "MFA disabled"}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Backup codes remaining: {status?.backupCodesRemaining ?? 0}
                </p>
              </div>

              {!status?.mfaEnabled && !setup && (
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 shadow-sm">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Enable MFA protection</h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        Add an authenticator app and backup codes to protect this account.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleStartSetup}
                    disabled={busyAction !== null}
                    className="inline-flex w-full items-center justify-center gap-2 shadow-sm"
                  >
                    <Shield className="h-4 w-4" />
                    {busyAction === "setup" ? "Preparing..." : "Start MFA setup"}
                  </Button>
                </div>
              )}

              {setup && (
                <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                  <div>
                    <h3 className="font-medium text-text-primary">1. Scan the QR code</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Use Google Authenticator, 1Password, Authy, or another TOTP app.
                    </p>
                  </div>
                  <img
                    src={setup.qrCode}
                    alt="MFA QR code"
                    className="h-56 w-56 rounded-lg border border-gray-200 bg-white p-3"
                  />
                  <div>
                    <Label htmlFor="manual-secret">Manual setup secret</Label>
                    <Input id="manual-secret" value={setup.secret} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="setup-code">2. Confirm with a 6-digit code</Label>
                    <Input
                      id="setup-code"
                      value={setupCode}
                      onChange={(e) => setSetupCode(e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                  <Button
                    onClick={handleConfirmSetup}
                    disabled={!setupCode || busyAction !== null}
                  >
                    {busyAction === "confirm" ? "Confirming..." : "Enable MFA"}
                  </Button>
                </div>
              )}

              {status?.mfaEnabled && (
                <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                  <div>
                    <h3 className="font-medium text-text-primary">Disable MFA</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      Enter your password and either a TOTP code or an unused backup code.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="disable-password">Password</Label>
                    <Input
                      id="disable-password"
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="disable-code">TOTP or backup code</Label>
                    <Input
                      id="disable-code"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value)}
                      placeholder="123456 or ABCD1234EF"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDisable}
                    disabled={!disableCode || !disablePassword || busyAction !== null}
                  >
                    {busyAction === "disable" ? "Disabling..." : "Disable MFA"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Backup Codes</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Each code can be used once. Store them offline in a secure place.
              </p>
            </div>
            {status?.mfaEnabled && (
              <Button
                onClick={handleRegenerateCodes}
                disabled={!regenCode || busyAction !== null}
                variant="outline"
                className="shrink-0"
              >
                {busyAction === "regenerate" ? "Generating..." : "Regenerate backup codes"}
              </Button>
            )}
          </div>

          {status?.mfaEnabled && (
            <div className="mt-4 space-y-3">
              <Label htmlFor="regen-code">Confirm with your current 6-digit code</Label>
              <Input
                id="regen-code"
                value={regenCode}
                onChange={(e) => setRegenCode(e.target.value)}
                placeholder="Current 6-digit code"
              />
            </div>
          )}

          {backupCodes.length > 0 ? (
            <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                These codes are displayed once. Save them before leaving this page.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={handleCopyBackupCodes}
                  variant="outline"
                  className="bg-white"
                >
                  Copy backup codes
                </Button>
                <Button
                  onClick={handleDownloadBackupCodes}
                  variant="outline"
                  className="bg-white"
                >
                  Download backup codes
                </Button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {backupCodes.map((code) => (
                  <div
                    key={code}
                    className="rounded-md border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-text-primary"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-text-secondary">
              No backup codes are currently displayed.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
