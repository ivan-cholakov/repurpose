import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "../auth-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <AuthForm mode="signup" />;
}
