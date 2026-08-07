import { WtLoader } from "@/components/dashboard/ui/WtLoader";

export function ProfileSectionLoader({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-wt-text-muted" role="status" aria-live="polite">
      <WtLoader size="sm" label={message} />
      {message}
    </div>
  );
}
