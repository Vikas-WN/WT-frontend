import { formatManagerEmailList, formatManagerLabelList } from "@/utils/leaveManagerDisplay";

export function LeaveManagerEmailsCell({
  emails,
  labels,
}: {
  emails: string[];
  labels?: string[];
}) {
  const { display, title } =
    labels?.length === emails.length
      ? formatManagerLabelList(labels)
      : formatManagerEmailList(emails);
  if (display === "—") return <span>—</span>;
  return (
    <span className="max-w-[200px] truncate" title={title}>
      {display}
    </span>
  );
}
