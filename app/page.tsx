
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



function ParticipantAvatar({ name, speaking = false }: { name: string; speaking?: boolean }) {
  const styles: Record<string, { bg: string; skin: string; hair: string; shirt: string }> = {
    Arjun: { bg: "#2b1c14", skin: "#b97850", hair: "#211a18", shirt: "#fb923c" },
    Meera: { bg: "#251a3e", skin: "#d99a76", hair: "#201721", shirt: "#a78bfa" },
    Kabir: { bg: "#102c3a", skin: "#b97850", hair: "#181a20", shirt: "#22d3ee" },
    Riya: { bg: "#3b1828", skin: "#e0a083", hair: "#291923", shirt: "#fb7185" },
    Dev: { bg: "#3a2a12", skin: "#c98760", hair: "#24201c", shirt: "#fbbf24" },
  };
  const c = styles[name] ?? styles.Arjun;
  const feminine = name === "Meera" || name === "Riya";
  return (
    <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 ${speaking ? "ring-2 ring-emerald-300 shadow-[0_0_22px_rgba(110,231,183,0.25)]" : ""}`} role="img" aria-label={`${name}${speaking ? ", speaking" : ""}`}>
      <svg viewBox="0 0 64 64" className={`h-full w-full ${speaking ? "animate-pulse" : ""}`} aria-hidden="true">
        <rect width="64" height="64" rx="14" fill={c.bg} />
        <circle cx="50" cy="12" r="12" fill={c.shirt} opacity=".16" />
        <path d="M7 66c2-15 11-22 25-22s23 7 25 22" fill={c.shirt} />
        <path d="M24 41h16l-1 9-7 6-7-6z" fill={c.skin} />
        {feminine && <path d="M15 31c-2-16 5-24 17-24s20 9 17 25l-3 14-8-5H25l-7 6z" fill={c.hair} />}
        {!feminine && <path d="M17 25c0-13 7-19 16-19s16 7 15 20l-5-6c-7 1-15-2-20-6z" fill={c.hair} />}
        <ellipse cx="32" cy="29" rx="14" ry="17" fill={c.skin} />
        <path d={feminine ? "M18 24c1-13 8-18 15-18 10 0 15 8 14 18-6-2-10-7-12-11-4 6-10 9-17 11z" : "M18 22c2-12 8-16 15-16 8 0 13 5 14 15-7-1-12-4-16-8-3 4-7 7-13 9z"} fill={c.hair} />
        <path d="M23 27q3-2 6 0M35 27q3-2 6 0" stroke="#4b2b24" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <ellipse cx="27" cy="31" rx="1.8" ry="2.3" fill="#211a20" />
        <ellipse cx="38" cy="31" rx="1.8" ry="2.3" fill="#211a20" />
        <path d={speaking ? "M27 39q5 7 10 0q-5-3-10 0" : "M27 39q5 4 10 0"} fill={speaking ? "#7f3036" : "none"} stroke="#7f3036" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M21 49l11 9 11-9 7 5 5 12H9l5-12z" fill={c.shirt} />
        <circle cx="51" cy="49" r="2" fill="#fff" opacity=".65" />
      </svg>
    </div>
  );
}

function AnanyaAvatar({
  speaking = false,
  size = "md",
}: {
  speaking?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions = size === "lg" ? "h-36 w-36 sm:h-44 sm:w-44" : size === "sm" ? "h-10 w-10" : "h-12 w-12";
  return (
    <div
      className={`relative isolate shrink-0 ${dimensions} ${speaking ? "animate-pulse" : ""}`}
      aria-label={`Ananya, AI moderator${speaking ? ", speaking" : ""}`}
      role="img"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300/40 via-teal-400/20 to-cyan-400/30 blur-xl" />
      <svg viewBox="0 0 160 160" className="relative h-full w-full drop-shadow-[0_12px_28px_rgba(16,185,129,0.18)]" aria-hidden="true">
        <defs>
          <linearGradient id="ananya-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#123b3a" />
            <stop offset="100%" stopColor="#101827" />
          </linearGradient>
          <linearGradient id="ananya-shirt" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r="77" fill="url(#ananya-bg)" stroke="#6ee7b7" strokeOpacity=".35" strokeWidth="1.5" />
        <circle cx="80" cy="80" r="68" fill="#0b1220" fillOpacity=".35" />
        <path d="M30 145c5-26 22-39 50-39s45 13 50 39" fill="url(#ananya-shirt)" />
        <path d="M61 104l19 19 19-19-8-13H69z" fill="#f3c7a6" />
        <path d="M43 72c-4-28 8-49 37-51 31-2 43 21 37 54l-7 23H50z" fill="#211a22" />
        <ellipse cx="80" cy="70" rx="31" ry="38" fill="#c98562" />
        <path d="M49 64c-3-23 8-43 31-43 24 0 36 18 32 39-8-3-15-12-19-21-11 12-27 18-44 18z" fill="#211a22" />
        <path d="M50 60c-9 22-2 44 7 51l-6-30zM110 57c10 20 3 44-6 53l6-32z" fill="#211a22" />
        <path d="M63 68q7-5 13 0" fill="none" stroke="#57352f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M84 68q7-5 13 0" fill="none" stroke="#57352f" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="70" cy="75" rx="3.3" ry="4" fill="#211a22" />
        <ellipse cx="91" cy="75" rx="3.3" ry="4" fill="#211a22" />
        <circle cx="71" cy="73.5" r="1" fill="#fff" />
        <circle cx="92" cy="73.5" r="1" fill="#fff" />
        <path d="M80 77l-3 10 5 1" fill="none" stroke="#a8664f" strokeWidth="2" strokeLinecap="round" />
        <path d={speaking ? "M70 94q10 12 20 0q-10-4-20 0" : "M70 93q10 9 20 0"} fill={speaking ? "#743b3a" : "none"} stroke="#7f3f39" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M63 105l17 16 17-16 10 8-12 28H65l-12-28z" fill="#ecfdf5" />
        <path d="M31 145q4-23 23-31l26 29 26-29q19 8 23 31" fill="url(#ananya-shirt)" />
        <circle cx="125" cy="34" r="4" fill="#a7f3d0" />
        <circle cx="35" cy="48" r="2.5" fill="#67e8f9" />
      </svg>
      {speaking && (
        <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-end gap-0.5 rounded-full border border-emerald-200/20 bg-[#0b1220] px-2 py-1">
          {[0, 1, 2, 3, 4].map((bar) => (
            <span
              key={bar}
              className="w-0.5 animate-pulse rounded-full bg-emerald-300"
              style={{ height: `${5 + (bar % 3) * 3}px`, animationDelay: `${bar * 90}ms` }}
            />
          ))}
        </span>
      )}
    </div>
  );
}

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
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [movementLevel, setMovementLevel] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const previousFrameRef = useRef<Uint8Array | null>(null);

  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const mountedRef = useRef(false);
  const openingStartedRef = useRef(false);
  const openingAutoPlayedRef = useRef(false);
  const lastSubmittedTranscriptRef = useRef("");
  const autoResponseLockRef = useRef(false);
  const roomRunRef = useRef(0);
  const speechRunRef = useRef(0);

  // Browser speech synthesis replaces the hosted TTS service.
  const speechResolveRef = useRef<(() => void) | null>(null);

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

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const resolvePendingSpeech = speechResolveRef.current;
    speechResolveRef.current = null;
    resolvePendingSpeech?.();

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

  // Play speech with the browser's built-in speech synthesis (free, no server/API).
  const speakText = useCallback(
    async (text: string, speaker: string, runId: number): Promise<void> => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        throw new Error("Speech playback is not supported in this browser. Try Chrome or Edge.");
      }
      if (speechRunRef.current !== runId) return;

      const cleanText = text.trim();
      if (!cleanText) return;

      window.speechSynthesis.cancel();

      // Wait briefly for voices to be populated on browsers that load them asynchronously.
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        await new Promise<void>((resolve) => {
          const timeout = window.setTimeout(resolve, 250);
          window.speechSynthesis.onvoiceschanged = () => {
            window.clearTimeout(timeout);
            window.speechSynthesis.onvoiceschanged = null;
            resolve();
          };
        });
        voices = window.speechSynthesis.getVoices();
      }

      if (speechRunRef.current !== runId) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const normalizedLanguage = language.toLowerCase();
      const lang = normalizedLanguage.includes("hindi") || normalizedLanguage.includes("hinglish")
        ? "hi-IN"
        : "en-IN";
      utterance.lang = lang;
      utterance.volume = 1;

      const voiceSettings: Record<string, { gender: "female" | "male"; pitch: number; rate: number }> = {
        Ananya: { gender: "female", pitch: 1.05, rate: 0.95 },
        Arjun: { gender: "male", pitch: 0.85, rate: 1.0 },
        Meera: { gender: "female", pitch: 1.0, rate: 0.95 },
        Kabir: { gender: "male", pitch: 0.9, rate: 0.9 },
        Riya: { gender: "female", pitch: 1.1, rate: 1.0 },
        Dev: { gender: "male", pitch: 0.95, rate: 0.95 },
      };
      const settings = voiceSettings[speaker] ?? { gender: "female" as const, pitch: 1, rate: 0.95 };
      utterance.pitch = settings.pitch;
      utterance.rate = settings.rate;

      const matchingLanguageVoices = voices.filter((voice) =>
        voice.lang.toLowerCase().startsWith(lang.slice(0, 2))
      );
      const genderHints = settings.gender === "female"
        ? ["female", "samantha", "ava", "karen", "moira", "lekha", "zira"]
        : ["male", "daniel", "alex", "david", "oliver", "rishi", "mark"];
      const preferredVoice = matchingLanguageVoices.find((voice) =>
        genderHints.some((hint) => voice.name.toLowerCase().includes(hint))
      );
      const selectedVoice = preferredVoice
        ?? matchingLanguageVoices.find((voice) => voice.default)
        ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en-"));
      if (selectedVoice) utterance.voice = selectedVoice;

      setActiveSpeaker(speaker);
      setModeratorSpeaking(speaker === "Ananya");

      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          utterance.onend = null;
          utterance.onerror = null;
          if (speechResolveRef.current === finish) speechResolveRef.current = null;
          if (speechRunRef.current === runId) {
            setModeratorSpeaking(false);
            setActiveSpeaker("");
          }
          resolve();
        };
        speechResolveRef.current = finish;
        utterance.onend = finish;
        utterance.onerror = (event) => {
          if (event.error === "canceled" || event.error === "interrupted") {
            finish();
            return;
          }
          if (settled) return;
          settled = true;
          if (speechResolveRef.current === finish) speechResolveRef.current = null;
          if (speechRunRef.current === runId) {
            setModeratorSpeaking(false);
            setActiveSpeaker("");
          }
          reject(new Error(`Speech playback failed: ${event.error}. Try Chrome or Edge.`));
        };
        if (speechRunRef.current !== runId) {
          finish();
          return;
        }
        window.speechSynthesis.speak(utterance);
      });
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

  const stopCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    previousFrameRef.current = null;
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access needs a supported browser and HTTPS (or localhost).");
      return;
    }
    try {
      setCameraError("");
      setMovementLevel(0);
      previousFrameRef.current = null;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCameraError("Camera permission was denied or no camera is available. Check your browser permissions.");
      stopCamera();
    }
  }, [stopCamera]);

  // Lightweight on-device motion estimate. This is not a psychological confidence detector.
  useEffect(() => {
    if (!cameraOn) return;
    let frameId = 0;
    let lastSample = 0;
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 36;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const sample = (time: number) => {
      frameId = window.requestAnimationFrame(sample);
      const video = videoRef.current;
      if (!context || !video || video.readyState < 2 || time - lastSample < 700) return;
      lastSample = time;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const current = new Uint8Array(canvas.width * canvas.height);
      for (let i = 0, j = 0; i < pixels.length; i += 4, j++) {
        current[j] = Math.round((pixels[i] * 3 + pixels[i + 1] * 6 + pixels[i + 2]) / 10);
      }
      const previous = previousFrameRef.current;
      if (previous) {
        let difference = 0;
        for (let i = 0; i < current.length; i++) difference += Math.abs(current[i] - previous[i]);
        setMovementLevel(Math.min(100, Math.round((difference / current.length) * 2.4)));
      }
      previousFrameRef.current = current;
    };
    frameId = window.requestAnimationFrame(sample);
    return () => window.cancelAnimationFrame(frameId);
  }, [cameraOn]);

  // Clean up audio and microphone when this page unmounts.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
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

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      speechResolveRef.current?.();
      speechResolveRef.current = null;
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
    stopCamera();
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
    stopCamera();
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
  const transcriptWords = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const elapsedSeconds = Math.max(0, duration * 60 - remaining);
  const elapsedLabel = `${Math.floor(elapsedSeconds / 60)}m ${String(elapsedSeconds % 60).padStart(2, "0")}s`;
  const userSentences = transcript.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0).length;
  const averageWordsPerSentence = userSentences ? Math.round(transcriptWords / userSentences) : 0;
  const fillerCount = (transcript.match(/\b(um|uh|erm|actually|basically|like)\b/gi) ?? []).length;

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
            <section className="mx-auto max-w-6xl">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#10131f] p-6 shadow-2xl shadow-violet-950/20 sm:p-10 print:border-slate-200 print:bg-white print:text-slate-900">
                <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl print:hidden" />
                <div className="pointer-events-none absolute -left-24 top-40 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl print:hidden" />

                <div className="relative flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-start print:border-slate-200">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-200 print:border-emerald-200 print:text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      SESSION COMPLETE · REPORT GENERATED
                    </div>
                    <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">Your next level starts here.</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 print:text-slate-600">A personalised debrief of your group discussion, with practical next steps and learning resources selected around your topic.</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 print:border-slate-200 print:text-slate-700">{format}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 print:border-slate-200 print:text-slate-700">{language}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 print:border-slate-200 print:text-slate-700">{panel} AI participants</span>
                    </div>
                    <p className="mt-4 text-sm text-slate-400 print:text-slate-600">Discussion topic: <span className="font-medium text-white print:text-slate-900">{topic}</span></p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
                    <button type="button" onClick={() => window.print()} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium transition hover:bg-white/10">↓ Save report as PDF</button>
                    <button type="button" onClick={leaveRoom} className="rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400">New practice ↗</button>
                  </div>
                </div>

                <div className="relative mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: "Practice time", value: elapsedLabel, detail: "Time spent in this session", icon: "◷", tone: "text-violet-200" },
                    { label: "Words spoken", value: String(transcriptWords), detail: "Your transcribed words", icon: "↗", tone: "text-cyan-200" },
                    { label: "Sentences", value: String(userSentences), detail: "Detected from punctuation", icon: "≋", tone: "text-emerald-200" },
                    { label: "Filler words", value: String(fillerCount), detail: "Rough transcript estimate", icon: "◎", tone: "text-amber-200" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5 print:border-slate-200 print:bg-slate-50">
                      <div className="flex items-center justify-between"><span className="text-xs text-slate-400 print:text-slate-600">{stat.label}</span><span className={`text-lg ${stat.tone}`}>{stat.icon}</span></div>
                      <p className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl print:text-slate-900">{stat.value}</p>
                      <p className="mt-2 text-[11px] leading-5 text-slate-500 print:text-slate-600">{stat.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="relative mt-7 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6 print:border-slate-200 print:bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300 print:text-violet-700">Your debrief</p><h2 className="mt-2 text-xl font-semibold">What your session tells us</h2></div>
                      <span className="rounded-xl bg-violet-400/10 px-3 py-2 text-lg text-violet-200 print:hidden">✳</span>
                    </div>
                    {transcriptWords === 0 ? (
                      <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-6 text-slate-300 print:text-slate-700">There is not enough transcribed speech to create a meaningful speaking assessment. In your next session, check microphone permission and speak for at least 30–60 seconds so the report can use your words.</div>
                    ) : (
                      <>
                        <p className="mt-4 text-sm leading-6 text-slate-300 print:text-slate-700">You contributed <strong className="text-white print:text-slate-900">{transcriptWords} words</strong> across <strong className="text-white print:text-slate-900">{userSentences} detected sentences</strong>. Your average sentence length was <strong className="text-white print:text-slate-900">{averageWordsPerSentence} words</strong>.</p>
                        <div className="mt-5 space-y-4">
                          <div>
                            <div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-300 print:text-slate-700">Average sentence length</span><span className="font-semibold text-cyan-200 print:text-cyan-800">{averageWordsPerSentence} words</span></div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10 print:bg-slate-200"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, averageWordsPerSentence / 30 * 100)}%` }} /></div>
                            <p className="mt-1.5 text-[11px] leading-5 text-slate-500 print:text-slate-600">A rough visual guide, not a score. Prioritise complete, easy-to-follow thoughts over a target number.</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-300 print:text-slate-700">Filler words detected</span><span className="font-semibold text-amber-200 print:text-amber-800">{fillerCount}</span></div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10 print:bg-slate-200"><div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, transcriptWords ? fillerCount / transcriptWords * 1000 : 0)}%` }} /></div>
                            <p className="mt-1.5 text-[11px] leading-5 text-slate-500 print:text-slate-600">Estimated from recognised text; transcription can miss or misclassify words.</p>
                          </div>
                        </div>
                      </>
                    )}
                    {movementLevel > 0 && <div className="mt-5 rounded-xl border border-sky-300/15 bg-sky-300/[0.05] p-3"><p className="text-xs font-semibold text-sky-200 print:text-sky-800">Camera movement snapshot</p><p className="mt-1 text-sm text-slate-300 print:text-slate-700">{movementLevel < 18 ? "Low" : movementLevel < 45 ? "Moderate" : "High"} visible movement estimate. This measures frame-to-frame movement only; it is not a confidence, emotion, or body-language score.</p></div>}
                  </div>

                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.035] p-5 sm:p-6 print:border-slate-200 print:bg-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 print:text-emerald-800">Your action plan</p>
                    <h2 className="mt-2 text-xl font-semibold">Three things to practise next</h2>
                    <div className="mt-5 space-y-4">
                      <div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-sm font-semibold text-emerald-200 print:text-emerald-800">01</span><div><p className="text-sm font-medium">Use a clear argument structure</p><p className="mt-1 text-xs leading-5 text-slate-400 print:text-slate-600">State your point → explain why → give a real example → connect it to the topic.</p></div></div>
                      <div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-sm font-semibold text-emerald-200 print:text-emerald-800">02</span><div><p className="text-sm font-medium">{fillerCount > 2 ? "Replace fillers with a pause" : "Practise concise, deliberate delivery"}</p><p className="mt-1 text-xs leading-5 text-slate-400 print:text-slate-600">{fillerCount > 2 ? `The transcript flagged ${fillerCount} possible filler words. Pause for a breath instead of filling silence; verify this estimate against what you actually said.` : "Record a 60-second answer, pause between ideas, and remove repeated points when reviewing it."}</p></div></div>
                      <div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-sm font-semibold text-emerald-200 print:text-emerald-800">03</span><div><p className="text-sm font-medium">Build on someone else's point</p><p className="mt-1 text-xs leading-5 text-slate-400 print:text-slate-600">Acknowledge one argument, add evidence or a counterpoint, then invite the group forward respectfully.</p></div></div>
                    </div>
                    <div className="mt-5 rounded-xl border border-white/10 bg-black/15 p-4 print:border-slate-200"><p className="text-xs font-semibold text-slate-200 print:text-slate-800">Next-session challenge</p><p className="mt-1 text-sm leading-6 text-slate-400 print:text-slate-600">Make 3 points in 60 seconds. Each point must include one reason and one example. Aim for clarity, not speed.</p></div>
                  </div>
                </div>

                <div className="relative mt-7">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300 print:text-violet-700">Curated for your topic</p><h2 className="mt-2 text-2xl font-semibold">Your learning queue</h2><p className="mt-2 text-sm text-slate-400 print:text-slate-600">Topic: {topic}. These links open focused searches or established learning resources; they are not claims that a particular video was watched or verified.</p></div><span className="text-xs text-slate-500">Videos · Reading · Practice</span></div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} group discussion arguments examples`)}`} target="_blank" rel="noreferrer" className="group rounded-2xl border border-rose-300/15 bg-rose-300/[0.04] p-5 transition hover:border-rose-300/40 hover:bg-rose-300/[0.07] print:border-slate-200 print:bg-white"><div className="flex items-center justify-between"><span className="rounded-lg bg-rose-300/10 px-2.5 py-1.5 text-xs font-semibold text-rose-200 print:text-rose-800">▶ VIDEO</span><span className="text-slate-500 transition group-hover:translate-x-1">↗</span></div><h3 className="mt-4 font-semibold">Understand the topic</h3><p className="mt-2 text-xs leading-5 text-slate-400 print:text-slate-600">Find explainers, arguments, examples and opposing viewpoints about this exact GD topic.</p><span className="mt-4 inline-block text-xs font-medium text-rose-200 print:text-rose-800">Search YouTube →</span></a>
                    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent("group discussion communication skills claim reason example public speaking")}`} target="_blank" rel="noreferrer" className="group rounded-2xl border border-violet-300/15 bg-violet-300/[0.04] p-5 transition hover:border-violet-300/40 hover:bg-violet-300/[0.07] print:border-slate-200 print:bg-white"><div className="flex items-center justify-between"><span className="rounded-lg bg-violet-300/10 px-2.5 py-1.5 text-xs font-semibold text-violet-200 print:text-violet-800">▶ VIDEO</span><span className="text-slate-500 transition group-hover:translate-x-1">↗</span></div><h3 className="mt-4 font-semibold">Speak with structure</h3><p className="mt-2 text-xs leading-5 text-slate-400 print:text-slate-600">Practise concise points, examples, active listening and respectful rebuttals.</p><span className="mt-4 inline-block text-xs font-medium text-violet-200 print:text-violet-800">Find speaking lessons →</span></a>
                    <a href="https://www.toastmasters.org/resources/public-speaking-tips" target="_blank" rel="noreferrer" className="group rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.07] print:border-slate-200 print:bg-white"><div className="flex items-center justify-between"><span className="rounded-lg bg-cyan-300/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-200 print:text-cyan-800">READ · GUIDE</span><span className="text-slate-500 transition group-hover:translate-x-1">↗</span></div><h3 className="mt-4 font-semibold">Public speaking toolkit</h3><p className="mt-2 text-xs leading-5 text-slate-400 print:text-slate-600">Practical tips for preparation, delivery and becoming a more effective speaker.</p><span className="mt-4 inline-block text-xs font-medium text-cyan-200 print:text-cyan-800">Read the guide →</span></a>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <a href="https://owl.purdue.edu/owl/general_writing/academic_writing/establishing_arguments/index.html" target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:bg-white/[0.05] print:border-slate-200"><span className="text-xl text-emerald-200 print:text-emerald-800">↗</span><div><p className="text-sm font-medium">Build stronger arguments</p><p className="mt-1 text-xs leading-5 text-slate-400 print:text-slate-600">Purdue OWL · How to establish and support an argument.</p></div></a>
                    <a href={`https://www.google.com/search?q=${encodeURIComponent(`${topic} credible sources evidence latest data`)}`} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:bg-white/[0.05] print:border-slate-200"><span className="text-xl text-amber-200 print:text-amber-800">⌕</span><div><p className="text-sm font-medium">Find evidence for your topic</p><p className="mt-1 text-xs leading-5 text-slate-400 print:text-slate-600">Search for credible sources, current data and examples you can use in your next GD.</p></div></a>
                  </div>
                </div>

                <div className="relative mt-7 grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 print:border-slate-200 print:bg-white"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Your transcript</h2><span className="text-xs text-slate-500">{transcriptWords} words</span></div><p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-300 print:max-h-none print:overflow-visible print:text-slate-700">{transcript || "No speech was transcribed."}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5 print:border-slate-200 print:bg-white"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">AI discussion highlights</h2><span className="text-xs text-slate-500">{discussionTurns.length} contributions</span></div>{discussionTurns.length ? <div className="mt-4 max-h-72 space-y-4 overflow-y-auto print:max-h-none print:overflow-visible">{discussionTurns.map((turn, index) => <div key={`${turn.speaker}-${index}`} className="border-l-2 border-violet-400/50 pl-3"><p className="text-xs font-semibold text-violet-300 print:text-violet-700">{turn.speaker} · {turn.role}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300 print:text-slate-700">{turn.text}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-400">No AI responses were recorded in this session.</p>}</div>
                </div>

                <div className="relative mt-7 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center print:border-slate-200">
                  <p className="text-xs leading-5 text-slate-500 print:text-slate-600">GD Arena coaching uses transcript-based signals, not a definitive measure of confidence or communication ability. Use the feedback as a practice guide.</p>
                  <button type="button" onClick={leaveRoom} className="shrink-0 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 print:hidden">Back to setup →</button>
                </div>
              </div>
              <style jsx global>{`@media print { body { background: white !important; } main { background: white !important; color: #0f172a !important; } @page { size: auto; margin: 12mm; } }`}</style>
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
                  <div className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-400/[0.04] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Live camera coach</p>
                        <h3 className="mt-1 text-lg font-semibold">Practice your on-camera presence</h3>
                        <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">Camera analysis stays in your browser. We estimate visible movement only—not your true confidence, emotions, or personality.</p>
                      </div>
                      <button type="button" onClick={() => cameraOn ? stopCamera() : void startCamera()} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${cameraOn ? "border border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20" : "bg-sky-400 text-slate-950 hover:bg-sky-300"}`}>
                        {cameraOn ? "Turn camera off" : "Turn camera on"}
                      </button>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full object-cover ${cameraOn ? "scale-x-[-1]" : "hidden"}`} />
                        {!cameraOn && <div className="flex h-full min-h-36 flex-col items-center justify-center gap-2 text-slate-500"><span className="text-3xl">◉</span><span className="text-xs">Camera is off</span></div>}
                        {cameraOn && <span className="absolute left-3 top-3 rounded-full bg-rose-500/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">● Live</span>}
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-2"><span className="text-xs text-slate-400">Visible movement</span><span className="text-sm font-semibold text-sky-200">{cameraOn ? movementLevel < 18 ? "Low" : movementLevel < 45 ? "Moderate" : "High" : "—"}</span></div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky-300 transition-all duration-500" style={{ width: `${cameraOn ? movementLevel : 0}%` }} /></div>
                          <p className="mt-2 text-[11px] leading-5 text-slate-500">A motion estimate from camera frames, not a confidence score. Some natural gestures are useful.</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-xs font-medium text-slate-200">Ananya’s tip</p>
                          <p className="mt-1 text-xs leading-5 text-slate-400">Keep your face comfortably in frame, look toward the camera when making a key point, and use relaxed, purposeful gestures.</p>
                        </div>
                        {cameraError && <p role="alert" className="text-xs leading-5 text-rose-300">{cameraError}</p>}
                      </div>
                    </div>
                  </div>
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
                        {member.name === moderator.name ? (
                          <AnanyaAvatar speaking={activeSpeaker === "Ananya" || moderatorSpeaking} />
                        ) : (
                          <ParticipantAvatar
                            name={member.name}
                            speaking={activeSpeaker === member.name}
                          />
                        )}

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
                      <AnanyaAvatar speaking={moderatorSpeaking} size="sm" />

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
                        aria-pressed={listening}
                        className="group flex min-h-[68px] flex-1 items-center justify-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 text-left transition hover:border-violet-300/30 hover:bg-white/[0.055] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                          <span className={`absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 via-violet-400 to-pink-400 blur-md transition-opacity ${listening ? "animate-pulse opacity-90" : "opacity-45 group-hover:opacity-75"}`} />
                          <span className={`absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 via-violet-500 to-pink-400 p-[2px] ${listening ? "animate-spin" : "transition-transform group-hover:scale-105"}`}>
                            <span className="flex h-full w-full items-center justify-center rounded-full bg-[#11131d]">
                              {listening ? (
                                <span className="flex h-5 items-center gap-[3px]">
                                  {[0, 1, 2, 3, 4].map((bar) => (
                                    <span key={bar} className="w-[3px] animate-pulse rounded-full bg-cyan-200" style={{ height: `${8 + (bar % 3) * 5}px`, animationDelay: `${bar * 100}ms` }} />
                                  ))}
                                </span>
                              ) : (
                                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                  <rect x="9" y="3" width="6" height="12" rx="3" />
                                  <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-4 0h8" strokeLinecap="round" />
                                </svg>
                              )}
                            </span>
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-white">{listening ? "Listening to you" : "Start speaking"}</span>
                          <span className="mt-1 block text-xs text-slate-400">{listening ? "Tap to stop · live transcription on" : "Tap the orb and share your point"}</span>
                        </span>
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

        {!finished && (
          <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-10 pointer-events-none">
            <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-full border border-white/10 bg-[#11131d]/95 p-2.5 shadow-[0_12px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                disabled={autoResponding}
                aria-label={listening ? "Stop listening" : "Start speaking"}
                aria-pressed={listening}
                className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={`absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 via-violet-500 to-pink-400 blur-md ${listening ? "animate-pulse opacity-100" : "opacity-70 group-hover:opacity-100"}`} />
                <span className={`absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 via-violet-500 to-pink-400 p-[2px] ${listening ? "animate-spin" : ""}`}>
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-[#11131d]">
                    {listening ? (
                      <span className="flex h-5 items-center gap-[3px]">
                        {[0, 1, 2, 3, 4].map((bar) => (
                          <span key={bar} className="w-[3px] animate-pulse rounded-full bg-cyan-200" style={{ height: `${8 + (bar % 3) * 5}px`, animationDelay: `${bar * 100}ms` }} />
                        ))}
                      </span>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <rect x="9" y="3" width="6" height="12" rx="3" />
                        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-4 0h8" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                disabled={autoResponding}
                className="min-w-0 flex-1 text-left disabled:cursor-not-allowed"
              >
                <span className="block text-sm font-semibold text-white">
                  {autoResponding ? (activeSpeaker ? `${activeSpeaker} is speaking` : "AI is preparing...") : listening ? "Listening to you" : "Start speaking"}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-400">
                  {autoResponding ? "Your mic will resume automatically" : listening ? "Tap here to stop · your words are transcribed" : "Tap the orb anytime to share your point"}
                </span>
              </button>
              {listening && (
                <span className="mr-2 flex h-8 items-center gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((bar) => (
                    <span key={bar} className="w-1 rounded-full bg-violet-300 animate-pulse" style={{ height: `${10 + (bar % 3) * 5}px`, animationDelay: `${bar * 120}ms` }} />
                  ))}
                </span>
              )}
            </div>
          </div>
        )}
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
              <span className="text-sky-300">✓</span>
              Optional camera practice coach
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
                speaking. Free browser voices with adjustable speaker styles.
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
