"use client";

import {
  createRelaySession,
  registerFormFill,
  registerPlaygroundSurfaces,
  submitForm,
  type RelayConnectionState,
  type RelayEventEnvelope,
  type RelaySession,
  type UiFormSurface,
  type UiSurface,
} from "@sumukhj1219-wkt-org/relay-web-sdk";
import ReactMarkdown from "react-markdown";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Bot, Check, ChevronDown, ChevronUp, Loader2, MessageCircle, Mic, MicOff, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RelayMessage = { id: string; role: "user" | "assistant" | "status"; text: string };
type FormValues = Record<string, string | number | boolean | null>;

type RelayConfig = {
  gatewayUrl: string;
  apiKey: string;
  agentId: string;
  projectId: string;
  enabled: boolean;
};

function eventText(event: RelayEventEnvelope): string {
  return String(event.payload.text ?? event.payload.message ?? "").trim();
}

function surfaceTitle(surface: UiSurface): string {
  return surface.title ?? surface.kind[0].toUpperCase() + surface.kind.slice(1);
}

function SurfaceContent({
  surface,
  values,
  onValuesChange,
  onSubmit,
}: {
  surface: UiSurface;
  values: FormValues;
  onValuesChange: (values: FormValues) => void;
  onSubmit: (form: UiFormSurface) => void;
}) {
  if (surface.kind === "markdown") return <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{surface.markdown}</ReactMarkdown></div>;
  if (surface.kind === "notice") return <p className="text-sm text-wt-text-muted">{surface.body}</p>;
  if (surface.kind === "kv") {
    return <dl className="grid gap-3 sm:grid-cols-2">{surface.items.map((item) => <div key={item.label}><dt className="text-xs text-wt-text-muted">{item.label}</dt><dd className="text-sm font-medium">{item.value}</dd></div>)}</dl>;
  }
  if (surface.kind === "cards") {
    return <div className="grid gap-3 sm:grid-cols-2">{surface.cards.map((card) => <Card key={card.title} className="rounded-xl"><CardHeader className="p-4"><CardTitle className="text-sm">{card.title}</CardTitle></CardHeader><CardContent className="space-y-2 p-4 pt-0"><p className="text-sm text-wt-text-muted">{card.body}</p>{card.fields?.map((field) => <p key={field.label} className="text-sm"><span className="text-wt-text-muted">{field.label}: </span>{field.value}</p>)}</CardContent></Card>)}</div>;
  }
  if (surface.kind === "comparison") {
    return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Field</th>{surface.entities.map((entity) => <th key={entity} className="p-2">{entity}</th>)}</tr></thead><tbody>{surface.rows.map((row) => <tr key={row.label} className={row.differs ? "bg-amber-500/10" : ""}><td className="p-2 font-medium">{row.label}</td>{row.values.map((value, index) => <td key={`${row.label}-${index}`} className="p-2">{value}</td>)}</tr>)}</tbody></table></div>;
  }
  if (surface.kind === "table" || surface.kind === "chart") {
    const columns = surface.kind === "table" ? surface.columns : [{ key: surface.xKey, label: surface.xKey }, ...surface.series];
    const rows = surface.kind === "table" ? surface.rows : surface.data;
    return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{columns.map((column) => <th key={column.key} className="border-b border-wt-border p-2 font-semibold">{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-b border-wt-border/50">{columns.map((column) => <td key={column.key} className="p-2">{String(row[column.key] ?? "")}</td>)}</tr>)}</tbody></table></div>;
  }
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(surface); }}>
      {surface.fields.map((field) => {
        const value = values[field.name] ?? field.defaultValue ?? (field.type === "checkbox" ? false : "");
        const common = { id: `${surface.id}-${field.name}`, name: field.name, required: field.required, placeholder: field.placeholder, value: field.type === "checkbox" ? undefined : String(value), checked: field.type === "checkbox" ? Boolean(value) : undefined };
        const change = (next: string | number | boolean) => onValuesChange({ ...values, [field.name]: next });
        return <label key={field.name} htmlFor={common.id} className="grid gap-1.5 text-sm sm:col-span-1">
          <span>{field.label}{field.required ? " *" : ""}</span>
          {field.type === "textarea" ? <Textarea {...common} onChange={(event) => change(event.target.value)} /> : field.type === "select" ? <select {...common} className="h-10 rounded-xl border border-input bg-wt-surface-1 px-3 text-sm" onChange={(event) => change(event.target.value)}><option value="">Select…</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : field.type === "checkbox" ? <input {...common} type="checkbox" className="size-4" onChange={(event) => change(event.target.checked)} /> : <Input {...common} type={field.type} onChange={(event) => change(field.type === "number" ? Number(event.target.value) : event.target.value)} />}
        </label>;
      })}
      <div className="sm:col-span-2"><Button type="submit" size="sm">{surface.submitLabel}</Button></div>
    </form>
  );
}

