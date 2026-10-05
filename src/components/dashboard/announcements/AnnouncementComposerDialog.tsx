"use client";

import { useState } from "react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { AudiencePicker, isAudienceComplete } from "@/components/audience/AudiencePicker";
import { DatePickerField, InputField, TextAreaField } from "@/components/dashboard/ui/forms";
import { ANNOUNCEMENT_COPY } from "@/constants/announcements";
import { AUDIENCE_COPY } from "@/constants/audience";
import { useAudienceOptions, useCreateAnnouncement } from "@/hooks/announcements/useAnnouncements";
import { formatApiDate } from "@/utils/apiDate";
import { EMPTY_AUDIENCE, type AudienceScope, type AudienceSpec } from "@/types/audience";

const MIN_LENGTH = 3;

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-wt-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-wt-border-md accent-[var(--wt-brand)]"
      />
      {label}
    </label>
  );
}

/** Post an announcement to everyone, departments, projects, your team or picked people. */
export function AnnouncementComposerDialog({ onClose }: { onClose: () => void }) {
  const options = useAudienceOptions(true);
  const create = useCreateAnnouncement();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [emailToo, setEmailToo] = useState(false);
  const [expiresOn, setExpiresOn] = useState("");
  const [audience, setAudience] = useState<AudienceSpec | null>(null);

  // A manager can't send company-wide, so start on the first scope the server allows.
  const firstScope: AudienceScope = options.data?.scopes[0] ?? "ALL";
  const effective = audience ?? { ...EMPTY_AUDIENCE, scope: firstScope };
  const canSubmit =
    title.trim().length >= MIN_LENGTH && body.trim().length >= MIN_LENGTH && isAudienceComplete(effective);

  return (
    <WtFormDialog
      open
      title={ANNOUNCEMENT_COPY.composerTitle}
      description={ANNOUNCEMENT_COPY.composerDescription}
      onClose={onClose}
      onSubmit={() =>
        create.mutate(
          {
            title: title.trim(),
            body: body.trim(),
            is_pinned: pinned,
            expires_on: expiresOn || null,
            audience: effective,
            notify_by_email: emailToo,
          },
          { onSuccess: onClose }
        )
      }
      submitLabel={ANNOUNCEMENT_COPY.post}
      submittingLabel={ANNOUNCEMENT_COPY.posting}
      submitDisabled={!canSubmit}
      loading={create.isPending}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5">
        <InputField
          label={ANNOUNCEMENT_COPY.titleLabel}
          value={title}
          onChange={setTitle}
          required
          placeholder={ANNOUNCEMENT_COPY.titlePlaceholder}
        />
        <TextAreaField
          label={ANNOUNCEMENT_COPY.bodyLabel}
          value={body}
          onChange={setBody}
          rows={5}
          required
          placeholder={ANNOUNCEMENT_COPY.bodyPlaceholder}
        />

        {options.isLoading ? (
          <p className="text-sm text-wt-text-muted">{AUDIENCE_COPY.loading}</p>
        ) : options.data ? (
          <AudiencePicker options={options.data} value={effective} onChange={setAudience} />
        ) : (
          <p className="text-sm text-rose-600 dark:text-rose-400">{AUDIENCE_COPY.error}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <DatePickerField
            label={ANNOUNCEMENT_COPY.expiresLabel}
            value={expiresOn}
            onChange={setExpiresOn}
            min={formatApiDate(new Date())}
          />
          <div className="flex flex-col justify-end gap-2.5 pb-1">
            <Toggle label={ANNOUNCEMENT_COPY.pinLabel} checked={pinned} onChange={setPinned} />
            <Toggle label={ANNOUNCEMENT_COPY.emailLabel} checked={emailToo} onChange={setEmailToo} />
          </div>
        </div>
      </div>
    </WtFormDialog>
  );
}
