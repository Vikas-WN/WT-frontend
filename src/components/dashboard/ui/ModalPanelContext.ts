import { createContext, useContext } from "react";

/**
 * Portal host for the currently open modal — typically the scrollable body,
 * not the full panel (so the footer stays outside the clipping region).
 *
 * Portal-based floating popups (e.g. Base UI comboboxes) read this and render
 * inside the host instead of document.body. With absolute positioning + the
 * body's overflow clipping, dropdown height is bounded by remaining space
 * above Cancel/Next and never covers those actions.
 */
export const ModalPanelContext = createContext<HTMLElement | null>(null);

export function useModalPanel(): HTMLElement | null {
  return useContext(ModalPanelContext);
}