function ResultsCanvas({ surfaces, onClear, onClose, onSubmit, formValues, setFormValues }: {
  surfaces: UiSurface[];
  onClear: () => void;
  onClose: (index: number) => void;
  onSubmit: (form: UiFormSurface) => void;
  formValues: Record<string, FormValues>;
  setFormValues: (id: string, values: FormValues) => void;
}) {
  const [hidden, setHidden] = useState(false);
  const [minimized, setMinimized] = useState<Record<string, boolean>>({});
  if (!surfaces.length) return null;
  return <section aria-label="Assistant results" className="mx-4 mb-5 rounded-2xl border border-wt-border bg-wt-surface-1 shadow-sm sm:mx-6 md:mx-8">
    <div className="flex items-center gap-2 border-b border-wt-border px-4 py-3"><h2 className="text-sm font-semibold">Assistant results ({surfaces.length})</h2><Button type="button" size="xs" variant="ghost" className="ml-auto" aria-expanded={!hidden} aria-controls="relay-results" onClick={() => setHidden((value) => !value)}>{hidden ? "Show results" : "Hide"}</Button>{!hidden && <Button type="button" size="xs" variant="ghost" onClick={onClear}>Clear</Button>}</div>
    <div id="relay-results" hidden={hidden} className="space-y-3 p-4">{surfaces.map((surface, index) => { const key = surface.id ?? `${surface.kind}-${index}`; const isMinimized = minimized[key] ?? false; return <article key={key} className="rounded-xl border border-wt-border"><header className="flex items-center gap-2 px-3 py-2"><h3 className="text-sm font-medium">{surfaceTitle(surface)}</h3><Button type="button" size="icon-xs" variant="ghost" className="ml-auto" aria-label={isMinimized ? "Expand result" : "Minimize result"} onClick={() => setMinimized((current) => ({ ...current, [key]: !isMinimized }))}>{isMinimized ? <ChevronDown /> : <ChevronUp />}</Button><Button type="button" size="icon-xs" variant="ghost" aria-label="Close result" onClick={() => onClose(index)}><X /></Button></header><div hidden={isMinimized} className="border-t border-wt-border p-3">{surface.kind === "form" && surface.description ? <p className="mb-3 text-sm text-wt-text-muted">{surface.description}</p> : null}<SurfaceContent surface={surface} values={formValues[key] ?? {}} onValuesChange={(values) => setFormValues(key, values)} onSubmit={onSubmit} /></div></article>; })}</div>
  </section>;
}

