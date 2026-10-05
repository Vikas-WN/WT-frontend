import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "?";
}

export function AuthorAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-wt-brand-soft text-xs font-semibold text-[var(--wt-brand)]",
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
