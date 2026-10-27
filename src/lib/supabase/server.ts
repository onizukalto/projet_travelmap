import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client Supabase côté serveur (routes, pages) : il lit et rafraîchit la session dans les cookies. */
export async function supabaseServeur() {
  const magasin = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => magasin.getAll(),
      setAll: (liste) => {
        try {
          for (const { name, value, options } of liste) magasin.set(name, value, options);
        } catch {
          // Appelé depuis une page (où l'on ne peut pas écrire de cookie) : le proxy s'en charge.
        }
      },
    },
  });
}
