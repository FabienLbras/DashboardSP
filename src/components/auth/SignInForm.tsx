import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import LogoIcon from "../../assets/logo2.png";

export default function SignInForm() {
  const navigate = useNavigate();
  const { login, verifyMfa, pendingMfaChallenge, clearMfaChallenge } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.mfaRequired) {
        setOtpCode("");
        setInfoMsg("Enter the 6-digit code from your authenticator app or a backup code.");
        return;
      }
      navigate("/", { replace: true });
    } catch (error: any) {
      if (error.response?.status === 401) {
        setErrorMsg("Invalid email or password. Please check your credentials and try again.");
      } else if (error.response?.status === 404) {
        setErrorMsg("User not found. Please check your email address.");
      } else if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
      } else if (error.message) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setIsLoading(true);

    try {
      const result = await verifyMfa(otpCode);
      if (result.usedBackupCode) {
        setInfoMsg("Backup code accepted. This code has now been consumed.");
      }
      navigate("/", { replace: true });
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
      } else if (error.message) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Unable to verify the MFA code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPassword = () => {
    clearMfaChallenge();
    setOtpCode("");
    setInfoMsg("");
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <img src={LogoIcon} alt="Company Logo" className="w-56" />
          <div className="space-y-4">
            <h3 className="text-4xl font-medium text-text-primary leading-tight">
              Welcome back to your <span className="text-success-blue">success</span> journey
            </h3>
            <p className="text-lg font-light text-text-secondary leading-relaxed">
              Continue building your financial future with our secure payment platform. 
              Your success is our mission.
            </p>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md bg-surface p-8 rounded-lg shadow-lg">
            <div className="lg:hidden mb-6">
              <img src={LogoIcon} alt="Company Logo" className="w-56" />
            </div>

            {/* Login Form */}
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
              <div>
                <div className="mb-5 sm:mb-8">
                  <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                    {pendingMfaChallenge ? "Verify MFA" : "Sign In"}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {pendingMfaChallenge
                      ? `A second factor is required for ${pendingMfaChallenge.email}.`
                      : "Enter your email and password to sign in!"}
                  </p>
                </div>

                {/* Show error if exists */}
                {errorMsg && (
                  <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-500/10 dark:text-red-400">
                    {errorMsg}
                  </div>
                )}

                {infoMsg && (
                  <div className="p-3 mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-500/10 dark:text-blue-300">
                    {infoMsg}
                  </div>
                )}

                <form onSubmit={pendingMfaChallenge ? handleVerifyMfa : handleSignIn}>
                  <div className="space-y-6">
                    {!pendingMfaChallenge ? (
                      <>
                        <div>
                          <Label>Email <span className="text-error-500">*</span></Label>
                          <Input
                            type="email"
                            autoComplete="email"
                            placeholder="info@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Password <span className="text-error-500">*</span></Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                            <span
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                            >
                              {showPassword ? (
                                <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                              ) : (
                                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isChecked} onChange={setIsChecked} />
                            <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                              Keep me logged in
                            </span>
                          </div>
                          <Link
                            to="/reset-password"
                            className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                          >
                            Forgot password?
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label>Authentication code <span className="text-error-500">*</span></Label>
                          <Input
                            type="text"
                            autoComplete="one-time-code"
                            placeholder="123456 or backup code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            required
                          />
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            You can use a 6-digit TOTP code or one of your one-time backup codes.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          size="sm"
                          onClick={handleBackToPassword}
                          disabled={isLoading}
                        >
                          Back to password
                        </Button>
                      </>
                    )}

                    <div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="sm"
                        disabled={isLoading || (!pendingMfaChallenge && (!email || !password)) || (!!pendingMfaChallenge && !otpCode)}
                      >
                        {isLoading ? (pendingMfaChallenge ? "Verifying..." : "Signing In...") : (pendingMfaChallenge ? "Verify code" : "Sign In")}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
