type ClipboardWriter = {
  writeText(value: string): Promise<void>;
};

type FallbackTextArea = {
  value: string;
  style: {
    position?: string;
    top?: string;
    left?: string;
    opacity?: string;
  };
  setAttribute(name: string, value: string): void;
  select(): void;
};

type FallbackDocument = {
  body: {
    appendChild(element: FallbackTextArea): unknown;
    removeChild(element: FallbackTextArea): unknown;
  };
  createElement(tagName: "textarea"): FallbackTextArea;
  execCommand(command: "copy"): boolean;
};

type CopyTextOptions = {
  clipboard?: ClipboardWriter | null;
  document?: FallbackDocument | null;
};

function getClipboard(options: CopyTextOptions): ClipboardWriter | null {
  if ("clipboard" in options) return options.clipboard ?? null;
  if (typeof navigator === "undefined") return null;
  return navigator.clipboard ?? null;
}

function getDocument(options: CopyTextOptions): FallbackDocument | null {
  if ("document" in options) return options.document ?? null;
  if (typeof document === "undefined") return null;
  return document as unknown as FallbackDocument;
}

function copyWithFallback(value: string, options: CopyTextOptions) {
  const fallbackDocument = getDocument(options);
  if (!fallbackDocument?.body) return false;

  const textarea = fallbackDocument.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";

  fallbackDocument.body.appendChild(textarea);
  textarea.select();

  try {
    return fallbackDocument.execCommand("copy");
  } finally {
    fallbackDocument.body.removeChild(textarea);
  }
}

export async function copyTextToClipboard(value: string, options: CopyTextOptions = {}) {
  if (copyWithFallback(value, options)) return true;

  const clipboard = getClipboard(options);
  if (!clipboard) return false;

  try {
    await clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
