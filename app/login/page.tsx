import { loginWithGoogle } from "../actions";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <form action={loginWithGoogle} className="mx-auto mt-32 flex w-80 flex-col gap-3 rounded bg-white p-6 shadow">
      <h1 className="text-xl font-bold">התחברות</h1>
      {error && <p className="text-sm text-red-600">ההתחברות נכשלה, נסה שוב</p>}
      <button className="rounded bg-black p-2 text-white">כניסה עם Google</button>
    </form>
  );
}
