"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, getTheme, type Theme } from "./themes";

/*
  The active theme lives on <html data-theme>. That attribute is the store: the boot
  script sets it before paint, setTheme changes it, and every component that needs a
  colour in JS subscribes to it here.
*/

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const read = () => document.documentElement.getAttribute("data-theme") ?? DEFAULT_THEME.id;
const readServer = () => DEFAULT_THEME.id;

export function useTheme(): { theme: Theme; setTheme: (id: string) => void } {
  const id = useSyncExternalStore(subscribe, read, readServer);

  const setTheme = useCallback((next: string) => {
    const theme = getTheme(next);
    const html = document.documentElement;
    // Ease the colours over for the switch only.
    html.classList.add("theme-switching");
    html.setAttribute("data-theme", theme.id);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.themeColor);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    } catch {
      // Private mode or blocked storage: the theme still applies for this visit.
    }
    window.setTimeout(() => html.classList.remove("theme-switching"), 480);
  }, []);

  return { theme: getTheme(id), setTheme };
}
