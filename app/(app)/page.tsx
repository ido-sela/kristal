import { createClient } from "@/lib/supabase/server";
import { createProject } from "../actions";

const label: Record<string, string> = {
  pending: "ממתינה לאישור", running: "בביצוע", done: "הושלמה", rejected: "נדחתה", failed: "נכשלה",
};

export default async function Home() {
  const sb = await createClient();
  const [{ data: projects }, { data: requests }] = await Promise.all([
    sb.from("projects").select("*").order("created_at", { ascending: false }),
    sb.from("requests").select("*, projects(name)").order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-lg font-bold">פרויקטים</h2>
        <ul className="mb-3 space-y-1">
          {projects?.map((p) => <li key={p.id} className="rounded bg-white p-2 shadow-sm">{p.name}</li>)}
        </ul>
        <form action={createProject} className="flex gap-2">
          <input name="name" placeholder="שם פרויקט" required className="rounded border p-2" />
          <input name="description" placeholder="תיאור" className="flex-1 rounded border p-2" />
          <button className="rounded bg-black px-3 text-white">הוסף</button>
        </form>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-bold">הבקשות שלי</h2>
        <ul className="space-y-2">
          {requests?.map((r) => (
            <li key={r.id} className="rounded bg-white p-3 shadow-sm">
              <div className="flex justify-between"><b>{r.title}</b><span className="text-sm">{label[r.status]}</span></div>
              <div className="text-xs text-gray-500">{r.projects?.name}</div>
              {r.result && <pre className="mt-2 whitespace-pre-wrap text-sm">{r.result}</pre>}
              {r.error && <p className="mt-2 text-sm text-red-600">{r.error}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
