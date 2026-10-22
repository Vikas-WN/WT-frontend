"use client";

import { Check } from "lucide-react";
import { COMPANIONS } from "@/constants/companions";
import { usePetCharacter, usePetEnabled } from "@/lib/petPreference";
import { Companion } from "./Companion";

export function CompanionPicker() {
  const [selected, select] = usePetCharacter();
  const [, setEnabled] = usePetEnabled();
  return (
    <section id="settings-companions" className="rounded-3xl border border-wt-border bg-wt-surface-1 p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-wt-text">Choose your companion</h3>
      <p className="mt-1 text-xs leading-relaxed text-wt-text-muted">Drag, pet, or double-tap to celebrate. Right-click or long-press for signature moves. Your choice stays on this device.</p>
      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,128px),1fr))] gap-3" role="group" aria-label="Desk companion">
        {COMPANIONS.map((item) => (
          <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => { select(item.id); setEnabled(true); }} className={`relative flex min-w-0 flex-col items-center justify-start rounded-2xl border p-3 text-center transition-colors ${selected === item.id ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)]" : "border-wt-border hover:bg-wt-surface-2"}`}>
            {selected === item.id ? <Check className="absolute right-2 top-2 size-4 text-[var(--wt-brand)]" aria-hidden /> : null}
            <span className="flex h-24 w-full items-center justify-center overflow-hidden"><Companion character={item.id} size={72} animate={false} /></span>
            <span className="mt-2 max-w-full break-words text-sm font-semibold text-wt-text">{item.name}</span>
            <span className="mt-1 max-w-full text-xs leading-relaxed text-wt-text-muted">{item.detail}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
