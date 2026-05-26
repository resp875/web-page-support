import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ManualLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get("auth_session")) {
    redirect("/api/auth/login");
  }
  return <>{children}</>;
}
