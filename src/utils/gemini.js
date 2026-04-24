export async function askGemini(prompt) {
  const isDev = import.meta.env.DEV;
  // During local vite dev, the serverless function isn't running natively.
  // We can fallback to direct call if needed, or Vercel CLI.
  // We will assume `vercel dev` or use the direct API here ONLY locally.
  
  // NOTE: If using `npm run dev`, /api/gemini won't exist.
  // But since this is production hardening, we will route to /api/gemini.
  const endpoint = "/api/gemini";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    
    // Fallback for local `npm run dev` if Vercel CLI is not used:
    if (res.status === 404 && isDev) {
       console.warn("Direct local fallback: the /api/gemini endpoint requires `vercel dev`. Relying on direct API for local dev.");
       return await localDirectCall(prompt);
    }
    
    throw new Error(err?.error || `Server error ${res.status}`);
  }

  const { data } = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
}

// Strictly for 'npm run dev' local fallback, NOT used in Vercel production
async function localDirectCall(prompt) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("Local dev fallback failed: missing API key");
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: "You are a senior defense tech expert. Answer cleanly." }] }
    })
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
}

