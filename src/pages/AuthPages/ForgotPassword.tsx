import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthService } from "../../services/authService";
import { useLanguage } from "../../context/LanguageContext";
import LogoIcon from "../../assets/logo2.png";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const message = await AuthService.forgotPassword(email);
      setSuccessMsg(
        message ||
          t("resetLinkSent")
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";
      // Always show a generic message to avoid email enumeration
      setSuccessMsg(
        t("resetLinkSent")
      );
      console.error("Forgot password error:", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <img src={LogoIcon} alt="Company Logo" className="w-56" />
          <div className="space-y-4">
            <h3 className="text-4xl font-medium text-text-primary leading-tight">
              Reset your <span className="text-success-blue">password</span>
            </h3>
            <p className="text-lg font-light text-text-secondary leading-relaxed">
              Enter your email address and we'll send you a secure link to reset
              your password.
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
                {t("forgotPasswordTitle")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("forgotPasswordDesc")}
              </p>
            </div>

            {successMsg ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-3 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                  <Mail className="h-10 w-10 text-green-500" />
                  <p className="text-sm text-green-800 font-medium">{successMsg}</p>
                </div>
                <Link
                  to="/signin"
                  className="flex items-center justify-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("backToSignIn")}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <Label>
                    {t("email")} <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  disabled={isLoading || !email}
                >
                  {isLoading ? t("sending") : t("sendResetLink")}
                </Button>

                <div className="text-center">
                  <Link
                    to="/signin"
                    className="flex items-center justify-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t("backToSignIn")}
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
