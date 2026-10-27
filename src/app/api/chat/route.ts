// src/app/api/chat/route.ts
import { streamText, stepCountIs, hasToolCall, convertToModelMessages, type UIMessage } from "ai";
import { modele } from "@/lib/agent/modele";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { climatTypique } from "@/lib/agent/tools/climat";
import { creerRechercherLieux } from "@/lib/agent/tools/lieux";
import { creerProposerItineraire } from "@/lib/agent/tools/itineraire";
import { repondre } from "@/lib/agent/tools/repondre";
import type { Registre } from "@/lib/agent/lieux-verifies";
import { limiteVisiteur, limiteGlobale, identifiantVisiteur } from "@/lib/agent/limites";
import { compacterHistorique } from "@/lib/agent/historique";
import { supabaseServeur } from "@/lib/supabase/server";

// Durée maximale d'une requête sur Vercel (en secondes) : l'agent en a besoin d'environ 20
export const maxDuration = 300;

export async function POST(req: Request) {
  // Garde-fou n°0 : seuls les comptes connectés utilisent l'agent (et ses quotas).
  // getUser vérifie la session auprès de Supabase : un cookie falsifié ne passe pas.
  const supabase = await supabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "compte-requis" }, { status: 401 });
  }

  // Garde-fou n°1 : on compte AVANT de faire quoi que ce soit de coûteux
  const [visiteur, site] = await Promise.all([
    limiteVisiteur.limit(identifiantVisiteur(req)),
    limiteGlobale.limit("site"),
  ]);
  if (!visiteur.success || !site.success) {
    return Response.json({ error: "limite-jour" }, { status: 429 });
  }

  // L'interface envoie l'historique au format « UIMessage » (id, role, parts)
  const { messages } = (await req.json()) as { messages?: UIMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Envoie un tableau « messages »." }, { status: 400 });
  }

  // Sécurité : on ne garde que user et assistant, le rôle system vient uniquement du serveur.
  // Et seulement les 20 derniers messages, pour limiter le coût.
  // Un registre neuf pour chaque requête : la liste des lieux réellement trouvés
  const registre: Registre = new Map();

  // On filtre les rôles, on garde les 20 derniers messages, puis on résume (et on recharge le registre)
  const historique = compacterHistorique(
    messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-20),
    registre,
  );

  const result = streamText({
    model: modele,
    // Réflexion courte : beaucoup moins de tokens à chaque étape, donc plus rapide
    providerOptions: { groq: { reasoningEffort: "low" } },
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(historique),
    tools: {
      climatTypique,
      rechercherLieux: creerRechercherLieux(registre),
      proposerItineraire: creerProposerItineraire(registre),
      repondre,
    },
    // Obligatoire : chaque étape est un appel d'outil, jamais du texte libre
    toolChoice: "required",
    // La boucle s'arrête sur un itinéraire rendu, ou sur une réponse ACCEPTÉE par son garde-fou
    stopWhen: [
      stepCountIs(20),
      hasToolCall("proposerItineraire"),
      ({ steps }) =>
        steps.at(-1)?.toolResults.some(
          (r) =>
            r.toolName === "repondre" &&
            typeof r.output === "object" &&
            r.output !== null &&
            !("erreur" in r.output)
        ) ?? false,
    ],
    // Filet de sécurité : à partir de la 13e étape, seules les deux sorties finales restent disponibles
    prepareStep: ({ stepNumber }) =>
      stepNumber >= 18 ? { activeTools: ["proposerItineraire", "repondre"] } : {},
    onStepFinish: ({ toolCalls, toolResults }) => {
      for (const call of toolCalls) console.log("[agent] outil appelé :", call.toolName, call.input);
      for (const res of toolResults) console.dir(res.output, { depth: null });
    },
    onError: ({ error }) => console.error("[agent] erreur :", error),
    onFinish: ({ finishReason, steps, totalUsage }) =>
      console.log("[agent] fin :", finishReason, "| étapes :", steps.length, "| tokens :", totalUsage.totalTokens),
  });

  // Format pour l'interface : texte et résultats d'outils voyagent ensemble.
  // onError : l'interface reçoit seulement « 429 » (limite atteinte) ou « Erreur »,
  // jamais le détail interne (clé, URL, réponse brute du fournisseur…).
  return result.toUIMessageStreamResponse({
    onError: (error) => {
      const statut = (error as { statusCode?: number })?.statusCode;
      const texte = error instanceof Error ? error.message : String(error);
      return statut === 429 || /429|rate.?limit|too many requests/i.test(texte) ? "429" : "Erreur";
    },
  });
}
