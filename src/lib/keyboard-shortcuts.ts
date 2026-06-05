/**
 * Keyboard Shortcuts - Global keyboard shortcuts for power users
 */

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  modifiers?: ("ctrl" | "alt" | "shift" | "meta")[];
  description: string;
  descriptionZh: string;
  action: () => void;
}

export const shortcuts: KeyboardShortcut[] = [
  {
    key: "k",
    modifiers: ["ctrl"],
    description: "Focus search",
    descriptionZh: "聚焦搜索",
    action: () => {},
  },
  {
    key: "s",
    modifiers: ["ctrl"],
    description: "Share analysis",
    descriptionZh: "分享分析",
    action: () => {},
  },
  {
    key: "c",
    modifiers: ["ctrl", "shift"],
    description: "Copy command queue",
    descriptionZh: "复制命令队列",
    action: () => {},
  },
  {
    key: "1",
    description: "Go to Focus tab",
    descriptionZh: "跳转到专注标签",
    action: () => {},
  },
  {
    key: "2",
    description: "Go to Contributors tab",
    descriptionZh: "跳转到贡献者标签",
    action: () => {},
  },
  {
    key: "3",
    description: "Go to Review tab",
    descriptionZh: "跳转到评审标签",
    action: () => {},
  },
];

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.modifiers) {
    if (shortcut.modifiers.includes("ctrl")) parts.push("⌘");
    if (shortcut.modifiers.includes("alt")) parts.push("⌥");
    if (shortcut.modifiers.includes("shift")) parts.push("⇧");
    if (shortcut.modifiers.includes("meta")) parts.push("⌘");
  }
  parts.push(shortcut.key.toUpperCase());
  return parts.join("");
}

/**
 * Check if keyboard event matches shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const key = event.key.toLowerCase();
  if (key !== shortcut.key.toLowerCase()) return false;

  const modifiers = shortcut.modifiers || [];
  const needsCtrl = modifiers.includes("ctrl");
  const needsAlt = modifiers.includes("alt");
  const needsShift = modifiers.includes("shift");
  const needsMeta = modifiers.includes("meta");

  return (
    event.ctrlKey === needsCtrl &&
    event.altKey === needsAlt &&
    event.shiftKey === needsShift &&
    event.metaKey === needsMeta
  );
}

/**
 * Hook to register keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
