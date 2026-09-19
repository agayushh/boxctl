import { useEffect } from "react";
import type { Action } from "@/utils/coordinates";

type Handlers = {
  enabled: boolean;
  onMove?: (action: Action) => void;
  onToggle?: () => void;
  onReset?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function useKeyboard(handlers: Handlers): void {
  const { enabled, onMove, onToggle, onReset, onNext, onPrev } = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "arrowup" || key === "w") {
        event.preventDefault();
        onMove?.("UP");
      } else if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        onMove?.("DOWN");
      } else if (key === "arrowleft" || key === "a") {
        event.preventDefault();
        onMove?.("LEFT");
      } else if (key === "arrowright" || key === "d") {
        event.preventDefault();
        onMove?.("RIGHT");
      } else if (key === " ") {
        event.preventDefault();
        onToggle?.();
      } else if (key === "r") {
        event.preventDefault();
        onReset?.();
      } else if (key === "n") {
        event.preventDefault();
        onNext?.();
      } else if (key === "p") {
        event.preventDefault();
        onPrev?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onMove, onToggle, onReset, onNext, onPrev]);
}
