export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt, imageBase64 } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });

    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join("\n") || "";

    return res.status(200).json({ result: text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
