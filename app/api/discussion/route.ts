```ts
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const MODEL = "openai/gpt-oss-120b";

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
];

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
  if (typeof error === "object" && error !== null) {
    const value = error as {
      status?: number;
      statusCode?: number;
    };

    const status = Number(value.status ?? value.statusCode);

    if (status >= 400 && status < 600) {
      return status;
    }
  }

  return 500;
}

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

    const transcript =
      typeof body.transcript === "string"
        ? body.transcript.trim()
        : "";

    const format =
      typeof body.format === "string"
        ? body.format
        : "Placement GD";

    const language =
      typeof body.language === "string"
        ? body.language
        : "English";

    const requestedPanel = Number(body.panel);
    const panel = Number.isFinite(requestedPanel)
      ? Math.min(Math.max(Math.floor(requestedPanel), 3), 5)
      : 4;

    if (!topic || topic.length > 240) {
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

    const history: HistoryItem[] = Array.isArray(body.history)
      ? body.history
          .filter(
            (item: unknown): item is HistoryItem =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as HistoryItem).speaker === "string" &&
              typeof (item as HistoryItem).text === "string"
          )
          .slice(-10)
          .map((item: HistoryItem) => ({
            speaker: item.speaker.slice(0, 50),
            text: item.text.slice(0, 1000),
          }))
      : [];

    const participants = PARTICIPANTS.slice(0, panel);

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `
You are running a realistic live group discussion on GD Arena.

Topic: ${topic}
Format: ${format}
Language: ${language}

The student has just finished speaking. Respond to the student's
ACTUAL argument and continue the discussion naturally.

Return exactly three turns in this order:
1. Ananya, the moderator. Acknowledge a specific point from the
   student's response, offer brief constructive feedback where
   appropriate, and ask a relevant follow-up or transition.
2. One AI participant. Add a distinct argument connected to the topic
   or respond to the student's point.
3. A different AI participant. Offer another perspective and, where
   useful, respectfully challenge a previous argument.

Available AI participants:
${JSON.stringify(participants)}

Their speaking styles:
${participants
  .map((p) => `${p.name} (${p.role}): ${p.style}`)
  .join("\n")}

Rules:
- Refer to the actual student transcript.
- Do not invent statements the student never made.
- Each turn should contain approximately 25-45 words.
- Keep responses natural for spoken conversation.
- Use ${language}; for Hinglish, mix Hindi and English naturally.
- Do not use markdown, emojis, or stage directions.
- Do not include speaker labels inside the text.
- The two participants must have different names.
- The moderator must speak first.
- Return valid JSON only, using this structure:
{
  "turns": [
    {
      "speaker": "Ananya",
      "role": "AI Moderator",
      "text": "Spoken response"
    },
    {
      "speaker": "Arjun",
      "role": "The Challenger",
      "text": "Spoken response"
    },
    {
      "speaker": "Meera",
      "role": "The Analyst",
      "text": "Spoken response"
    }
  ]
}
`,
        },
        {
          role: "user",
          content: JSON.stringify({
            latestStudentResponse: transcript.slice(-4000),
            recentDiscussion: history,
          }),
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1200,
      temperature: 0.6,
    });

    const content =
      completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "The AI returned an empty discussion response." },
        { status: 502 }
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "The AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    const rawTurns =
      typeof parsed === "object" &&
      parsed !== null &&
      "turns" in parsed &&
      Array.isArray(parsed.turns)
        ? parsed.turns
        : [];

    const turns: DiscussionTurn[] = rawTurns
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

    if (turns.length < 3 || turns[0].speaker !== "Ananya") {
      return NextResponse.json(
        { error: "The AI did not return all three valid turns." },
        { status: 502 }
      );
    }

    const participantTurns = turns.slice(1, 3);
    const participantNames = participantTurns.map(
      (turn) => turn.speaker
    );

    const validNames = new Set(
      participants.map((p) => p.name)
    );

    if (
      new Set(participantNames).size !== 2 ||
      participantNames.some((name) => !validNames.has(name))
    ) {
      return NextResponse.json(
        {
          error:
            "The AI returned duplicate or unknown participants. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      turns: turns.slice(0, 3),
    });
  } catch (error) {
    console.error("Discussion API error:", error);

    const status = getErrorStatus(error);

    let message = "Could not generate the discussion response.";

    if (status === 429) {
      message =
        "Groq rate limit reached. Please wait and try again.";
    } else if (status === 401 || status === 403) {
      message =
        "Groq API authentication failed. Check your API key.";
    } else if (status === 404) {
      message =
        "The configured Groq model is unavailable for this API key.";
    } else if (
      process.env.NODE_ENV === "development" &&
      error instanceof Error
    ) {
      message = error.message;
    }

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
```