function RelayChat({ session, messages, busy, connection, onSend, onVoice, voiceConnected, onClose }: {
  session: RelaySession;
  messages: RelayMessage[];
  busy: boolean;
  connection: RelayConnectionState;
  onSend: (text: string) => void;
  onVoice: () => void;
  voiceConnected: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  return <aside className="fixed bottom-4 right-4 z-[300] flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 shadow-2xl" aria-label="Relay assistant">
    <header className="flex items-center gap-2 border-b border-wt-border px-4 py-3"><Bot className="size-4 text-[var(--wt-brand)]" /><span className="text-sm font-semibold">WebTrak assistant</span><span className="ml-auto text-xs text-wt-text-muted">{connection === "ready" ? "Ready" : connection}</span><Button type="button" size="icon-xs" variant="ghost" aria-label="Close assistant" onClick={onClose}><X /></Button></header>
    <div className="max-h-80 space-y-3 overflow-y-auto p-4">{messages.length ? messages.map((message) => <div key={message.id} className={cn("rounded-xl px-3 py-2 text-sm", message.role === "user" ? "ml-8 bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" : "mr-8 bg-wt-surface-2 text-wt-text")}><span className="whitespace-pre-wrap">{message.text}</span></div>) : <p className="text-sm text-wt-text-muted">Ask about WebTrak or request a table, chart, or form.</p>}{busy ? <Loader2 className="size-4 animate-spin text-wt-text-muted" /> : null}</div>
    <form className="flex gap-2 border-t border-wt-border p-3" onSubmit={(event) => { event.preventDefault(); if (text.trim()) { onSend(text.trim()); setText(""); } }}><Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Ask the assistant…" disabled={connection !== "ready"} aria-label="Message assistant" /><Button type="button" size="icon" variant="outline" aria-label={voiceConnected ? "Stop voice" : "Start voice"} onClick={onVoice}>{voiceConnected ? <MicOff /> : <Mic />}</Button><Button type="submit" size="icon" disabled={connection !== "ready" || !text.trim()} aria-label="Send message"><Send /></Button></form>
    <span className="sr-only">{session.sessionId}</span>
  </aside>;
}

function RelayUnavailableNotice({ onClose }: { onClose: () => void }) {
  return (
    <aside
      className="fixed bottom-4 right-4 z-[300] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 shadow-2xl"
      aria-label="Relay assistant"
    >
      <header className="flex items-center gap-2 border-b border-wt-border px-4 py-3">
        <Bot className="size-4 text-[var(--wt-brand)]" />
        <span className="text-sm font-semibold">WebTrak assistant</span>
        <Button type="button" size="icon-xs" variant="ghost" className="ml-auto" aria-label="Close assistant" onClick={onClose}>
          <X />
        </Button>
      </header>
      <div className="space-y-2 p-4 text-sm">
        <p className="font-medium">Assistant unavailable in this deployment.</p>
        <p className="text-wt-text-muted">
          Relay needs its gateway URL, publishable key, and agent ID configured before it can connect.
        </p>
      </div>
    </aside>
  );
}

export function RelayExperience({ children }: { children: ReactNode }) {
  const sessionRef = useRef<RelaySession | null>(null);
  const [messages, setMessages] = useState<RelayMessage[]>([]);
  const [surfaces, setSurfaces] = useState<UiSurface[]>([]);
  const [formValues, setFormValuesState] = useState<Record<string, FormValues>>({});
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState<RelayConnectionState>("disconnected");
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [relayConfig, setRelayConfig] = useState<RelayConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const surfacesRef = useRef<UiSurface[]>([]);
  const addMessage = useCallback((role: RelayMessage["role"], text: string) => { if (!text) return; setMessages((current) => [...current, { id: `${Date.now()}-${Math.random()}`, role, text }]); }, []);
  const setFormValues = useCallback((id: string, values: FormValues) => setFormValuesState((current) => ({ ...current, [id]: values })), []);

  useEffect(() => {
    let active = true;
    fetch("/api/relay/config", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Relay configuration request failed: ${response.status}`);
        return (await response.json()) as RelayConfig;
      })
      .then((config) => {
        if (active) setRelayConfig(config);
      })
      .catch(() => {
        if (active) setRelayConfig({ gatewayUrl: "", apiKey: "", agentId: "", projectId: "", enabled: false });
      })
      .finally(() => {
        if (active) setConfigLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!relayConfig?.enabled) return;
    const session = createRelaySession({ gatewayUrl: relayConfig.gatewayUrl, agentId: relayConfig.agentId, ...(relayConfig.apiKey ? { apiKey: relayConfig.apiKey } : { projectId: relayConfig.projectId }), transport: "small-webrtc" });
    sessionRef.current = session;
    const offSurfaces = registerPlaygroundSurfaces(session, ({ surfaces: next, replace }) => {
      setSurfaces((current) => {
        const updated = replace ? next : [...current, ...next];
        surfacesRef.current = updated;
        return updated;
      });
      setFormValuesState((current) => { const nextValues = { ...current }; next.filter((surface): surface is UiFormSurface => surface.kind === "form").forEach((form) => { nextValues[form.id] ??= Object.fromEntries(form.fields.filter((field) => field.defaultValue !== undefined).map((field) => [field.name, field.defaultValue ?? null])); }); return nextValues; });
      setOpen(true);
    });
    const offFill = registerFormFill(session, ({ formId, values }) => { if (!surfacesRef.current.some((surface) => surface.kind === "form" && surface.id === formId)) throw new Error("form is not open"); setFormValuesState((current) => ({ ...current, [formId]: { ...current[formId], ...values } })); });
    const offConnection = session.onConnectionState(setConnection);
    const offTurnStart = session.on("TURN_STARTED", () => setBusy(true));
    const offTurnEnd = session.on("TURN_COMPLETED", () => setBusy(false));
    const offTranscript = session.on("TRANSCRIPT_FINAL", (event) => addMessage("user", eventText(event)));
    const offResponseStart = session.on("RESPONSE_STARTED", () => setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: "assistant", text: "" }]));
    const offDelta = session.on("RESPONSE_DELTA", (event) => setMessages((current) => { const last = current[current.length - 1]; if (!last || last.role !== "assistant") return current; return [...current.slice(0, -1), { ...last, text: `${last.text}${eventText(event)}` }]; }));
    const offError = session.on("SESSION_ERROR", (event) => { setBusy(false); addMessage("status", eventText(event) || "The assistant is unavailable."); });
    void session.connect().catch((error: unknown) => addMessage("status", error instanceof Error ? error.message : "The assistant could not connect."));
    return () => { offSurfaces(); offFill(); offConnection(); offTurnStart(); offTurnEnd(); offTranscript(); offResponseStart(); offDelta(); offError(); session.disconnect(); sessionRef.current = null; };
  }, [addMessage, relayConfig]);

  const send = useCallback((text: string) => { sessionRef.current?.sendText(text); setOpen(true); }, []);
  const toggleVoice = useCallback(() => { const session = sessionRef.current; if (!session) return; if (voiceConnected) { void session.disconnectVoice(); setVoiceConnected(false); } else { void session.connectVoice().then(() => setVoiceConnected(true)).catch((error: unknown) => addMessage("status", error instanceof Error ? error.message : "Microphone access failed.")); } }, [addMessage, voiceConnected]);
  if (configLoading || !relayConfig?.enabled) {
    return (
      <>
        {children}
        {open ? (
          <RelayUnavailableNotice onClose={() => setOpen(false)} />
        ) : (
          <Button
            type="button"
            className="fixed bottom-5 right-5 z-[300] rounded-full shadow-lg"
            aria-label="Open WebTrak assistant"
            onClick={() => setOpen(true)}
          >
            <MessageCircle /> Assistant
          </Button>
        )}
      </>
    );
  }
  return <><div>{surfaces.length ? <ResultsCanvas surfaces={surfaces} onClear={() => { surfacesRef.current = []; setSurfaces([]); }} onClose={(index) => setSurfaces((current) => { const updated = current.filter((_, item) => item !== index); surfacesRef.current = updated; return updated; })} onSubmit={(form) => { const id = form.id; const values = formValues[id] ?? {}; if (sessionRef.current) submitForm(sessionRef.current, form, values); }} formValues={formValues} setFormValues={setFormValues} /> : null}{children}</div>{open ? <RelayChat session={sessionRef.current!} messages={messages} busy={busy} connection={connection} onSend={send} onVoice={toggleVoice} voiceConnected={voiceConnected} onClose={() => setOpen(false)} /> : <Button type="button" className="fixed bottom-5 right-5 z-[300] rounded-full shadow-lg" aria-label="Open WebTrak assistant" onClick={() => setOpen(true)}><MessageCircle /> Assistant</Button>}</>;
}
