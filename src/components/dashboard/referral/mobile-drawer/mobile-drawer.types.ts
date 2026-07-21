import type { ReactNode } from "react";

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}
