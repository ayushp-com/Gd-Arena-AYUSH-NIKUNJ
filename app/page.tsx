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
  }, [room, paused, finished, remaining
