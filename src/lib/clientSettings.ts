"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Client-side, localStorage-backed user preferences.
 *
 * Theme is applied immediately by toggling the `.dark`/`.light` class on
 * <html> (the pre-paint script in layout.tsx reads the same `theme` key on
 * first load). Other preferences are simple persisted values consumed where
 * relevant (e.g. the chapter reader).
 */

export type ThemeMode = "dark" | "light" | "system";
export type ReaderMode = "vertical" | "horizontal";
export type ReaderQuality = "high" | "medium" | "data";

export const SETTINGS_KEYS = {
  theme: "theme",
  readerMode: "reader:mode",
  readerQuality: "reader:quality",
  notifyUpdates: "notify:updates",
  notifyReplies: "notify:replies",
} as const;

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyThemeClass(mode: ThemeMode) {
  const root = document.documentElement;
  const dark = mode === "dark" || (mode === "system" && systemPrefersDark());
  root.classList.remove("light", "dark");
  root.classList.add(dark ? "dark" : "light");
}

/** Live theme control: persists the choice and applies it to <html>. */
export function useTheme(): [ThemeMode, (mode: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(SETTINGS_KEYS.theme);
    } catch {
      /* ignore */
    }
    setMode(stored === "dark" || stored === "light" ? stored : "system");
  }, []);

  // While on "system", track OS theme changes live.
  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeClass("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const set = useCallback((next: ThemeMode) => {
    setMode(next);
    try {
      if (next === "system") localStorage.removeItem(SETTINGS_KEYS.theme);
      else localStorage.setItem(SETTINGS_KEYS.theme, next);
    } catch {
      /* ignore */
    }
    applyThemeClass(next);
  }, []);

  return [mode, set];
}

/** Persisted string preference (typed to a known union). */
export function useStored<T extends string>(
  key: string,
  fallback: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(stored as T);
    } catch {
      /* ignore */
    }
  }, [key]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, next);
      } catch {
        /* ignore */
      }
    },
    [key],
  );

  return [value, set];
}

/** Persisted boolean preference (stored as "1"/"0"). */
export function useStoredBool(
  key: string,
  fallback: boolean,
): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(stored === "1");
    } catch {
      /* ignore */
    }
  }, [key]);

  const set = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        /* ignore */
      }
    },
    [key],
  );

  return [value, set];
}
