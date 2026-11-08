import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";

export default async function ManualLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const user = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value, process.env.AUTH0_SECRET);
  if (!user) {
    redirect("/api/auth/login");
  }
  return <>{children}</>;
}
