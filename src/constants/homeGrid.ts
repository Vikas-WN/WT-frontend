/** Home is a one-screen dashboard on desktop: every widget is always visible and the grid fills the window. */
export const HOME_GRID = {
  /** Below this width (px) the grid is a normal scrolling stack. */
  desktopMinWidth: 1024,
  wideMinWidth: 1536,
  columnsDesktop: 3,
  columnsWide: 4,
  /** With this few cells a wide screen would leave empty columns, so stay at three. */
  maxCellsForThreeColumns: 6,
} as const;
