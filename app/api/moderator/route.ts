
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing from .env.local." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const topic =
      typeof body.topic === "string" ? body.topic.trim() : "";

    const format =
      typeof body.format === "string"
        ? body.format
        : "Placement GD";

    const language =
      typeof body.language === "string"
        ? body.language
        : "English";

    const panelValue = Number(body.panel);
    const panel = Number.isFinite(panelValue)
      ? Math.min(Math.max(Math.floor(panelValue), 3), 5)
      : 4;

    const durationValue = Number(body.duration);
    const duration = Number.isFinite(durationValue)
      ? Math.min(Math.max(Math.floor(durationValue), 1), 60)
      : 5;

    if (!topic || topic.length > 240) {
      return NextResponse.json(
        { error: "Please enter a valid discussion topic." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",

      messages: [
        {
          role: "system",
          content: `You are Ananya, the friendly moderator of GD Arena.

Generate a SHORT opening speech for a live group discussion.

Topic: ${topic}
Format: ${format}
Language: ${language}
AI participants: ${panel}
Duration: ${duration} minutes.

Requirements:
1. Briefly welcome the student and introduce yourself as Ananya.
2. State the topic clearly.
3. Give a very brief explanation of the topic.
4. Mention one simple discussion rule: respect others and support opinions with reasoning.
5. Invite the student to share their opening opinion.

Use ${language} throughout.
For Hinglish, naturally mix Hindi and English.
Sound friendly, confident, and conversational.
Use only 45-60 words.
Ask one short, relevant question at the end.
Do not give a long introduction or explain every discussion rule.
Return only the speech, without markdown, headings, or speaker labels.` ,
        },
        {
          role: "user",
          content: `Start the discussion on: ${topic}. Keep the opening short.`,
        },
      ],

      max_completion_tokens: 1000,
      temperature: 0.5,
    });

    const choice = completion.choices[0];
    const text = choice?.message?.content?.trim();

    console.log("Moderator model:", completion.model);
    console.log("Moderator finish reason:", choice?.finish_reason);

    if (!text) {
      console.error("Empty moderator response:", {
        finishReason: choice?.finish_reason,
        usage: completion.usage,
      });

      return NextResponse.json(
        {
          error:
            "Groq returned an empty opening speech. Please try again and check the terminal logs.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (error: unknown) {
    console.error("Moderator API error:", error);

    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;

    const message =
      error instanceof Error
        ? error.message
        : "Could not generate the moderator opening.";

    return NextResponse.json(
      { error: message },
      {
        status:
          status >= 400 && status < 600
            ? status
            : 500,
      }
    );
  }
}
