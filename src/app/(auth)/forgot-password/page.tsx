import ForgotPasswordForm from "./forgot-form";

// Authenticated visitors are redirected in src/proxy.ts (JWT check, no DB).
// No env dependence, so this page can prerender fully static.
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
