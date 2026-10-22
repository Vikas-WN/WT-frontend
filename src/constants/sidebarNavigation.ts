import {
  Activity,
  BarChart3,
  BookOpen,
  Box,
  Briefcase,
  Bug,
  CalendarDays,
  CalendarX2,
  CheckSquare,
  DoorOpen,
  FileText,
  Folder,
  Gift,
  GraduationCap,
  Home,
  HouseWifi,
  KeyRound,
  Laptop,
  LayoutGrid,
  type LucideIcon,
  Megaphone,
  MessageCircle,
  Calendar,
  Clock,
  ShieldCheck,
  Star,
  Sun,
  Timer,
  Upload,
  User,
  UserMinus,
  UserPlus,
  Users,
  ArrowRightToLine,
  FileUser,
  HelpCircle,
  MapPin,
  Settings as SettingsIcon,
} from "lucide-react";

/** A sidebar entry. `navId` is the id the rest of the app already uses for the page (routes, role filtering, active state). */
export interface AppNavEntry {
  navId: string;
  label: string;
  icon: LucideIcon;
  /** The page's own heading when it differs from the sidebar label ("Leave" -> "My leave"). */
  title?: string;
  /** The line under the page heading. */
  description?: string;
  /** A count shown at the right edge, computed elsewhere. */
  badge?: "requests" | "learning" | "compliance";
  /** Always shown to a signed-in person (not filtered by the role-based navigation). */
  alwaysVisible?: boolean;
  /** Sub-pages, shown under the entry while it is open (Reports). */
  children?: ReadonlyArray<{ navId: string; label: string }>;
}

export interface AppNavSection {
  id: string;
  /** Section heading; null for the two entries at the very top. */
  label: string | null;
  entries: readonly AppNavEntry[];
}

/** The sidebar, in the order and with the names of the WebTrak redesign. */
export const APP_NAVIGATION: readonly AppNavSection[] = [
  {
    id: "top",
    label: null,
    entries: [
      { navId: "home", label: "Home", icon: Home },
      { navId: "chat", label: "Chat", icon: MessageCircle },
    ],
  },
  {
    id: "me",
    label: "Me",
    entries: [
      { navId: "profile", label: "Profile", icon: User, alwaysVisible: true },
      { navId: "leave", label: "Leave", icon: Calendar, title: "My leave", description: "Request leave, work from home or comp-off credit, and see where your balance stands." },
      { navId: "wfh", label: "Work from home", icon: HouseWifi, description: "Apply for a work-from-home day, track your requests, or ask for a custom exception." },
      { navId: "timelog", label: "Time logs", icon: Clock, description: "Fill in your week in one place. Hours save as you type." },
      { navId: "my-allocations", label: "My allocations", icon: MapPin },
      { navId: "my-assets", label: "My assets", icon: Laptop, description: "What the company has given you." },
      { navId: "policies", label: "Policies", icon: BookOpen, description: "Company policies, and the ones waiting for your acknowledgement." },
      { navId: "exit-interview", label: "Exit survey", icon: FileText },
    ],
  },
  {
    id: "team",
    label: "Team",
    entries: [
      { navId: "employee-directory", label: "People", icon: Users },
      { navId: "leave-team", label: "Requests", icon: CheckSquare, badge: "requests", title: "Team requests", description: "Leave, work-from-home and comp-off requests from your team." },
      { navId: "whos-out", label: "Who's out", icon: CalendarX2, description: "Approved leave, work from home and holidays." },
      { navId: "timelog-team", label: "Team time", icon: Timer },
      { navId: "skills-matrix", label: "Skills matrix", icon: LayoutGrid, description: "Who has which skills, and how strongly." },
    ],
  },
  {
    id: "work",
    label: "Work",
    entries: [
      { navId: "allocation", label: "Projects", icon: Folder, description: "Projects synced from WK Business. Open one to see who is allocated and until when." },
      { navId: "allocation-extension", label: "Extensions", icon: ArrowRightToLine },
      { navId: "talent-pool", label: "Talent pool", icon: Users },
      { navId: "clients", label: "Clients", icon: Briefcase, description: "Client accounts, who owns them, and which projects they are linked to." },
      { navId: "resumes", label: "Resumes", icon: FileUser },
      {
        navId: "reports",
        label: "Reports",
        icon: BarChart3,
        children: [
          { navId: "reports-workforce", label: "Workforce overview" },
          { navId: "reports-section-2", label: "Utilization vs effort" },
          { navId: "reports-heatmap", label: "Utilisation heatmap" },
          { navId: "reports-bench", label: "Bench" },
          { navId: "reports-section-3", label: "Attrition & retention" },
          { navId: "reports-section-4", label: "Skill & capacity" },
          { navId: "reports-section-6", label: "Compliance & risk" },
          { navId: "reports-section-7", label: "BGV dashboard" },
          { navId: "reports-lop", label: "LOP report" },
        ],
      },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    entries: [
      { navId: "learning", label: "Learning", icon: GraduationCap, badge: "learning" },
      { navId: "pulse", label: "Pulse", icon: Activity },
      { navId: "announcements", label: "Announcements", icon: Megaphone, description: "News and notices from HR, Admin and your managers." },
      { navId: "events", label: "Events", icon: Star, description: "What is happening at WebKnot, and what you are invited to." },
      { navId: "forms", label: "Forms", icon: FileText, description: "Forms and surveys waiting for you." },
    ],
  },
  {
    id: "workplace",
    label: "Workplace",
    entries: [
      { navId: "meeting-rooms", label: "Meeting rooms", icon: DoorOpen, description: "Pick a slot on the timeline to book a room." },
      { navId: "assets", label: "Assets", icon: Box, description: "Laptops, phones and chargers the company owns, and who has them." },
      { navId: "annual-calendar", label: "Holidays", icon: Sun },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    entries: [
      { navId: "employee", label: "Onboarding", icon: UserPlus },
      { navId: "offboarding", label: "Offboarding", icon: UserMinus },
      { navId: "compliance", label: "Compliance", icon: ShieldCheck, badge: "compliance" },
      { navId: "holiday-calendars", label: "Holiday setup", icon: CalendarDays },
      { navId: "masters", label: "Data management", icon: SettingsIcon },
      { navId: "uploads", label: "Bulk imports", icon: Upload },
      { navId: "apps", label: "Apps & keys", icon: KeyRound },
      { navId: "bug-reports", label: "Bug reports", icon: Bug },
      { navId: "referral", label: "Referral", icon: Gift },
    ],
  },
];

/** Pinned under the sections, above the account card. */
export const APP_NAV_FOOTER: readonly AppNavEntry[] = [
  { navId: "guide", label: "Help & guide", icon: HelpCircle },
  { navId: "settings", label: "Settings", icon: SettingsIcon, alwaysVisible: true },
];

/** Breadcrumb for a page: the section heading and the page name, from the sidebar's own labels. */
export function appBreadcrumb(navId: string): { section: string | null; page: string; title: string; description?: string } | null {
  for (const section of APP_NAVIGATION) {
    for (const entry of section.entries) {
      if (entry.navId === navId) return { section: section.label, page: entry.label, title: entry.title ?? entry.label, description: entry.description };
      const child = entry.children?.find((c) => c.navId === navId);
      if (child) return { section: entry.label, page: child.label, title: child.label };
    }
  }
  const footer = APP_NAV_FOOTER.find((e) => e.navId === navId);
  return footer ? { section: null, page: footer.label, title: footer.label } : null;
}
