import { SETTINGS_SECTIONS } from "@/constants/settingsNavigation";

export function SettingsNavigation({admin}: {admin: boolean}) {
  return <nav className="wt-settings-navigation" aria-label="Settings sections">
    <p className="mb-3 hidden px-3 text-[10px] font-medium uppercase tracking-wider text-wt-text-faint xl:block">On this page</p>
    {SETTINGS_SECTIONS.filter(section=>!("admin" in section)||admin).map(section=><a key={section.id} href={`#settings-${section.id}`} className="rounded-lg px-3 py-2.5 text-xs font-medium text-wt-text-muted transition-colors hover:bg-wt-surface-3 hover:text-wt-text">{section.label}</a>)}
  </nav>;
}
