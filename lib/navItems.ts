// Navigation items — static for now, later fetched from WordPress/ACF
export type NavItem = {
  label: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Finanzen", href: "/finanzen" },
  { label: "Versicherungen", href: "/versicherungen" },
  { label: "Steuern", href: "/steuern" },
  { label: "Recht", href: "/recht" },
  { label: "Finanztools", href: "/finanztools" },
];
