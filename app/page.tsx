
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

const topics = [
  { name: "AI & Technology", icon: "✳", topic: "Will AI create more jobs than it destroys?" },
  { name: "Business & Economy", icon: "↗", topic: "Should startups prioritize profit over growth?" },
  { name: "Society & Education", icon: "◎", topic: "Is a college degree still worth it?" },
  { name: "Environment", icon: "♧", topic: "Can economic growth coexist with sustainability?" },
  { name: "Abstract", icon: "◇", topic: "The other side of the coin" },
  { name: "Current Affairs", icon: "◷", topic: "Social media: a force for good or harm?" },
];

const panelMembers = [
  { name: "Arjun", role: "The Challenger", color: "bg-orange-400", initials: "A" },
  { name: "Meera", role: "The Analyst", color: "bg-violet-400", initials: "M" },
  { name: "Kabir", role: "The Thinker", color: "bg-sky-400", initials: "K" },
  { name: "Riya", role: "The Contrarian", color: "bg-rose-400", initials: "R" },
  { name: "Dev", role: "The Strategist", color: "bg-amber-300", initials: "D" },
];

const moderator = {
  name: "Ananya",
  role: "AI Moderator",
  color: "bg-emerald-400",
  initials: "A",
};

const formats = ["Placement GD", "Case-based", "Abstract GD", "Debate"];

type RecognitionResult = {
  isFinal: boolean;
  [index: number]: { transcript: string };
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
};

type RecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => RecognitionInstance;

type DiscussionTurn = {
  speaker: string;
  role: string;
  text: string;
};

