import { login } from "../actions";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <form action={login} className="mx-auto mt-32 flex w-80 flex-col gap-3 rounded bg-white p-6 shadow">
      <h1 className="text-xl font-bold">התחברות</h1>
      <input name="email" type="email" placeholder="אימייל" required className="rounded border p-2" />
      <input name="password" type="password" placeholder="סיסמה" required className="rounded border p-2" />
      {error && <p className="text-sm text-red-600">פרטים שגויים</p>}
      <button className="rounded bg-black p-2 text-white">כניסה</button>
    </form>
  );
}
