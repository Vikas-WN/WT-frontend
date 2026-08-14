"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { PAGE_SIZE_OPTIONS } from "@/hooks/useClientPagination";
import { hrmsService } from "@/services/hrms.service";
import {
  dashboardFromOnBenchPage,
  dashboardFromUnallocatedPage,
  parseOnBenchPage,
  parseTalentPoolDashboard,
  parseUnallocatedPage,
  type TalentPoolDashboardData,
} from "@/utils/talentPool";

export const TALENT_POOL_QUERY_KEY = ["allocation", "talent-pool"] as const;

const DEFAULT_PAGE_SIZE = 25;

export type TalentPoolPages = {
  onBench: number;
  unallocated: number;
};

export type TalentPoolPageSizes = {
  onBench: number;
  unallocated: number;
};

const DEFAULT_PAGES: TalentPoolPages = { onBench: 0, unallocated: 0 };
const DEFAULT_PAGE_SIZES: TalentPoolPageSizes = {
  onBench: DEFAULT_PAGE_SIZE,
  unallocated: DEFAULT_PAGE_SIZE,
};

function normalizePageSize(size: number): number {
  if ((PAGE_SIZE_OPTIONS as readonly number[]).includes(size)) return size;
  return DEFAULT_PAGE_SIZE;
}

export function useTalentPoolTables(enabled: boolean) {
  const [data, setData] = useState<TalentPoolDashboardData | null>(null);
  const [pages, setPages] = useState<TalentPoolPages>(DEFAULT_PAGES);
  const [pageSizes, setPageSizes] = useState<TalentPoolPageSizes>(DEFAULT_PAGE_SIZES);
  const pageSizesRef = useRef(pageSizes);
  pageSizesRef.current = pageSizes;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (opts?: {
      search?: string;
      pages?: Partial<TalentPoolPages>;
      pageSizes?: Partial<TalentPoolPageSizes>;
    }) => {
      if (!enabled) return;
      const nextSearch = opts?.search ?? debouncedSearch;
      const nextPages = { ...DEFAULT_PAGES, ...opts?.pages };
      const currentSizes = pageSizesRef.current;
      const nextSizes = {
        onBench: normalizePageSize(opts?.pageSizes?.onBench ?? currentSizes.onBench),
        unallocated: normalizePageSize(
          opts?.pageSizes?.unallocated ?? currentSizes.unallocated
        ),
      };

      setLoading(true);
      setError(null);
      try {
        const res = await hrmsService.getTalentPoolDashboard({
          search: nextSearch.trim() || undefined,
          onBenchPage: nextPages.onBench,
          onBenchSize: nextSizes.onBench,
          unallocatedPage: nextPages.unallocated,
          unallocatedSize: nextSizes.unallocated,
        });
        setData(parseTalentPoolDashboard(res));
        setPages(nextPages);
        setPageSizes(nextSizes);
      } catch (e) {
        setData(null);
        setError(e instanceof Error ? e.message : "Could not load talent pool.");
      } finally {
        setLoading(false);
      }
    },
    [enabled, debouncedSearch]
  );

  const loadOnBenchPage = useCallback(
    async (page: number, size?: number) => {
      if (!enabled) return;
      const nextSize = normalizePageSize(size ?? pageSizesRef.current.onBench);
      setLoading(true);
      setError(null);
      try {
        const res = await hrmsService.getTalentPool({
          page,
          size: nextSize,
          search: debouncedSearch.trim() || undefined,
        });
        const parsed = parseOnBenchPage(res);
        setData((prev) => dashboardFromOnBenchPage(parsed, prev));
        setPages((p) => ({ ...p, onBench: page }));
        setPageSizes((p) => ({ ...p, onBench: nextSize }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load talent pool.");
      } finally {
        setLoading(false);
      }
    },
    [enabled, debouncedSearch]
  );

  const loadUnallocatedPage = useCallback(
    async (page: number, size?: number) => {
      if (!enabled) return;
      const nextSize = normalizePageSize(size ?? pageSizesRef.current.unallocated);
      setLoading(true);
      setError(null);
      try {
        const res = await hrmsService.getTalentPoolUnallocated({
          page,
          size: nextSize,
          search: debouncedSearch.trim() || undefined,
        });
        const parsed = parseUnallocatedPage(res);
        setData((prev) => {
          const base = dashboardFromUnallocatedPage(parsed);
          return prev ? { ...base, on_bench: prev.on_bench, label: prev.label } : base;
        });
        setPages((p) => ({ ...p, unallocated: page }));
        setPageSizes((p) => ({ ...p, unallocated: nextSize }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load talent pool.");
      } finally {
        setLoading(false);
      }
    },
    [enabled, debouncedSearch]
  );

  const setOnBenchPageSize = useCallback(
    (size: number) => {
      void loadOnBenchPage(0, size);
    },
    [loadOnBenchPage]
  );

  const setUnallocatedPageSize = useCallback(
    (size: number) => {
      void loadUnallocatedPage(0, size);
    },
    [loadUnallocatedPage]
  );

  useEffect(() => {
    if (!enabled) return;
    void loadDashboard({ search: debouncedSearch, pages: DEFAULT_PAGES });
  }, [enabled, debouncedSearch, loadDashboard]);

  return {
    data,
    pages,
    pageSizes,
    search,
    setSearch,
    loading,
    error,
    loadDashboard,
    loadOnBenchPage,
    loadUnallocatedPage,
    setOnBenchPageSize,
    setUnallocatedPageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
