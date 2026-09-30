"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** `?submission=<id>` — set by Pulse notifications (the backend's action_url)
 *  so the reviewer lands straight in that submission. `clear` drops it once
 *  handled, so closing the review doesn't reopen it. */
export function useSubmissionLink() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = Number(searchParams.get("submission"));
  const linkedId = Number.isInteger(raw) && raw > 0 ? raw : null;

  const clear = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("submission");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  return { linkedId, clear };
}
