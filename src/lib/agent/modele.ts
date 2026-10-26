// src/lib/agent/modele.ts
// Le modèle utilisé par l'agent, avec un filet de sécurité autour.
//
// Le problème : gpt-oss-120b sur Groq produit parfois un appel d'outil mal formé
// (par exemple un outil nommé « commentary », qui n'existe pas). Groq le refuse avec
// « Tool call validation failed » (erreur 400) et, sans protection, toute la requête échoue.
//
// La solution : un « middleware », c'est-à-dire une couche qui s'intercale entre l'agent
// et le modèle. Pour chaque étape, il lit la réponse en entier avant de la transmettre.
// Si Groq a refusé l'appel d'outil, il redemande la même étape, jusqu'à 3 essais en tout.
import { simulateReadableStream, wrapLanguageModel, type LanguageModelMiddleware } from "ai";
import { groq } from "@ai-sdk/groq";

// Nombre d'essais au total pour une même étape (le premier compris)
const ESSAIS_MAX = 3;

// Quelques types déduits de la bibliothèque « ai », pour que TypeScript nous aide :
// - FonctionDoStream : la fonction qui demande une étape au modèle ;
// - ResultatFlux : ce qu'elle renvoie (le flux de réponse et quelques informations) ;
// - Morceau : un morceau du flux (un bout de texte, un appel d'outil, une erreur…).
type FonctionDoStream = Parameters<NonNullable<LanguageModelMiddleware["wrapStream"]>>[0]["doStream"];
type ResultatFlux = Awaited<ReturnType<FonctionDoStream>>;
type Morceau = ResultatFlux["stream"] extends ReadableStream<infer M> ? M : never;

// Les messages d'erreur qui justifient un nouvel essai de la même étape :
// - un appel d'outil mal formé (ex. un outil nommé « commentary ») ;
// - aucun appel d'outil alors qu'il est obligatoire (le modèle a écrit du texte à la place).
//   Groq renvoie le premier message dans le flux. Le second vient de la bibliothèque « ai »
//   (AI_ToolChoiceViolationError) : il est gardé ici au cas où il traverserait cette couche.
const ERREURS_A_RELANCER = [
  "Tool call validation failed",
  "Tool choice is required, but model did not call a tool",
  "did not contain a tool call even though tool choice was required",
];

// Vrai si l'erreur fait partie des refus ci-dessus.
// Le message peut se trouver dans le texte de l'erreur ou dans la réponse brute de Groq.
function estAppelOutilInvalide(erreur: unknown) {
  const texte =
    erreur instanceof Error
      ? `${erreur.message} ${(erreur as { responseBody?: string }).responseBody ?? ""}`
      : JSON.stringify(erreur);
  return ERREURS_A_RELANCER.some((message) => texte.includes(message));
}

const relancerAppelsOutilInvalides: LanguageModelMiddleware = {
  wrapStream: async ({ doStream }) => {
    for (let essai = 1; ; essai++) {
      let resultat: ResultatFlux | undefined;
      const morceaux: Morceau[] = [];
      let erreurLevee: unknown = null;

      // 1. On demande l'étape au modèle et on lit tout le flux en mémoire,
      //    sans encore rien transmettre à l'agent.
      try {
        resultat = await doStream();
        const lecteur = resultat.stream.getReader();
        while (true) {
          const { done, value } = await lecteur.read();
          if (done) break;
          morceaux.push(value);
        }
      } catch (erreur) {
        erreurLevee = erreur;
      }

      // 2. L'erreur peut arriver de deux façons : levée par doStream,
      //    ou glissée dans le flux sous forme d'un morceau de type "error".
      const morceauErreur = morceaux.find((m) => m.type === "error");
      const probleme =
        erreurLevee ?? (morceauErreur?.type === "error" ? morceauErreur.error : null);

      // 3. Appel d'outil refusé par Groq, et il reste des essais : on recommence l'étape.
      if (probleme !== null && estAppelOutilInvalide(probleme) && essai < ESSAIS_MAX) {
        console.warn(`[agent] appel d'outil invalide, nouvel essai (${essai + 1}/${ESSAIS_MAX})`);
        continue;
      }

      // 4. Toute autre erreur levée (ou le dernier essai raté) passe telle quelle.
      if (erreurLevee !== null || !resultat) throw erreurLevee;

      // 5. Tout va bien : on rejoue les morceaux lus, d'un coup, sans délai.
      return {
        ...resultat,
        stream: simulateReadableStream({ chunks: morceaux, initialDelayInMs: null, chunkDelayInMs: null }),
      };
    }
  },
};

// Le modèle de l'agent : gpt-oss-120b sur Groq, entouré du filet de sécurité
export const modele = wrapLanguageModel({
  model: groq("openai/gpt-oss-120b"),
  middleware: relancerAppelsOutilInvalides,
});
