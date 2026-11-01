import "server-only";
import { createClient } from "@supabase/supabase-js";

// service role: עוקף RLS. להשתמש רק בקוד שרת אחרי בדיקת הרשאות.
export const adminDb = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
