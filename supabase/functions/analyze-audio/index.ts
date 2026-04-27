import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Gandharva, an expert music transcription AI.
Analyze the provided audio and return a structured JSON musical transcription.
Detect:
- Primary musical instrument (Piano, Guitar, Violin, Flute, Saxophone, Drums, Cello, Trumpet, Voice, Synth, Other)
- Up to 3 candidate instruments with confidence (0-100)
- Estimated tempo (BPM), musical key, time signature, mood
- A sequence of detected notes with note name (e.g. "C4", "F#5"), frequency in Hz, start time and end time in seconds.

Be musically accurate. Use scientific pitch notation. Cover the full duration.
Return between 8 and 60 notes depending on density.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audioBase64, mimeType, fileName, durationHint } = await req.json();
    if (!audioBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: "audioBase64 and mimeType are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataUrl = `data:${mimeType};base64,${audioBase64}`;
    const userText = `Filename: ${fileName ?? "unknown"}\nApproximate duration: ${durationHint ?? "unknown"}s\nAnalyze this audio and produce the structured transcription.`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_transcription",
            description: "Return the structured musical transcription of the audio.",
            parameters: {
              type: "object",
              properties: {
                instrument: { type: "string", description: "Most likely primary instrument" },
                confidence: { type: "number", description: "0-100" },
                candidates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      confidence: { type: "number" },
                    },
                    required: ["name", "confidence"],
                  },
                },
                tempo_bpm: { type: "number" },
                key: { type: "string" },
                time_signature: { type: "string" },
                mood: { type: "string" },
                summary: { type: "string" },
                notes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      note: { type: "string" },
                      frequency: { type: "number" },
                      start: { type: "number" },
                      end: { type: "number" },
                    },
                    required: ["note", "frequency", "start", "end"],
                  },
                },
              },
              required: ["instrument", "confidence", "notes"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_transcription" } },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error", detail: t }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured response from model" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let parsed: any = {};
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("parse error", e, toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "Failed to parse model output" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-audio error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});