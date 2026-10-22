export type ProjectCollectionProps = {
  rows: Record<string, unknown>[];
  typeLabels: Record<string, string>;
  onSelect: (row: Record<string, unknown>) => void;
};
