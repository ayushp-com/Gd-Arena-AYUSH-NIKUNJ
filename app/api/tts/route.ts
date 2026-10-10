
import { NextResponse } from "next/server";

const VOICES: Record<string, string> = {
  Ananya: "af_heart",
  Arjun: "am_michael",
  Meera: "af_bella",
  Kabir: "am_fenrir",
  Riya: "af_sky",
  Dev: "am_echo",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const text =
      typeof body.text === "string" ? body.text.trim() : "";

    const speaker =
      typeof body.speaker === "string" ? body.speaker : "Ananya";

    if (!text || text.length > 2000) {
      return NextResponse.json(
        { error: "Text must contain 1–2000 characters." },
        { status: 400 }
      );
    }

    const voice = VOICES[speaker];

    if (!voice) {
      return NextResponse.json(
        { error: `Unknown speaker: ${speaker}` },
        { status: 400 }
      );
    }

    const response = await fetch(
      "http://127.0.0.1:8880/v1/audio/speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "kokoro",
          voice,
          input: text,
          response_format: "mp3",
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const details = await response.text();

      console.error("Kokoro error:", response.status, details);

      return NextResponse.json(
        {
          error: `Kokoro error ${response.status}: ${details.slice(0, 400)}`,
        },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    const audio = await response.arrayBuffer();

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kokoro TTS failed. Check whether the server is running.",
      },
      { status: 500 }
    );
  }
}
