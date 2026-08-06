"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appsService } from "@/services/apps.service";
import type {
  CreateAppKeyRequest,
  UpdateAppKeyRequest,
  UpdateAppKeyRolesRequest,
} from "@/types/apiKey";

const KEYS = {
  root: ["apps"] as const,
  list: (q: string, page: number, perPage: number) =>
    ["apps", "list", q, page, perPage] as const,
  detail: (id: number | null) => ["apps", "detail", id] as const,
};

export function useAppsList(
  q = "",
  page = 1,
  perPage = 20,
  enabled = true,
) {
  return useQuery({
    queryKey: KEYS.list(q, page, perPage),
    enabled,
    queryFn: () => appsService.list({ q: q || undefined, page, per_page: perPage }),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  });
}

export function useApp(id: number | null) {
  return useQuery({
    queryKey: KEYS.detail(id),
    enabled: id != null && id > 0,
    queryFn: () => (id ? appsService.get(id) : Promise.resolve(null)),
    staleTime: 30_000,
  });
}

export function useInvalidateApps() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: KEYS.root });
  };
}

export function useCreateApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAppKeyRequest) => appsService.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.root });
    },
  });
}

export function useUpdateApp(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateAppKeyRequest) => appsService.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.root });
    },
  });
}

export function useUpdateAppRoles(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateAppKeyRolesRequest) => appsService.updateRoles(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.root });
    },
  });
}

export function useRevokeApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => appsService.revoke(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.root });
    },
  });
}

export function useRotateApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => appsService.rotate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEYS.root });
    },
  });
}
