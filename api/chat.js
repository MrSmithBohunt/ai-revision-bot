export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "Missing message" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a friendly AI revision tutor. Ask short follow-up questions, give step-by-step explanations, and finish with 3 quick practice questions. Keep answers concise."
          },
          { role: "user", content: message }
        ]
      })
    });


    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "No reply";

    res.status(200).json({ reply: reply.replace(/\n/g, "<br>") });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
