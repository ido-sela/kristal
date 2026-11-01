import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: p } = await sb.from("profiles").select("role").eq("id", user?.id ?? "").single();
  return (
    <div className="mx-auto max-w-4xl p-6">
      <nav className="mb-6 flex items-center gap-4 border-b pb-3">
        <Link href="/" className="font-bold">פרויקטים ובקשות</Link>
        <Link href="/requests/new">בקשה חדשה</Link>
        {p?.role === "admin" && <Link href="/admin">ניהול</Link>}
        <form action={logout} className="ms-auto"><button className="text-sm text-gray-500">יציאה</button></form>
      </nav>
      {children}
    </div>
  );
}
