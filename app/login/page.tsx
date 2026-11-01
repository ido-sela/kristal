import { PasswordInput } from "../password-input";
import Link from "next/link";
import { login } from "../actions";
// כניסה עם Google קיימת ב-loginWithGoogle (app/actions.ts); מחזירים אותה כשמוגדר ב-Supabase.
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <form action={login} className="mx-auto mt-32 flex w-80 flex-col gap-3 rounded bg-white p-6 shadow">
      <h1 className="text-xl font-bold">התחברות</h1>
      <input name="email" type="email" placeholder="אימייל" required className="rounded border p-2" />
      <PasswordInput name="password" placeholder="סיסמה" />
      {error && <p className="text-sm text-red-600">פרטים שגויים</p>}
      <button className="rounded bg-black p-2 text-white">כניסה</button>
      <Link href="/forgot" className="text-center text-sm text-gray-500">שכחתי סיסמה</Link>
    </form>
  );
}
