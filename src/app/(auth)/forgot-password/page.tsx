import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ForgotPasswordForm from "./forgot-form";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <ForgotPasswordForm />;
}
