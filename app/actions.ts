"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";
import { runRequest } from "@/lib/ai";

export async function login(fd: FormData) {
  const sb = await createClient();
  const { error } = await sb.auth.signInWithPassword({
    email: String(fd.get("email")), password: String(fd.get("password")),
  });
  if (error) redirect("/login?error=1");
  redirect("/");
}

export async function loginWithGoogle() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const sb = await createClient();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${proto}://${host}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=1");
  redirect(data.url);
}

export async function logout() {
  await (await createClient()).auth.signOut();
  redirect("/login");
}

export async function createProject(fd: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: p } = await sb.from("profiles").select("client_id").eq("id", user!.id).single();
  if (!p?.client_id) return;
  await sb.from("projects").insert({
    client_id: p.client_id, name: String(fd.get("name")), description: String(fd.get("description") ?? ""),
  });
  revalidatePath("/");
}

export async function submitRequest(fd: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: p } = await sb.from("profiles").select("client_id").eq("id", user!.id).single();
  if (!p?.client_id) return;

  // RLS מבטיח שהפרויקט שייך ללקוח; הבקשה נוצרת תמיד כ-pending
  const { data: req, error } = await sb.from("requests").insert({
    client_id: p.client_id, created_by: user!.id, project_id: String(fd.get("project_id")),
    title: String(fd.get("title")).slice(0, 200), body: String(fd.get("body")).slice(0, 8000),
  }).select("id").single();
  if (error || !req) return;

  const { data: c } = await sb.from("clients").select("auto_approve").eq("id", p.client_id).single();
  if (c?.auto_approve) await runRequest(req.id); // ה-runner בודק תקציב בעצמו
  redirect("/");
}

async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: p } = await sb.from("profiles").select("role").eq("id", user?.id ?? "").single();
  if (p?.role !== "admin") throw new Error("forbidden");
}

export async function approveRequest(fd: FormData) {
  await requireAdmin();
  await runRequest(String(fd.get("id")));
  revalidatePath("/admin");
}

export async function rejectRequest(fd: FormData) {
  await requireAdmin();
  await adminDb().from("requests").update({ status: "rejected", finished_at: new Date().toISOString() })
    .eq("id", String(fd.get("id"))).eq("status", "pending");
  revalidatePath("/admin");
}

export async function updateClient(fd: FormData) {
  await requireAdmin();
  await adminDb().from("clients").update({
    monthly_budget_cents: Math.round(Number(fd.get("budget")) * 100),
    auto_approve: fd.get("auto_approve") === "on",
    active: fd.get("active") === "on",
  }).eq("id", String(fd.get("id")));
  revalidatePath("/admin");
}

async function baseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
}

export async function requestPasswordReset(fd: FormData) {
  const sb = await createClient();
  await sb.auth.resetPasswordForEmail(String(fd.get("email")), {
    redirectTo: `${await baseUrl()}/auth/callback?next=/reset`,
  });
  redirect("/forgot?sent=1"); // אותה תשובה תמיד, בלי לחשוף אם האימייל קיים
}

export async function setNewPassword(fd: FormData) {
  const password = String(fd.get("password"));
  if (password.length < 8) redirect("/reset?error=1");
  const sb = await createClient();
  const { error } = await sb.auth.updateUser({ password });
  if (error) redirect("/reset?error=1");
  redirect("/");
}
