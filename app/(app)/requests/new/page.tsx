import { createClient } from "@/lib/supabase/server";
import { submitRequest } from "../../../actions";

export default async function NewRequest() {
  const sb = await createClient();
  const { data: projects } = await sb.from("projects").select("id, name");
  return (
    <form action={submitRequest} className="flex max-w-xl flex-col gap-3">
      <h1 className="text-xl font-bold">בקשה חדשה</h1>
      <select name="project_id" required className="rounded border p-2">
        {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <input name="title" placeholder="כותרת" required className="rounded border p-2" />
      <textarea name="body" placeholder="פירוט הבקשה" required rows={8} className="rounded border p-2" />
      <button className="rounded bg-black p-2 text-white">שלח</button>
    </form>
  );
}
