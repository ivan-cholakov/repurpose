import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { googleConfigured } from "@/lib/google-oauth";
import AuthForm from "../auth-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <AuthForm mode="login" googleEnabled={googleConfigured()} />;
}
