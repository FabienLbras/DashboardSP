import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | Success Payment"
        description="Login page for dashboard access"
      />
      <AuthLayout>
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="Company Logo" className="h-72 mb-4" />
        </div>
        <SignInForm />
      </AuthLayout>
    </>
  );
}