/**
 * Voice Search hook powered by Web Speech API.
 * Supports localized speech recognition (Telugu 'te-IN', Hindi 'hi-IN', English 'en-IN'),
 * extended silence detection (4-5 seconds pause before auto-submit),
 * and intelligent meaningful query transformation (removes verbal fillers/stutters,
 * normalizes survey/khasra numbers and land terms, formats questions).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from './store';

export const LOCALE_SPEECH_LANGS: Record<Locale, string> = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
};

export const LOCALE_LANG_NAMES: Record<Locale, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English (India)' },
  te: { name: 'Telugu', nativeName: 'తెలుగు (Telugu)' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी (Hindi)' },
};

/**
 * Intelligent voice query cleaner.
 * Transforms raw spoken transcript into a crisp, meaningful land governance question:
 * 1. Strips spoken fillers (uh, um, ఆ, అంటే, ఉమ్, అరే, सुनो, मतलब, etc.)
 * 2. Removes stuttering / consecutive word repetitions
 * 3. Removes polite conversational preambles ("can you please tell me", "దయచేసి చెప్పండి", "कृपया मुझे बताएं")
 * 4. Normalizes survey numbers / khasra numbers / ULPIN into standard cadastral syntax
 * 5. Punctuates questions with '?' and capitalizes appropriate letters
 */
