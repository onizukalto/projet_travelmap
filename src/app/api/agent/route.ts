// src/app/api/agent/route.ts
// Ce code tourne uniquement sur le serveur : la clé ne quitte jamais ta machine.

export async function POST(req: Request) {
  // 1. Lire ce qu'on nous envoie : { "message": "..." }
  const { message } = await req.json();

  if (typeof message !== "string" || message.trim() === "") {
    return Response.json({ error: "Envoie un champ « message » non vide." }, { status: 400 });
  }

  // 2. Appeler l'API de Groq
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { // ← changé
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // La clé prouve à Groq qui fait la demande
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`, // ← changé
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b", // ← changé
      // Toute la conversation à chaque fois (pour l'instant, un seul message)
      messages: [{ role: "user", content: message }],
    }),
  });

  // 3. Si Groq refuse (mauvaise clé, limite atteinte…), on renvoie son explication
  if (!res.ok) {
    const detail = await res.text();
    return Response.json({ error: detail }, { status: res.status });
  }

  // 4. Garder la réponse, la réflexion du modèle et le décompte de tokens
  const data = await res.json();
  return Response.json({
    reply: data.choices[0].message.content,
    reasoning: data.choices[0].message.reasoning, // ← ajouté : la réflexion du modèle
    usage: data.usage,
  });
}
