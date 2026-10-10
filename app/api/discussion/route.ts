
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const MODEL = "openai/gpt-oss-120b";
const MODERATOR = {
  name: "Ananya",
  role: "AI Moderator",
};

const PARTICIPANTS = [
  {
    name: "Arjun",
    role: "The Challenger",
    style: "Challenge assumptions and present strong counterarguments.",
  },
  {
    name: "Meera",
    role: "The Analyst",
    style: "Use logical reasoning, evidence, and practical examples.",
  },
  {
    name: "Kabir",
    role: "The Thinker",
    style: "Explore deeper implications and long-term consequences.",
  },
  {
    name: "Riya",
    role: "The Contrarian",
    style: "Question popular opinions and offer alternative viewpoints.",
  },
  {
    name: "Dev",
    role: "The Strategist",
    style: "Suggest practical solutions and balanced conclusions.",
  },
] as const;

type HistoryItem = {
  speaker: string;
  text: string;
};

type DiscussionTurn = {
  speaker: string;
  role: string;
  text: string;
};

function getErrorStatus(error: unknown): number {
  if (typeof error !== "object" || error === null) {
    return 500;
  }

  const value = error as {
    status?: number;
    statusCode?: number;
  };

  const status = Number(value.status ?? value.statusCode);

  return Number.isInteger(status) && status >= 400 && status < 600
    ? status
    : 500;
}

function getString(
  value: unknown,
  fallback: string,
  maxLength = 100
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const result = value.trim().slice(0, maxLength);
  return result || fallback;
}

function parseHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item: unknown): item is HistoryItem =>
        typeof item === "object" &&
        item !== null &&
        "speaker" in item &&
        "text" in item &&
        typeof item.speaker === "string" &&
        typeof item.text === "string"
    )
    .slice(-10)
    .map((item: HistoryItem) => ({
      speaker: item.speaker.trim().slice(0, 50),
      text: item.text.trim().slice(0, 1000),
    }))
    .filter((item) => item.speaker && item.text);
}

