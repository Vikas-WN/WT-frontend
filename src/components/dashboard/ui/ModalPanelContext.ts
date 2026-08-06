import { createContext, useContext } from "react";

/**
 * The DOM element of the currently open modal panel (dialog box).
 *
 * Portal-based floating popups (e.g. Base UI comboboxes) read this and render
 * inside the panel instead of <body>, so they are clipped to the panel and
 * their height is bounded by the space left inside the modal — they never
 * overflow beyond the modal's boundaries.
 */
export const ModalPanelContext = createContext<HTMLElement | null>(null);

export function useModalPanel(): HTMLElement | null {
  return useContext(ModalPanelContext);
}
