"use client";
import { useSyncExternalStore } from "react";

const QUERY="(max-width: 639px)";
const serverSnapshot=()=>false;
const snapshot=()=>window.matchMedia(QUERY).matches;
function subscribe(listener:()=>void){
  const media=window.matchMedia(QUERY);
  media.addEventListener("change",listener);
  return ()=>media.removeEventListener("change",listener);
}
/** Only mount one record presentation so interactive cells and field IDs are never duplicated. */
export function useCompactViewport(){return useSyncExternalStore(subscribe,snapshot,serverSnapshot);}