export function cleanMeaningfulVoiceQuery(raw: string, locale: Locale): string {
  if (!raw || !raw.trim()) return '';
  let text = raw.trim();

  // 1. Remove stuttering / duplicate adjacent words (e.g. 'the the', 'నా నా', 'मेरा मेरा')
  text = text.replace(/\b(\w+)\s+\1\b/gi, '$1');
  text = text.replace(/(^|\s+)([\p{L}\p{M}]+)\s+\2(?=\s+|$)/giu, '$1$2');

  // 2. Language-specific spoken filler tokens & introductory pleasantries
  if (locale === 'te') {
    // Remove Telugu verbal fillers
    text = text.replace(/(?:^|\s+)(?:అంటే|ఏంటంటే|ఆ+|ఉమ్+|హలో|అరే|ఒకసారి|వగైరా)(?=\s+|$)/gu, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    // Remove polite conversational preambles
    text = text.replace(/^(?:దయచేసి\s+చెప్పండి|దయచేసి|నాకు\s+చెప్పండి|నాకు\s+తెలియజేయండి|నాకు\s+కావాల్సింది)\s+/u, '');
    // Normalize Telugu survey numbers: "సర్వే నంబర్ 123 బై 4" -> "సర్వే నం. 123/4"
    text = text.replace(/సర్వే\s*(?:నంబర్|నంబరు|సంఖ్య)?\s*(\d+)\s*(?:బై|\/)\s*(\d+)/gi, 'సర్వే నం. $1/$2');
    text = text.replace(/సర్వే\s*(?:నంబర్|నంబరు|సంఖ్య)?\s*(\d+)/gi, 'సర్వే నం. $1');
    text = text.replace(/యు\s*ఎల్\s*పి\s*ఐ\s*ఎన్|భూ[\s-]*ఆధార్/gi, 'ULPIN');
  } else if (locale === 'hi') {
    // Remove Hindi verbal fillers
    text = text.replace(/(?:^|\s+)(?:मतलब|जैसे\s*कि|अरे|सुनो|नमस्ते|देखिये|उम+|आ+)(?=\s+|$)/gu, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    // Remove polite conversational preambles
    text = text.replace(/^(?:कृपया\s+मुझे\s+बताएं|कृपया\s+बताइए|कृपया|मुझे\s+जानना\s+है\s+कि|क्या\s+आप\s+बता\s+सकते\s+हैं\s+कि|मुझे\s+बताएं)\s+/u, '');
    // Normalize Hindi khasra numbers: "खसरा नंबर 123 बटा 4" -> "खसरा सं. 123/4"
    text = text.replace(/खसरा\s*(?:नंबर|संख्या)?\s*(\d+)\s*(?:बटा|\/)\s*(\d+)/gi, 'खसरा सं. $1/$2');
    text = text.replace(/खसरा\s*(?:नंबर|संख्या)?\s*(\d+)/gi, 'खसरा सं. $1');
    text = text.replace(/भू[\s-]*आधार/gi, 'ULPIN');
  } else {
    // Remove English verbal fillers
    text = text.replace(/\b(?:uh|um|er|ah|like|you know|basically|actually|sort of|kind of|i mean|hello)\b/gi, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    // Remove polite conversational preambles
    text = text.replace(/^(?:can you please tell me|please tell me|i want to know|can you check|tell me about|tell me|please)\s+/i, '');
    // Normalize English survey numbers: "survey number 123 by 4" -> "Survey No. 123/4"
    text = text.replace(/survey\s*(?:no\.?|number)?\s*(\d+)\s*(?:by|\/|slash)\s*(\d+)/gi, 'Survey No. $1/$2');
    text = text.replace(/survey\s*(?:no\.?|number)?\s*(\d+)/gi, 'Survey No. $1');
    text = text.replace(/\bbhu\s*aadhaar\b/gi, 'ULPIN');
  }

  // 3. Clean redundant whitespace
  text = text.replace(/\s+/g, ' ').trim();
  if (!text) return raw.trim();

  // 4. Capitalize first letter if Latin alphabet
  text = text.charAt(0).toUpperCase() + text.slice(1);

  // 5. Add question mark if interrogative without terminal punctuation
  const isQuestionEn = /\b(?:how|what|where|who|why|can\s+(?:i|we|you)|is\s+it|is\s+there|are\s+there|which|when|do|does|safe\s+to)\b/i.test(text);
  const isQuestionTe = /(?:ఎలా|ఏమిటి|ఎక్కడ|ఎవరు|ఎందుకు|చేయవచ్చా|ఉందా|కదా|ఎవరిది)/u.test(text);
  const isQuestionHi = /(?:कैसे|क्या|कहाँ|किसका|किसकी|किनका|किसे|क्यों|सकते हैं|है क्या|मिलेगा)/u.test(text);

  if ((isQuestionEn || isQuestionTe || isQuestionHi) && !/[?.!]$/.test(text)) {
    text += '?';
  }

  return text;
}

export interface UseVoiceSearchOptions {
  locale: Locale;
  /** Silence duration before auto-submitting the query in milliseconds (default: 4500ms = 4.5s) */
  silenceDurationMs?: number;
  /** Callback fired when a meaningful query has been finalized after silence timeout or user manual stop */
  onFinalTranscript?: (meaningfulQuery: string) => void;
  /** Optional callback fired on interim partial speech */
  onInterimTranscript?: (interimQuery: string) => void;
}

export function useVoiceSearch({
  locale,
  silenceDurationMs = 4500, // 4.5 seconds default (within the user's requested 4-5s window)
  onFinalTranscript,
  onInterimTranscript,
}: UseVoiceSearchOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [cleanedPreview, setCleanedPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [silenceSecondsRemaining, setSilenceSecondsRemaining] = useState<number | null>(null);

  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalChunksRef = useRef<string[]>([]);
  const currentRawRef = useRef<string>('');

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const clearSilenceTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSilenceSecondsRemaining(null);
  }, []);

  const finalizeQuery = useCallback(
    (manualStop = false) => {
      clearSilenceTimers();
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }

      isListeningRef.current = false;
      setIsListening(false);

      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }

      const raw = currentRawRef.current.trim();
      currentRawRef.current = '';
      finalChunksRef.current = [];
      setInterimTranscript('');

      if (raw) {
        const meaningful = cleanMeaningfulVoiceQuery(raw, locale);
        setCleanedPreview(meaningful);
        if (meaningful && onFinalTranscript) {
          onFinalTranscript(meaningful);
        }
      } else if (!manualStop) {
        setCleanedPreview('');
      }
    },
    [clearSilenceTimers, locale, onFinalTranscript],
  );

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimers();

    const durationSec = Math.ceil(silenceDurationMs / 1000);
    setSilenceSecondsRemaining(durationSec);

    let remaining = durationSec;
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setSilenceSecondsRemaining(null);
      } else {
        setSilenceSecondsRemaining(remaining);
      }
    }, 1000);

    silenceTimerRef.current = setTimeout(() => {
      // 4-5s of silence elapsed!
      finalizeQuery(false);
    }, silenceDurationMs);
  }, [clearSilenceTimers, finalizeQuery, silenceDurationMs]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('speech_not_supported');
      return;
    }

    setError(null);
    clearSilenceTimers();
    finalChunksRef.current = [];
    currentRawRef.current = '';
    setInterimTranscript('');
    setCleanedPreview('');

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = LOCALE_SPEECH_LANGS[locale] || 'en-IN';

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);

      // Initial timeout: if no speech is detected at all for 10s, auto-cancel
      initialTimeoutRef.current = setTimeout(() => {
        if (isListeningRef.current && !currentRawRef.current) {
          cancelListening();
        }
      }, 10000);
    };

    recognition.onresult = (event: any) => {
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
        initialTimeoutRef.current = null;
      }

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';
        if (item.isFinal) {
          finalChunksRef.current.push(text);
        } else {
          interim += text;
        }
      }

      const allFinal = finalChunksRef.current.join(' ').trim();
      const combined = (allFinal + (interim ? (allFinal ? ' ' : '') + interim : '')).trim();

      currentRawRef.current = combined;
      setInterimTranscript(interim || allFinal);

      if (combined) {
        const preview = cleanMeaningfulVoiceQuery(combined, locale);
        setCleanedPreview(preview);
        onInterimTranscript?.(preview);

        // Reset the 4-5s silence countdown after each piece of speech detected
        resetSilenceTimer();
      }
    };

    recognition.onerror = (event: any) => {
      const errType = event?.error;
      if (errType === 'not-allowed' || errType === 'service-not-allowed') {
        setError('permission_denied');
        finalizeQuery(true);
      } else if (errType === 'no-speech') {
        // Handled via our custom silence detection, avoid immediate termination
      } else if (errType !== 'aborted') {
        setError(errType || 'unknown');
      }
    };

    recognition.onend = () => {
      // In Chrome, continuous mode can still unexpectedly trigger onend after short pauses.
      // If our silenceTimer hasn't finished and the user is still intended to be listening,
      // seamlessly restart recognition!
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // If restart fails, finalize gracefully
          finalizeQuery(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err: any) {
      setError(err?.message || 'start_failed');
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [
    isSupported,
    clearSilenceTimers,
    locale,
    onInterimTranscript,
    resetSilenceTimer,
    finalizeQuery,
  ]);

  const stopListening = useCallback(() => {
    // Manually stop and send whatever was spoken
    finalizeQuery(true);
  }, [finalizeQuery]);

  const cancelListening = useCallback(() => {
    clearSilenceTimers();
    if (initialTimeoutRef.current) {
      clearTimeout(initialTimeoutRef.current);
      initialTimeoutRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    currentRawRef.current = '';
    finalChunksRef.current = [];
    setInterimTranscript('');
    setCleanedPreview('');
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, [clearSilenceTimers]);

  // Clean up timers on unmount or language change
  useEffect(() => {
    return () => {
      clearSilenceTimers();
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, [clearSilenceTimers]);

  return {
    isSupported,
    isListening,
    interimTranscript,
    cleanedPreview,
    error,
    silenceSecondsRemaining,
    startListening,
    stopListening,
    cancelListening,
  };
}
