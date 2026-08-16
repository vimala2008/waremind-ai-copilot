import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface VoiceContextValue {
  muted: boolean;
  toggleMuted: () => void;
  speak: (text: string) => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

const STORAGE_KEY = "waremind:voice-muted";

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setMuted(true);
    } catch {
      /* ignore */
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (muted) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.98;
        utterance.pitch = 1.02;
        utterance.volume = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch {
        /* speech not available */
      }
    },
    [muted],
  );

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (next && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  return (
    <VoiceContext.Provider value={{ muted, toggleMuted, speak }}>{children}</VoiceContext.Provider>
  );
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used inside VoiceProvider");
  return ctx;
}
