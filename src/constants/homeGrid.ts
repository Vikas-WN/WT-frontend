/** Home is a one-screen dashboard on desktop: a fixed grid that fills the window, paged when widgets don't all fit. */
export const HOME_GRID = {
  /** Below this width (px) the grid is a normal scrolling stack. */
  desktopMinWidth: 1024,
  wideMinWidth: 1536,
  /** Windows shorter than this (px) get two rows instead of three. */
  tallMinHeight: 820,
  columnsDesktop: 3,
  columnsWide: 4,
  rowsTall: 3,
  rowsShort: 2,
} as const;

export const HOME_GRID_COPY = {
  previousPage: "Previous widgets",
  nextPage: "Next widgets",
  pageLabel: (page: number, pages: number) => `${page} / ${pages}`,
} as const;
