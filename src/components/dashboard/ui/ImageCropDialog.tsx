"use client";

import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from "react";

import { Button } from "@/components/ui/button";
import { MODAL_BODY_CLASS, MODAL_FOOTER_CLASS, MODAL_HEADER_CLASS, MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from "@/components/dashboard/ui/uiLayout";
import { IMAGE_CROP_COPY } from "@/constants/uiCopy";
import { clampCropOffset, cropSquareFor, renderCrop } from "@/lib/cropImage";

const VIEW = 288;
const CIRCLE = 256;
const OUTPUT = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const KEY_STEP = 12;

/** Pick the part of a photo to keep: drag to position, slide or scroll to zoom, inside a circular frame. */
export function ImageCropDialog({
  imageSrc,
  onConfirm,
  onCancel,
}: {
  imageSrc: string;
  onConfirm: (cropped: File) => void;
  onCancel: () => void;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  // UI state: the loaded picture's size, the zoom, where it has been dragged to, and whether it is being saved.
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const scale = natural ? Math.max(CIRCLE / natural.width, CIRCLE / natural.height) * zoom : 1;
  const displayWidth = natural ? natural.width * scale : 0;
  const displayHeight = natural ? natural.height * scale : 0;
  // The stored offset is re-clamped on every render, so zooming out never leaves the frame over empty space.
  const position = useMemo(
    () => ({
      x: clampCropOffset(offset.x, displayWidth, CIRCLE),
      y: clampCropOffset(offset.y, displayHeight, CIRCLE),
    }),
    [offset, displayWidth, displayHeight]
  );

  const moveBy = useCallback((dx: number, dy: number) => setOffset({ x: position.x + dx, y: position.y + dy }), [position.x, position.y]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const last = dragRef.current;
    if (!last) return;
    dragRef.current = { x: event.clientX, y: event.clientY };
    moveBy(event.clientX - last.x, event.clientY - last.y);
  };
  const endDrag = () => {
    dragRef.current = null;
  };
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - event.deltaY * 0.002)));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moveBy(move[0], move[1]);
  };

  const confirm = async () => {
    const image = imageRef.current;
    if (!image || !natural) return;
    setSaving(true);
    try {
      const square = cropSquareFor({
        naturalWidth: natural.width,
        naturalHeight: natural.height,
        scale,
        offsetX: position.x,
        offsetY: position.y,
        circle: CIRCLE,
      });
      onConfirm(await renderCrop(image, square, OUTPUT, IMAGE_CROP_COPY.fileName));
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <div className={MODAL_OVERLAY_CLASS} role="presentation">
      <div role="dialog" aria-modal="true" aria-label={IMAGE_CROP_COPY.title} className={`${MODAL_PANEL_CLASS} max-w-sm`}>
        <div className={MODAL_HEADER_CLASS}>
          <h2 className="text-base font-semibold text-wt-text">{IMAGE_CROP_COPY.title}</h2>
          <p className="mt-1 text-sm text-wt-text-muted">{IMAGE_CROP_COPY.hint}</p>
        </div>
        <div className={MODAL_BODY_CLASS}>
          <div
            tabIndex={0}
            role="application"
            aria-label={IMAGE_CROP_COPY.hint}
            className="relative mx-auto touch-none select-none overflow-hidden rounded-xl bg-black outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)] cursor-grab active:cursor-grabbing"
            style={{ width: VIEW, height: VIEW }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onWheel={onWheel}
            onKeyDown={onKeyDown}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL being cropped on a canvas */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt=""
              draggable={false}
              onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
              onError={() => setFailed(true)}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
              style={{
                width: displayWidth || undefined,
                height: displayHeight || undefined,
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
                visibility: natural ? "visible" : "hidden",
              }}
            />
            <div
              className="pointer-events-none absolute rounded-full border-2 border-white/90"
              style={{ width: CIRCLE, height: CIRCLE, left: (VIEW - CIRCLE) / 2, top: (VIEW - CIRCLE) / 2, boxShadow: "0 0 0 999px rgba(0,0,0,0.55)" }}
              aria-hidden
            />
          </div>
          <label className="mx-auto mt-4 flex items-center gap-3" style={{ width: VIEW }}>
            <span className="text-sm text-wt-text-muted">{IMAGE_CROP_COPY.zoom}</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-2 flex-1 accent-[var(--wt-brand)]"
              aria-label={IMAGE_CROP_COPY.zoom}
            />
          </label>
          {failed ? <p className="mt-3 text-center text-sm text-rose-600">{IMAGE_CROP_COPY.loadError}</p> : null}
        </div>
        <div className={MODAL_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            {IMAGE_CROP_COPY.cancel}
          </Button>
          <Button type="button" variant="brand" onClick={() => void confirm()} disabled={!natural || saving || failed}>
            {saving ? IMAGE_CROP_COPY.saving : IMAGE_CROP_COPY.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
