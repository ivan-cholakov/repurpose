import { googleConfigured } from "@/lib/google-oauth";
import AuthForm from "../auth-form";

// Authenticated visitors are redirected in src/proxy.ts (JWT check, no DB).
// Rendered per request so the Google button reflects runtime env in Docker.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <AuthForm mode="login" googleEnabled={googleConfigured()} />;
}
