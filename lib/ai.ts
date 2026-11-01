import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/supabase/admin";

const MODEL = process.env.AI_MODEL ?? "claude-sonnet-5-5";
const PRICE_IN = Number(process.env.AI_PRICE_INPUT_PER_MTOK ?? 3);
const PRICE_OUT = Number(process.env.AI_PRICE_OUTPUT_PER_MTOK ?? 15);
const MAX_OUT = Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 2000);

const costCents = (i: number, o: number) => ((i * PRICE_IN + o * PRICE_OUT) / 1_000_000) * 100;

/** מריץ בקשה על חשבון ה-API שלך, עם בדיקת תקציב ורישום צריכה. שרת בלבד. */
export async function runRequest(requestId: string) {
  const db = adminDb();

  // "תפיסה" אטומית: רק pending -> running, מונע הרצה כפולה (וחיוב כפול)
  const { data: req } = await db
    .from("requests").update({ status: "running" })
    .eq("id", requestId).eq("status", "pending")
    .select("*, projects(name, description), clients(monthly_budget_cents, active)")
    .single();
  if (!req) return;

  const fail = (error: string) =>
    db.from("requests").update({ status: "failed", error, finished_at: new Date().toISOString() }).eq("id", requestId);

  if (!req.clients.active) return fail("הלקוח מושבת");

  const { data: spent } = await db.rpc("admin_month_spend", { p_client: req.client_id });
  if (Number(spent ?? 0) >= req.clients.monthly_budget_cents) return fail("התקציב החודשי נוצל");

  try {
    const ai = new Anthropic(); // ANTHROPIC_API_KEY מהסביבה
    const msg = await ai.messages.create({
      model: MODEL,
      max_tokens: MAX_OUT,
      system: `אתה עוזר בצוות ניהול פרויקטים. פרויקט: ${req.projects.name}. ${req.projects.description ?? ""}`,
      messages: [{ role: "user", content: `${req.title}\n\n${req.body}` }],
    });
    const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const cost = costCents(msg.usage.input_tokens, msg.usage.output_tokens);

    await db.from("usage_log").insert({
      client_id: req.client_id, request_id: requestId, model: MODEL,
      input_tokens: msg.usage.input_tokens, output_tokens: msg.usage.output_tokens, cost_cents: cost,
    });
    await db.from("requests").update({
      status: "done", result: text, cost_cents: cost, finished_at: new Date().toISOString(),
    }).eq("id", requestId);
  } catch (e) {
    await fail(e instanceof Error ? e.message : "שגיאה לא ידועה");
  }
}
