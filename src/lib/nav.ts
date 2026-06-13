/** Canonical navigation map for the app shell. */
export interface NavItem {
  href: string;
  label: string;
  icon: string; // single-glyph icon (kept dependency-free)
  accent: string; // token var for the active state
}

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "◎", accent: "var(--color-electric)" },
  { href: "/training", label: "Training", icon: "⚡", accent: "var(--color-electric)" },
  { href: "/recovery", label: "Recovery", icon: "❤", accent: "var(--color-recovery)" },
  { href: "/nutrition", label: "Nutrition", icon: "◍", accent: "var(--color-recovery)" },
  { href: "/coach", label: "Coach", icon: "✦", accent: "var(--color-ai)" },
  { href: "/analytics", label: "Analytics", icon: "▟", accent: "var(--color-sleep)" },
  { href: "/achievements", label: "Achievements", icon: "★", accent: "var(--color-money)" },
  { href: "/calendar", label: "Calendar", icon: "▤", accent: "var(--color-fg)" },
  { href: "/settings", label: "Settings", icon: "⚙", accent: "var(--color-fg)" },
];
