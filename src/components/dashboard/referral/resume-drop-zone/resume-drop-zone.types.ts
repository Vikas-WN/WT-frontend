export interface ResumeDropZoneProps {
  file: File | null;
  onPick: (f: File | null) => void;
}
