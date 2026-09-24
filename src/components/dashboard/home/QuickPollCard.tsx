"use client";

import { useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, Trash2, Vote } from "lucide-react";
import { HomeCard, CardMessage, CardSkeleton } from "@/components/dashboard/home/HomeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  REPORT_CHART_COLORS,
  REPORT_CHART_MUTED,
  REPORT_CHART_TOOLTIP_BG,
  REPORT_CHART_TOOLTIP_BORDER,
  REPORT_CHART_TOOLTIP_TEXT,
} from "@/components/reports/charts/reportChartTheme";
import { useAuth } from "@/context/AuthContext";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  useClosePoll,
  useCreatePoll,
  useCurrentPoll,
  useVoteOnPoll,
} from "@/hooks/polls/useQuickPoll";
import type { PollSummary } from "@/services/hrms.service";

function CreatePollForm() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const createPoll = useCreatePoll();

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const submit = () => {
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || cleanOptions.length < 2) {
      showErrorToast("Add a question and at least 2 options.");
      return;
    }
    createPoll.mutate(
      { question: question.trim(), options: cleanOptions },
      {
        onSuccess: () => {
          showSuccessToast("Poll published");
          setQuestion("");
          setOptions(["", ""]);
        },
        onError: (err) => showErrorToast(err instanceof Error ? err.message : "Could not create poll"),
      }
    );
  };

  return (
    <div className="space-y-2.5">
      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask something fun…"
        aria-label="Poll question"
      />
      <div className="space-y-1.5">
        {options.map((opt, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <Input
              value={opt}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              aria-label={`Option ${index + 1}`}
              className="h-8 text-sm"
            />
            {options.length > 2 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                aria-label="Remove option"
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ))}
        {options.length < 6 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-wt-text-muted"
            onClick={() => setOptions((prev) => [...prev, ""])}
          >
            <Plus className="size-3.5" /> Add option
          </Button>
        ) : null}
      </div>
      <Button
        type="button"
        variant="brand"
        size="sm"
        className="w-full"
        disabled={createPoll.isPending}
        onClick={submit}
      >
        {createPoll.isPending ? "Publishing…" : "Publish poll"}
      </Button>
    </div>
  );
}

function VoteOptions({ poll }: { poll: PollSummary }) {
  const vote = useVoteOnPoll();
  return (
    <div className="space-y-1.5">
      <p className="mb-1 text-sm font-medium text-wt-text">{poll.question}</p>
      {poll.options.map((opt) => (
        <Button
          key={opt.id}
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start"
          disabled={vote.isPending}
          onClick={() =>
            vote.mutate(
              { pollId: poll.id, optionId: opt.id },
              { onError: (err) => showErrorToast(err instanceof Error ? err.message : "Could not vote") }
            )
          }
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

function PollResults({ poll, canManage }: { poll: PollSummary; canManage: boolean }) {
  const closePoll = useClosePoll();
  const chartData = poll.options.map((opt) => ({
    label: opt.label,
    votes: opt.votes,
    mine: opt.id === poll.my_option_id,
  }));
  const height = Math.max(120, chartData.length * 34);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-wt-text">{poll.question}</p>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tick={{ fill: REPORT_CHART_MUTED, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "color-mix(in srgb, var(--wt-brand) 8%, transparent)" }}
              contentStyle={{
                background: REPORT_CHART_TOOLTIP_BG,
                border: `1px solid ${REPORT_CHART_TOOLTIP_BORDER}`,
                borderRadius: 10,
                color: REPORT_CHART_TOOLTIP_TEXT,
                fontSize: 12,
              }}
              formatter={(value: number | string) => [
                `${poll.total_votes > 0 ? Math.round((Number(value) / poll.total_votes) * 100) : 0}%`,
                "Votes",
              ]}
            />
            <Bar dataKey="votes" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.label}
                  fill={entry.mine ? "var(--wt-brand)" : REPORT_CHART_COLORS[index % REPORT_CHART_COLORS.length]}
                  fillOpacity={entry.mine ? 1 : 0.65}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-wt-text-muted">
        {poll.total_votes} vote{poll.total_votes === 1 ? "" : "s"} · by {poll.created_by_name}
      </p>
      {canManage && poll.status === "ACTIVE" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 text-xs text-wt-text-muted"
          disabled={closePoll.isPending}
          onClick={() =>
            closePoll.mutate(poll.id, {
              onSuccess: () => showSuccessToast("Poll closed"),
              onError: (err) => showErrorToast(err instanceof Error ? err.message : "Could not close poll"),
            })
          }
        >
          Close poll
        </Button>
      ) : null}
    </div>
  );
}

export function QuickPollCard() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const canManage = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const { data: poll, isLoading } = useCurrentPoll();

  const hasVoted = poll ? poll.my_option_id != null : false;

  return (
    <HomeCard title="Quick Poll" icon={<Vote className="size-4" />}>
      {isLoading ? (
        <CardSkeleton />
      ) : !poll ? (
        canManage ? (
          <CreatePollForm />
        ) : (
          <CardMessage text="No active poll right now." />
        )
      ) : hasVoted ? (
        <PollResults poll={poll} canManage={canManage} />
      ) : (
        <VoteOptions poll={poll} />
      )}
    </HomeCard>
  );
}
