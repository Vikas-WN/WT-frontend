import { PULSE_ENABLED } from "@/constants/pulseFeature";

const ALL_SETTINGS_SECTIONS = [
  {id:"appearance",label:"Appearance"},
  {id:"companions",label:"Desk companion"},
  {id:"notifications",label:"Notifications"},
  {id:"calendar",label:"Calendar & dates"},
  {id:"timezone",label:"Timezone"},
  {id:"seasonal",label:"Seasonal look",admin:true},
  {id:"scoring",label:"Pulse scoring",admin:true},
] as const;

/** "Pulse scoring" only exists while Pulse is enabled. */
export const SETTINGS_SECTIONS = ALL_SETTINGS_SECTIONS.filter((section) => PULSE_ENABLED || section.id !== "scoring");