function parseTurns(value: unknown): DiscussionTurn[] {
  if (
    typeof value !== "object" ||
    value === null ||
    !("turns" in value) ||
    !Array.isArray(value.turns)
  ) {
    return [];
  }

  return value.turns
    .filter(
      (turn: unknown) =>
        typeof turn === "object" &&
        turn !== null &&
        "speaker" in turn &&
        "role" in turn &&
        "text" in turn &&
        typeof turn.speaker === "string" &&
        typeof turn.role === "string" &&
        typeof turn.text === "string" &&
        turn.text.trim().length > 0
    )
    .map(
      (turn: {
        speaker: string;
        role: string;
        text: string;
      }) => ({
        speaker: turn.speaker.trim().slice(0, 50),
        role: turn.role.trim().slice(0, 80),
        text: turn.text.trim().slice(0, 2000),
      })
    );
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing from your environment variables." },
        { status: 500 }
      );
    }

    let body: Record<string, unknown>;

    try {
      const parsedBody: unknown = await request.json();

      if (
        typeof parsedBody !== "object" ||
        parsedBody === null ||
        Array.isArray(parsedBody)
      ) {
        return NextResponse.json(
          { error: "Invalid request body." },
          { status: 400 }
        );
      }

      body = parsedBody as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Request body must contain valid JSON." },
        { status: 400 }
      );
    }

    const topic = getString(body.topic, "", 240);
    const transcript = getString(body.transcript, "", 4000);
    const format = getString(body.format, "Placement GD", 80);
    const language = getString(body.language, "English", 40);

    const requestedPanel = Number(body.panel);
    const panel = Number.isFinite(requestedPanel)
      ? Math.min(Math.max(Math.floor(requestedPanel), 3), 5)
      : 4;

    if (!topic) {
      return NextResponse.json(
        { error: "Enter a valid discussion topic." },
        { status: 400 }
      );
    }

    if (!transcript) {
      return NextResponse.json(
        {
          error:
            "No speech transcript was received. Speak first, then try again.",
        },
        { status: 400 }
      );
    }

    const history = parseHistory(body.history);
    const participants = PARTICIPANTS.slice(0, panel);

    const participantInstructions = participants
      .map(
        (participant) =>
          `${participant.name} (${participant.role}): ${participant.style}`
      )
      .join("\n");

    const systemPrompt = [
      "You are the discussion engine for GD Arena, a realistic live group discussion practice application.",
      "",
      `Topic: ${topic}`,
      `Format: ${format}`,
      `Language: ${language}`,
      "",
      "The student has just finished speaking. Continue the discussion naturally and respond to the student's actual argument.",
      "",
      "Return exactly three turns in this order:",
      "1. Ananya, the moderator: acknowledge a specific point from the student's response, give brief constructive feedback when appropriate, and ask a relevant follow-up or transition.",
      "2. One AI participant: contribute a distinct argument related to the topic or the student's point.",
      "3. A different AI participant: offer another perspective and respectfully challenge an argument when useful.",
      "",
      "Available AI participants:",
      JSON.stringify(participants),
      "",
      "Participant speaking styles:",
      participantInstructions,
      "",
      "Rules:",
      "- Refer to the student's actual transcript and recent discussion.",
      "- Never claim the student said something that is not in the transcript.",
      "- Each turn should normally contain 25-45 words.",
      "- Make every turn easy to understand when spoken aloud.",
      "- Use the requested language. For Hinglish, naturally mix Hindi and English.",
      "- Do not use Markdown, emojis, or stage directions.",
      "- Do not put speaker names inside the spoken text.",
      "- The two AI participants must have different names.",
      "- Only use participant names from the provided list.",
      "- The moderator must speak first and must be named Ananya.",
      "- Avoid repeating points already made in the recent discussion.",
      "- Make the conversation feel interactive, not like three separate speeches.",
      "",
      "Return valid JSON only, in this exact structure:",
      JSON.stringify(
        {
          turns: [
            {
              speaker: "Ananya",
              role: "AI Moderator",
              text: "Spoken response",
            },
            {
              speaker: participants[0].name,
              role: participants[0].role,
              text: "Spoken response",
            },
            {
              speaker: participants[1].name,
              role: participants[1].role,
              text: "Spoken response",
            },
          ],
        },
        null,
        2
      ),
    ].join("\n");

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            latestStudentResponse: transcript,
            recentDiscussion: history,
          }),
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1200,
      temperature: 0.6,
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "The AI returned an empty discussion response. Please try again." },
        { status: 502 }
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Groq returned invalid JSON.");
      return NextResponse.json(
        { error: "The AI returned an invalid response. Please try again." },
        { status: 502 }
      );
    }

    const turns = parseTurns(parsed);

    if (turns.length < 3 || turns[0].speaker !== MODERATOR.name) {
      console.error("Invalid discussion structure returned by Groq.");

      return NextResponse.json(
        { error: "The AI did not return all three valid discussion turns. Please try again." },
        { status: 502 }
      );
    }

    const selectedTurns = turns.slice(0, 3);
    const participantTurns = selectedTurns.slice(1);
    const validNames = new Set<string>(
      participants.map((participant) => participant.name)
    );

    const participantNames = participantTurns.map(
      (turn) => turn.speaker
    );

    if (
      participantNames.some((name) => !validNames.has(name)) ||
      new Set(participantNames).size !== 2
    ) {
      console.error("Groq returned duplicate or unknown participants.");

      return NextResponse.json(
        {
          error:
            "The AI returned invalid participant names. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { turns: selectedTurns },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Discussion API error:", error);

    const status = getErrorStatus(error);
    let message = "Could not generate the discussion response. Please try again.";

    if (status === 429) {
      message = "Groq rate limit reached. Please wait a moment and try again.";
    } else if (status === 401 || status === 403) {
      message = "Groq API authentication failed. Check your GROQ_API_KEY.";
    } else if (status === 404) {
      message = "The configured Groq model was not found or is unavailable.";
    } else if (status === 400) {
      message = "Groq rejected the request. Check the model and request configuration.";
    } else if (status === 503 || status === 529) {
      message = "The AI service is temporarily unavailable. Please try again shortly.";
    } else if (
      process.env.NODE_ENV === "development" &&
      error instanceof Error
    ) {
      message = error.message;
    }

    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}