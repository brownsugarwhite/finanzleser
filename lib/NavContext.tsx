"use client";

import { createContext, useContext } from "react";

export type NavItem = {
  label: string;
  href: string;
  megamenu: boolean;
  submenu: Array<{ label: string; href: string }>;
};

const NavContext = createContext<NavItem[]>([]);

export function NavProvider({
  items,
  children,
}: {
  items: NavItem[];
  children: React.ReactNode;
}) {
  return <NavContext.Provider value={items}>{children}</NavContext.Provider>;
}

export function useNavItems() {
  return useContext(NavContext);
}
