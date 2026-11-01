import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approveRequest, rejectRequest, updateClient } from "../../actions";

export default async function Admin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: me } = await sb.from("profiles").select("role").eq("id", user?.id ?? "").single();
  if (me?.role !== "admin") redirect("/");

  const [{ data: clients }, { data: pending }] = await Promise.all([
    sb.from("clients").select("*").order("name"),
    sb.from("requests").select("*, projects(name), clients(name)").eq("status", "pending").order("created_at"),
  ]);
  const spend = await Promise.all(
    (clients ?? []).map(async (c) => Number((await sb.rpc("month_spend_cents", { p_client: c.id })).data ?? 0)),
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-lg font-bold">בקשות ממתינות לאישור ({pending?.length ?? 0})</h2>
        <ul className="space-y-2">
          {pending?.map((r) => (
            <li key={r.id} className="rounded bg-white p-3 shadow-sm">
              <b>{r.title}</b> <span className="text-xs text-gray-500">{r.clients?.name} / {r.projects?.name}</span>
              <p className="my-2 whitespace-pre-wrap text-sm">{r.body}</p>
              <div className="flex gap-2">
                <form action={approveRequest}><input type="hidden" name="id" value={r.id} />
                  <button className="rounded bg-green-700 px-3 py-1 text-white">אשר והרץ</button></form>
                <form action={rejectRequest}><input type="hidden" name="id" value={r.id} />
                  <button className="rounded bg-gray-300 px-3 py-1">דחה</button></form>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-bold">לקוחות ותקציבים (החודש)</h2>
        <ul className="space-y-2">
          {clients?.map((c, i) => (
            <li key={c.id} className="rounded bg-white p-3 shadow-sm">
              <form action={updateClient} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={c.id} />
                <b className="w-40">{c.name}</b>
                <span className="text-sm">נוצל ${(spend[i] / 100).toFixed(2)} מתוך $</span>
                <input name="budget" type="number" step="0.5" defaultValue={c.monthly_budget_cents / 100} className="w-20 rounded border p-1" />
                <label className="text-sm"><input type="checkbox" name="auto_approve" defaultChecked={c.auto_approve} /> אישור אוטומטי</label>
                <label className="text-sm"><input type="checkbox" name="active" defaultChecked={c.active} /> פעיל</label>
                <button className="rounded bg-black px-3 py-1 text-white">שמור</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
