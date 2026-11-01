import { requestPasswordReset } from "../actions";
export default async function Forgot({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <form action={requestPasswordReset} className="mx-auto mt-32 flex w-80 flex-col gap-3 rounded bg-white p-6 shadow">
      <h1 className="text-xl font-bold">איפוס סיסמה</h1>
      <input name="email" type="email" placeholder="אימייל" required className="rounded border p-2" />
      {sent && <p className="text-sm text-green-700">אם האימייל קיים, נשלח אליו קישור לאיפוס.</p>}
      <button className="rounded bg-black p-2 text-white">שלח קישור</button>
    </form>
  );
}
