"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { hrmsService } from "@/services/hrms.service";
import { formatBalanceDays } from "@/utils/leaveRequestDisplay";
import { formatApiDate, toApiDateParam } from "@/utils/apiDate";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

/** Projected leave balance on a future date, before booking travel — adds the leaves credited
 *  on the 1st of each month until then and subtracts approved and still-pending
 *  leave/optional-leave requests, not just the current snapshot. */
export function LeaveBalanceForecastWidget() {
  const [targetDate, setTargetDate] = useState("");
  const normalized = targetDate ? (toApiDateParam(targetDate) ?? "") : "";
  // The API rejects a past target_date outright (the forecast only makes sense
  // going forward from today) — restrict the picker to today onward so that
  // rejection can't happen from the picker's own default range, rather than
  // letting the user pick an invalid date and only finding out from a generic
  // "Could not calculate forecast" after the fact.
  const todayApiDate = useMemo(() => formatApiDate(new Date()), []);

  const forecastQ = useQuery({
    queryKey: ["leave", "my-balance-forecast", normalized],
    enabled: Boolean(normalized),
    staleTime: 60_000,
    queryFn: async () => {
      const res = await hrmsService.getMyLeaveBalanceForecast(normalized);
      return res.data ?? null;
    },
  });

  const forecast = forecastQ.data;

  return (
    <div className="mb-6 rounded-xl border border-wt-border bg-wt-surface-2/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="size-4 text-[var(--wt-brand)]" />
        <p className="text-sm font-semibold text-wt-text">Forecast my balance</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-[220px]">
          <DatePicker
            label="On this date"
            value={targetDate}
            onChange={setTargetDate}
            min={todayApiDate}
          />
        </div>
        {forecastQ.isFetching ? (
          <p className="text-sm text-wt-text-muted">Calculating…</p>
        ) : forecastQ.isError ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {toUserFriendlyApiErrorMessage(forecastQ.error, "Could not calculate forecast.")}
          </p>
        ) : forecast ? (
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <p className="text-sm text-wt-text">
              Projected balance:{" "}
              <span className="text-lg font-bold text-[var(--wt-brand)] tabular-nums">
                {formatBalanceDays(forecast.projected_total).amount}
              </span>{" "}
              <span className="text-xs text-wt-text-muted">days</span>
            </p>
            {forecast.accrual_days > 0 || forecast.approved_days > 0 || forecast.pending_days > 0 ? (
              <p className="text-xs text-wt-text-muted">
                {[
                  forecast.accrual_days > 0 ? `+${forecast.accrual_days} credited` : null,
                  forecast.approved_days > 0 ? `−${forecast.approved_days} approved` : null,
                  forecast.pending_days > 0 ? `−${forecast.pending_days} pending` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                {" between now and then"}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-wt-text-muted">Pick a date to see your projected balance.</p>
        )}
      </div>
    </div>
  );
}
