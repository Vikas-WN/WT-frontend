/** What chat accepts as a file, mirrored from the server's rules so a bad pick is caught before the upload starts. No app imports. */

const MB = 1024 * 1024;

export type ChatFileKind = "image" | "video" | "audio" | "file";

const BY_EXTENSION: Record<string, { kind: ChatFileKind; capMb: number }> = {
  png: { kind: "image", capMb: 10 },
  jpg: { kind: "image", capMb: 10 },
  jpeg: { kind: "image", capMb: 10 },
  gif: { kind: "image", capMb: 10 },
  webp: { kind: "image", capMb: 10 },
  mp4: { kind: "video", capMb: 20 },
  mov: { kind: "video", capMb: 20 },
  webm: { kind: "video", capMb: 20 },
  mp3: { kind: "audio", capMb: 10 },
  m4a: { kind: "audio", capMb: 10 },
  wav: { kind: "audio", capMb: 10 },
  ogg: { kind: "audio", capMb: 10 },
  pdf: { kind: "file", capMb: 15 },
  doc: { kind: "file", capMb: 15 },
  docx: { kind: "file", capMb: 15 },
  xls: { kind: "file", capMb: 15 },
  xlsx: { kind: "file", capMb: 15 },
  ppt: { kind: "file", capMb: 15 },
  pptx: { kind: "file", capMb: 15 },
  csv: { kind: "file", capMb: 15 },
  txt: { kind: "file", capMb: 15 },
};

/** For <input accept>. */
export const CHAT_FILE_ACCEPT = Object.keys(BY_EXTENSION)
  .map((ext) => `.${ext}`)
  .join(",");

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

export function chatFileKind(name: string): ChatFileKind {
  return BY_EXTENSION[extensionOf(name)]?.kind ?? "file";
}

/** An error to show the person, or null when the file is fine to send. */
export function validateChatFile(file: { name: string; size: number }): string | null {
  const rule = BY_EXTENSION[extensionOf(file.name)];
  if (!rule) return `${file.name} can't be sent in chat. Photos, videos, audio, PDFs, Word/Excel/PowerPoint, CSV and text files are fine.`;
  if (file.size <= 0) return `${file.name} is empty.`;
  if (file.size > rule.capMb * MB) return `${file.name} is larger than ${rule.capMb}MB.`;
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`;
}

/** Slash commands people expect from chat: "/shrug", "/tableflip", "/party". Returns the text to send. */
const SLASH: Record<string, string> = {
  "/shrug": "¯\\_(ツ)_/¯",
  "/tableflip": "(╯°□°)╯︵ ┻━┻",
  "/unflip": "┬─┬ ノ( ゜-゜ノ)",
  "/party": "🎉🥳🎉",
};

export function applySlashCommand(text: string): string {
  const match = /^(\/[a-z]+)(?:\s+([\s\S]*))?$/.exec(text.trim());
  if (!match || !(match[1] in SLASH)) return text;
  const rest = (match[2] ?? "").trim();
  return rest ? `${rest} ${SLASH[match[1]]}` : SLASH[match[1]];
}
