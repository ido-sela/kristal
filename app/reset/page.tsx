import { setNewPassword } from "../actions";
export default async function Reset({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <form action={setNewPassword} className="mx-auto mt-32 flex w-80 flex-col gap-3 rounded bg-white p-6 shadow">
      <h1 className="text-xl font-bold">סיסמה חדשה</h1>
      <input name="password" type="password" minLength={8} placeholder="לפחות 8 תווים" required className="rounded border p-2" />
      {error && <p className="text-sm text-red-600">לא הצלחנו לעדכן, נסה שוב</p>}
      <button className="rounded bg-black p-2 text-white">שמור</button>
    </form>
  );
}
