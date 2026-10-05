"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/error";
import { FORM_QUERY_KEYS, FORM_REFRESH_MS } from "@/constants/forms";
import { notifyError, notifySuccess } from "@/lib/notify";
import { formService } from "@/services/forms.service";
import { EMPTY_PAGE, type ListParams } from "@/types/paged";
import type { FormAnswers, FormCreatePayload, FormUpdatePayload } from "@/types/form";
import { downloadBlob } from "@/utils/downloadBlob";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

function apiErrorMessage(error: unknown, fallback: string): string {
  return toUserFriendlyApiErrorMessage(error, error instanceof ApiError ? error.message : fallback);
}

export function useMyForms(params: ListParams & { status?: "all" | "todo" | "done" } = {}) {
  return useQuery({
    queryKey: FORM_QUERY_KEYS.minePage(params),
    placeholderData: keepPreviousData,
    queryFn: async () => (await formService.mine(params)).data ?? EMPTY_PAGE,
    staleTime: 30_000,
    refetchInterval: FORM_REFRESH_MS,
    refetchOnWindowFocus: "always",
  });
}

export function useManagedForms(enabled: boolean, params: ListParams = {}) {
  return useQuery({
    queryKey: FORM_QUERY_KEYS.managedPage(params),
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => (await formService.managed(params)).data ?? EMPTY_PAGE,
    staleTime: 30_000,
  });
}

export function useFormDetail(id: number) {
  return useQuery({
    queryKey: FORM_QUERY_KEYS.detail(id),
    queryFn: async () => (await formService.detail(id)).data ?? null,
    staleTime: 0,
  });
}

export function useFormResponses(id: number) {
  return useQuery({
    queryKey: FORM_QUERY_KEYS.responses(id),
    queryFn: async () => (await formService.responses(id)).data ?? null,
    staleTime: 10_000,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormCreatePayload) => formService.create(payload),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: FORM_QUERY_KEYS.all });
      const sent = res.data?.recipient_count;
      notifySuccess(sent != null ? `Form sent to ${sent} ${sent === 1 ? "person" : "people"}.` : "Form sent.");
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't send that form.")),
  });
}

/** The server's message names exactly which answer is wrong, so it's shown as-is. */
export function useSubmitForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answers }: { id: number; answers: FormAnswers }) => formService.submit(id, answers),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FORM_QUERY_KEYS.all });
      notifySuccess("Thanks — your answers are saved.");
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't save your answers.")),
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormUpdatePayload }) => formService.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: FORM_QUERY_KEYS.all }),
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't update that form.")),
  });
}

export function useRemindForm() {
  return useMutation({
    mutationFn: (id: number) => formService.remind(id),
    onSuccess: (res) => {
      const reminded = res.data?.reminded ?? 0;
      notifySuccess(reminded > 0 ? `Reminded ${reminded} ${reminded === 1 ? "person" : "people"}.` : "Everyone has answered.");
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't send reminders.")),
  });
}

export function useExportFormCsv() {
  return useMutation({
    mutationFn: async (id: number) => downloadBlob(await formService.responsesCsv(id), `form-${id}-responses.csv`),
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't export the responses.")),
  });
}
