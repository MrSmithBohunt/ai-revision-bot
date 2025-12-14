export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel env vars" });

  const { message, topic = "General revision", rag = "amber" } = req.body || {};
  if (!message) return res.status(400).json({ error: "Missing message" });

  const ragGuidance = {
    red: [
      "Assume low confidence and knowledge gaps.",
      "Reteach from first principles in short steps.",
      "Use simple examples and check understanding frequently.",
      "Avoid exam-mark-scheme style at first; build up gradually.",
      "Finish with 2 very easy questions + 1 slightly harder."
    ],
    amber: [
      "Assume partial understanding.",
      "Give a brief recap then guided practice with hints.",
      "Address common misconceptions.",
      "Finish with 3 exam-style questions with short mark-scheme bullets."
    ],
    green: [
      "Assume high confidence.",
      "Be concise, challenge with exam-style depth.",
      "Use minimal hints unless asked.",
      "Finish with 1 harder stretch question and mark-scheme bullets."
    ]
  };

  const system = [
    "You are an AI revision tutor for students.",
    `Topic: ${topic}.`,
    `Student confidence (RAG): ${rag}. Follow the guidance below:`,
    ...(ragGuidance[rag] || ragGuidance.amber),
    "If the student asks something vague, ask ONE clarifying question then proceed.",
    "Keep answers structured with headings and bullet points.",
    "Do not fabricate quotes from exam boards. If unsure, say so."
  ].join("\n");

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: message }
        ],
        temperature: rag === "green" ? 0.3 : 0.5
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: "OpenAI API error",
        status: r.status,
        details: data
      });
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(502).json({ error: "OpenAI response missing reply text", details: data });
    }

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
}