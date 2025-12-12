export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel env vars" });

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "Missing message" });

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
          { role: "system", content: "You are a revision tutor. Be concise and end with 3 quick practice questions." },
          { role: "user", content: message }
        ],
        temperature: 0.4
      })
    });

    const data = await r.json();

    // If OpenAI returned an error, show it to the client
    if (!r.ok) {
      return res.status(r.status).json({
        error: "OpenAI API error",
        status: r.status,
        details: data
      });
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(502).json({
        error: "OpenAI response missing reply text",
        details: data
      });
    }

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
}

