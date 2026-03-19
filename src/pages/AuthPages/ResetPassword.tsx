import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AuthService } from "../../services/authService";
import LogoIcon from "../../assets/logo2.png";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (!token) {
      setErrorMsg("Invalid or missing reset token. Please request a new reset link.");
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.resetPassword(token, newPassword);
      setSuccessMsg("Your password has been reset successfully.");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reset password. The link may have expired.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface p-8 rounded-lg shadow-lg text-center space-y-4">
          <p className="text-red-600 font-medium">Invalid reset link.</p>
          <p className="text-sm text-gray-500">This link is missing a token. Please request a new password reset.</p>
          <Link to="/forgot-password" className="inline-block text-sm text-brand-500 hover:text-brand-600 font-medium">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <img src={LogoIcon} alt="Company Logo" className="w-56" />
          <div className="space-y-4">
            <h3 className="text-4xl font-medium text-text-primary leading-tight">
              Create a new <span className="text-success-blue">password</span>
            </h3>
            <p className="text-lg font-light text-text-secondary leading-relaxed">
              Choose a strong password to secure your account.
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md bg-surface p-8 rounded-lg shadow-lg">
            <div className="lg:hidden mb-6">
              <img src={LogoIcon} alt="Company Logo" className="w-56" />
            </div>

            <div className="mb-6">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Reset Password
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your new password below.
              </p>
            </div>

            {successMsg ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-3 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                  <p className="text-sm text-green-800 font-medium">{successMsg}</p>
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => navigate("/signin", { replace: true })}
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
                    {errorMsg}
                    {errorMsg.includes("expired") && (
                      <div className="mt-2">
                        <Link to="/forgot-password" className="text-red-700 underline font-medium">
                          Request a new link
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label>
                    New Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label>
                    Confirm Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  disabled={isLoading || !newPassword || !confirmPassword}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>

                <div className="text-center">
                  <Link
                    to="/signin"
                    className="flex items-center justify-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
