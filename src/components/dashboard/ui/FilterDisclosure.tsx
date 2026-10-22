"use client";
import { useId, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

/** Keep search visible while secondary filters stay optional on narrow screens. */
export function FilterDisclosure({children,activeCount=0}:{children:ReactNode;activeCount?:number}) {
  // UI-only disclosure; filter values continue to live in the feature's hook.
  const [expanded,setExpanded]=useState(false);
  const id=useId();
  return <div className="wt-filter-disclosure">
    <Button type="button" variant="outline" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded} aria-controls={id} className="wt-filter-toggle"><SlidersHorizontal className="size-4"/>Filters{activeCount?<span className="rounded-md bg-wt-brand-soft px-1.5 text-xs text-wt-brand">{activeCount}</span>:null}</Button>
    <div id={id} className="wt-filter-body" data-expanded={expanded}>{children}</div>
  </div>;
}
