"use client";

import { useQuery } from "@tanstack/react-query";
import { leaveAttachmentService } from "@/services/leaveAttachment.service";

export const LEAVE_ATTACHMENT_REQUIREMENT_QUERY_KEY = ["leave", "attachment-requirement"] as const;

/** Is the signed-in employee on-site (so their leave needs the client's approval email)? Asked of the server, which owns the rule. */
export function useLeaveAttachmentRequirement(enabled = true) {
  return useQuery({
    queryKey: LEAVE_ATTACHMENT_REQUIREMENT_QUERY_KEY,
    enabled,
    staleTime: 5 * 60_000,
    queryFn: () => leaveAttachmentService.requirement(),
  });
}