export default function Home() {
  const [selected, setSelected] = useState(topics[0].name);
  const [topic, setTopic] = useState(topics[0].topic);
  const [custom, setCustom] = useState(false);
  const [panel, setPanel] = useState(4);
  const [duration, setDuration] = useState(5);
  const [language, setLanguage] = useState("English");
  const [format, setFormat] = useState("Placement GD");

  const [room, setRoom] = useState(false);
  const [remaining, setRemaining] = useState(300);
  const [paused, setPaused] = useState(true);
  const [finished, setFinished] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState("");

  const [moderatorOpening, setModeratorOpening] = useState("");
  const [moderatorLoading, setModeratorLoading] = useState(false);
  const [moderatorError, setModeratorError] = useState("");
  const [moderatorSpeaking, setModeratorSpeaking] = useState(false);

  const [discussionTurns, setDiscussionTurns] = useState<DiscussionTurn[]>([]);
  const [autoResponding, setAutoResponding] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState("");

  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const mountedRef = useRef(false);
  const openingStartedRef = useRef(false);
  const openingAutoPlayedRef = useRef(false);
  const lastSubmittedTranscriptRef = useRef("");
  const autoResponseLockRef = useRef(false);
  const roomRunRef = useRef(0);
  const speechRunRef = useRef(0);

  // ElevenLabs audio playback refs.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioResolveRef = useRef<(() => void) | null>(null);
  // Serialize ElevenLabs requests in this browser tab to avoid concurrent-limit errors.
  const ttsRequestQueueRef = useRef<Promise<void>>(Promise.resolve());

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    setListening(false);
    setInterimTranscript("");

    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Recognition may already have stopped.
      }
    }
  }, []);

  // Stop current audio and invalidate any ongoing speech sequence.
  const stopAllSpeech = useCallback(() => {
    speechRunRef.current += 1;

    const audio = audioRef.current;

    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    audioRef.current = null;

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    const resolvePendingAudio = audioResolveRef.current;
    audioResolveRef.current = null;
    resolvePendingAudio?.();

    setModeratorSpeaking(false);
    setActiveSpeaker("");
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined" || !room || finished) return;
    if (recognitionRef.current || autoResponseLockRef.current) return;

    const browser = window as Window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };

    const Recognition =
      browser.SpeechRecognition || browser.webkitSpeechRecognition;

    if (!Recognition) {
      setSpeechError(
        "Speech recognition is unavailable. Please use Google Chrome."
      );
      return;
    }

    setSpeechError("");
    setInterimTranscript("");

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === "Hindi" ? "hi-IN" : "en-IN";

    recognition.onstart = () => {
      if (!mountedRef.current) return;
      setListening(true);
      setSpeechError("");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let temporaryText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const recognizedText = result[0].transcript;

        if (result.isFinal) {
          finalText += recognizedText + " ";
        } else {
          temporaryText += recognizedText;
        }
      }

      if (finalText) {
        setTranscript((previous) => previous + finalText);
      }

      setInterimTranscript(temporaryText);
    };

    recognition.onerror = (event) => {
      if (!mountedRef.current) return;

      const messages: Record<string, string> = {
        "not-allowed":
          "Microphone access denied. Allow microphone access in browser settings.",
        "no-speech": "No speech detected. Start speaking when you are ready.",
        "audio-capture": "No microphone detected. Check your audio device.",
        network:
          "Speech recognition network error. Check your connection and try Chrome.",
        "service-not-allowed":
          "Speech recognition is blocked by your browser.",
      };

      if (event.error !== "aborted") {
        setSpeechError(
          messages[event.error] || `Microphone error: ${event.error}`
        );
      }

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }

      setListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }

      setListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setSpeechError("Could not start the microphone. Please try again.");
    }
  }, [room, finished, language]);

  // Generate and play speech using the server-side ElevenLabs endpoint.
  const speakText = useCallback(
    async (text: string, speaker: string, runId: number): Promise<void> => {
      if (typeof window === "undefined") return;
      if (speechRunRef.current !== runId) return;

      let objectUrl: string | null = null;

      try {
        // Wait for the previous TTS generation request before calling ElevenLabs.
        let releaseRequest!: () => void;
        const previousRequest = ttsRequestQueueRef.current;

        ttsRequestQueueRef.current = new Promise<void>((resolve) => {
          releaseRequest = resolve;
        });

        let audioBlob: Blob;

        await previousRequest;

        try {
          // If this speech sequence was stopped while waiting, skip the request.
          if (speechRunRef.current !== runId) return;

          let response: Response | null = null;
          let data: { error?: string } | null = null;

          // Retry rate-limit errors twice, waiting before each retry.
          for (let attempt = 0; attempt < 3; attempt++) {
            response = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, speaker, language }),
            });

            if (response.ok) break;

            data = await response.json().catch(() => null);

            if (response.status !== 429 || attempt === 2) {
              throw new Error(
                data?.error ||
                  `ElevenLabs voice generation failed (${response.status}).`
              );
            }

            await new Promise((resolve) =>
              window.setTimeout(resolve, 1200 * (attempt + 1))
            );

            if (speechRunRef.current !== runId) return;
          }

          if (!response?.ok) {
            throw new Error(
              data?.error || "ElevenLabs is busy. Please try again shortly."
            );
          }

          audioBlob = await response.blob();
        } finally {
          // Always release the queue, including when a request fails or is skipped.
          releaseRequest();
        }

        // Do not play audio if this turn was cancelled during generation.
        if (speechRunRef.current !== runId) return;

        objectUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = objectUrl;

        const audio = new Audio(objectUrl);
        audio.preload = "auto";
        audioRef.current = audio;

        setActiveSpeaker(speaker);
        setModeratorSpeaking(speaker === "Ananya");

        await new Promise<void>((resolve, reject) => {
          let settled = false;

          const finish = () => {
            if (settled) return;
            settled = true;

            audio.onended = null;
            audio.onerror = null;

            if (audioRef.current === audio) {
              audioRef.current = null;
            }

            if (audioUrlRef.current === objectUrl) {
              URL.revokeObjectURL(objectUrl!);
              audioUrlRef.current = null;
            }

            if (audioResolveRef.current === finish) {
              audioResolveRef.current = null;
            }

            if (speechRunRef.current === runId) {
              setModeratorSpeaking(false);
              setActiveSpeaker("");
            }

            resolve();
          };

          audioResolveRef.current = finish;
          audio.onended = finish;

          audio.onerror = () => {
            if (settled) return;
            finish();
            reject(new Error("Audio playback failed. Please try again."));
          };

          if (speechRunRef.current !== runId) {
            finish();
            return;
          }

          audio.play().catch((error: unknown) => {
            if (settled) return;

            finish();

            reject(
              new Error(
                error instanceof Error
                  ? `${error.message} Try clicking "Play opening again" to enable audio.`
                  : "Browser blocked audio playback. Please try again."
              )
            );
          });
        });
      } catch (error) {
        if (speechRunRef.current === runId) {
          throw error;
        }
      } finally {
        if (objectUrl && audioUrlRef.current !== objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    },
    [language]
  );

  const playModeratorOpening = useCallback(async () => {
    const text = moderatorOpening.trim();

    if (!text) {
      setModeratorError("No opening speech is available. Please try again.");
      return;
    }

    stopListening();
    stopAllSpeech();

    const runId = speechRunRef.current;
    setModeratorError("");

    try {
      await speakText(text, "Ananya", runId);

      if (speechRunRef.current !== runId) return;

      if (room && !finished) {
        startListening();
      }
    } catch (error) {
      if (speechRunRef.current === runId) {
        setModeratorError(
          error instanceof Error
            ? error.message
            : "Could not play the moderator's voice."
        );
      }
    }
  }, [
    moderatorOpening,
    room,
    finished,
    startListening,
    stopListening,
    stopAllSpeech,
    speakText,
  ]);

  // Clean up audio and microphone when this page unmounts.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      roomRunRef.current += 1;
      speechRunRef.current += 1;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Already stopped.
        }

        recognitionRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      audioResolveRef.current?.();
      audioResolveRef.current = null;
    };
  }, []);

  // Session countdown.
  useEffect(() => {
    if (!room || paused || finished || remaining <= 0) return;

    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [room, paused, finished, remaining]);

  // Finish the session when the countdown reaches zero.
  useEffect(() => {
    if (!room || remaining !== 0 || finished) return;

    stopListening();
    stopAllSpeech();

    roomRunRef.current += 1;
    autoResponseLockRef.current = false;
    setAutoResponding(false);
    setPaused(true);
    setFinished(true);
  }, [
    room,
    remaining,
    finished,
    stopListening,
    stopAllSpeech,
  ]);

  // Generate the moderator's opening statement.
  useEffect(() => {
    if (!room || finished || openingStartedRef.current) return;

    openingStartedRef.current = true;
    const runId = roomRunRef.current;
    let cancelled = false;

    async function generateOpening() {
      setModeratorLoading(true);
      setModeratorError("");

      try {
        const response = await fetch("/api/moderator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            format,
            language,
            panel,
            duration,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Could not generate the moderator opening."
          );
        }

        if (typeof data.text !== "string" || !data.text.trim()) {
          throw new Error("The moderator returned an empty opening.");
        }

        if (cancelled || roomRunRef.current !== runId) return;

        setModeratorOpening(data.text.trim());
      } catch (error) {
        if (!cancelled && roomRunRef.current === runId) {
          setModeratorError(
            error instanceof Error
              ? error.message
              : "Could not generate the moderator opening."
          );
        }
      } finally {
        if (!cancelled && roomRunRef.current === runId) {
          setModeratorLoading(false);
        }
      }
    }

    void generateOpening();

    return () => {
      cancelled = true;
    };
  }, [room, finished, topic, format, language, panel, duration]);

  // Automatically play the opening after it has been generated.
  useEffect(() => {
    if (!room || finished || moderatorLoading || !moderatorOpening) return;
    if (openingAutoPlayedRef.current) return;

    openingAutoPlayedRef.current = true;
    void playModeratorOpening();
  }, [
    room,
    finished,
    moderatorLoading,
    moderatorOpening,
    playModeratorOpening,
  ]);

  // Five seconds without new speech triggers the AI panel.
  useEffect(() => {
    if (!room || finished || !transcript.trim()) return;

    if (
      moderatorLoading ||
      moderatorSpeaking ||
      autoResponseLockRef.current
    ) {
      return;
    }

    const currentTranscript = transcript;
    const previousTranscript = lastSubmittedTranscriptRef.current;

    if (currentTranscript.length <= previousTranscript.length) return;

    const roomRun = roomRunRef.current;

    const timeout = window.setTimeout(async () => {
      if (roomRunRef.current !== roomRun) return;
      if (autoResponseLockRef.current) return;

      const studentTurn = currentTranscript
        .slice(previousTranscript.length)
        .trim();

      if (!studentTurn) return;

      autoResponseLockRef.current = true;
      lastSubmittedTranscriptRef.current = currentTranscript;

      setAutoResponding(true);
      setSpeechError("");
      stopListening();

      try {
        const response = await fetch("/api/discussion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            format,
            language,
            panel,
            transcript: studentTurn,
            history: discussionTurns.slice(-10),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Could not generate the AI discussion."
          );
        }

        if (!Array.isArray(data.turns) || data.turns.length === 0) {
          throw new Error("The AI returned no discussion turns.");
        }

        const turns = (data.turns as DiscussionTurn[]).filter(
          (turn) =>
            turn &&
            typeof turn.speaker === "string" &&
            typeof turn.role === "string" &&
            typeof turn.text === "string" &&
            turn.text.trim().length > 0
        );

        if (!turns.length) {
          throw new Error("The AI returned empty discussion turns.");
        }

        // Keep the microphone off while each AI speaker is talking.
        stopAllSpeech();
        const speechRun = speechRunRef.current;

        for (const rawTurn of turns.slice(0, 3)) {
          if (roomRunRef.current !== roomRun) break;
          if (speechRunRef.current !== speechRun) break;

          const turn = {
            ...rawTurn,
            text: rawTurn.text.trim(),
          };

          setDiscussionTurns((previous) => [...previous, turn]);

          await speakText(turn.text, turn.speaker, speechRun);
        }
      } catch (error) {
        if (roomRunRef.current === roomRun) {
          setSpeechError(
            error instanceof Error
              ? error.message
              : "The automatic discussion failed."
          );
        }
      } finally {
        if (roomRunRef.current === roomRun) {
          setActiveSpeaker("");
          setModeratorSpeaking(false);
          setAutoResponding(false);
          autoResponseLockRef.current = false;

          if (!finished && room) {
            startListening();
          }
        }
      }
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [
    transcript,
    room,
    finished,
    topic,
    format,
    language,
    panel,
    moderatorLoading,
    moderatorSpeaking,
    discussionTurns,
    startListening,
    stopListening,
    stopAllSpeech,
    speakText,
  ]);

  function chooseTopic(name: string) {
    setSelected(name);
    setCustom(false);
    setTopic(topics.find((item) => item.name === name)?.topic ?? "");
  }

  function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic.trim()) return;

    stopListening();
    stopAllSpeech();

    roomRunRef.current += 1;
    autoResponseLockRef.current = false;
    lastSubmittedTranscriptRef.current = "";
    openingStartedRef.current = false;
    openingAutoPlayedRef.current = false;

    setTranscript("");
    setInterimTranscript("");
    setSpeechError("");
    setDiscussionTurns([]);
    setAutoResponding(false);
    setActiveSpeaker("");

    setModeratorOpening("");
    setModeratorError("");
    setModeratorLoading(false);

    setRemaining(duration * 60);
    setPaused(false);
    setFinished(false);
    setRoom(true);
  }

  function clearTranscript() {
    setTranscript("");
    setInterimTranscript("");
    setSpeechError("");
    lastSubmittedTranscriptRef.current = "";
  }

  function leaveRoom() {
    stopListening();
    stopAllSpeech();

    roomRunRef.current += 1;
    autoResponseLockRef.current = false;
    openingStartedRef.current = false;
    openingAutoPlayedRef.current = false;

    setAutoResponding(false);
    setActiveSpeaker("");
    setRoom(false);
    setPaused(true);
    setFinished(false);
  }

  function endSession() {
    stopListening();
    stopAllSpeech();

    roomRunRef.current += 1;
    autoResponseLockRef.current = false;

    setAutoResponding(false);
    setActiveSpeaker("");
    setPaused(true);
    setFinished(true);
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const participants = [...panelMembers.slice(0, panel), moderator];

  if (room) {
    return (
      <main className="min-h-screen bg-[#090b12] text-white">
        <header className="border-b border-white/[0.08]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <button onClick={leaveRoom} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 font-bold shadow-lg shadow-violet-500/20">
                G
              </span>
              <span className="text-lg font-semibold">
                gd<span className="text-violet-400">arena</span>
              </span>
            </button>

            <span className="hidden rounded-full border border-white/10 px-4 py-2 text-xs text-slate-400 sm:block">
              Automatic AI discussion
            </span>

            <button
              onClick={endSession}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:border-rose-400/40 hover:text-rose-300"
            >
              End session
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
          {finished ? (
            <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl text-violet-300">
                ✓
              </div>

              <p className="mt-6 text-xs uppercase tracking-[0.22em] text-violet-300">
                Session closed
              </p>

              <h1 className="mt-3 text-3xl font-semibold">
                Good practice starts here.
              </h1>

              <p className="mt-4 text-sm leading-7 text-slate-400">
                Your session has ended. Your transcript and AI discussion are
                available below.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Your transcript
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {transcript || "No speech was transcribed."}
                </p>
              </div>

              <button
                onClick={leaveRoom}
                className="mt-8 w-full rounded-xl bg-violet-500 px-5 py-4 text-sm font-semibold transition hover:bg-violet-400"
              >
                Back to setup →
              </button>
            </section>
          ) : (
            <>
              <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs text-violet-200">
                      {format}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400">
                      {language}
                    </span>
                  </div>

                  <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                    {topic}
                  </h1>

                  <p className="mt-3 text-sm text-slate-400">
                    Your discussion room · {panel} AI participants + moderator
                  </p>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:min-w-64">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-xl text-violet-300">
                    ◷
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      {paused ? "Timer paused" : "Time remaining"}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                      {minutes}:{seconds}
                    </p>
                  </div>

                  <button
                    onClick={() => setPaused((value) => !value)}
                    className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10"
                  >
                    {paused ? "Resume" : "Pause"}
                  </button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
                <section className="rounded-3xl border border-white/10 bg-[#11131d] p-5 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">The discussion table</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Your AI panel
                      </p>
                    </div>

                    <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-xs text-emerald-200">
                      {autoResponding
                        ? activeSpeaker
                          ? `${activeSpeaker} speaking`
                          : "AI thinking..."
                        : listening
                          ? "Microphone on"
                          : "Microphone off"}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {participants.map((member) => (
                      <div
                        key={member.name}
                        className={`relative overflow-hidden rounded-2xl border p-4 transition sm:p-5 ${
                          member.name === moderator.name
                            ? "border-emerald-400/20 bg-emerald-400/[0.04]"
                            : "border-white/[0.08] bg-white/[0.025]"
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${member.color} text-lg font-semibold text-slate-950`}
                        >
                          {member.initials}
                        </div>

                        <p className="mt-4 text-sm font-semibold">
                          {member.name}
                        </p>
                        <p className="mt-1 min-h-8 text-xs leading-5 text-slate-400">
                          {member.role}
                        </p>

                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              activeSpeaker === member.name
                                ? "animate-pulse bg-emerald-400"
                                : "bg-slate-600"
                            }`}
                          />
                          {activeSpeaker === member.name
                            ? "Speaking now"
                            : "AI participant"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-violet-400/15 bg-violet-400/[0.04] p-5">
                    <div className="flex items-center gap-2 text-xs font-medium text-violet-200">
                      <span>✳</span> Discussion briefing
                    </div>

                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {format === "Case-based"
                        ? "Analyse the situation, identify the main problem, and support your proposed solution with clear reasoning."
                        : format === "Abstract GD"
                          ? "Interpret the topic creatively. Explore different perspectives and connect your ideas to real-world examples."
                          : format === "Debate"
                            ? "Present a clear position, support your reasoning, and respond respectfully to counterarguments."
                            : "Express your perspective, support your ideas with examples, and build on the arguments of other participants."}
                    </p>
                  </div>

                  {/* Moderator opening */}
                  <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 font-semibold text-emerald-300">
                        A
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-semibold">Ananya</p>
                        <p className="mt-1 text-xs text-emerald-300">
                          AI Moderator
                        </p>
                      </div>

                      {moderatorLoading && (
                        <span className="animate-pulse text-xs text-emerald-300">
                          Preparing...
                        </span>
                      )}

                      {moderatorSpeaking && (
                        <span className="animate-pulse text-xs text-emerald-300">
                          {activeSpeaker || "Speaking..."}
                        </span>
                      )}
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {moderatorLoading
                        ? "Ananya is preparing the opening statement..."
                        : moderatorOpening ||
                          "Your moderator's opening statement will appear here."}
                    </p>

                    {moderatorError && (
                      <div
                        role="alert"
                        className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs leading-5 text-rose-200"
                      >
                        {moderatorError}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void playModeratorOpening()}
                        disabled={!moderatorOpening || moderatorLoading}
                        className="rounded-xl bg-emerald-400/15 px-4 py-3 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ▶ Play opening again
                      </button>

                      {moderatorSpeaking && (
                        <button
                          type="button"
                          onClick={stopAllSpeech}
                          className="rounded-xl border border-white/10 px-4 py-3 text-xs text-slate-300 transition hover:bg-white/[0.05]"
                        >
                          Stop voice
                        </button>
                      )}
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      The opening plays automatically. Your microphone starts
                      after Ananya finishes.
                    </p>
                  </div>

                  {/* Live AI conversation */}
                  <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">
                          Live AI discussion
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {autoResponding
                            ? activeSpeaker
                              ? `${activeSpeaker} is speaking...`
                              : "Preparing responses..."
                            : listening
                              ? "Speak naturally. Pause for five seconds for the panel to respond."
                              : "Microphone will resume after the AI finishes."}
                        </p>
                      </div>

                      {autoResponding && (
                        <span className="animate-pulse rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
                          Automatic discussion
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      {discussionTurns.map((turn, index) => (
                        <article
                          key={`${index}-${turn.speaker}`}
                          className={`rounded-xl border p-4 ${
                            turn.speaker === "Ananya"
                              ? "border-emerald-400/15 bg-emerald-400/[0.035]"
                              : "border-white/[0.07] bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold">
                              {turn.speaker}
                            </p>
                            <p className="text-xs text-slate-500">
                              {turn.role}
                            </p>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                            {turn.text}
                          </p>
                        </article>
                      ))}

                      {!discussionTurns.length && (
                        <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm leading-6 text-slate-500">
                          Speak into your microphone. After five seconds of
                          silence, Ananya and the AI participants will respond
                          here automatically.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Live captions */}
                  <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium">Live captions</p>

                      <span
                        className={`flex items-center gap-2 text-xs ${
                          listening ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            listening
                              ? "animate-pulse bg-emerald-400"
                              : "bg-slate-600"
                          }`}
                        />
                        {listening ? "Listening..." : "Microphone off"}
                      </span>
                    </div>

                    <div
                      aria-live="polite"
                      className="mt-5 min-h-36 max-h-64 overflow-y-auto rounded-xl bg-white/[0.025] p-4"
                    >
                      {transcript || interimTranscript ? (
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                          {transcript}
                          <span className="text-violet-300">
                            {interimTranscript}
                          </span>
                        </p>
                      ) : (
                        <div className="flex min-h-24 flex-col items-center justify-center text-center">
                          <span className="text-2xl text-violet-300">〰</span>
                          <p className="mt-3 text-sm text-slate-400">
                            Your words will appear here
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            The microphone starts automatically after the
                            opening.
                          </p>
                        </div>
                      )}
                    </div>

                    {speechError && (
                      <div
                        role="alert"
                        className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs leading-5 text-rose-200"
                      >
                        {speechError}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={listening ? stopListening : startListening}
                        disabled={autoResponding}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          listening
                            ? "border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                            : "bg-violet-500 text-white hover:bg-violet-400"
                        }`}
                      >
                        {listening ? "■ Stop listening" : "🎙 Start speaking"}
                      </button>

                      <button
                        type="button"
                        onClick={clearTranscript}
                        disabled={!transcript && !interimTranscript}
                        className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Clear
                      </button>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-600">
                      After five seconds without new speech, your latest
                      response is sent to the AI. The microphone pauses while
                      the panel speaks and resumes automatically afterward.
                    </p>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setPaused((value) => !value)}
                      className="w-full rounded-xl border border-white/10 px-5 py-4 text-sm font-medium transition hover:bg-white/[0.05]"
                    >
                      {paused ? "Resume timer" : "Pause timer"}
                    </button>
                  </div>
                </section>

                <aside className="space-y-5">
                  <section className="rounded-3xl border border-white/10 bg-[#11131d] p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Session overview
                    </p>

                    <h2 className="mt-3 text-lg font-semibold">Your arena</h2>

                    <div className="mt-5 space-y-4">
                      {[
                        ["Topic", topic],
                        ["Format", format],
                        ["Language", language],
                        ["Panel size", `${panel} participants + moderator`],
                        ["Duration", `${duration} minutes`],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex items-start justify-between gap-4"
                        >
                          <span className="text-xs text-slate-500">
                            {label}
                          </span>
                          <span className="max-w-40 text-right text-xs leading-5 text-slate-300">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-white/10 bg-[#11131d] p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Your practice goals
                    </p>

                    <div className="mt-5 space-y-4">
                      {[
                        ["01", "Make a strong opening"],
                        ["02", "Build on others' ideas"],
                        ["03", "Support your arguments"],
                        ["04", "End with a clear summary"],
                      ].map(([number, goal]) => (
                        <div key={number} className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-xs text-violet-300">
                            {number}
                          </span>
                          <p className="text-xs leading-5 text-slate-300">
                            {goal}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
                    <p className="text-xs font-medium text-amber-200">
                      Automatic turn-taking
                    </p>
                    <p className="mt-2 text-xs leading-6 text-slate-400">
                      Ananya responds to your point, followed by AI
                      participants with different perspectives. No button is
                      needed after each turn.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b12] text-white selection:bg-violet-500/30">
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[440px] w-[440px] rounded-full bg-violet-600/[0.12] blur-[130px]" />
      <div className="pointer-events-none absolute right-[-180px] top-[440px] h-[360px] w-[360px] rounded-full bg-indigo-500/[0.09] blur-[110px]" />

      <nav className="relative z-10 border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="#" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-lg font-bold shadow-lg shadow-violet-500/20">
              G
            </span>
            <span className="text-lg font-semibold tracking-tight">
              gd<span className="text-violet-400">arena</span>
            </span>
          </a>

          <div className="hidden items-center gap-7 text-sm text-slate-400 sm:flex">
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300">
              Campus placement prep
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Practice mode
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1fr_0.86fr] lg:gap-16 lg:pt-24">
        <section className="pt-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3.5 py-2 text-xs text-violet-200">
            <span>✳</span> Your personal GD practice arena
          </div>

          <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[1.08] tracking-[-0.055em] sm:text-6xl xl:text-7xl">
            Speak with
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
              confidence.
            </span>
            <br />
            Not guesswork.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-slate-400 sm:text-lg">
            Walk into your next placement GD prepared. Practice with AI
            participants, think on your feet, and discover exactly where you
            can improve.
          </p>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Automatic AI responses
            </span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Live speech transcription
            </span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              No group required
            </span>
          </div>

          <div
            id="how-it-works"
            className="mt-12 grid max-w-lg grid-cols-3 gap-3 border-t border-white/[0.08] pt-6"
          >
            {[
              { n: "01", t: "Choose a topic" },
              { n: "02", t: "Enter the arena" },
              { n: "03", t: "Discuss automatically" },
            ].map((item) => (
              <div key={item.n}>
                <p className="text-xs text-violet-300">{item.n}</p>
                <p className="mt-2 text-sm font-medium text-slate-300">
                  {item.t}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#11131d]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">
                Session setup
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Build your arena
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Make it your discussion. Make every minute count.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xl">
              ⌘
            </div>
          </div>

          <form onSubmit={createRoom} className="mt-7 space-y-7">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-200">
                  Choose your topic
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (!custom) {
                      setCustom(true);
                      setSelected("");
                      setTopic("");
                    } else {
                      chooseTopic(topics[0].name);
                    }
                  }}
                  className="text-xs text-violet-300 transition hover:text-violet-200"
                >
                  {custom ? "← Browse topics" : "+ Custom topic"}
                </button>
              </div>

              {!custom ? (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {topics.map((item) => (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => chooseTopic(item.name)}
                        className={`rounded-xl border p-3 text-left transition duration-200 ${
                          selected === item.name
                            ? "border-violet-400/60 bg-violet-500/[0.13] ring-1 ring-violet-400/20"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.045]"
                        }`}
                      >
                        <span
                          className={`text-lg ${
                            selected === item.name
                              ? "text-violet-300"
                              : "text-slate-400"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="mt-2 block text-xs font-medium leading-5 text-slate-200">
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Discussion prompt
                    </p>
                    <p className="text-sm leading-6 text-slate-300">
                      {topic}
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <input
                    autoFocus
                    required
                    maxLength={240}
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. Should AI be regulated in India?"
                    className="w-full rounded-xl border border-violet-400/30 bg-black/20 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/70"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Choose a clear, debatable topic for the best practice
                    experience.
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-200">
                  AI panel size
                </label>
                <span className="text-xs text-slate-400">
                  {panel} participants + moderator
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5].map((number) => (
                  <button
                    type="button"
                    key={number}
                    onClick={() => setPanel(number)}
                    className={`rounded-xl border py-3 text-sm font-medium transition ${
                      panel === number
                        ? "border-violet-400/60 bg-violet-500/[0.13] text-violet-200"
                        : "border-white/[0.08] text-slate-400 hover:bg-white/[0.04]"
                    }`}
                  >
                    {number} participants
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-200">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 8].map((number) => (
                    <button
                      type="button"
                      key={number}
                      onClick={() => setDuration(number)}
                      className={`rounded-xl border py-3 text-sm transition ${
                        duration === number
                          ? "border-violet-400/60 bg-violet-500/[0.13] text-violet-200"
                          : "border-white/[0.08] text-slate-400 hover:bg-white/[0.04]"
                      }`}
                    >
                      {number} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="language"
                  className="mb-3 block text-sm font-medium text-slate-200"
                >
                  Discussion language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#171925] px-3 py-3.5 text-sm text-slate-200 outline-none focus:border-violet-400/60"
                >
                  <option>English</option>
                  <option>Hinglish</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-200">
                Discussion format
              </label>

              <div className="grid grid-cols-2 gap-2">
                {formats.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setFormat(item)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-3 text-left text-sm transition ${
                      format === item
                        ? "border-violet-400/50 bg-violet-500/[0.1] text-violet-200"
                        : "border-white/[0.08] text-slate-400 hover:bg-white/[0.035]"
                    }`}
                  >
                    <span
                      className={
                        format === item
                          ? "text-violet-300"
                          : "text-slate-600"
                      }
                    >
                      {format === item ? "◉" : "○"}
                    </span>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
              <p className="text-xs leading-5 text-slate-400">
                <span className="font-medium text-slate-200">
                  Automatic discussion.
                </span>{" "}
                The moderator and AI participants respond after you finish
                speaking. Natural AI voices powered by ElevenLabs.
              </p>
            </div>

            <button
              type="submit"
              disabled={!topic.trim()}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-violet-500 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 hover:shadow-violet-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create practice room
              <span className="transition group-hover:translate-x-1">→</span>
            </button>

            <p className="text-center text-xs text-slate-600">
              No pressure. Just practice, learn, and improve.
            </p>
          </form>
        </section>
      </div>

      <footer className="relative z-10 border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© 2026 GD Arena · Practice makes progress.</span>
          <span>Built for the next generation of confident speakers.</span>
        </div>
      </footer>
    </main>
  );
}
