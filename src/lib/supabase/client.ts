import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Une seule instance dans le navigateur : la session (cookies) est partagée par toute l'application.
let client: SupabaseClient | undefined;

/** Client Supabase du navigateur (clé publique « anon » : les règles RLS protègent les données). */
export function supabaseNavigateur() {
  client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return client;
}
