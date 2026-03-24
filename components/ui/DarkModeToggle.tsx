"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Verhindert Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-lg text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100 transition"
      title={isDark ? "Light Mode" : "Dark Mode"}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        // Sun Icon
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM4.939 4.939a.75.75 0 011.06 0l1.591 1.591a.75.75 0 11-1.06 1.06L4.939 5.998a.75.75 0 010-1.06zM2.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zM4.939 19.061a.75.75 0 010 1.06l-1.591 1.591a.75.75 0 11-1.06-1.06l1.591-1.591a.75.75 0 011.06 0zM12 19.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V20.25a.75.75 0 01.75-.75zM19.061 4.939a.75.75 0 011.06 0l1.591 1.591a.75.75 0 11-1.06 1.06l-1.591-1.591a.75.75 0 010-1.06zM21.75 12a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0V11.25a.75.75 0 01-.75.75zM19.061 19.061a.75.75 0 011.06 1.06l-1.591 1.591a.75.75 0 11-1.06-1.06l1.591-1.591zM12 6.75a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5z" />
        </svg>
      ) : (
        // Moon Icon
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.64 8.05a.75.75 0 00-.29-1.04A9.821 9.821 0 0015.5 6c-5.385 0-9.75 4.365-9.75 9.75 0 2.006.613 3.873 1.66 5.441a.75.75 0 001.296-.372c.353-1.353.516-2.741.516-4.319 0-4.556 3.694-8.25 8.25-8.25 1.039 0 2.051.184 3.027.537a.75.75 0 001.04-.292z" />
        </svg>
      )}
    </button>
  );
}
