import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WebTrakBrand } from "@/components/shared/WebTrakBrand";
import { NotFoundSpaceScene } from "@/components/shared/NotFoundSpaceScene";
import { DASHBOARD_ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <main className="wt-not-found relative flex min-h-dvh flex-col overflow-hidden bg-wt-page-bg text-wt-text">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="wt-not-found-nebula absolute left-1/2 top-[12%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[var(--wt-brand)]/16 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--wt-page-bg)_72%)]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <div className="wt-not-found-enter wt-not-found-enter--1 mb-6">
          <WebTrakBrand variant="header" className="origin-center !justify-center scale-110" />
        </div>

        <div className="wt-not-found-enter wt-not-found-enter--2 w-full">
          <NotFoundSpaceScene />
        </div>

        <h1 className="wt-not-found-enter wt-not-found-enter--3 wt-brand-wordmark mt-2 text-balance text-2xl font-bold tracking-[-0.03em] text-wt-text sm:text-3xl">
          Lost in orbit
        </h1>
        <p className="wt-not-found-enter wt-not-found-enter--4 mt-2 max-w-sm text-pretty text-sm leading-relaxed text-wt-text-muted sm:text-base">
          This page isn&apos;t on the map. Drift back to WebTrak and we&apos;ll get you grounded.
        </p>

        <div className="wt-not-found-enter wt-not-found-enter--5 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="brand"
            size="lg"
            nativeButton={false}
            render={<Link href={DASHBOARD_ROUTES.overview} />}
          >
            Back to dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Go to login
          </Button>
        </div>
      </div>
    </main>
  );
}
