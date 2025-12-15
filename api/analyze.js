import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in environment variables" });
      return;
    }

    const { prompt, imageBase64, mimeType } = req.body || {};
    if (!prompt || !imageBase64) {
      res.status(400).json({ error: "Missing prompt or imageBase64" });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    // ✅ Modello valido (evita i vecchi gemini-1.5*)
    const model = "gemini-2.0-flash";

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType || "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    res.status(200).json({ result: response.text || "" });
  } catch (e) {
    // Ritorna errore leggibile
    res.status(500).json({
      error: e?.message || "Server error",
      details: String(e),
    });
  }
}
